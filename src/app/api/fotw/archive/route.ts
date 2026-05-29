import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason, FOTWSiteConfig } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTWReview } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { formatDisplayName } from '@/lib/fotw/utils';

// GET: Fetch all previous (locked) FOTWs with their stats.
// Accepts optional ?seasonId=<mongoId> to filter to a season's date window.
// Performs exactly 4 DB queries total regardless of how many films or ratings exist.
export async function GET(req: Request) {
  try {
    const [session, _] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // --- Season filter ---
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');
    let dateFilter: Record<string, unknown> = {};
    let seasonLetterboxdUrl = '';

    if (seasonId && seasonId !== 'all') {
      const season = await FOTWSeason.findById(seasonId)
        .select('startDate endDate letterboxdUrl')
        .lean();
      if (!season) {
        return NextResponse.json({ message: 'Season not found' }, { status: 404 });
      }
      dateFilter = {
        lockedAt: { $ne: null },
        dateSuggested: {
          $gte: season.startDate,
          ...(season.endDate ? { $lte: season.endDate } : {}),
        },
      };
      // Use season-specific URL if set, otherwise fall back to all-time config
      if ((season as any).letterboxdUrl) {
        seasonLetterboxdUrl = (season as any).letterboxdUrl;
      }
    }

    // Always load the all-time URL as a fallback (one fast lean query)
    if (!seasonLetterboxdUrl) {
      const siteConfig = await FOTWSiteConfig.findOne({}).select('letterboxdAllTimeUrl').lean();
      seasonLetterboxdUrl = siteConfig?.letterboxdAllTimeUrl || '';
    }

    // Fetch films (all, or filtered to the season window) sorted by createdAt
    const films = await FOTWFilm.find(dateFilter).sort({ createdAt: -1 }).lean();

    // Identify the current film (newest document with lockedAt: null)
    // and separate it from the archive list.
    let currentFilm = null;
    let archiveFilms = films;
    const unlockedIndex = films.findIndex((f) => f.lockedAt === null);
    if (unlockedIndex !== -1) {
      currentFilm = films[unlockedIndex];
      archiveFilms = films.filter((_, idx) => idx !== unlockedIndex);
    }

    const filmIds = archiveFilms.map((f) => f._id);

    // 2. Bulk-fetch ALL ratings, ALL users, and ALL likes in 4 parallel queries.
    //    No per-film or per-rating sub-queries — everything resolved in memory.
    const [allRatings, allUsers, allLikes, allReviews] = await Promise.all([
      FOTWRating.find({ filmId: { $in: filmIds } }).lean(),
      FOTWUser.find().select('email name username image').lean(),
      FOTWLike.find({ filmId: { $in: filmIds } }).lean(),
      FOTWReview.find({ filmId: { $in: filmIds }, isPrivate: false }).lean(),
    ]);

    // 3. Build O(1) lookup map: email → user document
    const userMap = Object.fromEntries((allUsers as any[]).map((u) => [u.email, u]));

    const formatName = (user: any, fallback: string) => {
      if (!user) return formatDisplayName(fallback);
      return formatDisplayName(user.name ?? fallback, user.username);
    };

    // 4. Assemble per-film stats in memory — zero additional DB queries
    const result = archiveFilms.map((film) => {
      const filmIdStr = film._id.toString();

      const filmRatings = (allRatings as any[]).filter((r) => r.filmId.toString() === filmIdStr);
      const filmLikes = (allLikes as any[]).filter((l) => l.filmId.toString() === filmIdStr);
      const filmReviews = (allReviews as any[]).filter((r) => r.filmId.toString() === filmIdStr).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const avg =
        filmRatings.length > 0
          ? Math.round((filmRatings.reduce((s, r) => s + r.rating, 0) / filmRatings.length) * 10) /
            10
          : 0;

      const watchedBy = Array.isArray(film.watchedBy) ? film.watchedBy : [];

      return {
        ...film,
        timerDuration:
          film.timerDuration ??
          ((film as any).timerDurationDays
            ? (film as any).timerDurationDays * 86400000
            : 7 * 86400000),
        averageRating: avg,
        ratingsCount: filmRatings.length,
        watchedCount: watchedBy.length,
        likesCount: filmLikes.length,
        allRatings: filmRatings.map((r) => ({
          userEmail: r.userEmail,
          name: formatName(userMap[r.userEmail], r.userEmail),
          image: userMap[r.userEmail]?.image ?? null,
          rating: r.rating,
          createdAt: r.createdAt,
        })),
        watchedBy: watchedBy.map((w: any) => ({
          userEmail: w.userEmail,
          watchedAt: w.watchedAt,
          name: formatName(userMap[w.userEmail], w.userEmail),
          image: userMap[w.userEmail]?.image ?? null,
        })),
        publicReviews: filmReviews.map((r: any) => ({
          userEmail: r.userEmail,
          name: formatName(userMap[r.userEmail], r.userEmail),
          image: userMap[r.userEmail]?.image ?? null,
          body: r.body,
          hasSpoiler: r.hasSpoiler ?? false,
          createdAt: r.createdAt,
        })),
        chosenBy: film.chosenByEmail
          ? formatName(userMap[film.chosenByEmail], film.chosenBy || '')
          : film.chosenBy || '',
      };
    });

    return NextResponse.json({ films: result, seasonLetterboxdUrl });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
