import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
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

    // $addToSet safely pushes uniquely, and automatically initiates array if it somehow was missing.
    const updatedFilm = await FOTWFilm.findByIdAndUpdate(
      filmId,
      {
        $addToSet: {
          watchedBy: { userEmail: session.user.email, watchedAt: new Date() },
        },
      },
      { new: true }
    );

    if (!updatedFilm) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking film as watched:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
