import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import FOTWUser from '@/models/FOTWUser';
import FOTWLike from '@/models/FOTWLike';
import { authOptions } from '@/lib/auth';

// GET: Fetch all previous FOTWs with their stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all films sorted by newest first
    const films = await FOTWFilm.find().sort({ createdAt: -1 }).lean();

    const filmsWithStats = await Promise.all(
      films.map(async (film) => {
        const [ratings, likesCount] = await Promise.all([
          FOTWRating.find({ filmId: film._id }).lean(),
          FOTWLike.countDocuments({ filmId: film._id }),
        ]);

        // fetch all rating details in parallel
        const allRatings = await Promise.all(
          ratings.map(async (r: any) => {
            const user = await FOTWUser.findOne({ email: r.userEmail }).select('name').lean();
            return {
              userEmail: r.userEmail,
              name: user?.name || 'Anonymous',
              rating: r.rating,
              createdAt: r.createdAt,
            };
          })
        );

        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) * 10) / 10
            : 0;

        const watchedBy = Array.isArray(film.watchedBy) ? film.watchedBy : [];

        // Resolve display names for watchers
        const watcherEmails = watchedBy.map((w: any) => w.userEmail);
        const watchers = await FOTWUser.find({ email: { $in: watcherEmails } })
          .select('email name image')
          .lean();
        const watchedByWithNames = watchedBy.map((w: any) => ({
          userEmail: w.userEmail,
          watchedAt: w.watchedAt,
          name: (watchers as any[]).find((u) => u.email === w.userEmail)?.name ?? w.userEmail,
        }));

        return {
          ...film,
          allRatings,
          ratingsCount: ratings.length,
          watchedCount: watchedBy.length,
          watchedBy: watchedByWithNames,
          averageRating,
          chosenBy: film.chosenBy || '',
          likesCount,
        };
      })
    );

    return NextResponse.json(filmsWithStats);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
