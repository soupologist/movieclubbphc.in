import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

// POST: Like a film (idempotent)
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

    // Check lock status
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

    await Promise.all([
      FOTWLike.findOneAndUpdate(
        { userEmail: session.user.email, filmId },
        { userEmail: session.user.email, filmId },
        { upsert: true, new: true }
      ),
      FOTWUser.findOneAndUpdate(
        { email: session.user.email },
        { $set: { name: session.user.name, image: session.user.image } },
        { upsert: false }
      ),
    ]);

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Error liking film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Unlike a film
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

    // Check lock status
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

    await FOTWLike.findOneAndDelete({
      userEmail: session.user.email,
      filmId,
    });

    return NextResponse.json({ liked: false });
  } catch (error) {
    console.error('Error unliking film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
