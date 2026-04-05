import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import FOTWUser from '@/models/FOTWUser';
import FOTWLike from '@/models/FOTWLike';
import { authOptions } from '@/lib/auth';

// GET: Fetch all previous (locked) FOTWs with their stats.
// Performs exactly 4 DB queries total regardless of how many films or ratings exist.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Identify the current film the same way GET /api/fotw/data does —
    // newest document with lockedAt: null. We exclude it from the archive
    // by _id so that old films (which may also have lockedAt: null because
    // they predate the auto-lock system) still appear in the archive.
    const currentFilm = await FOTWFilm.findOne({ lockedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    const archiveQuery = currentFilm ? { _id: { $ne: currentFilm._id } } : {};
    const films = await FOTWFilm.find(archiveQuery)
      .sort({ createdAt: -1 })
      .lean();

    const filmIds = films.map((f) => f._id);

    // 2. Bulk-fetch ALL ratings, ALL users, and ALL likes in 3 parallel queries.
    //    No per-film or per-rating sub-queries — everything resolved in memory.
    const [allRatings, allUsers, allLikes] = await Promise.all([
      FOTWRating.find({ filmId: { $in: filmIds } }).lean(),
      FOTWUser.find().select('email name image').lean(),
      FOTWLike.find({ filmId: { $in: filmIds } }).lean(),
    ]);

    // 3. Build O(1) lookup map: email → user document
    const userMap = Object.fromEntries(
      (allUsers as any[]).map((u) => [u.email, u])
    );

    // 4. Assemble per-film stats in memory — zero additional DB queries
    const result = films.map((film) => {
      const filmIdStr = film._id.toString();

      const filmRatings = (allRatings as any[]).filter(
        (r) => r.filmId.toString() === filmIdStr
      );
      const filmLikes = (allLikes as any[]).filter(
        (l) => l.filmId.toString() === filmIdStr
      );

      const avg =
        filmRatings.length > 0
          ? Math.round(
              (filmRatings.reduce((s, r) => s + r.rating, 0) / filmRatings.length) * 10
            ) / 10
          : 0;

      const watchedBy = Array.isArray(film.watchedBy) ? film.watchedBy : [];

      return {
        ...film,
        averageRating: avg,
        ratingsCount: filmRatings.length,
        watchedCount: watchedBy.length,
        likesCount: filmLikes.length,
        allRatings: filmRatings.map((r) => ({
          userEmail: r.userEmail,
          name: userMap[r.userEmail]?.name ?? r.userEmail,
          image: userMap[r.userEmail]?.image ?? null,
          rating: r.rating,
          createdAt: r.createdAt,
        })),
        watchedBy: watchedBy.map((w: any) => ({
          userEmail: w.userEmail,
          watchedAt: w.watchedAt,
          name: userMap[w.userEmail]?.name ?? w.userEmail,
          image: userMap[w.userEmail]?.image ?? null,
        })),
        chosenBy: film.chosenBy || '',
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
