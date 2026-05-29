import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { FOTWSiteConfig } from '@/lib/fotw/schemas';

// GET /api/fotw/config — public, returns site-wide FOTW config (no auth required)
export async function GET() {
  try {
    await dbConnect();
    const config = await FOTWSiteConfig.findOne({}).lean();
    return NextResponse.json({
      letterboxdAllTimeUrl: config?.letterboxdAllTimeUrl || '',
    });
  } catch (err) {
    console.error('[fotw/config] GET error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
