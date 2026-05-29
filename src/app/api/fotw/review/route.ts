import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWReview, FOTWFilm } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

// POST /api/fotw/review — create or update the caller's review for a film
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

    const { filmId, body: reviewBody, isPrivate, hasSpoiler } = body;

    if (!filmId) {
      return NextResponse.json({ message: 'filmId is required' }, { status: 400 });
    }

    const trimmed = (reviewBody ?? '').trim();
    if (!trimmed) {
      return NextResponse.json({ message: 'Review body cannot be empty' }, { status: 400 });
    }
    if (trimmed.length > 1000) {
      return NextResponse.json({ message: 'Review must be 1000 characters or fewer' }, { status: 400 });
    }

    // Ensure film exists and is not locked
    const film = await FOTWFilm.findById(filmId).lean();
    if (!film) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }
    if ((film as any).lockedAt !== null && (film as any).lockedAt !== undefined) {
      return NextResponse.json(
        { error: 'This film has been archived and can no longer be updated.' },
        { status: 403 }
      );
    }

    // Gating: user must have watched the film before reviewing
    const hasWatched =
      Array.isArray((film as any).watchedBy) &&
      (film as any).watchedBy.some((w: any) => w.userEmail === session.user.email);

    if (!hasWatched) {
      return NextResponse.json(
        { error: 'You must mark the film as watched before reviewing.' },
        { status: 403 }
      );
    }

    const existingReview = await FOTWReview.findOneAndUpdate(
      { userEmail: session.user.email, filmId },
      { $set: { body: trimmed, isPrivate: !!isPrivate, hasSpoiler: !!hasSpoiler } },
      { upsert: true, new: false }
    );

    return NextResponse.json({ success: true, updated: !!existingReview });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/fotw/review — delete the caller's review for a film
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
      return NextResponse.json({ message: 'filmId is required' }, { status: 400 });
    }

    const result = await FOTWReview.deleteOne({ userEmail: session.user.email, filmId });
    return NextResponse.json({ success: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
