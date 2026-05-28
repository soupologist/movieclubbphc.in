import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

// GET: Fetch the current user's activity across all films
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all user's ratings
    const ratings = await FOTWRating.find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .lean();

    // Get all films the user has rated
    const filmIds = ratings.map((r) => r.filmId);
    const films = await FOTWFilm.find({ _id: { $in: filmIds } }).lean();
    const filmMap = new Map(films.map((f: any) => [f._id.toString(), f]));

    // Combine ratings with film data
    const ratedFilms = ratings.map((r: any) => {
      const film: any = filmMap.get(r.filmId.toString());
      return {
        _id: r._id,
        rating: r.rating,
        ratedAt: r.createdAt,
        filmId: r.filmId,
        filmTitle: film?.title || 'Unknown Film',
        filmPosterUrl: film?.posterUrl || '',
      };
    });

    return NextResponse.json({
      ratings: ratedFilms,
      totalWatched: ratedFilms.length,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
