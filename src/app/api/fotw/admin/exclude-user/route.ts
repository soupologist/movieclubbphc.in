import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { email, exclude } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    // Update the user
    await FOTWUser.findOneAndUpdate(
      { email },
      { $set: { excludeFromLeaderboard: Boolean(exclude) } }
    );

    return NextResponse.json({ success: true, exclude: Boolean(exclude) });
  } catch (error) {
    console.error('Error toggling exclude status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
