import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWLike from '@/models/FOTWLike';
import { authOptions } from '@/lib/auth';

// POST: Like a film (idempotent)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId } = await req.json();

    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
    }

    await FOTWLike.findOneAndUpdate(
      { userEmail: session.user.email, filmId },
      { userEmail: session.user.email, filmId },
      { upsert: true, new: true }
    );

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Error liking film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Unlike a film
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId } = await req.json();

    if (!filmId) {
      return NextResponse.json({ message: 'Film ID is required' }, { status: 400 });
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
