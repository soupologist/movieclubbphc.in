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

    const { email, spottedBug } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    await FOTWUser.findOneAndUpdate(
      { email },
      { $set: { spottedBug: Boolean(spottedBug) } }
    );

    return NextResponse.json({ success: true, spottedBug: Boolean(spottedBug) });
  } catch (error) {
    console.error('Error toggling spottedBug status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
