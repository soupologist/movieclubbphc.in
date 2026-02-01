import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import FOTWComment from '@/models/FOTWComment';

// GET: Fetch all previous FOTWs with their stats
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all films sorted by newest first
    const films = await FOTWFilm.find().sort({ createdAt: -1 }).lean();

    // Get stats for each film
    const filmsWithStats = await Promise.all(
      films.map(async (film) => {
        const ratings = await FOTWRating.find({ filmId: film._id }).lean();
        const commentsCount = await FOTWComment.countDocuments({
          filmId: film._id,
          parentId: null,
        });

        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) * 10) / 10
            : 0;

        return {
          ...film,
          ratingsCount: ratings.length,
          averageRating,
          commentsCount,
        };
      })
    );

    return NextResponse.json(filmsWithStats);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
