import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';

// GET — public season list for the frontend season picker.
// Returns id, name, startDate, endDate, isActive for every season.
// Requires login (member) but not admin.
export async function GET() {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const seasons = await FOTWSeason.find({})
      .select('name startDate endDate isActive letterboxdUrl')
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({ seasons });
  } catch (err) {
    console.error('[fotw/seasons] GET error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
