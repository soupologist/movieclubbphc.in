import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWSeason, FOTWUser } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { formatDisplayName, normalizeLanguage } from '@/lib/fotw/utils';


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
          chosenByEmail: 1,
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
            email: { $cond: [{ $in: ['$chosenByEmail', [null, '']] }, '$chosenBy', '$chosenByEmail'] },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$dateSuggested' } }
          },
          fallbackName: { $first: '$chosenBy' }
        },
      },
      {
        $group: {
          _id: '$_id.email',
          count: { $sum: 1 },
          fallbackName: { $first: '$fallbackName' }
        }
      },
      { $project: { name: '$_id', count: 1, fallbackName: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ];

    const aggregatedResults = await FOTWFilm.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          overviewStats: [
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
          overviewUniqueWatchers: [
            { $unwind: '$watchedBy' },
            { $group: { _id: '$watchedBy.userEmail' } },
            { $count: 'count' },
          ],
          films: filmsPipeline.slice(1) as any[],
          leaderboard: leaderboardPipeline.slice(1) as any[],
          ratingDist: ratingDistributionPipeline.slice(1) as any[],
          participation: participationPipeline.slice(1) as any[],
          language: languagePipeline.slice(1) as any[],
          chosenBy: chosenByPipeline.slice(1) as any[]
        }
      }
    ]);

    const resultBlock = aggregatedResults[0] || {};
    const overviewStatsResult = resultBlock.overviewStats || [];
    const overviewUniqueWatchersResult = resultBlock.overviewUniqueWatchers || [];
    const filmsResult = resultBlock.films || [];
    const leaderboardResult = resultBlock.leaderboard || [];
    const ratingDistResult = resultBlock.ratingDist || [];
    const participationResult = resultBlock.participation || [];
    const languageResult = resultBlock.language || [];
    const chosenByResult = resultBlock.chosenBy || [];

    // Format Overview
    const stats = overviewStatsResult[0] || {
      totalFilms: 0,
      totalWatches: 0,
      totalRatings: 0,
      totalRatingSum: 0,
    };
    const uniqueWatchers = overviewUniqueWatchersResult[0]?.count || 0;

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

    // Extract unique emails from results to avoid fetching ALL users
    const uniqueEmails = new Set<string>();
    filmsResult.forEach((f: any) => {
      if (f.chosenByEmail) uniqueEmails.add(f.chosenByEmail);
    });
    chosenByResult.forEach((c: any) => {
      if (c.name && c.name.includes('@')) uniqueEmails.add(c.name);
    });

    // Fetch only required users for formatting names efficiently
    const involvedUsers = await FOTWUser.find({ email: { $in: Array.from(uniqueEmails) } }).select('email name username').lean();
    const userMap = Object.fromEntries((involvedUsers as any[]).map(u => [u.email, u]));

    // Format Films
    const films = filmsResult.map((f: any) => {
      const u = userMap[f.chosenByEmail];
      return {
        filmId: f.filmId.toString(),
        title: f.title,
        year: f.year,
        language: normalizeLanguage(f.language),
        dateSuggested: f.dateSuggested,
        chosenBy: u ? formatDisplayName(u.name, u.username) : formatDisplayName(f.chosenBy),
        watchCount: f.watchCount,
        avgRating: f.avgRating,
        ratingCount: f.ratingCount,
      };
    });

    const formattedLeaderboard = leaderboardResult.map((l: any) => {
      return {
        ...l,
        name: formatDisplayName(l.name, l.username),
      };
    });

    // Group normalized languages in case multiple raw codes map to the same normalized name
    const groupedLanguages: Record<string, number> = {};
    languageResult.forEach((l: any) => {
      const norm = normalizeLanguage(l.language);
      groupedLanguages[norm] = (groupedLanguages[norm] || 0) + l.count;
    });
    const languageBreakdown = Object.entries(groupedLanguages)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    const chosenByBreakdown = chosenByResult.map((c: any) => {
      // c.name might be an email or a raw string fallback
      const u = userMap[c.name];
      const displayName = u ? formatDisplayName(u.name, u.username) : formatDisplayName(c.fallbackName || c.name);
      return { name: displayName, count: Math.round(c.count) };
    });
    
    // Deduplicate chosenByBreakdown in case multiple emails map to same display name or same fallback
    const groupedChosenBy: Record<string, number> = {};
    chosenByBreakdown.forEach((c: any) => {
      groupedChosenBy[c.name] = (groupedChosenBy[c.name] || 0) + c.count;
    });
    const finalChosenByBreakdown = Object.entries(groupedChosenBy)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      season,
      overview,
      films,
      leaderboard: formattedLeaderboard,
      ratingDistribution,
      participationByFilm: participationResult,
      languageBreakdown,
      chosenByBreakdown: finalChosenByBreakdown,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
