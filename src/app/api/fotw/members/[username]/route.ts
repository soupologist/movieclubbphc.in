import { NextRequest, NextResponse } from 'next/server';
import { getMemberProfile } from '@/lib/fotw/getMemberData';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await getMemberProfile(decodeURIComponent(username));
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
