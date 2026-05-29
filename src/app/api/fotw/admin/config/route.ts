import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSiteConfig } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// GET /api/fotw/admin/config — admin: fetch current site config
export async function GET() {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const config = await FOTWSiteConfig.findOne({}).lean();
    return NextResponse.json({
      letterboxdAllTimeUrl: config?.letterboxdAllTimeUrl || '',
    });
  } catch (err) {
    console.error('[admin/config] GET error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/fotw/admin/config — admin: update site config
// Body: { letterboxdAllTimeUrl?: string }
export async function PATCH(req: Request) {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { letterboxdAllTimeUrl } = body as { letterboxdAllTimeUrl?: string };

    const updates: Record<string, unknown> = {
      updatedBy: session.user.email,
      updatedAt: new Date(),
    };

    if (letterboxdAllTimeUrl !== undefined) {
      updates.letterboxdAllTimeUrl = letterboxdAllTimeUrl.trim();
    }

    const config = await FOTWSiteConfig.findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, new: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error('[admin/config] PATCH error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
