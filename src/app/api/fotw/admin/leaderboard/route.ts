import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWUser from '@/models/FOTWUser';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Includes email field, accessible only to admins
    const leaderboard = await FOTWUser.find({ watchedCount: { $gt: 0 } })
      .sort({ watchedCount: -1, createdAt: 1 })
      .select('name image watchedCount email timesSuggested')
      .lean();

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching admin leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
