import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';
import { syncTimesSuggestedFromFilms } from '@/lib/fotwTimesSuggested';

export async function GET(req: Request) {
  try {
    const [session, _] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await syncTimesSuggestedFromFilms();

    // Includes email field, accessible only to admins
    // Note: admins can see all users, including those excluded
    const leaderboard = await FOTWUser.find({
      $or: [
        { watchedCount: { $gt: 0 } },
        { seasonWatchedCount: { $gt: 0 } },
        { excludeFromLeaderboard: true },
      ],
    })
      .sort({ watchedCount: -1, createdAt: 1 })
      .select(
        'name username image watchedCount seasonWatchedCount email timesSuggested excludeFromLeaderboard currentStreak longestStreak'
      )
      .lean();

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching admin leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
