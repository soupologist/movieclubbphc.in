import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';

const isValidUsername = (username: string) => {
  if (!username || username.length < 3 || username.length > 20) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  const blocklist = ['admin', 'moderator', 'root', 'fuck', 'shit', 'bitch'];
  if (blocklist.some((word) => username.toLowerCase().includes(word))) return false;
  return true;
};

export async function POST(request: Request) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      request.json().catch(() => ({})),
    ]);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = body;

    if (!username || !isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username format or contains blocked words' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check availability
    const existingUser = await FOTWUser.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    }).lean();
    if (existingUser && existingUser.email !== session.user.email) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    // Upsert user
    const user = await FOTWUser.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          username,
          hasCompletedOnboarding: true,
          lastUsernameChange: new Date(),
          name: session.user.name || 'Unknown',
          image: session.user.image || '',
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in onboarding POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      request.json().catch(() => ({})),
    ]);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = body;

    if (!username || !isValidUsername(username)) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    await dbConnect();

    const user = await FOTWUser.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.lastUsernameChange) {
      const nextAllowedChange = new Date(user.lastUsernameChange);

      nextAllowedChange.setMonth(nextAllowedChange.getMonth() + 6);

      if (new Date() < nextAllowedChange) {
        return NextResponse.json(
          { error: 'You can only change your username once every 6 months' },

          { status: 429 }
        );
      }
    }

    // Check availability
    const existingUser = await FOTWUser.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    }).lean();
    if (existingUser && existingUser.email !== session.user.email) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    user.username = username;
    user.lastUsernameChange = new Date();
    await user.save();

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in onboarding PATCH:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
