import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason, FOTWReview } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';
import { syncTimesSuggestedFromFilms } from '@/lib/fotwTimesSuggested';
import { formatDisplayName } from '@/lib/fotw/utils';
import mongoose from 'mongoose';

const parseAdminDate = (value: unknown): Date | null => {
  const raw = (value ?? '').toString().trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (
        !Number.isNaN(candidate.getTime()) &&
        candidate.getUTCDate() === day &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCFullYear() === year
      ) {
        return candidate;
      }
    }
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

// GET: Fetch current film, leaderboard, and user's rating status
export async function GET(req: Request) {
  try {
    const [session, _] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // --- Season filter for leaderboard ---
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');
    const useSeasonFilter =
      !!seasonId &&
      seasonId !== 'all' &&
      mongoose.Types.ObjectId.isValid(seasonId);

    // Promises that can run in parallel early on
    const currentFilmPromise = FOTWFilm.findOne({ lockedAt: null }).sort({ createdAt: -1 }).lean();

    // Build leaderboard — two paths:
    //   A) No seasonId / 'all' / invalid id: existing FOTWUser.watchedCount sort
    //   B) Valid seasonId: fetch season films, tally watchedBy in memory, join FOTWUser
    let leaderboardPromise: Promise<any[]>;

    if (useSeasonFilter) {
      // Path B ---------------------------------------------------------------
      // Step 1: resolve the season's date window
      // Step 2: fetch only the watchedBy arrays of films in that window (lean, minimal projection)
      // Step 3: tally per-user watch counts in memory — zero extra DB round-trips
      // Step 4: fetch FOTWUser display fields for users who appear in the tally
      leaderboardPromise = (async () => {
        const season = await FOTWSeason.findById(seasonId).select('startDate endDate').lean();
        if (!season) return [];

        // Fetch only the field we need — watchedBy — for all locked films in the window
        const seasonFilms = await FOTWFilm.find(
          {
            dateSuggested: {
              $gte: season.startDate,
              ...(season.endDate ? { $lte: season.endDate } : {}),
            },
            lockedAt: { $ne: null }, // only past (locked) films
          },
          { watchedBy: 1 }  // projection: only watchedBy
        ).lean();

        // Build watch-count map in memory — no extra DB query
        const watchCountMap = new Map<string, number>();
        for (const film of seasonFilms) {
          const watchedBy = Array.isArray((film as any).watchedBy)
            ? (film as any).watchedBy
            : [];
          for (const entry of watchedBy) {
            const email: string = entry?.userEmail;
            if (email) {
              watchCountMap.set(email, (watchCountMap.get(email) ?? 0) + 1);
            }
          }
        }

        if (watchCountMap.size === 0) return [];

        // Fetch FOTWUser display fields — only for users who appear in the tally
        const emails = [...watchCountMap.keys()];
        const users = await FOTWUser.find({
          email: { $in: emails },
          excludeFromLeaderboard: { $ne: true },
        })
          .select('email username name image watchedCount currentStreak longestStreak _id')
          .lean();

        // Build response, sorted by season watch count descending
        return (users as any[])
          .map((u) => ({
            _id: u._id,
            name: formatDisplayName(u.name, u.username),
            image: u.image ?? null,
            watchedCount: u.watchedCount,
            seasonWatchCount: watchCountMap.get(u.email) ?? 0,
            currentStreak: u.currentStreak || 0,
            longestStreak: u.longestStreak || 0,
          }))
          .sort((a, b) => b.seasonWatchCount - a.seasonWatchCount);
      })();
    } else {
      // Path A ---------------------------------------------------------------
      // All-time: sort by the pre-aggregated FOTWUser.watchedCount
      leaderboardPromise = FOTWUser.find({
        watchedCount: { $gt: 0 },
        excludeFromLeaderboard: { $ne: true },
      })
        .sort({ watchedCount: -1, createdAt: 1 })
        .select('email username name watchedCount currentStreak longestStreak image')
        .lean()
        .then((raw) =>
          (raw as any[]).map((u) => ({
            _id: u._id,
            name: formatDisplayName(u.name, u.username),
            image: u.image,
            watchedCount: u.watchedCount,
            currentStreak: u.currentStreak || 0,
            longestStreak: u.longestStreak || 0,
          }))
        );
    }

    const [currentFilmRaw, leaderboard] = await Promise.all([
      currentFilmPromise,
      leaderboardPromise,
    ]);

    let currentFilm = currentFilmRaw as any;

    // Auto-lock if the timer duration has passed and timer is not paused
    if (currentFilm && !currentFilm.timerPaused) {
      // Ensure backwards compatibility by attaching a timerDuration explicitly
      const fallbackMs = currentFilm.timerDurationDays
        ? currentFilm.timerDurationDays * 86400000
        : 7 * 86400000;
      currentFilm.timerDuration = currentFilm.timerDuration ?? fallbackMs;

      const deadline = new Date(currentFilm.createdAt).getTime() + currentFilm.timerDuration;
      if (Date.now() > deadline) {
        await FOTWFilm.findByIdAndUpdate(currentFilm._id, { $set: { lockedAt: new Date() } });
        currentFilm = null;
      }
    }

    let userRating = null;
    let isAdmin = FOTW_ADMINS.includes(session.user.email);
    let allRatings: any[] = [];
    let averageRating = 0;
    let watchedCount = 0;
    let hasWatched = false;
    let userLiked = false;
    let likesCount = 0;
    let userReview: { body: string; isPrivate: boolean } | null = null;
    let publicReviews: { userEmail: string; name: string; image: string | null; body: string; createdAt: string }[] = [];

    if (currentFilm) {
      const fallbackMs = currentFilm.timerDurationDays
        ? currentFilm.timerDurationDays * 86400000
        : 7 * 86400000;
      currentFilm.timerDuration = currentFilm.timerDuration ?? fallbackMs;

      const [chooser, rating, ratings, likeDoc, likesTotal, myReview, filmReviews] = await Promise.all([
        currentFilm.chosenByEmail
          ? FOTWUser.findOne({ email: currentFilm.chosenByEmail }).select('name username').lean()
          : Promise.resolve(null),
        FOTWRating.findOne({ userEmail: session.user.email, filmId: currentFilm._id }).lean(),
        FOTWRating.find({ filmId: currentFilm._id }).sort({ createdAt: -1 }).lean(),
        FOTWLike.findOne({ userEmail: session.user.email, filmId: currentFilm._id }).lean(),
        FOTWLike.countDocuments({ filmId: currentFilm._id }),
        FOTWReview.findOne({ userEmail: session.user.email, filmId: currentFilm._id }).lean(),
        FOTWReview.find({ filmId: currentFilm._id, isPrivate: false })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      if (chooser) {
        currentFilm.chosenBy = formatDisplayName(
          (chooser as any).name,
          (chooser as any).username
        );
      }

      if (rating) {
        userRating = (rating as any).rating;
      }

      watchedCount = Array.isArray(currentFilm.watchedBy) ? currentFilm.watchedBy.length : 0;
      hasWatched = Array.isArray(currentFilm.watchedBy)
        ? currentFilm.watchedBy.some((w: any) => w.userEmail === session.user.email)
        : false;

      // Extract unique emails from ratings to fetch user profiles efficiently
      const userEmails = [...new Set((ratings as any[]).map((r: any) => r.userEmail))];

      const raters = await FOTWUser.find({ email: { $in: userEmails } })
        .select('name username image email')
        .lean();

      const ratersMap = new Map((raters as any[]).map((u) => [u.email, u]));

      // Fetch user data for each rating
      allRatings = (ratings as any[]).map((rating: any) => {
        const user = ratersMap.get(rating.userEmail);
        return {
          ...rating,
          userId: user
            ? { name: formatDisplayName(user.name, user.username), image: user.image }
            : { name: 'Anonymous', image: null },
        };
      });

      if (allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r: any) => acc + r.rating, 0);
        averageRating = Math.round((sum / allRatings.length) * 10) / 10;
      }

      userLiked = !!likeDoc;
      likesCount = likesTotal;

      // Caller's own review (regardless of privacy)
      if (myReview) {
        userReview = { body: (myReview as any).body, isPrivate: (myReview as any).isPrivate };
      }

      // Public reviews — join with user display info
      if (filmReviews && (filmReviews as any[]).length > 0) {
        const reviewerEmails = [...new Set((filmReviews as any[]).map((r: any) => r.userEmail))];
        const reviewers = await FOTWUser.find({ email: { $in: reviewerEmails } })
          .select('email name username image')
          .lean();
        const reviewerMap = new Map((reviewers as any[]).map((u) => [u.email, u]));

        publicReviews = (filmReviews as any[]).map((r) => {
          const u = reviewerMap.get(r.userEmail);
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
    }

    return NextResponse.json({
      currentFilm,
      leaderboard,
      userRating,
      isAdmin,
      allRatings,
      averageRating,
      watchedCount,
      hasWatched,
      userLiked,
      likesCount,
      userReview,
      publicReviews,
    });
  } catch (error) {
    console.error('Error fetching FOTW data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper: fetch language + year from TMDB given a tmdbUrl.
// Returns null fields on any failure so the caller can still proceed.
async function fetchTmdbMetadata(
  tmdbUrl: string
): Promise<{ language: string; year: number } | null> {
  try {
    const match = tmdbUrl.match(/\/movie\/(\d+)/);
    if (!match) return null;
    const tmdbId = match[1];
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}`,
      { method: 'GET' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      language: data.original_language || '',
      year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
    };
  } catch {
    return null;
  }
}

// POST: Admin creates a new film
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { title, posterUrl, tmdbUrl, chosenBy, chosenByEmail, timerDuration } = await req.json();

    // Fetch TMDB metadata in parallel with nothing else — fast extra call
    const tmdbMeta = tmdbUrl ? await fetchTmdbMetadata(tmdbUrl) : null;

    const newFilm = await FOTWFilm.create({
      title,
      posterUrl,
      tmdbUrl: tmdbUrl || '',
      chosenBy: chosenBy || '',
      chosenByEmail: chosenByEmail || '',
      dateSuggested: new Date(),
      addedBy: session.user.email,
      timerDuration: timerDuration ?? 604800000,
      language: tmdbMeta?.language ?? '',
      year: tmdbMeta?.year ?? 0,
    });

    await syncTimesSuggestedFromFilms();

    return NextResponse.json({ success: true, film: newFilm });
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Admin updates current film
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const {
      filmId,
      title,
      posterUrl,
      tmdbUrl,
      chosenBy,
      chosenByEmail,
      dateSuggested,
      timerPaused,
      timerDuration,
    } = body;

    if (!filmId) {
      return NextResponse.json({ message: 'Missing filmId' }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (posterUrl !== undefined) updates.posterUrl = posterUrl;
    if (tmdbUrl !== undefined) updates.tmdbUrl = tmdbUrl;
    if (chosenBy !== undefined) updates.chosenBy = chosenBy;
    if (chosenByEmail !== undefined) updates.chosenByEmail = chosenByEmail;
    if (dateSuggested !== undefined) updates.dateSuggested = parseAdminDate(dateSuggested);
    if (timerPaused !== undefined) updates.timerPaused = timerPaused;
    if (timerDuration !== undefined) updates.timerDuration = timerDuration;

    const updatedFilm = await FOTWFilm.findByIdAndUpdate(filmId, { $set: updates }, { new: true });

    if (!updatedFilm) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    await syncTimesSuggestedFromFilms();

    return NextResponse.json({ success: true, film: updatedFilm });
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Admin deletes a film and rolls back watch counts for users who watched it
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { filmId } = await req.json();

    if (!filmId) {
      return NextResponse.json({ message: 'Missing filmId' }, { status: 400 });
    }

    // 1. Find the film by ID.
    const film = await FOTWFilm.findById(filmId).select('watchedBy').lean();
    if (!film) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    // 2. Extract all watchedBy[].userEmail entries.
    const watchedBy = Array.isArray((film as any).watchedBy) ? (film as any).watchedBy : [];
    const uniqueEmails: string[] = Array.from(
      new Set(
        watchedBy
          .map((entry: any) => (typeof entry === 'object' ? entry.userEmail : null))
          .filter(Boolean) as string[]
      )
    );

    // 3. For each unique email, $inc: { watchedCount: -1, seasonWatchedCount: -1 } on FOTWUser using bulkWrite.
    let watchersAffected = 0;
    if (uniqueEmails.length > 0) {
      const bulkOps = uniqueEmails.map((email) => ({
        updateOne: {
          filter: { email },
          update: { $inc: { watchedCount: -1, seasonWatchedCount: -1 } },
        },
      }));
      const userUpdateResult = await FOTWUser.bulkWrite(bulkOps);
      watchersAffected = userUpdateResult.modifiedCount || 0;
    }

    // 4. Delete all FOTWRating documents where filmId matches.
    const ratingsResult = await FOTWRating.deleteMany({ filmId });
    const ratingsRemoved = ratingsResult.deletedCount || 0;

    // 5. Delete all FOTWLike documents where filmId matches.
    const likesResult = await FOTWLike.deleteMany({ filmId });
    const likesRemoved = likesResult.deletedCount || 0;

    // 6. Delete the FOTWFilm document itself.
    await FOTWFilm.deleteOne({ _id: filmId });

    await syncTimesSuggestedFromFilms();

    return NextResponse.json({
      deleted: true,
      filmId,
      ratingsRemoved,
      likesRemoved,
      watchersAffected,
    });
  } catch (error) {
    console.error('Error deleting film:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { message: 'Internal Server Error', error: String(error) },
      { status: 500 }
    );
  }
}
