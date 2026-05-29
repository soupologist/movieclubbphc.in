import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';

const isValidUsername = (username: string) => {
  if (!username || username.length < 3 || username.length > 20) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  // Basic profanity blocklist (can be expanded)
  const blocklist = ['admin', 'moderator', 'root', 'fuck', 'shit', 'bitch'];
  if (blocklist.some((word) => username.toLowerCase().includes(word))) return false;
  return true;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || !isValidUsername(username)) {
      return NextResponse.json({ available: false });
    }

    await dbConnect();

    // Check if taken (case-insensitive search typically requires regex in standard mongoose
    // without collation, but we can just use exact for now or ignore case).
    // Let's use exact match or case-insensitive via regex:
    const user = await FOTWUser.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();

    if (user) {
      // If it's taken, but it's the CURRENT user's username, they technically can use it / have it
      if (user.email === session.user.email) {
        return NextResponse.json({ available: true });
      }
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
