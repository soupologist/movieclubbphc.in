import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason, FOTWSiteConfig, FOTWUser, FOTWRating, FOTWLike, FOTWReview } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { formatDisplayName } from '@/lib/fotw/utils';
import mongoose from 'mongoose';

// Bootstrap: single authenticated request that returns data, archive, and seasons
// in one round-trip. Session and DB connection are shared across all three.
export async function GET(req: Request) {
  try {
    // ── 1. Auth + DB in parallel ─────────────────────────────────────────────
    const [session] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');
    const useSeasonFilter =
      !!seasonId && seasonId !== 'all' && mongoose.Types.ObjectId.isValid(seasonId);

    // ── 2. Kick off all top-level DB queries in parallel ──────────────────────
    const [
      currentFilmRaw,
      archiveFilmsRaw,
      seasonsRaw,
    ] = await Promise.all([
      // Current unlocked film
      FOTWFilm.findOne({ lockedAt: null }).sort({ createdAt: -1 }).lean(),
      // All locked films for archive
      FOTWFilm.find({ lockedAt: { $ne: null } }).sort({ createdAt: -1 }).lean(),
      // Season list
      FOTWSeason.find({}).select('name startDate endDate isActive letterboxdUrl').sort({ startDate: -1 }).lean(),
    ]);

    const currentFilm = currentFilmRaw as any;
    const archiveFilms = archiveFilmsRaw as any[];

    // ── 3. Determine season date window for leaderboard (if needed) ───────────
    let seasonWindow: { startDate: Date; endDate?: Date } | null = null;
    let seasonLetterboxdUrl = '';

    if (useSeasonFilter) {
      const season = await FOTWSeason.findById(seasonId).select('startDate endDate letterboxdUrl').lean() as any;
      if (season) {
        seasonWindow = { startDate: season.startDate, endDate: season.endDate };
        seasonLetterboxdUrl = season.letterboxdUrl || '';
      }
    }
    if (!seasonLetterboxdUrl) {
      const siteConfig = await FOTWSiteConfig.findOne({}).select('letterboxdAllTimeUrl').lean() as any;
      seasonLetterboxdUrl = siteConfig?.letterboxdAllTimeUrl || '';
    }

    // ── 4. Collect all film IDs and unique emails for bulk fetching ───────────
    const archiveFilmIds = archiveFilms.map((f: any) => f._id);
    const currentFilmId = currentFilm?._id;

    // Gather every email we might need for user display
    const uniqueEmails = new Set<string>();
    if (currentFilm?.chosenByEmail) uniqueEmails.add(currentFilm.chosenByEmail);
    archiveFilms.forEach((f: any) => {
      if (f.chosenByEmail) uniqueEmails.add(f.chosenByEmail);
      if (Array.isArray(f.watchedBy)) {
        f.watchedBy.forEach((w: any) => { if (w?.userEmail) uniqueEmails.add(w.userEmail); });
      }
    });

    // ── 5. Bulk-fetch all interaction data in parallel ────────────────────────
    const [
      archiveRatings,
      archiveLikes,
      archiveReviews,
      currentRating,
      currentAllRatings,
      currentLikeDoc,
      currentLikesCount,
      currentMyReview,
      currentPublicReviews,
      leaderboardUsers,
      seasonFilmsForLeaderboard,
    ] = await Promise.all([
      FOTWRating.find({ filmId: { $in: archiveFilmIds } }).lean(),
      FOTWLike.find({ filmId: { $in: archiveFilmIds } }).lean(),
      FOTWReview.find({ filmId: { $in: archiveFilmIds }, isPrivate: false }).sort({ createdAt: -1 }).lean(),
      // Current film — user-specific
      currentFilmId ? FOTWRating.findOne({ userEmail: userEmail, filmId: currentFilmId }).lean() : Promise.resolve(null),
      currentFilmId ? FOTWRating.find({ filmId: currentFilmId }).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
      currentFilmId ? FOTWLike.findOne({ userEmail: userEmail, filmId: currentFilmId }).lean() : Promise.resolve(null),
      currentFilmId ? FOTWLike.countDocuments({ filmId: currentFilmId }) : Promise.resolve(0),
      currentFilmId ? FOTWReview.findOne({ userEmail: userEmail, filmId: currentFilmId }).lean() : Promise.resolve(null),
      currentFilmId ? FOTWReview.find({ filmId: currentFilmId, isPrivate: false }).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
      // Leaderboard
      useSeasonFilter
        ? Promise.resolve(null) // will be built from season films
        : FOTWUser.find({ watchedCount: { $gt: 0 }, excludeFromLeaderboard: { $ne: true } })
            .sort({ watchedCount: -1, createdAt: 1 })
            .select('email username name watchedCount currentStreak longestStreak image')
            .lean(),
      // Season leaderboard: need film watchedBy data for the season window
      useSeasonFilter && seasonWindow
        ? FOTWFilm.find({
            dateSuggested: {
              $gte: seasonWindow.startDate,
              ...(seasonWindow.endDate ? { $lte: seasonWindow.endDate } : {}),
            },
          }, { watchedBy: 1 }).lean()
        : Promise.resolve(null),
    ]);

    // ── 6. Add rater/reviewer emails to uniqueEmails, then bulk-fetch users ───
    (archiveRatings as any[]).forEach((r: any) => uniqueEmails.add(r.userEmail));
    (archiveReviews as any[]).forEach((r: any) => uniqueEmails.add(r.userEmail));
    (currentAllRatings as any[]).forEach((r: any) => uniqueEmails.add(r.userEmail));
    (currentPublicReviews as any[]).forEach((r: any) => uniqueEmails.add(r.userEmail));

    const allUsers = await FOTWUser.find({ email: { $in: Array.from(uniqueEmails) } })
      .select('email name username image watchedCount currentStreak longestStreak excludeFromLeaderboard')
      .lean();
    const userMap = new Map((allUsers as any[]).map((u: any) => [u.email, u]));

    const fmt = (email: string, fallback = '') => {
      const u = userMap.get(email) as any;
      return u ? formatDisplayName(u.name, u.username) : formatDisplayName(fallback);
    };

    // ── 7. Build leaderboard ──────────────────────────────────────────────────
    let leaderboard: any[];
    if (useSeasonFilter && seasonFilmsForLeaderboard) {
      const watchCountMap = new Map<string, number>();
      for (const film of seasonFilmsForLeaderboard as any[]) {
        for (const entry of (film.watchedBy || [])) {
          if (entry?.userEmail) {
            watchCountMap.set(entry.userEmail, (watchCountMap.get(entry.userEmail) ?? 0) + 1);
          }
        }
      }
      leaderboard = (allUsers as any[])
        .filter((u: any) => !u.excludeFromLeaderboard && watchCountMap.has(u.email))
        .map((u: any) => ({
          _id: u._id,
          name: formatDisplayName(u.name, u.username),
          image: u.image ?? null,
          watchedCount: u.watchedCount,
          seasonWatchCount: watchCountMap.get(u.email) ?? 0,
          currentStreak: u.currentStreak || 0,
          longestStreak: u.longestStreak || 0,
        }))
        .sort((a, b) => b.seasonWatchCount - a.seasonWatchCount);
    } else {
      leaderboard = (leaderboardUsers as any[] || []).map((u: any) => ({
        _id: u._id,
        name: formatDisplayName(u.name, u.username),
        image: u.image,
        watchedCount: u.watchedCount,
        currentStreak: u.currentStreak || 0,
        longestStreak: u.longestStreak || 0,
      }));
    }

    // ── 8. Build current film payload ─────────────────────────────────────────
    let activatedFilm = currentFilm;
    if (activatedFilm && !activatedFilm.timerPaused) {
      const fallbackMs = activatedFilm.timerDurationDays
        ? activatedFilm.timerDurationDays * 86400000 : 7 * 86400000;
      activatedFilm.timerDuration = activatedFilm.timerDuration ?? fallbackMs;
      if (Date.now() > new Date(activatedFilm.createdAt).getTime() + activatedFilm.timerDuration) {
        activatedFilm = null;
      }
    }

    let userRating = null;
    let allRatingsFormatted: any[] = [];
    let averageRating = 0;
    let watchedCount = 0;
    let hasWatched = false;
    let userLiked = false;
    let likesCount = 0;
    let userReview: { body: string; isPrivate: boolean } | null = null;
    let publicReviews: any[] = [];

    if (activatedFilm) {
      if (activatedFilm.chosenByEmail) {
        const chooser = userMap.get(activatedFilm.chosenByEmail) as any;
        if (chooser) activatedFilm.chosenBy = formatDisplayName(chooser.name, chooser.username);
      }
      if (currentRating) userRating = (currentRating as any).rating;

      watchedCount = Array.isArray(activatedFilm.watchedBy) ? activatedFilm.watchedBy.length : 0;
      hasWatched = Array.isArray(activatedFilm.watchedBy)
        ? activatedFilm.watchedBy.some((w: any) => w.userEmail === userEmail) : false;

      allRatingsFormatted = (currentAllRatings as any[]).map((r: any) => {
        const u = userMap.get(r.userEmail) as any;
        return {
          ...r,
          userId: u
            ? { name: formatDisplayName(u.name, u.username), image: u.image }
            : { name: 'Anonymous', image: null },
        };
      });
      if (allRatingsFormatted.length > 0) {
        averageRating = Math.round(
          (allRatingsFormatted.reduce((s: number, r: any) => s + r.rating, 0) / allRatingsFormatted.length) * 10
        ) / 10;
      }

      userLiked = !!currentLikeDoc;
      likesCount = currentLikesCount as number;

      if (currentMyReview) {
        userReview = { body: (currentMyReview as any).body, isPrivate: (currentMyReview as any).isPrivate };
      }
      publicReviews = (currentPublicReviews as any[]).map((r: any) => {
        const u = userMap.get(r.userEmail) as any;
        return {
          userEmail: r.userEmail,
          name: u ? formatDisplayName(u.name, u.username) : r.userEmail,
          image: u?.image ?? null,
          body: r.body,
          hasSpoiler: r.hasSpoiler ?? false,
          createdAt: r.createdAt,
        };
      });
    }

    // ── 9. Build archive payload ───────────────────────────────────────────────
    const archiveResult = archiveFilms.map((film: any) => {
      const filmIdStr = film._id.toString();
      const filmRatings = (archiveRatings as any[]).filter((r: any) => r.filmId.toString() === filmIdStr);
      const filmLikes = (archiveLikes as any[]).filter((l: any) => l.filmId.toString() === filmIdStr);
      const filmReviews = (archiveReviews as any[]).filter((r: any) => r.filmId.toString() === filmIdStr);
      const avg = filmRatings.length > 0
        ? Math.round((filmRatings.reduce((s: number, r: any) => s + r.rating, 0) / filmRatings.length) * 10) / 10
        : 0;
      const watchedBy = Array.isArray(film.watchedBy) ? film.watchedBy : [];
      return {
        ...film,
        timerDuration: film.timerDuration ?? ((film.timerDurationDays ? film.timerDurationDays * 86400000 : 7 * 86400000)),
        averageRating: avg,
        ratingsCount: filmRatings.length,
        watchedCount: watchedBy.length,
        likesCount: filmLikes.length,
        allRatings: filmRatings.map((r: any) => ({
          userEmail: r.userEmail,
          name: fmt(r.userEmail, r.userEmail),
          image: (userMap.get(r.userEmail) as any)?.image ?? null,
          rating: r.rating,
          createdAt: r.createdAt,
        })),
        watchedBy: watchedBy.map((w: any) => ({
          userEmail: w.userEmail,
          watchedAt: w.watchedAt,
          name: fmt(w.userEmail, w.userEmail),
          image: (userMap.get(w.userEmail) as any)?.image ?? null,
        })),
        publicReviews: filmReviews.map((r: any) => ({
          userEmail: r.userEmail,
          name: fmt(r.userEmail, r.userEmail),
          image: (userMap.get(r.userEmail) as any)?.image ?? null,
          body: r.body,
          hasSpoiler: r.hasSpoiler ?? false,
          createdAt: r.createdAt,
        })),
        chosenBy: film.chosenByEmail ? fmt(film.chosenByEmail, film.chosenBy || '') : film.chosenBy || '',
      };
    });

    // ── 10. Compose final response ─────────────────────────────────────────────
    return NextResponse.json({
      data: {
        currentFilm: activatedFilm,
        leaderboard,
        userRating,
        isAdmin: FOTW_ADMINS.includes(userEmail),
        allRatings: allRatingsFormatted,
        averageRating,
        watchedCount,
        hasWatched,
        userLiked,
        likesCount,
        userReview,
        publicReviews,
      },
      archive: {
        films: archiveResult,
        seasonLetterboxdUrl,
      },
      seasons: seasonsRaw,
    });
  } catch (error) {
    console.error('Bootstrap API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
