import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.error('Watch API failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId } = await req.json();

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
    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: { name: session.user.name, image: session.user.image },
        $inc: { watchedCount: 1 },
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.error('Watch API DELETE failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId } = await req.json();

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

    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: { name: session.user.name, image: session.user.image },
        $inc: { watchedCount: -1 },
      },
      { new: true }
    );

    // Delete any FOTWRating and FOTWLike for this user and film
    const ratingResult = await FOTWRating.deleteOne({ userEmail: session.user.email, filmId });
    const likeResult = await FOTWLike.deleteOne({ userEmail: session.user.email, filmId });

    return NextResponse.json({ 
      success: true, 
      ratingRemoved: ratingResult.deletedCount > 0, 
      likeRemoved: likeResult.deletedCount > 0 
    });
  } catch (error) {
    console.error('Error removing watched film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
