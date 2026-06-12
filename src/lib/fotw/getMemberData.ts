import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWFilm, FOTWLike, FOTWRating, FOTWReview } from '@/lib/fotw/schemas';
import { formatDisplayName, normalizeName } from '@/lib/fotw/utils';

export async function getAllMembers() {
  await dbConnect();
  
  const users = await FOTWUser.find({})
    .select('email username name image watchedCount currentStreak longestStreak timesSuggested')
    .sort({ watchedCount: -1, createdAt: 1 })
    .lean();
    
  return (users as any[]).map(u => ({
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
  }));
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
  const [watchedFilms, ratings, likes, reviews] = await Promise.all([
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
      .lean()
  ]);

  const formatFilm = (f: any) => ({
    _id: f._id.toString(),
    title: f.title,
    posterUrl: f.posterUrl,
    tmdbUrl: f.tmdbUrl,
    year: f.year,
    dateSuggested: f.dateSuggested,
  });

  return {
    _id: user._id.toString(),
    email: user.email,
    username: user.username || '',
    name: formatDisplayName(user.name, user.username),  // username-first
    realName: normalizeName(user.name),                  // title-cased actual name
    image: user.image || null,
    stats: {
      watchedCount: user.watchedCount || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      timesSuggested: user.timesSuggested || 0,
    },
    watchHistory: (watchedFilms as any[])
      .map(f => {
        const watchedEntry = f.watchedBy.find((w: any) => w.userEmail === userEmail);
        return {
          film: formatFilm(f),
          watchedAt: watchedEntry?.watchedAt || f.dateSuggested,
        };
      })
      .sort((a, b) => new Date(b.watchedAt || 0).getTime() - new Date(a.watchedAt || 0).getTime()),
    ratingHistory: (ratings as any[]).map(r => ({
      _id: r._id.toString(),
      film: r.filmId ? formatFilm(r.filmId) : null,
      rating: r.rating,
      createdAt: r.createdAt,
    })).filter(r => r.film),
    likeHistory: (likes as any[]).map(l => ({
      _id: l._id.toString(),
      film: l.filmId ? formatFilm(l.filmId) : null,
      createdAt: l.createdAt,
    })).filter(l => l.film),
    reviews: (reviews as any[]).map(r => ({
      _id: r._id.toString(),
      film: r.filmId ? formatFilm(r.filmId) : null,
      body: r.body,
      isPrivate: r.isPrivate,
      hasSpoiler: r.hasSpoiler,
      createdAt: r.createdAt,
    })).filter(r => r.film),
  };
}
