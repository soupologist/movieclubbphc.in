import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWRating from '@/models/FOTWRating';
import FOTWLike from '@/models/FOTWLike';
import FOTWUser from '@/models/FOTWUser';
import FOTWFilm from '@/models/FOTWFilm';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ message: 'Missing email param' }, { status: 400 });
    }

    await dbConnect();

    // Fetch user profile, ratings, and likes in parallel
    const [userDoc, ratings, likes] = await Promise.all([
      FOTWUser.findOne({ email }).select('name image watchedCount').lean(),
      FOTWRating.find({ userEmail: email }).sort({ createdAt: -1 }).lean(),
      FOTWLike.find({ userEmail: email }).sort({ createdAt: -1 }).lean(),
    ]);

    // Get all film IDs referenced
    const ratingFilmIds = ratings.map((r: any) => r.filmId);
    const likeFilmIds = likes.map((l: any) => l.filmId);
    const allFilmIds = [...new Set([...ratingFilmIds, ...likeFilmIds].map(String))];

    const films = await FOTWFilm.find({ _id: { $in: allFilmIds } })
      .select('_id title posterUrl')
      .lean();
    const filmMap = new Map(films.map((f: any) => [f._id.toString(), f]));

    const ratingsList = ratings.map((r: any) => {
      const film: any = filmMap.get(r.filmId.toString());
      return {
        filmId: r.filmId,
        filmTitle: film?.title ?? 'Unknown Film',
        filmPosterUrl: film?.posterUrl ?? '',
        rating: r.rating,
        createdAt: r.createdAt,
      };
    });

    const likesList = likes.map((l: any) => {
      const film: any = filmMap.get(l.filmId.toString());
      return {
        filmId: l.filmId,
        filmTitle: film?.title ?? 'Unknown Film',
        filmPosterUrl: film?.posterUrl ?? '',
        createdAt: l.createdAt,
      };
    });

    return NextResponse.json({
      name: (userDoc as any)?.name ?? email,
      image: (userDoc as any)?.image ?? null,
      watchedCount: (userDoc as any)?.watchedCount ?? 0,
      ratings: ratingsList,
      likes: likesList,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
