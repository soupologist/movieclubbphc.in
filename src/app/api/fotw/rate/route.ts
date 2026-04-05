import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWRating from '@/models/FOTWRating';
import FOTWFilm from '@/models/FOTWFilm';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId, rating } = await req.json();

    if (rating < 0.5 || rating > 5) {
      return NextResponse.json({ message: 'Invalid rating' }, { status: 400 });
    }

    // Ensure film exists
    const film = await FOTWFilm.findById(filmId);
    if (!film) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    // Check lock status
    if (film.lockedAt !== null && film.lockedAt !== undefined) {
      return NextResponse.json(
        { error: 'This film has been archived and can no longer be updated.' },
        { status: 403 }
      );
    }

    // Gating: user must have marked film as watched before rating
    const hasWatched = Array.isArray(film.watchedBy) &&
      film.watchedBy.some((w: any) => w.userEmail === session.user.email);
    if (!hasWatched) {
      return NextResponse.json(
        { error: 'You must mark the film as watched before rating.' },
        { status: 403 }
      );
    }

    // Check if already rated — if so, update; otherwise create
    const existingRating = await FOTWRating.findOne({
      userEmail: session.user.email,
      filmId,
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      await existingRating.save();
    } else {
      // Create new rating — leaderboard score is NOT affected by rating, only by watching
      await FOTWRating.create({
        userEmail: session.user.email,
        filmId,
        rating,
      });
    }

    return NextResponse.json({ success: true, updated: !!existingRating });
  } catch (error) {
    console.error('Error rating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove user's rating for a film
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId } = await req.json();

    await FOTWRating.findOneAndDelete({
      userEmail: session.user.email,
      filmId,
    });

    // Leaderboard score is based on watches, not ratings — no FOTWUser update needed here.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
