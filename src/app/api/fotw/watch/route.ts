import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTWReview } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json().catch(() => ({})),
      dbConnect(),
    ]);
    if (!session || !session.user?.email) {
      console.error('Watch API failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { filmId } = body;

    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
    }

    // Attempt to atomically add the user to watchedBy ONLY if they aren't already there
    // and the film is NOT locked.
    const result = await FOTWFilm.findOneAndUpdate(
      {
        _id: filmId,
        lockedAt: null,
        'watchedBy.userEmail': { $ne: session.user.email }, // atomic condition checks if already watched
      },
      {
        $push: { watchedBy: { userEmail: session.user.email, watchedAt: new Date() } },
      },
      { new: true }
    );

    // If result is null, either the film doesn't exist, is locked, or the user already watched it.
    if (!result) {
      const film = await FOTWFilm.findById(filmId).select('lockedAt watchedBy').lean();
      if (!film) return NextResponse.json({ message: 'Film not found' }, { status: 404 });
      if (film.lockedAt !== null && film.lockedAt !== undefined) {
        return NextResponse.json(
          { error: 'This film has been archived and can no longer be updated.' },
          { status: 403 }
        );
      }
      // If it exists and isn't locked, the update failed only because the user was already in watchedBy.
      return NextResponse.json({ success: true, alreadyWatched: true });
    }

    // Increment watchedCount exactly once per unique watch. (safe to do since atomic update succeeded)
    const user = await FOTWUser.findOne({ email: session.user.email }).lean();

    const currentFilmAnchor = result.dateSuggested || result.createdAt;

    const previousFilm = await FOTWFilm.findOne({ lockedAt: { $ne: null } })
      .sort({ lockedAt: -1 })
      .select('dateSuggested createdAt lockedAt')
      .lean();

    let newCurrentStreak = user?.currentStreak || 0;

    if (user?.lastWatchedWeek && new Date(user.lastWatchedWeek).getTime() === new Date(currentFilmAnchor).getTime()) {
      newCurrentStreak += 1;
    } else if (previousFilm && user?.lastWatchedWeek) {
      const prevFilmAnchor = previousFilm.dateSuggested || previousFilm.createdAt;
      const diffTime = Math.abs(
        new Date(user.lastWatchedWeek).getTime() - new Date(prevFilmAnchor).getTime()
      );
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(user?.longestStreak || 0, newCurrentStreak);

    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: session.user.name,
          image: session.user.image,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastWatchedWeek: currentFilmAnchor,
        },
        $inc: { watchedCount: 1, seasonWatchedCount: 1 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking film as watched:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json().catch(() => ({})),
      dbConnect(),
    ]);
    if (!session || !session.user?.email) {
      console.error('Watch API DELETE failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { filmId } = body;

    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
    }

    const result = await FOTWFilm.findOneAndUpdate(
      {
        _id: filmId,
        lockedAt: null,
        'watchedBy.userEmail': session.user.email,
      },
      {
        $pull: { watchedBy: { userEmail: session.user.email } },
      },
      { new: true }
    );

    if (!result) {
      const film = await FOTWFilm.findById(filmId).select('lockedAt watchedBy').lean();
      if (!film) return NextResponse.json({ message: 'Film not found' }, { status: 404 });
      if (film.lockedAt !== null && film.lockedAt !== undefined) {
        return NextResponse.json(
          { error: 'This film has been archived and can no longer be updated.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, notWatched: true });
    }

    const user = await FOTWUser.findOne({ email: session.user.email }).lean();
    const currentStreak = Math.max(0, (user?.currentStreak || 0) - 1);

    const lastWatchedFilm = await FOTWFilm.findOne({
      'watchedBy.userEmail': session.user.email,
      _id: { $ne: filmId }
    }).sort({ lockedAt: -1, createdAt: -1 }).lean();

    const newLastWatchedWeek = lastWatchedFilm ? (lastWatchedFilm.dateSuggested || lastWatchedFilm.createdAt) : null;

    const updateQuery: any = {
      $set: {
        name: session.user.name,
        image: session.user.image,
        currentStreak: currentStreak,
      },
      $inc: { watchedCount: -1, seasonWatchedCount: -1 },
    };

    if (newLastWatchedWeek) {
      updateQuery.$set.lastWatchedWeek = newLastWatchedWeek;
    } else {
      updateQuery.$unset = { lastWatchedWeek: 1 };
    }

    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      updateQuery,
      { new: true }
    );

    // Delete any FOTWRating, FOTWLike, and FOTWReview for this user and film
    const ratingResult = await FOTWRating.deleteOne({ userEmail: session.user.email, filmId });
    const likeResult = await FOTWLike.deleteOne({ userEmail: session.user.email, filmId });
    const reviewResult = await FOTWReview.deleteOne({ userEmail: session.user.email, filmId });

    return NextResponse.json({
      success: true,
      ratingRemoved: ratingResult.deletedCount > 0,
      likeRemoved: likeResult.deletedCount > 0,
      reviewRemoved: reviewResult.deletedCount > 0,
    });
  } catch (error) {
    console.error('Error removing watched film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
