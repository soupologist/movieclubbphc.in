import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

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

    const { filmId, rating } = body;

    if (rating < 0.5 || rating > 5) {
      return NextResponse.json({ message: 'Invalid rating' }, { status: 400 });
    }

    // Ensure film exists
    const film = await FOTWFilm.findById(filmId).lean();
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
    const hasWatched =
      Array.isArray(film.watchedBy) &&
      film.watchedBy.some((w: any) => w.userEmail === session.user.email);
    if (!hasWatched) {
      return NextResponse.json(
        { error: 'You must mark the film as watched before rating.' },
        { status: 403 }
      );
    }

    // Check if already rated — if so, update; otherwise create.
    // The compound unique index (userEmail + filmId) prevents duplicates at DB level.
    // We run the rating upsert and user name/image sync concurrently.
    const [existingRating] = await Promise.all([
      FOTWRating.findOneAndUpdate(
        { userEmail: session.user.email, filmId },
        { $set: { rating } },
        { upsert: true, new: false }
      ),
      FOTWUser.findOneAndUpdate(
        { email: session.user.email },
        { $set: { name: session.user.name, image: session.user.image } },
        { upsert: false }
      ),
    ]);

    return NextResponse.json({ success: true, updated: !!existingRating });
  } catch (error) {
    console.error('Error rating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/fotw/rate is intentionally removed.
// Users change their rating by clicking a different star — the POST handler upserts.
// There is no UI that triggers rating deletion, so the route is dead code.
