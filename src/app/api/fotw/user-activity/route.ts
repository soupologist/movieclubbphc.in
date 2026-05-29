import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWRating } from '@/lib/fotw/schemas';
import { FOTWLike } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import { formatDisplayName } from '@/lib/fotw/utils';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const userIdParam = searchParams.get('userId');

    if (!emailParam && !userIdParam) {
      return NextResponse.json({ message: 'Missing email or userId param' }, { status: 400 });
    }

    await dbConnect();

    // Securely resolve the target user's email 
    let targetEmail = emailParam;
    let userDoc: any = null;

    if (userIdParam) {
      userDoc = await FOTWUser.findById(userIdParam).select('email name username image watchedCount').lean();
      if (!userDoc) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      targetEmail = userDoc.email;
    } else if (emailParam) {
      userDoc = await FOTWUser.findOne({ email: emailParam }).select('email name username image watchedCount').lean();
    }

    if (!targetEmail) {
       return NextResponse.json({ message: 'Failed to resolve user email' }, { status: 400 });
    }

    // Fetch user ratings and likes
    const [ratings, likes] = await Promise.all([
      FOTWRating.find({ userEmail: targetEmail }).sort({ createdAt: -1 }).lean(),
      FOTWLike.find({ userEmail: targetEmail }).sort({ createdAt: -1 }).lean(),
    ]);

    // Get all film IDs referenced
    const ratingFilmIds = ratings.map((r: any) => r.filmId);
    const likeFilmIds = likes.map((l: any) => l.filmId);
    const allFilmIds = [...new Set([...ratingFilmIds, ...likeFilmIds].map(String))];
    const objectIds = allFilmIds.map(id => new mongoose.Types.ObjectId(id));

    const films = await FOTWFilm.find({ _id: { $in: objectIds } })
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
      name: userDoc ? formatDisplayName(userDoc.name, userDoc.username) : targetEmail,
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
