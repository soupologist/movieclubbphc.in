import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWUser from '@/models/FOTWUser';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    await FOTWUser.updateMany({}, { $set: { watchedCount: 0 } });

    return NextResponse.json({ success: true, message: 'Leaderboard reset' });
  } catch (error: any) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
