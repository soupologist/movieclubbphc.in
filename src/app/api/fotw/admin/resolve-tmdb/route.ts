import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { tmdbUrl } = body;

    if (!tmdbUrl || typeof tmdbUrl !== 'string') {
      return NextResponse.json({ error: 'TMDB URL is required' }, { status: 400 });
    }

    const match = tmdbUrl.match(/\/movie\/(\d+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid TMDB URL' }, { status: 400 });
    }

    const tmdbId = match[1];

    let tmdbData = null;
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!tmdbRes.ok) {
          if (tmdbRes.status === 404) {
            return NextResponse.json({ error: 'Movie not found on TMDB' }, { status: 404 });
          }
          throw new Error(`TMDB API returned ${tmdbRes.status}`);
        }

        tmdbData = await tmdbRes.json();
        break;
      } catch (e: any) {
        lastError = e;
        retries--;
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    if (!tmdbData) {
      console.error('TMDB fetch failed after 3 retries:', lastError);
      throw lastError;
    }

    const data = tmdbData;
    
    return NextResponse.json({
      title: data.title,
      posterUrl: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      year: new Date(data.release_date).getFullYear()
    });

  } catch (error) {
    console.error('Error resolving TMDB URL:', error);
    return NextResponse.json({ error: 'Failed to fetch movie data' }, { status: 500 });
  }
}
