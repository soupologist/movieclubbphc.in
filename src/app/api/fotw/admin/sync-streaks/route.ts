import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncAllUserStreaks } from '@/lib/fotw/streaks';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await syncAllUserStreaks();

    return NextResponse.json({ success: true, message: 'All user streaks successfully synchronized in database' });
  } catch (error) {
    console.error('Error syncing user streaks:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
