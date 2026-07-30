import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWFilm, FOTWLike, FOTWRating, FOTWReview, FOTWSeason } from '@/lib/fotw/schemas';
import { formatDisplayName, normalizeName } from '@/lib/fotw/utils';
import { computeUserBadges } from '@/lib/badges';

export async function getAllMembers() {
  await dbConnect();
  
  const [users, allFilms, activeSeason, allReviews] = await Promise.all([
    FOTWUser.find({})
      .select('email username name image watchedCount currentStreak longestStreak timesSuggested spottedBug')
      .sort({ watchedCount: -1, createdAt: 1 })
      .lean(),
    FOTWFilm.find({})
      .select('_id title chosenByEmail addedBy language dateSuggested createdAt watchedCount watchedBy')
      .lean(),
    FOTWSeason.findOne({ isActive: true }).lean(),
    FOTWReview.find({})
      .select('userEmail filmId body')
      .lean(),
  ]);
    
  return (users as any[]).map(u => {
    const userEmail = u.email;
    const userWatches = (allFilms as any[]).filter(f =>
      f.watchedBy?.some((w: any) => w.userEmail === userEmail)
    ).map(f => ({
      filmId: f._id.toString(),
      dateSuggested: f.dateSuggested,
      language: f.language,
    }));

    const userReviews = (allReviews as any[]).filter(r => r.userEmail === userEmail);

    const badges = computeUserBadges({
      userEmail,
      spottedBug: Boolean(u.spottedBug),
      watchedCount: u.watchedCount || 0,
      userWatches,
      userReviews,
      allFilms: allFilms as any[],
      activeSeason: activeSeason as any,
    });

    const earnedBadges = badges.filter(b => b.earned);

    return {
      _id: u._id.toString(),
      email: u.email,
      username: u.username || '',
      name: formatDisplayName(u.name, u.username),  // username-first, for site-wide display
      realName: normalizeName(u.name),               // title-cased actual name, for member cards
      image: u.image || null,
      watchedCount: u.watchedCount || 0,
      currentStreak: u.currentStreak || 0,
      longestStreak: u.longestStreak || 0,
      timesSuggested: u.timesSuggested || 0,
      spottedBug: Boolean(u.spottedBug),
      badges,
      earnedBadges,
    };
  });
}

export async function getMemberProfile(username: string) {
  await dbConnect();

  // Try username first, fallback to email if not found (or if username isn't set)
  let user = await FOTWUser.findOne({ username }).lean() as any;
  if (!user) {
    user = await FOTWUser.findOne({ email: username }).lean() as any;
  }

  if (!user) return null;

  const userEmail = user.email;

  // Fetch all related data in parallel
  const [watchedFilms, ratings, likes, reviews, allFilms, activeSeason] = await Promise.all([
    FOTWFilm.find({ 'watchedBy.userEmail': userEmail })
      .select('title posterUrl tmdbUrl year language dateSuggested watchedBy')
      .lean(),
    FOTWRating.find({ userEmail })
      .populate('filmId', 'title posterUrl tmdbUrl year dateSuggested')
      .sort({ createdAt: -1 })
      .lean(),
    FOTWLike.find({ userEmail })
      .populate('filmId', 'title posterUrl tmdbUrl year dateSuggested')
      .sort({ createdAt: -1 })
      .lean(),
    FOTWReview.find({ userEmail, isPrivate: false })
      .populate('filmId', 'title posterUrl tmdbUrl year dateSuggested')
      .sort({ createdAt: -1 })
      .lean(),
    FOTWFilm.find({})
      .select('_id title chosenByEmail addedBy language dateSuggested createdAt watchedCount watchedBy')
      .lean(),
    FOTWSeason.findOne({ isActive: true }).lean(),
  ]);

  const formatFilm = (f: any) => ({
    _id: f._id.toString(),
    title: f.title,
    posterUrl: f.posterUrl,
    tmdbUrl: f.tmdbUrl,
    year: f.year,
    dateSuggested: f.dateSuggested,
  });

  const userWatches = (watchedFilms as any[]).map(f => ({
    filmId: f._id.toString(),
    dateSuggested: f.dateSuggested,
    language: f.language,
  }));

  const userReviews = (reviews as any[]).map(r => ({
    filmId: r.filmId?._id?.toString() || r.filmId?.toString(),
    body: r.body,
  }));

  const badges = computeUserBadges({
    userEmail,
    spottedBug: Boolean(user.spottedBug),
    watchedCount: user.watchedCount || 0,
    userWatches,
    userReviews,
    allFilms: allFilms as any[],
    activeSeason: activeSeason as any,
  });

  const earnedBadges = badges.filter(b => b.earned);

  return {
    _id: user._id.toString(),
    email: user.email,
    username: user.username || '',
    name: formatDisplayName(user.name, user.username),  // username-first
    realName: normalizeName(user.name),                  // title-cased actual name
    image: user.image || null,
    spottedBug: Boolean(user.spottedBug),
    stats: {
      watchedCount: user.watchedCount || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      timesSuggested: user.timesSuggested || 0,
    },
    badges,
    earnedBadges,
    watchHistory: (watchedFilms as any[])
      .map(f => {
        const watchedEntry = f.watchedBy.find((w: any) => w.userEmail === userEmail);
        return {
          film: formatFilm(f),
          watchedAt: watchedEntry?.watchedAt || f.dateSuggested,
        };
      })
      .sort((a, b) => new Date(b.watchedAt || 0).getTime() - new Date(a.watchedAt || 0).getTime()),
    ratingHistory: (ratings as any[])
      .filter(r => r.filmId)
      .map(r => ({
        _id: r._id.toString(),
        film: formatFilm(r.filmId),
        rating: r.rating,
        createdAt: r.createdAt,
      })),
    likeHistory: (likes as any[])
      .filter(l => l.filmId)
      .map(l => ({
        _id: l._id.toString(),
        film: formatFilm(l.filmId),
        createdAt: l.createdAt,
      })),
    reviews: (reviews as any[])
      .filter(r => r.filmId)
      .map(r => ({
        _id: r._id.toString(),
        film: formatFilm(r.filmId),
        body: r.body,
        isPrivate: r.isPrivate,
        hasSpoiler: r.hasSpoiler,
        createdAt: r.createdAt,
      })),
  };
}
