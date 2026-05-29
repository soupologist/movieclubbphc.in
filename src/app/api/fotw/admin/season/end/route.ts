import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the current active season
    let currentSeason = await FOTWSeason.findOne({ isActive: true });

    // Snapshot all users
    const users = await FOTWUser.find({ seasonWatchedCount: { $gt: 0 } }).lean();

    const snapshot = users.map((u) => ({
      userEmail: u.email,
      username: u.username || '',
      name: u.name || '',
      watchedCount: u.seasonWatchedCount || 0,
    }));

    if (currentSeason) {
      currentSeason.isActive = false;
      currentSeason.endDate = new Date();
      currentSeason.snapshot = snapshot;
      await currentSeason.save();
    } else {
      // If no active season exists, we create one as season 1 and archive it immediately.
      currentSeason = await FOTWSeason.create({
        seasonNumber: 1,
        startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // Just an arbitrary past date for the fallback
        endDate: new Date(),
        isActive: false,
        snapshot,
      });
    }

    const newSeasonNumber = currentSeason.seasonNumber + 1;

    // Create a new active season
    await FOTWSeason.create({
      seasonNumber: newSeasonNumber,
      startDate: new Date(),
      endDate: null,
      isActive: true,
      snapshot: [],
    });

    // Reset seasonWatchedCount for all users to 0
    await FOTWUser.updateMany({}, { $set: { seasonWatchedCount: 0 } });

    return NextResponse.json({ success: true, archivedSeason: currentSeason });
  } catch (error) {
    console.error('Error ending season:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
