import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/fotw/admin/reset-leaderboard
 * 
 * Performs a partial reset of the leaderboard. This sets `watchedCount` to 0 
 * for all users in the FOTWUser collection. It does NOT delete the users, 
 * preserving their names, emails, and profile pictures.
 * 
 * Requires FOTW_ADMINS authorization and an explicit confirmation string 
 * in the request body to prevent accidental execution.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (body.confirm !== 'RESET_LEADERBOARD') {
      return NextResponse.json({ message: 'Missing or invalid confirmation string' }, { status: 400 });
    }

    await dbConnect();
    await FOTWUser.updateMany({}, { $set: { watchedCount: 0 } });

    return NextResponse.json({ success: true, message: 'Leaderboard reset' });
  } catch (error: any) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
