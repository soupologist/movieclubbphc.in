import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBootstrapData } from '@/lib/fotw/getBootstrapData';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');

    const result = await getBootstrapData(session.user.email, seasonId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bootstrap API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
