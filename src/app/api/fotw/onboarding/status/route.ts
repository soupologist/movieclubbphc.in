import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await FOTWUser.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ hasCompletedOnboarding: false, username: null });
    }

    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      username: user.username || null,
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
