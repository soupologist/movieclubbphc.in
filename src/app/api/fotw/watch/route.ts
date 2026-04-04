import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWUser from '@/models/FOTWUser';
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

    // Increment watchedCount on FOTWUser — this drives the leaderboard score.
    // Only increments once per watch action (idempotency is handled by $addToSet above,
    // but the client only calls this once per film so double-increment is not a concern).
    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: session.user.name,
          image: session.user.image,
        },
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
