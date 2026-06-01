import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

// Small delay between TMDB calls to avoid hitting rate limits (40 req/10s on free tier)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTmdbMetadata(
  tmdbId: string,
  apiKey: string
): Promise<{ language: string; year: number } | null> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}`,
      { method: 'GET' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      language: data.original_language || '',
      year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/fotw/admin/backfill-metadata
 *
 * Finds every FOTWFilm where language is blank OR year is 0/missing,
 * resolves TMDB data for those that have a tmdbUrl, and writes the
 * language + year back to MongoDB.
 *
 * Safe to re-run: films that already have both fields are skipped.
 * Films without a tmdbUrl are skipped (reported as `skipped`).
 *
 * Returns a summary: { updated, skipped, failed, errors }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.email ||
      !FOTW_ADMINS.includes(session.user.email)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey =
      process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TMDB API key is not configured' },
        { status: 500 }
      );
    }

    await dbConnect();

    // Only fetch films that are still missing one or both fields
    const films = await FOTWFilm.find({
      $or: [
        { language: { $in: [null, ''] } },
        { year: { $in: [null, 0] } },
      ],
    })
      .select('_id title tmdbUrl language year')
      .lean();

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { title: string; reason: string }[] = [];

    // Process in batches of 5 to speed up backfilling while respecting TMDB rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < films.length; i += BATCH_SIZE) {
      const batch = films.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (film) => {
        const tmdbUrl = (film as any).tmdbUrl as string | undefined;

        if (!tmdbUrl) {
          errors.push({ title: (film as any).title, reason: 'No tmdbUrl' });
          return { status: 'skipped' };
        }

        const match = tmdbUrl.match(/\/movie\/(\d+)/);
        if (!match) {
          errors.push({ title: (film as any).title, reason: 'Invalid tmdbUrl format' });
          return { status: 'skipped' };
        }

        const tmdbId = match[1];
        const meta = await fetchTmdbMetadata(tmdbId, apiKey);

        if (!meta) {
          errors.push({ title: (film as any).title, reason: `TMDB fetch failed for id ${tmdbId}` });
          return { status: 'failed' };
        }

        await FOTWFilm.findByIdAndUpdate((film as any)._id, {
          $set: { language: meta.language, year: meta.year },
        });

        return { status: 'updated' };
      });

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.status === 'updated') updated++;
        if (res.status === 'skipped') skipped++;
        if (res.status === 'failed') failed++;
      }

      await sleep(250); // Pause after each batch to respect limits
    }

    return NextResponse.json({
      success: true,
      total: films.length,
      updated,
      skipped,
      failed,
      errors,
    });
  } catch (error) {
    console.error('Backfill metadata error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
