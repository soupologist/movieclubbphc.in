import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FOTW_SECRET_PASSWORD } from '@/lib/fotwConfig';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password === FOTW_SECRET_PASSWORD) {
      // Set a cookie to authorize the user for FOTW
      const cookieStore = await cookies();
      cookieStore.set('fotw_authorized', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
