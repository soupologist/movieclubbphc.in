import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWRating, FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// ---------------------------------------------------------------------------
// Helper: build MongoDB $switch branches that map each film's dateSuggested
// to the _id of the season it belongs to. Films outside every season → null.
// ---------------------------------------------------------------------------
function buildSeasonBranches(seasons: any[]) {
  return seasons.map((s) => {
    const conditions: any[] = [
      { $ne: ['$dateSuggested', null] },
      { $gte: ['$dateSuggested', s.startDate] },
    ];
    if (s.endDate) {
      conditions.push({ $lte: ['$dateSuggested', s.endDate] });
    }
    return { case: { $and: conditions }, then: s._id };
  });
}

// ---------------------------------------------------------------------------
// GET — list all seasons with pre-computed metrics (admin only)
//
// Metrics per season (computed with 2 aggregation pipelines in parallel):
//   filmCount      — # FOTWFilm docs whose dateSuggested falls in the range
//   totalWatches   — sum of watchedBy.length across those films
//   uniqueWatchers — count of distinct watchedBy.userEmail across those films
//   avgRating      — mean of FOTWRating.rating for those films
//
// The film pipeline and the rating pipeline run concurrently with Promise.all.
// Neither uses N+1 queries — both process all seasons in a single pass.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const seasons = await FOTWSeason.find({}).sort({ startDate: -1 }).lean();

    if (seasons.length === 0) {
      return NextResponse.json({ seasons: [] });
    }

    const branches = buildSeasonBranches(seasons);

    // ------------------------------------------------------------------
    // Pipeline A — FOTWFilm: filmCount, totalWatches, uniqueWatchers
    // Uses $facet so one collection scan covers both grouped metrics.
    // ------------------------------------------------------------------
    const filmPipelinePromise = FOTWFilm.aggregate([
      // Tag every film with the season it belongs to
      {
        $addFields: {
          _seasonId: {
            $switch: { branches, default: null },
          },
        },
      },
      // Drop films that belong to no season (or have no dateSuggested)
      { $match: { _seasonId: { $ne: null } } },
      {
        $facet: {
          // filmCount + totalWatches in one group pass
          counts: [
            {
              $group: {
                _id: '$_seasonId',
                filmCount: { $sum: 1 },
                totalWatches: {
                  $sum: { $size: { $ifNull: ['$watchedBy', []] } },
                },
              },
            },
          ],
          // uniqueWatchers: unwind → deduplicate (season, email) → count per season
          uniqueWatchers: [
            {
              $unwind: {
                path: '$watchedBy',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: {
                  seasonId: '$_seasonId',
                  email: '$watchedBy.userEmail',
                },
              },
            },
            {
              $group: {
                _id: '$_id.seasonId',
                uniqueWatchers: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // ------------------------------------------------------------------
    // Pipeline B — FOTWRating: avgRating per season
    // $lookup joins each rating to its film to read dateSuggested, then
    // the same $switch assigns it to a season.
    // ------------------------------------------------------------------
    const ratingPipelinePromise = FOTWRating.aggregate([
      {
        $lookup: {
          from: 'fotwfilms',
          localField: 'filmId',
          foreignField: '_id',
          as: '_film',
        },
      },
      { $unwind: { path: '$_film', preserveNullAndEmptyArrays: false } },
      {
        $addFields: {
          _seasonId: {
            $switch: {
              branches: branches.map((b) => ({
                // Re-reference dateSuggested from the joined film doc
                case: {
                  $and: (b.case.$and as any[]).map((cond: any) => {
                    // Rewrite $dateSuggested refs to $_film.dateSuggested
                    const key = Object.keys(cond)[0]; // $ne, $gte, $lte
                    const [field, val] = (cond as any)[key];
                    return { [key]: [field === '$dateSuggested' ? '$_film.dateSuggested' : field, val] };
                  }),
                },
                then: b.then,
              })),
              default: null,
            },
          },
        },
      },
      { $match: { _seasonId: { $ne: null } } },
      {
        $group: {
          _id: '$_seasonId',
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    // Run both pipelines in parallel
    const [filmResult, ratingResult] = await Promise.all([
      filmPipelinePromise,
      ratingPipelinePromise,
    ]);

    // ------------------------------------------------------------------
    // Merge pipeline outputs into O(1) lookup maps, then annotate seasons
    // ------------------------------------------------------------------
    const filmFacet = filmResult[0] ?? { counts: [], uniqueWatchers: [] };

    const countMap = new Map(
      (filmFacet.counts as any[]).map((r: any) => [r._id.toString(), r])
    );
    const watcherMap = new Map(
      (filmFacet.uniqueWatchers as any[]).map((r: any) => [r._id.toString(), r.uniqueWatchers])
    );
    const ratingMap = new Map(
      (ratingResult as any[]).map((r: any) => [r._id.toString(), r.avgRating])
    );

    const seasonsWithMetrics = seasons.map((s: any) => {
      const sid = s._id.toString();
      const counts = countMap.get(sid);
      const rawAvg = ratingMap.get(sid);
      return {
        ...s,
        filmCount: counts?.filmCount ?? 0,
        totalWatches: counts?.totalWatches ?? 0,
        uniqueWatchers: watcherMap.get(sid) ?? 0,
        avgRating: rawAvg != null ? Math.round(rawAvg * 10) / 10 : null,
      };
    });

    return NextResponse.json({ seasons: seasonsWithMetrics });
  } catch (err) {
    console.error('[admin/seasons] GET error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new season
// Body: { name: string, startDate: string (ISO), endDate?: string | null, isActive?: boolean }
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, isActive, letterboxdUrl } = body as {
      name: string;
      startDate: string;
      endDate?: string | null;
      isActive?: boolean;
      letterboxdUrl?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ message: 'name is required' }, { status: 400 });
    }
    if (!startDate) {
      return NextResponse.json({ message: 'startDate is required' }, { status: 400 });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ message: 'Invalid startDate' }, { status: 400 });
    }

    let end: Date | null = null;
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json({ message: 'Invalid endDate' }, { status: 400 });
      }
      if (end <= start) {
        return NextResponse.json(
          { message: 'endDate must be after startDate' },
          { status: 400 }
        );
      }
    }

    // Derive isActive: explicit param, or implicit (ongoing = no endDate)
    const active = isActive ?? end === null;

    // Ensure at most one active season at a time
    if (active) {
      await FOTWSeason.updateMany({ isActive: true }, { $set: { isActive: false } });
    }

    const season = await FOTWSeason.create({
      name: name.trim(),
      startDate: start,
      endDate: end,
      isActive: active,
      letterboxdUrl: letterboxdUrl || '',
      createdBy: session.user.email,
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (err) {
    console.error('[admin/seasons] POST error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
