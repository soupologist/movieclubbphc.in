import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import FOTWUser from '@/models/FOTWUser';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// GET: Fetch current film, leaderboard, and user's rating status
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 1. Get Current Film (Latest one)
    const currentFilm = await FOTWFilm.findOne().sort({ createdAt: -1 }).lean();

    // 2. Get Leaderboard (Top 50 users by rating count)
    const leaderboard = await FOTWUser.find()
      .sort({ ratingsCount: -1 })
      .limit(50)
      .select('name image ratingsCount email');

    let userRating = null;
    let isAdmin = FOTW_ADMINS.includes(session.user.email);
    let allRatings: any[] = [];
    let averageRating = 0;
    let watchedCount = 0;

    if (currentFilm) {
      // 3. Check if current user rated this film
      const rating = await FOTWRating.findOne({
        userEmail: session.user.email,
        filmId: currentFilm._id,
      });
      if (rating) {
        userRating = rating.rating;
      }

      // 4. Get all ratings for current film
      const ratings = await FOTWRating.find({ filmId: currentFilm._id })
        .sort({ createdAt: -1 })
        .lean();

      // Watched count = number of ratings
      watchedCount = ratings.length;

      // Fetch user data for each rating
      allRatings = await Promise.all(
        ratings.map(async (rating: any) => {
          const user = await FOTWUser.findOne({ email: rating.userEmail })
            .select('name image')
            .lean();
          return {
            ...rating,
            userId: user
              ? { name: user.name, image: user.image }
              : { name: 'Anonymous', image: null },
          };
        })
      );

      // 5. Calculate average rating
      if (allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r: any) => acc + r.rating, 0);
        averageRating = Math.round((sum / allRatings.length) * 10) / 10;
      }
    }

    return NextResponse.json({
      currentFilm,
      leaderboard,
      userRating,
      isAdmin,
      allRatings,
      averageRating,
      watchedCount,
    });
  } catch (error) {
    console.error('Error fetching FOTW data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Admin creates a new film
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { title, posterUrl, driveLink, chosenBy } = await req.json();

    const newFilm = await FOTWFilm.create({
      title,
      posterUrl,
      driveLink,
      chosenBy: chosenBy || '',
      addedBy: session.user.email,
    });

    return NextResponse.json({ success: true, film: newFilm });
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
