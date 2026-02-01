import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWRating from '@/models/FOTWRating';
import FOTWUser from '@/models/FOTWUser';
import FOTWFilm from '@/models/FOTWFilm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { filmId, rating } = await req.json();

    if (rating < 0 || rating > 5) {
      return NextResponse.json({ message: 'Invalid rating' }, { status: 400 });
    }

    // Ensure film exists
    const film = await FOTWFilm.findById(filmId);
    if (!film) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    // Check if already rated
    const existingRating = await FOTWRating.findOne({
      userEmail: session.user.email,
      filmId,
    });

    if (existingRating) {
      return NextResponse.json({ message: 'Already rated' }, { status: 400 });
    }

    // Create Rating
    await FOTWRating.create({
      userEmail: session.user.email,
      filmId,
      rating,
    });

    // Update or Create User and increment count
    await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: session.user.name,
          image: session.user.image,
        },
        $inc: { ratingsCount: 1 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
