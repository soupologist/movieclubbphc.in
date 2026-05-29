import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// POST — close the current active season and open a new one.
//
// Old behaviour wrote a snapshot[] of user watch-counts and relied on
// seasonNumber. Both are gone. The new behaviour:
//   1. Finds the active season, stamps endDate = now, sets isActive = false.
//   2. Creates a new season whose name is inferred from the total count.
//
// FOTWFilm documents are NOT touched. FOTWUser.seasonWatchedCount is NOT reset
// (it remains as the "current rolling season" counter used by the legacy
// leaderboard sort — the new season-filtered leaderboard computes from films).
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();

    // Close the active season (if one exists)
    const activeSeason = await FOTWSeason.findOne({ isActive: true });
    if (activeSeason) {
      activeSeason.isActive = false;
      activeSeason.endDate = now;
      await activeSeason.save();
    }

    // Infer the next season name from total document count
    const totalSeasons = await FOTWSeason.countDocuments();
    const nextName = `Season ${totalSeasons + 1}`;

    const newSeason = await FOTWSeason.create({
      name: nextName,
      startDate: now,
      endDate: null,
      isActive: true,
      createdBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      archivedSeason: activeSeason ?? null,
      newSeason,
    });
  } catch (error) {
    console.error('[season/end] POST error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
