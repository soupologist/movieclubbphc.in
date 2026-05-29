import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const [session, _] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');

    let season = null;
    let dateFilter: Record<string, any> = { dateSuggested: { $ne: null } };

    if (seasonId && seasonId !== 'all') {
      const seasonDoc = await FOTWSeason.findById(seasonId).lean();
      if (!seasonDoc) {
        return NextResponse.json({ message: 'Season not found' }, { status: 404 });
      }
      dateFilter.dateSuggested = {
        $ne: null,
        $gte: seasonDoc.startDate,
        ...(seasonDoc.endDate ? { $lte: seasonDoc.endDate } : {}),
      };

      season = {
        id: seasonDoc._id.toString(),
        name: seasonDoc.name,
        startDate: seasonDoc.startDate,
        endDate: seasonDoc.endDate,
      };
    }

    // 1. Overview pipeline
    const overviewPipeline = [
      { $match: dateFilter },
      {
        $facet: {
          stats: [
            {
              $lookup: {
                from: 'fotwratings',
                localField: '_id',
                foreignField: 'filmId',
                as: 'ratings',
              },
            },
            {
              $group: {
                _id: null,
                totalFilms: { $sum: 1 },
                totalWatches: { $sum: { $size: { $ifNull: ['$watchedBy', []] } } },
                totalRatings: { $sum: { $size: '$ratings' } },
                totalRatingSum: { $sum: { $sum: '$ratings.rating' } },
              },
            },
          ],
          uniqueWatchers: [
            { $unwind: '$watchedBy' },
            { $group: { _id: '$watchedBy.userEmail' } },
            { $count: 'count' },
          ],
        },
      },
    ];

    // 2. Films pipeline
    const filmsPipeline = [
      { $match: dateFilter },
      {
        $lookup: {
          from: 'fotwratings',
          localField: '_id',
          foreignField: 'filmId',
          as: 'ratings',
        },
      },
      {
        $project: {
          filmId: '$_id',
          title: 1,
          year: { $ifNull: ['$year', 0] },
          language: { $cond: [{ $in: ['$language', [null, '']] }, 'Unknown', '$language'] },
          dateSuggested: 1,
          chosenBy: { $cond: [{ $in: ['$chosenBy', [null, '']] }, 'Unknown', '$chosenBy'] },
          watchCount: { $size: { $ifNull: ['$watchedBy', []] } },
          ratingCount: { $size: '$ratings' },
          avgRatingRaw: { $avg: '$ratings.rating' },
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: [{ $gte: ['$ratingCount', 5] }, '$avgRatingRaw', null],
          },
        },
      },
      { $sort: { dateSuggested: 1 as 1 } },
    ];

    // 3. Leaderboard pipeline
    const leaderboardPipeline = [
      { $match: dateFilter },
      { $unwind: '$watchedBy' },
      { $group: { _id: '$watchedBy.userEmail', watchCount: { $sum: 1 } } },
      { $sort: { watchCount: -1 } },
      {
        $lookup: {
          from: 'fotwusers',
          localField: '_id',
          foreignField: 'email',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          username: { $ifNull: ['$user.username', null] },
          name: { $ifNull: ['$user.name', 'Unknown User'] },
          email: '$_id',
          watchCount: 1,
          currentStreak: { $ifNull: ['$user.currentStreak', 0] },
          longestStreak: { $ifNull: ['$user.longestStreak', 0] },
        },
      },
    ];

    // 4. Rating distribution pipeline
    const ratingDistributionPipeline = [
      { $match: dateFilter },
      {
        $lookup: {
          from: 'fotwratings',
          localField: '_id',
          foreignField: 'filmId',
          as: 'ratings',
        },
      },
      { $unwind: '$ratings' },
      { $group: { _id: '$ratings.rating', count: { $sum: 1 } } },
    ];

    // 5. Participation pipeline
    const participationPipeline = [
      { $match: dateFilter },
      {
        $project: {
          _id: 0,
          title: 1,
          watchCount: { $size: { $ifNull: ['$watchedBy', []] } },
          dateSuggested: 1,
        },
      },
      { $sort: { dateSuggested: 1 as 1 } },
    ];

    // 6. Language breakdown pipeline
    const languagePipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $cond: [{ $in: ['$language', [null, '']] }, 'Unknown', '$language'],
          },
          count: { $sum: 1 },
        },
      },
      { $project: { language: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ];

    // 7. Chosen by breakdown pipeline
    const chosenByPipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $cond: [{ $in: ['$chosenBy', [null, '']] }, 'Unknown', '$chosenBy'],
          },
          count: { $sum: 1 },
        },
      },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ];

    const [
      overviewResult,
      filmsResult,
      leaderboardResult,
      ratingDistResult,
      participationResult,
      languageResult,
      chosenByResult,
    ] = await Promise.all([
      FOTWFilm.aggregate(overviewPipeline as any[]),
      FOTWFilm.aggregate(filmsPipeline as any[]),
      FOTWFilm.aggregate(leaderboardPipeline as any[]),
      FOTWFilm.aggregate(ratingDistributionPipeline as any[]),
      FOTWFilm.aggregate(participationPipeline as any[]),
      FOTWFilm.aggregate(languagePipeline as any[]),
      FOTWFilm.aggregate(chosenByPipeline as any[]),
    ]);

    // Format Overview
    const stats = overviewResult[0]?.stats[0] || {
      totalFilms: 0,
      totalWatches: 0,
      totalRatings: 0,
      totalRatingSum: 0,
    };
    const uniqueWatchers = overviewResult[0]?.uniqueWatchers[0]?.count || 0;

    let overviewAvgRating = null;
    if (stats.totalRatings >= 5) {
      overviewAvgRating = stats.totalRatingSum / stats.totalRatings;
    }

    const overview = {
      totalFilms: stats.totalFilms,
      totalWatches: stats.totalWatches,
      totalRatings: stats.totalRatings,
      totalUniqueWatchers: uniqueWatchers,
      avgRating: overviewAvgRating,
      avgWatchesPerFilm:
        stats.totalFilms > 0 ? stats.totalWatches / stats.totalFilms : 0,
    };

    // Format Rating Distribution
    const ratingDistribution: Record<string, number> = {};
    for (const row of ratingDistResult) {
      // row._id should be a number like 3, 3.5, 4, 4.5
      ratingDistribution[Number(row._id).toFixed(1)] = row.count;
    }

    // Format Films
    const films = filmsResult.map((f) => ({
      filmId: f.filmId.toString(),
      title: f.title,
      year: f.year,
      language: f.language,
      dateSuggested: f.dateSuggested,
      chosenBy: f.chosenBy,
      watchCount: f.watchCount,
      avgRating: f.avgRating,
      ratingCount: f.ratingCount,
    }));

    return NextResponse.json({
      season,
      overview,
      films,
      leaderboard: leaderboardResult,
      ratingDistribution,
      participationByFilm: participationResult,
      languageBreakdown: languageResult,
      chosenByBreakdown: chosenByResult,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
