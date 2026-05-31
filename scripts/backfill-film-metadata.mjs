/**
 * scripts/backfill-film-metadata.mjs
 *
 * One-shot script: for every FOTWFilm missing language or year,
 * fetch from TMDB and write back to MongoDB.
 *
 * Usage:
 *   node scripts/backfill-film-metadata.mjs
 *
 * Reads MONGODB_URI and NEXT_PUBLIC_TMDB_API_KEY from .env
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ---- Load .env manually (no dotenv dependency needed) ----
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}
if (!TMDB_API_KEY) {
  console.error('❌  TMDB_API_KEY / NEXT_PUBLIC_TMDB_API_KEY not set in .env');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMeta(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  return {
    language: d.original_language || '',
    year: d.release_date ? new Date(d.release_date).getFullYear() : 0,
  };
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('✅  Connected to MongoDB');

  const db = client.db(); // uses the database in the URI
  const col = db.collection('fotwfilms');

  // Find all films that are missing language or year
  const films = await col
    .find({
      $or: [
        { language: { $in: [null, ''] } },
        { year: { $in: [null, 0] } },
      ],
    })
    .project({ _id: 1, title: 1, tmdbUrl: 1, language: 1, year: 1 })
    .toArray();

  console.log(`\n🎬  ${films.length} film(s) need metadata backfill\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (const film of films) {
    const tmdbUrl = film.tmdbUrl || '';
    const match = tmdbUrl.match(/\/movie\/(\d+)/);

    if (!match) {
      console.log(`  ⚠️  SKIP  "${film.title}" — no valid tmdbUrl`);
      skipped++;
      continue;
    }

    const tmdbId = match[1];
    let meta = null;

    // 3 retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      meta = await fetchMeta(tmdbId);
      if (meta) break;
      if (attempt < 3) await sleep(1000);
    }

    if (!meta) {
      console.log(`  ❌  FAIL  "${film.title}" (tmdbId=${tmdbId}) — TMDB fetch failed`);
      failed++;
      await sleep(300);
      continue;
    }

    await col.updateOne(
      { _id: film._id },
      { $set: { language: meta.language, year: meta.year } }
    );

    console.log(`  ✅  OK    "${film.title}" → lang=${meta.language}, year=${meta.year}`);
    updated++;

    // Stay well under TMDB's 40 req / 10s rate limit
    await sleep(150);
  }

  await client.close();

  console.log(`\n── Summary ────────────────────────────`);
  console.log(`   Total:   ${films.length}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`───────────────────────────────────────\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
