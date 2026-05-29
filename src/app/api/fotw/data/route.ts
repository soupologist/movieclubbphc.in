import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';
import { syncTimesSuggestedFromFilms } from '@/lib/fotwTimesSuggested';
import { formatDisplayName } from '@/lib/fotw/utils';

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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 1. Get Current Film (Latest unlocked one)
    let currentFilm = await FOTWFilm.findOne({ lockedAt: null }).sort({ createdAt: -1 }).lean();

    if (currentFilm) {
      // Ensure backwards compatibility by attaching a timerDuration explicitly
      const fallbackMs = (currentFilm as any).timerDurationDays
        ? (currentFilm as any).timerDurationDays * 86400000
        : 7 * 86400000;
      currentFilm.timerDuration = currentFilm.timerDuration ?? fallbackMs;

      // Update chosenBy formatted
      if (currentFilm.chosenByEmail) {
        const chooser = await FOTWUser.findOne({ email: currentFilm.chosenByEmail })
          .select('name username')
          .lean();
        if (chooser) {
          currentFilm.chosenBy = formatDisplayName(chooser.name, chooser.username);
        }
      }
    }

    // Auto-lock if the timer duration has passed and timer is not paused
    if (currentFilm && !currentFilm.timerPaused) {
      const deadline = new Date(currentFilm.createdAt).getTime() + currentFilm.timerDuration;
      if (Date.now() > deadline) {
        await FOTWFilm.findByIdAndUpdate(currentFilm._id, { $set: { lockedAt: new Date() } });
        currentFilm = null;
      }
    }

    // 2. Get Leaderboard (Top 50 users by watched count, tiebreak by oldest user)
    // Filter out ghost/excluded users and those with 0 watched counts
    const leaderboardRaw = await FOTWUser.find({
      $or: [{ watchedCount: { $gt: 0 } }, { seasonWatchedCount: { $gt: 0 } }],
      excludeFromLeaderboard: { $ne: true },
    })
      .sort({ seasonWatchedCount: -1, createdAt: 1 })
      .select('name username image watchedCount seasonWatchedCount email')
      .lean();

    // Remove email from the public response payload and format name
    const leaderboard = (leaderboardRaw as any[]).map((u) => ({
      _id: u._id,
      name: formatDisplayName(u.name, u.username),
      image: u.image,
      watchedCount: u.watchedCount,
      seasonWatchedCount: u.seasonWatchedCount,
    }));

    let userRating = null;
    let isAdmin = FOTW_ADMINS.includes(session.user.email);
    let allRatings: any[] = [];
    let averageRating = 0;
    let watchedCount = 0;
    let hasWatched = false;
    let userLiked = false;
    let likesCount = 0;

    if (currentFilm) {
      // 3. Check if current user rated this film
      const rating = await FOTWRating.findOne({
        userEmail: session.user.email,
        filmId: currentFilm._id,
      });
      if (rating) {
        userRating = rating.rating;
      }

      // Watched count from watchedBy array
      watchedCount = Array.isArray(currentFilm.watchedBy) ? currentFilm.watchedBy.length : 0;

      // Check if current user has watched
      hasWatched = Array.isArray(currentFilm.watchedBy)
        ? currentFilm.watchedBy.some((w: any) => w.userEmail === session.user.email)
        : false;

      // 4. Get all ratings for current film
      const ratings = await FOTWRating.find({ filmId: currentFilm._id })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch user data for each rating
      allRatings = await Promise.all(
        ratings.map(async (rating: any) => {
          const user = await FOTWUser.findOne({ email: rating.userEmail })
            .select('name username image')
            .lean();
          return {
            ...rating,
            userId: user
              ? { name: formatDisplayName(user.name, user.username), image: user.image }
              : { name: 'Anonymous', image: null },
          };
        })
      );

      // 5. Calculate average rating
      if (allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r: any) => acc + r.rating, 0);
        averageRating = Math.round((sum / allRatings.length) * 10) / 10;
      }

      // 6. Likes for current film
      const [likeDoc, likesTotal] = await Promise.all([
        FOTWLike.findOne({ userEmail: session.user.email, filmId: currentFilm._id }).lean(),
        FOTWLike.countDocuments({ filmId: currentFilm._id }),
      ]);
      userLiked = !!likeDoc;
      likesCount = likesTotal;
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
    });
  } catch (error) {
    console.error('Error fetching FOTW data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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

    const newFilm = await FOTWFilm.create({
      title,
      posterUrl,
      tmdbUrl: tmdbUrl || '',
      chosenBy: chosenBy || '',
      chosenByEmail: chosenByEmail || '',
      dateSuggested: new Date(),
      addedBy: session.user.email,
      timerDuration: timerDuration ?? 604800000,
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
