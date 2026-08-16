import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWFilm, FOTWSeason, FOTWReview, FOTWRating } from '@/lib/fotw/schemas';
import { computeUserBadges } from '@/lib/badges';
import { calculateUserStreak } from '@/lib/fotw/streaks';
import BadgesShowcase from '@/components/fotw/BadgesShowcase';

export const metadata: Metadata = {
  title: 'Badges | Film of the Week | Movie Club',
  description: 'Explore all collectible badges and achievements on Film of the Week.',
};

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);
  let userBadges = undefined;

  if (session?.user?.email) {
    await dbConnect();
    const userEmail = session.user.email.toLowerCase().trim();
    const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const [userDoc, allFilms, activeSeason, reviews, allRatings] = await Promise.all([
      FOTWUser.findOne({ email: { $regex: emailRegex } }).lean() as any,
      // Fetch ALL films — season-completionist & crowd-pleaser need full data
      FOTWFilm.find({})
        .select('_id title chosenBy chosenByEmail addedBy language year dateSuggested createdAt watchedCount watchedBy')
        .lean() as any,
      FOTWSeason.findOne({ isActive: true }).lean() as any,
      // Fetch ALL reviews (including private) for accurate badge counting
      FOTWReview.find({ userEmail: { $regex: emailRegex } })
        .select('filmId body')
        .lean() as any,
      FOTWRating.find({}).select('filmId rating').lean() as any,
    ]);

    if (userDoc) {
      const userWatches = (allFilms as any[])
        .filter((f: any) =>
          Array.isArray(f.watchedBy) &&
          f.watchedBy.some((w: any) => (w.userEmail || '').toLowerCase().trim() === userEmail)
        )
        .map((f: any) => ({
          filmId: f._id.toString(),
          dateSuggested: f.dateSuggested,
          language: f.language,
        }));

      const streaks = calculateUserStreak(allFilms, userEmail, userDoc.longestStreak || 0);

      userBadges = computeUserBadges({
        userEmail,
        userName: userDoc.name,
        userUsername: userDoc.username,
        spottedBug: Boolean(userDoc.spottedBug),
        watchedCount: userWatches.length, // prefer live count
        longestStreak: streaks.longestStreak,
        currentStreak: streaks.currentStreak,
        userWatches,
        userReviews: (reviews || []).map((r: any) => ({
          filmId: r.filmId?.toString(),
          body: r.body,
        })),
        allFilms,
        allRatings: (allRatings || []).map((r: any) => ({
          filmId: r.filmId.toString(),
          rating: r.rating,
        })),
        activeSeason,
      });
    }
  }

  return <BadgesShowcase userBadges={userBadges} />;
}
