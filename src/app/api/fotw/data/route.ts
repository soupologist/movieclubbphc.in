import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import FOTWUser from '@/models/FOTWUser';
import FOTWLike from '@/models/FOTWLike';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

// GET: Fetch current film, leaderboard, and user's rating status
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 1. Get Current Film (Latest unlocked one)
    let currentFilm = await FOTWFilm.findOne({ lockedAt: null }).sort({ createdAt: -1 }).lean();

    // Auto-lock if 7 days have passed
    if (currentFilm) {
      const deadline = new Date(currentFilm.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;
      if (Date.now() > deadline) {
        await FOTWFilm.findByIdAndUpdate(currentFilm._id, { $set: { lockedAt: new Date() } });
        currentFilm = null;
      }
    }

    // 2. Get Leaderboard (Top 50 users by watched count)
    const leaderboard = await FOTWUser.find()
      .sort({ watchedCount: -1 })
      .limit(50)
      .select('name image watchedCount email');

    let userRating = null;
    let isAdmin = FOTW_ADMINS.includes(session.user.email);
    let allRatings: any[] = [];
    let averageRating = 0;
    let watchedCount = 0;
    let hasWatched = false;
    let userLiked = false;
    let likesCount = 0;

    if (currentFilm) {
      // 3. Check if current user rated this film
      const rating = await FOTWRating.findOne({
        userEmail: session.user.email,
        filmId: currentFilm._id,
      });
      if (rating) {
        userRating = rating.rating;
      }

      // Watched count from watchedBy array
      watchedCount = Array.isArray(currentFilm.watchedBy) ? currentFilm.watchedBy.length : 0;

      // Check if current user has watched
      hasWatched = Array.isArray(currentFilm.watchedBy)
        ? currentFilm.watchedBy.some((w: any) => w.userEmail === session.user.email)
        : false;

      // 4. Get all ratings for current film
      const ratings = await FOTWRating.find({ filmId: currentFilm._id })
        .sort({ createdAt: -1 })
        .lean();

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

      // 6. Likes for current film
      const [likeDoc, likesTotal] = await Promise.all([
        FOTWLike.findOne({ userEmail: session.user.email, filmId: currentFilm._id }).lean(),
        FOTWLike.countDocuments({ filmId: currentFilm._id }),
      ]);
      userLiked = !!likeDoc;
      likesCount = likesTotal;
    }

    return NextResponse.json({
      currentFilm,
      leaderboard,
      userRating,
      isAdmin,
      allRatings,
      averageRating,
      watchedCount,
      hasWatched,
      userLiked,
      likesCount,
    });
  } catch (error) {
    console.error('Error fetching FOTW data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Admin creates a new film
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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

// PATCH: Admin updates current film
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { filmId, title, posterUrl, driveLink, chosenBy } = await req.json();

    if (!filmId) {
      return NextResponse.json({ message: 'Missing filmId' }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (posterUrl !== undefined) updates.posterUrl = posterUrl;
    if (driveLink !== undefined) updates.driveLink = driveLink;
    if (chosenBy !== undefined) updates.chosenBy = chosenBy;

    const updatedFilm = await FOTWFilm.findByIdAndUpdate(
      filmId,
      { $set: updates },
      { new: true }
    );

    if (!updatedFilm) {
      return NextResponse.json({ message: 'Film not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, film: updatedFilm });
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
