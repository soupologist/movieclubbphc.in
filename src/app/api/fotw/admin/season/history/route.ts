import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all past seasons (isActive: false) along with the active one if requested, but normally we just return all
    const seasons = await FOTWSeason.find({}).sort({ seasonNumber: -1 }).lean();

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error('Error fetching season history:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
