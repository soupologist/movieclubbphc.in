import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWRating, FOTWLike, FOTWUser, FOTWFilm, FOTWSeason, FOTWReview } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import { formatDisplayName } from '@/lib/fotw/utils';
import { computeUserBadges } from '@/lib/badges';
import { calculateUserStreak } from '@/lib/fotw/streaks';

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
    const emailParam = searchParams.get('email');
    const userIdParam = searchParams.get('userId');

    if (!emailParam && !userIdParam) {
      return NextResponse.json({ message: 'Missing email or userId param' }, { status: 400 });
    }

    // Securely resolve the target user's email
    let targetEmail = emailParam;
    let userDoc: any = null;

    if (userIdParam) {
      userDoc = await FOTWUser.findById(userIdParam)
        .select('email name username image watchedCount currentStreak longestStreak spottedBug')
        .lean();
      if (!userDoc) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      targetEmail = userDoc.email;
    } else if (emailParam) {
      userDoc = await FOTWUser.findOne({ email: emailParam })
        .select('email name username image watchedCount currentStreak longestStreak spottedBug')
        .lean();
    }

    if (!targetEmail) {
      return NextResponse.json({ message: 'Failed to resolve user email' }, { status: 400 });
    }

    // --- Season filter ---
    const seasonId = searchParams.get('seasonId');
    let dateFilter: Record<string, any> = { dateSuggested: { $ne: null } };

    if (seasonId && seasonId !== 'all') {
      const season = await FOTWSeason.findById(seasonId).select('startDate endDate').lean();
      if (!season) {
        return NextResponse.json({ message: 'Season not found' }, { status: 404 });
      }
      dateFilter.dateSuggested = {
        $ne: null,
        $gte: season.startDate,
        ...(season.endDate ? { $lte: season.endDate } : {}),
      };
    }

    const [ratings, likes, reviews, seasonFilms, allFilmsForBadges, activeSeason] = await Promise.all([
      FOTWRating.find({ userEmail: targetEmail }).sort({ createdAt: -1 }).lean(),
      FOTWLike.find({ userEmail: targetEmail }).sort({ createdAt: -1 }).lean(),
      FOTWReview.find({ userEmail: targetEmail }).sort({ createdAt: -1 }).lean(),
      FOTWFilm.find(dateFilter).select('_id title posterUrl watchedBy').lean(),
      FOTWFilm.find({ dateSuggested: { $ne: null } })
        .select('_id title posterUrl language dateSuggested createdAt chosenBy chosenByEmail addedBy watchedCount watchedBy')
        .lean(),
      FOTWSeason.findOne({ endDate: null }).select('_id startDate endDate').lean(),
    ]);

    const filmMap = new Map(seasonFilms.map((f: any) => [f._id.toString(), f]));

    const filteredRatings = ratings.filter((r: any) => filmMap.has(r.filmId.toString()));
    const filteredLikes = likes.filter((l: any) => filmMap.has(l.filmId.toString()));
    const filteredReviews = reviews.filter((r: any) => filmMap.has(r.filmId.toString()));

    const ratingsList = filteredRatings.map((r: any) => {
      const film: any = filmMap.get(r.filmId.toString());
      return {
        filmId: r.filmId,
        filmTitle: film?.title ?? 'Unknown Film',
        filmPosterUrl: film?.posterUrl ?? '',
        rating: r.rating,
        createdAt: r.createdAt,
      };
    });

    const likesList = filteredLikes.map((l: any) => {
      const film: any = filmMap.get(l.filmId.toString());
      return {
        filmId: l.filmId,
        filmTitle: film?.title ?? 'Unknown Film',
        filmPosterUrl: film?.posterUrl ?? '',
        createdAt: l.createdAt,
      };
    });

    const reviewsList = filteredReviews.map((r: any) => {
      const film: any = filmMap.get(r.filmId.toString());
      return {
        filmId: r.filmId,
        filmTitle: film?.title ?? 'Unknown Film',
        filmPosterUrl: film?.posterUrl ?? '',
        body: r.body,
        isPrivate: r.isPrivate,
        createdAt: r.createdAt,
      };
    });

    const watchedFilms = seasonFilms
      .filter((f: any) => Array.isArray(f.watchedBy) && f.watchedBy.some((w: any) => w.userEmail === targetEmail))
      .map((f: any) => ({
        filmId: f._id,
        title: f.title,
        posterUrl: f.posterUrl
      }));

    // --- Compute badges ---
    const userWatchesForBadges = (allFilmsForBadges as any[])
      .filter((f) => Array.isArray(f.watchedBy) && f.watchedBy.some((w: any) => w.userEmail === targetEmail))
      .map((f: any) => ({ filmId: f._id.toString(), dateSuggested: f.dateSuggested, language: f.language }));

    const allBadges = computeUserBadges({
      userEmail: targetEmail!,
      userName: (userDoc as any)?.name,
      userUsername: (userDoc as any)?.username,
      spottedBug: (userDoc as any)?.spottedBug ?? false,
      watchedCount: (userDoc as any)?.watchedCount ?? userWatchesForBadges.length,
      userWatches: userWatchesForBadges,
      userReviews: (reviews as any[]).map((r) => ({ filmId: r.filmId.toString(), body: r.body })),
      allFilms: allFilmsForBadges as any[],
      activeSeason: activeSeason as any,
    });

    const earnedBadges = allBadges.filter((b) => b.earned).map((b) => ({
      id: b.id,
      name: b.name,
      symbol: b.symbol,
      description: b.description,
      imageUrl: b.imageUrl,
    }));

    // --- Compute streaks ---
    const streaks = calculateUserStreak(
      allFilmsForBadges as any[],
      targetEmail!,
      (userDoc as any)?.longestStreak || 0
    );

    return NextResponse.json({
      name: userDoc ? formatDisplayName(userDoc.name, userDoc.username) : targetEmail,
      image: (userDoc as any)?.image ?? null,
      watchedCount: watchedFilms.length,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      ratings: ratingsList,
      likes: likesList,
      reviews: reviewsList,
      watchedFilms: watchedFilms,
      earnedBadges,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
