import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason, FOTWSiteConfig, FOTWUser } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { formatDisplayName } from '@/lib/fotw/utils';

// GET: Fetch all previous (locked) FOTWs with their stats.
// Accepts optional ?seasonId=<mongoId> to filter to a season's date window.
// Uses MongoDB $lookup aggregation — all joining happens inside the DB engine,
// not in Node.js memory.
export async function GET(req: Request) {
  try {
    const [session] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // --- Season filter ---
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');
    let dateFilter: Record<string, unknown> = { lockedAt: { $ne: null } };
    let seasonLetterboxdUrl = '';

    if (seasonId && seasonId !== 'all') {
      const season = await FOTWSeason.findById(seasonId)
        .select('startDate endDate letterboxdUrl')
        .lean();
      if (!season) {
        return NextResponse.json({ message: 'Season not found' }, { status: 404 });
      }
      dateFilter = {
        lockedAt: { $ne: null },
        dateSuggested: {
          $gte: season.startDate,
          ...(season.endDate ? { $lte: season.endDate } : {}),
        },
      };
      if ((season as any).letterboxdUrl) {
        seasonLetterboxdUrl = (season as any).letterboxdUrl;
      }
    }

    if (!seasonLetterboxdUrl) {
      const siteConfig = await FOTWSiteConfig.findOne({}).select('letterboxdAllTimeUrl').lean();
      seasonLetterboxdUrl = siteConfig?.letterboxdAllTimeUrl || '';
    }

    // ── Single aggregation: films + ratings + likes + reviews in one DB round-trip ──
    const films = await FOTWFilm.aggregate([
      { $match: dateFilter },
      { $sort: { createdAt: -1 } },
      // Join ratings
      {
        $lookup: {
          from: 'fotwratings',
          localField: '_id',
          foreignField: 'filmId',
          as: 'allRatings',
        },
      },
      // Join public reviews
      {
        $lookup: {
          from: 'fotwreviews',
          let: { filmId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$filmId', '$$filmId'] }, { $eq: ['$isPrivate', false] }] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: 'publicReviews',
        },
      },
      // Join likes
      {
        $lookup: {
          from: 'fotwlikes',
          localField: '_id',
          foreignField: 'filmId',
          as: 'allLikes',
        },
      },
      // Compute derived fields server-side
      {
        $addFields: {
          ratingsCount: { $size: '$allRatings' },
          likesCount: { $size: '$allLikes' },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$allRatings' }, 0] },
              then: {
                $round: [
                  { $divide: [{ $sum: '$allRatings.rating' }, { $size: '$allRatings' }] },
                  1,
                ],
              },
              else: 0,
            },
          },
          // Use the denormalized watchedCount field; fall back to array length for older docs
          watchedCount: {
            $cond: {
              if: { $gt: [{ $ifNull: ['$watchedCount', -1] }, -1] },
              then: '$watchedCount',
              else: { $size: '$watchedBy' },
            },
          },
          timerDuration: {
            $ifNull: ['$timerDuration', { $multiply: ['$timerDurationDays', 86400000] }],
          },
        },
      },
    ]);

    // Collect all unique emails we need display info for (ratings, reviews, watchedBy, chosenBy)
    const uniqueEmails = new Set<string>();
    for (const film of films) {
      if (film.chosenByEmail) uniqueEmails.add(film.chosenByEmail);
      for (const r of film.allRatings ?? []) uniqueEmails.add(r.userEmail);
      for (const r of film.publicReviews ?? []) uniqueEmails.add(r.userEmail);
      for (const w of film.watchedBy ?? []) if (w?.userEmail) uniqueEmails.add(w.userEmail);
    }

    // Single user lookup for all needed emails
    const involvedUsers = await FOTWUser.find({ email: { $in: Array.from(uniqueEmails) } })
      .select('email name username image')
      .lean();
    const userMap = new Map((involvedUsers as any[]).map((u) => [u.email, u]));

    const fmt = (email: string, fallback = '') => {
      const u = userMap.get(email) as any;
      return u ? formatDisplayName(u.name, u.username) : formatDisplayName(fallback);
    };
    const img = (email: string) => (userMap.get(email) as any)?.image ?? null;

    // Assemble final response — shape is identical to previous implementation
    const result = films.map((film) => ({
      ...film,
      allRatings: (film.allRatings ?? []).map((r: any) => ({
        userEmail: r.userEmail,
        name: fmt(r.userEmail, r.userEmail),
        image: img(r.userEmail),
        rating: r.rating,
        createdAt: r.createdAt,
      })),
      watchedBy: (film.watchedBy ?? []).map((w: any) => ({
        userEmail: w.userEmail,
        watchedAt: w.watchedAt,
        name: fmt(w.userEmail, w.userEmail),
        image: img(w.userEmail),
      })),
      publicReviews: (film.publicReviews ?? []).map((r: any) => ({
        userEmail: r.userEmail,
        name: fmt(r.userEmail, r.userEmail),
        image: img(r.userEmail),
        body: r.body,
        hasSpoiler: r.hasSpoiler ?? false,
        createdAt: r.createdAt,
      })),
      chosenBy: film.chosenByEmail ? fmt(film.chosenByEmail, film.chosenBy || '') : film.chosenBy || '',
      allLikes: undefined, // strip the raw join array from response
    }));

    return NextResponse.json({ films: result, seasonLetterboxdUrl });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
