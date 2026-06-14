import dbConnect from '@/lib/dbConnect';
import {
  FOTWFilm,
  FOTWSeason,
  FOTWSiteConfig,
  FOTWUser,
  FOTWRating,
  FOTWLike,
  FOTWReview,
} from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { formatDisplayName } from '@/lib/fotw/utils';
import mongoose from 'mongoose';

export async function getBootstrapData(userEmail: string, seasonId?: string | null) {
  await dbConnect();

  const useSeasonFilter = !!seasonId && seasonId !== 'all' && mongoose.Types.ObjectId.isValid(seasonId);

  // ── 2. Kick off top-level DB queries in parallel ──────────────────────────
  const [currentFilmRaw, seasonsRaw] = await Promise.all([
    // Current unlocked film
    FOTWFilm.findOne({ lockedAt: null }).sort({ createdAt: -1 }).lean(),
    // Season list
    FOTWSeason.find({})
      .select('name startDate endDate isActive letterboxdUrl')
      .sort({ startDate: -1 })
      .lean(),
  ]);

  const currentFilm = currentFilmRaw as any;

  // ── 3. Determine season date window and letterboxd URL ───────────────────
  let seasonWindow: { startDate: Date; endDate?: Date } | null = null;
  let seasonLetterboxdUrl = '';

  if (useSeasonFilter) {
    const season = (await FOTWSeason.findById(seasonId)
      .select('startDate endDate letterboxdUrl')
      .lean()) as any;
    if (season) {
      seasonWindow = { startDate: season.startDate, endDate: season.endDate };
      seasonLetterboxdUrl = season.letterboxdUrl || '';
    }
  }
  if (!seasonLetterboxdUrl) {
    const siteConfig = (await FOTWSiteConfig.findOne({})
      .select('letterboxdAllTimeUrl')
      .lean()) as any;
    seasonLetterboxdUrl = siteConfig?.letterboxdAllTimeUrl || '';
  }

  const currentFilmId = currentFilm?._id;

  // ── 4. Archive: single $lookup aggregation ─────────────────────────────────
  const archiveAggregation = FOTWFilm.aggregate([
    { $match: { lockedAt: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'fotwratings',
        localField: '_id',
        foreignField: 'filmId',
        as: 'allRatings',
      },
    },
    {
      $lookup: {
        from: 'fotwreviews',
        localField: '_id',
        foreignField: 'filmId',
        as: 'publicReviews',
      },
    },
    {
      $lookup: {
        from: 'fotwlikes',
        localField: '_id',
        foreignField: 'filmId',
        as: 'allLikes',
      },
    },
    {
      $addFields: {
        ratingsCount: { $size: '$allRatings' },
        likesCount: { $size: '$allLikes' },
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: '$allRatings' }, 0] },
            then: {
              $round: [{ $divide: [{ $sum: '$allRatings.rating' }, { $size: '$allRatings' }] }, 1],
            },
            else: 0,
          },
        },
        watchedCount: {
          $cond: {
            if: { $gt: [{ $ifNull: ['$watchedCount', -1] }, -1] },
            then: '$watchedCount',
            else: { $size: '$watchedBy' },
          },
        },
        timerDuration: {
          $ifNull: [
            '$timerDuration',
            { $multiply: [{ $ifNull: ['$timerDurationDays', 7] }, 86400000] },
          ],
        },
      },
    },
  ]);

  // ── 5. Leaderboard: use indexed FOTWUser.watchedCount or aggregate by season
  let leaderboardPromise: Promise<any[]>;

  if (useSeasonFilter && seasonWindow) {
    // Season leaderboard: aggregate watchedBy entries for films in the date window
    leaderboardPromise = FOTWFilm.aggregate([
      {
        $match: {
          dateSuggested: {
            $gte: seasonWindow.startDate,
            ...(seasonWindow.endDate ? { $lte: seasonWindow.endDate } : {}),
          },
        },
      },
      { $unwind: { path: '$watchedBy', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$watchedBy.userEmail',
          seasonWatchCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'fotwusers',
          localField: '_id',
          foreignField: 'email',
          as: 'userDoc',
        },
      },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'userDoc.excludeFromLeaderboard': { $ne: true } } },
      { $sort: { seasonWatchCount: -1 } },
    ]).then((rows) =>
      rows.map((r) => ({
        _id: r.userDoc?._id,
        name: formatDisplayName(r.userDoc?.name, r.userDoc?.username),
        image: r.userDoc?.image ?? null,
        watchedCount: r.userDoc?.watchedCount ?? 0,
        seasonWatchCount: r.seasonWatchCount,
        currentStreak: r.userDoc?.currentStreak || 0,
        longestStreak: r.userDoc?.longestStreak || 0,
      }))
    );
  } else {
    // All-time leaderboard: simple indexed sort on FOTWUser.watchedCount
    leaderboardPromise = FOTWUser.find({
      watchedCount: { $gt: 0 },
      excludeFromLeaderboard: { $ne: true },
    })
      .sort({ watchedCount: -1, createdAt: 1 })
      .select('email username name watchedCount currentStreak longestStreak image')
      .lean()
      .then((users) =>
        (users as any[]).map((u) => ({
          _id: u._id,
          name: formatDisplayName(u.name, u.username),
          image: u.image ?? null,
          watchedCount: u.watchedCount,
          currentStreak: u.currentStreak || 0,
          longestStreak: u.longestStreak || 0,
        }))
      );
  }

  // ── 6. Current film: fetch interaction data in parallel ──────────────────
  const currentFilmDataPromise = currentFilmId
    ? Promise.all([
        FOTWRating.findOne({ userEmail, filmId: currentFilmId }).lean(),
        FOTWRating.find({ filmId: currentFilmId }).sort({ createdAt: -1 }).lean(),
        FOTWLike.findOne({ userEmail, filmId: currentFilmId }).lean(),
        FOTWLike.countDocuments({ filmId: currentFilmId }),
        FOTWReview.findOne({ userEmail, filmId: currentFilmId }).lean(),
        FOTWReview.find({ filmId: currentFilmId, isPrivate: false })
          .sort({ createdAt: -1 })
          .lean(),
      ])
    : Promise.resolve([null, [], null, 0, null, []] as const);

  // ── 7. Wait for all parallel work to complete ────────────────────────────
  const [archiveFilms, leaderboard, currentFilmInteractions] = await Promise.all([
    archiveAggregation,
    leaderboardPromise,
    currentFilmDataPromise,
  ]);

  const [
    currentRating,
    currentAllRatings,
    currentLikeDoc,
    currentLikesCount,
    currentMyReview,
    currentPublicReviews,
  ] = currentFilmInteractions as any[];

  // ── 8. Build user lookup map for display names/images ────────────────────
  const uniqueEmails = new Set<string>();
  if (currentFilm?.chosenByEmail) uniqueEmails.add(currentFilm.chosenByEmail);
  for (const r of (currentAllRatings as any[]) ?? []) uniqueEmails.add(r.userEmail);
  for (const r of (currentPublicReviews as any[]) ?? []) uniqueEmails.add(r.userEmail);
  for (const film of archiveFilms) {
    if (film.chosenByEmail) uniqueEmails.add(film.chosenByEmail);
    for (const r of film.allRatings ?? []) uniqueEmails.add(r.userEmail);
    for (const r of film.publicReviews ?? []) {
      if (!r.isPrivate) uniqueEmails.add(r.userEmail);
    }
    for (const w of film.watchedBy ?? []) if (w?.userEmail) uniqueEmails.add(w.userEmail);
  }

  const allUsers = await FOTWUser.find({ email: { $in: Array.from(uniqueEmails) } })
    .select(
      'email name username image watchedCount currentStreak longestStreak excludeFromLeaderboard'
    )
    .lean();
  const userMap = new Map((allUsers as any[]).map((u: any) => [u.email, u]));

  const fmt = (email: string, fallback = '') => {
    const u = userMap.get(email) as any;
    return u ? formatDisplayName(u.name, u.username) : formatDisplayName(fallback);
  };
  const img = (email: string) => (userMap.get(email) as any)?.image ?? null;

  // ── 9. Build current film payload ─────────────────────────────────────────
  let activatedFilm = currentFilm;
  if (activatedFilm && !activatedFilm.timerPaused) {
    const fallbackMs = activatedFilm.timerDurationDays
      ? activatedFilm.timerDurationDays * 86400000
      : 7 * 86400000;
    activatedFilm.timerDuration = activatedFilm.timerDuration ?? fallbackMs;
    if (Date.now() > new Date(activatedFilm.createdAt).getTime() + activatedFilm.timerDuration) {
      activatedFilm = null;
    }
  }

  let userRating = null;
  let allRatingsFormatted: any[] = [];
  let averageRating = 0;
  let watchedCount = 0;
  let hasWatched = false;
  let userLiked = false;
  let likesCount = 0;
  let userReview: { body: string; isPrivate: boolean } | null = null;
  let publicReviews: any[] = [];

  if (activatedFilm) {
    if (activatedFilm.chosenByEmail) {
      const chooser = userMap.get(activatedFilm.chosenByEmail) as any;
      if (chooser) activatedFilm.chosenBy = formatDisplayName(chooser.name, chooser.username);
    }
    if (currentRating) userRating = (currentRating as any).rating;

    // Use denormalized watchedCount; fall back to array length for older docs
    watchedCount =
      activatedFilm.watchedCount ??
      (Array.isArray(activatedFilm.watchedBy) ? activatedFilm.watchedBy.length : 0);
    hasWatched = Array.isArray(activatedFilm.watchedBy)
      ? activatedFilm.watchedBy.some((w: any) => w.userEmail === userEmail)
      : false;

    allRatingsFormatted = (currentAllRatings as any[]).map((r: any) => {
      const u = userMap.get(r.userEmail) as any;
      return {
        ...r,
        userId: u
          ? { name: formatDisplayName(u.name, u.username), image: u.image }
          : { name: 'Anonymous', image: null },
      };
    });
    if (allRatingsFormatted.length > 0) {
      averageRating =
        Math.round(
          (allRatingsFormatted.reduce((s: number, r: any) => s + r.rating, 0) /
            allRatingsFormatted.length) *
            10
        ) / 10;
    }

    userLiked = !!currentLikeDoc;
    likesCount = currentLikesCount as number;

    if (currentMyReview) {
      userReview = {
        body: (currentMyReview as any).body,
        isPrivate: (currentMyReview as any).isPrivate,
      };
    }
    publicReviews = (currentPublicReviews as any[]).map((r: any) => ({
      userEmail: r.userEmail,
      name: fmt(r.userEmail, r.userEmail),
      image: img(r.userEmail),
      body: r.body,
      hasSpoiler: r.hasSpoiler ?? false,
      createdAt: r.createdAt,
    }));
  }

  // ── 10. Build archive payload ──────────────────────────────────────────────
  const archiveResult = archiveFilms.map((film: any) => ({
    ...film,
    _id: film._id.toString(),
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
    publicReviews: (film.publicReviews ?? [])
      .filter((r: any) => !r.isPrivate)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r: any) => ({
      userEmail: r.userEmail,
      name: fmt(r.userEmail, r.userEmail),
      image: img(r.userEmail),
      body: r.body,
      hasSpoiler: r.hasSpoiler ?? false,
      createdAt: r.createdAt,
    })),
    chosenBy: film.chosenByEmail
      ? fmt(film.chosenByEmail, film.chosenBy || '')
      : film.chosenBy || '',
    allLikes: undefined, // strip raw join array
  }));

  // Ensure activatedFilm._id is stringified for Next.js Server Components passing props
  if (activatedFilm && activatedFilm._id) {
    activatedFilm._id = activatedFilm._id.toString();
  }

  // Ensure seasons are plain objects with stringified _ids
  const serializedSeasons = (seasonsRaw as any[]).map((s: any) => ({
    ...s,
    _id: s._id.toString(),
  }));

  const serializedLeaderboard = leaderboard.map(l => ({
    ...l,
    _id: l._id?.toString()
  }));

  // ── 11. Compose final response ─────────────────────────────────────────────
  const responseObj = {
    data: {
      // Strip watchedBy — hasWatched is already computed as a boolean above.
      currentFilm: activatedFilm ? { ...activatedFilm, watchedBy: undefined } : null,
      leaderboard: serializedLeaderboard,
      userRating,
      isAdmin: FOTW_ADMINS.includes(userEmail),
      allRatings: allRatingsFormatted,
      averageRating,
      watchedCount,
      hasWatched,
      userLiked,
      likesCount,
      userReview,
      publicReviews,
    },
    archive: {
      films: archiveResult,
      seasonLetterboxdUrl,
    },
    seasons: serializedSeasons,
  };

  return JSON.parse(JSON.stringify(responseObj));
}
