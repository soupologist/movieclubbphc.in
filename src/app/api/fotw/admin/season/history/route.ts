import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// GET — list all seasons, newest first (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const seasons = await FOTWSeason.find({}).sort({ startDate: -1 }).lean();
    return NextResponse.json({ seasons });
  } catch (error) {
    console.error('[season/history] GET error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
