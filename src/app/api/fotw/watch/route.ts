import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWUser, FOTWRating, FOTWLike, FOTWReview } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { calculateUserStreak } from '@/lib/fotw/streaks';

export async function POST(req: Request) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json().catch(() => ({})),
      dbConnect(),
    ]);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { filmId } = body;
    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
    }

    // Atomically add the user to watchedBy only if they aren't already there and the film is not locked
    const result = await FOTWFilm.findOneAndUpdate(
      {
        _id: filmId,
        lockedAt: null,
        'watchedBy.userEmail': { $ne: session.user.email },
      },
      {
        $push: { watchedBy: { userEmail: session.user.email, watchedAt: new Date() } },
        $inc: { watchedCount: 1 },
      },
      { new: true }
    );

    if (!result) {
      const film = await FOTWFilm.findById(filmId).select('lockedAt watchedBy').lean();
      if (!film) return NextResponse.json({ message: 'Film not found' }, { status: 404 });
      if (film.lockedAt != null) {
        return NextResponse.json(
          { error: 'This film has been archived and can no longer be updated.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, alreadyWatched: true });
    }

    // Fetch all films to calculate streak chronologically
    const allFilms = await FOTWFilm.find({})
      .select('_id dateSuggested createdAt lockedAt watchedBy')
      .lean();

    const existingUser = await FOTWUser.findOne({ email: session.user.email })
      .select('longestStreak')
      .lean();

    const { currentStreak, longestStreak } = calculateUserStreak(
      allFilms as any[],
      session.user.email,
      existingUser?.longestStreak || 0
    );

    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: session.user.name,
          image: session.user.image,
          currentStreak,
          longestStreak,
          lastWatchedWeek: result.dateSuggested || result.createdAt,
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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { filmId } = body;
    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
    }

    // Atomically remove user from watchedBy only if the film is not locked
    const result = await FOTWFilm.findOneAndUpdate(
      {
        _id: filmId,
        lockedAt: null,
        'watchedBy.userEmail': session.user.email,
      },
      {
        $pull: { watchedBy: { userEmail: session.user.email } },
        $inc: { watchedCount: -1 },
      },
      { new: true }
    );

    if (!result) {
      const film = await FOTWFilm.findById(filmId).select('lockedAt watchedBy').lean();
      if (!film) return NextResponse.json({ message: 'Film not found' }, { status: 404 });
      if (film.lockedAt != null) {
        return NextResponse.json(
          { error: 'This film has been archived and can no longer be updated.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, notWatched: true });
    }

    // Recompute streak from all remaining films
    const allFilms = await FOTWFilm.find({})
      .select('_id dateSuggested createdAt lockedAt watchedBy')
      .lean();

    const existingUser = await FOTWUser.findOne({ email: session.user.email })
      .select('longestStreak')
      .lean();

    const { currentStreak, longestStreak } = calculateUserStreak(
      allFilms as any[],
      session.user.email,
      existingUser?.longestStreak || 0
    );

    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: session.user.name,
          image: session.user.image,
          currentStreak,
          longestStreak,
        },
        $inc: { watchedCount: -1, seasonWatchedCount: -1 },
      },
      { new: true }
    );

    // Remove rating, like, and review for this film
    const [ratingResult, likeResult, reviewResult] = await Promise.all([
      FOTWRating.deleteOne({ userEmail: session.user.email, filmId }),
      FOTWLike.deleteOne({ userEmail: session.user.email, filmId }),
      FOTWReview.deleteOne({ userEmail: session.user.email, filmId }),
    ]);

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
