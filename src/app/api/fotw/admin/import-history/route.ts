import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWUser from '@/models/FOTWUser';
import FOTWRating from '@/models/FOTWRating';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';
import { syncTimesSuggestedFromFilms } from '@/lib/fotwTimesSuggested';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\(\d{4}\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const parseCsvDate = (value: unknown): Date | null => {
  const raw = (value ?? '').toString().trim();
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (
        !Number.isNaN(candidate.getTime()) &&
        candidate.getUTCDate() === day &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCFullYear() === year
      ) {
        return candidate;
      }
    }
  }

  // Fallback for ISO or RFC-like values only.
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  return null;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const data = await req.json();

    if (!data.films || !Array.isArray(data.films) || !data.users || !Array.isArray(data.users)) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    let filmsImported = 0;
    let watchesImported = 0;
    let ratingsImported = 0;
    let usersImported = 0;
    let duplicatesSkipped = 0;
    let backfilledDates = 0;

    // 1) Sync leaderboard users from CSV (create missing users, update existing).
    // This always runs, even when film columns are duplicates.
    for (const u of data.users) {
      if (!u.email) continue;

      const parsedWhenSuggested = parseCsvDate(u.whenSuggested);
      const parsedName = (u.name || '').toString().trim();
      const parsedEmail = (u.email || '').toString().trim();
      const parsedFilmSuggested = (u.filmSuggested || '').toString().trim();
      const parsedWatchedCount = Number.isFinite(Number(u.watchedCount))
        ? Number(u.watchedCount)
        : 0;
      const parsedTimesSuggested = Number.isFinite(Number(u.timesSuggested))
        ? Number(u.timesSuggested)
        : 0;

      await FOTWUser.findOneAndUpdate(
        { email: parsedEmail },
        {
          $set: {
            name: parsedName || parsedEmail.split('@')[0],
            watchedCount: parsedWatchedCount,
            timesSuggested: parsedTimesSuggested,
            filmSuggested: parsedFilmSuggested,
            // Always overwrite with latest CSV: valid date or explicit null.
            whenSuggested: parsedWhenSuggested,
          },
        },
        { upsert: true, new: true }
      );
      usersImported++;
    }

    // Build a lookup from user-level "film suggested" + "when suggested" columns.
    const suggestionEntriesByFilm = new Map<
      string,
      Array<{ email: string; name: string; when: Date | null }>
    >();
    for (const u of data.users) {
      const title = (u.filmSuggested || '').toString().trim();
      if (!title) continue;
      const key = normalizeTitle(title);
      if (!suggestionEntriesByFilm.has(key)) suggestionEntriesByFilm.set(key, []);
      suggestionEntriesByFilm.get(key)!.push({
        email: (u.email || '').toString().trim().toLowerCase(),
        name: (u.name || '').toString().trim(),
        when: parseCsvDate(u.whenSuggested),
      });
    }

    // 2) Import/Update archive films and attach watched/rating relations.
    const seenInPayload = new Set<string>();
    for (const filmData of data.films) {
      if (!filmData.title || !filmData.posterUrl) continue;

      const normalizedTitle = normalizeTitle(filmData.title.toString());
      if (!normalizedTitle) continue;
      if (seenInPayload.has(normalizedTitle)) {
        duplicatesSkipped++;
        continue;
      }
      seenInPayload.add(normalizedTitle);

      // Extract watches and ratings
      const watches = filmData.watches || [];
      const watchedBy = watches.map((w: any) => ({
        userEmail: w.email,
        watchedAt: new Date(),
      }));

      const existingFilm = await FOTWFilm.findOne({
        title: { $regex: `^${escapeRegex(filmData.title.toString().trim())}$`, $options: 'i' },
        lockedAt: { $ne: null },
      });

      const suggestionEntries = suggestionEntriesByFilm.get(normalizedTitle) || [];
      const preferredEmail = (existingFilm?.chosenByEmail || filmData.chosenByEmail || '')
        .toString()
        .trim()
        .toLowerCase();
      const preferredName = (existingFilm?.chosenBy || filmData.chosenBy || '')
        .toString()
        .trim()
        .toLowerCase();

      const chooserMatched =
        suggestionEntries.find((e) => !!preferredEmail && e.email === preferredEmail) ||
        suggestionEntries.find((e) => !!preferredName && e.name.toLowerCase() === preferredName) ||
        suggestionEntries[0];

      const parsedFilmDate = parseCsvDate(filmData.dateSuggested);
      const resolvedDateSuggested = parsedFilmDate || chooserMatched?.when || null;

      let importedFilmId;
      if (existingFilm) {
        // Preserve canonical poster and chooser once a film already exists.
        existingFilm.tmdbUrl = filmData.tmdbUrl || '';
        // Always overwrite from latest CSV mapping (valid date or explicit null).
        existingFilm.dateSuggested = resolvedDateSuggested;
        existingFilm.watchedBy = watchedBy;
        if (!existingFilm.lockedAt) existingFilm.lockedAt = new Date();
        await existingFilm.save();
        importedFilmId = existingFilm._id;
      } else {
        const newFilm = await FOTWFilm.create({
          title: filmData.title,
          posterUrl: filmData.posterUrl,
          tmdbUrl: filmData.tmdbUrl || '',
          addedBy: session.user.email,
          chosenBy: filmData.chosenBy || chooserMatched?.name || '',
          chosenByEmail: filmData.chosenByEmail || chooserMatched?.email || '',
          dateSuggested: resolvedDateSuggested,
          watchedBy,
          lockedAt: new Date(),
          timerDuration: 0,
        });
        importedFilmId = newFilm._id;
      }

      filmsImported++;

      await FOTWRating.deleteMany({ filmId: importedFilmId });

      // Process each watch for rating docs.
      for (const w of watches) {
        if (!w.email) continue;
        watchesImported++;

        // 0 means watched but did not rate, so ratings start at 1.
        if (
          w.rating !== undefined &&
          w.rating !== null &&
          w.rating !== '' &&
          Number(w.rating) > 0
        ) {
          const rNum = Number(w.rating);
          if (!isNaN(rNum) && rNum > 0 && rNum <= 5) {
            await FOTWRating.create({ userEmail: w.email, filmId: importedFilmId, rating: rNum });
            ratingsImported++;
          }
        }
      }
    }

    // 3) Backfill missing dateSuggested on any archived films using chooser + user suggestion map.
    const filmsMissingDate = await FOTWFilm.find({
      lockedAt: { $ne: null },
      $or: [{ dateSuggested: { $exists: false } }, { dateSuggested: null }],
    }).select('title chosenByEmail chosenBy dateSuggested');

    for (const film of filmsMissingDate) {
      const key = normalizeTitle(film.title || '');
      if (!key) continue;
      const entries = suggestionEntriesByFilm.get(key) || [];
      const preferredEmail = (film.chosenByEmail || '').toString().trim().toLowerCase();
      const preferredName = (film.chosenBy || '').toString().trim().toLowerCase();

      const chooserMatched =
        entries.find((e) => !!preferredEmail && e.email === preferredEmail) ||
        entries.find((e) => !!preferredName && e.name.toLowerCase() === preferredName) ||
        entries[0];

      if (chooserMatched?.when) {
        film.dateSuggested = chooserMatched.when;
        await film.save();
        backfilledDates++;
      }
    }

    await syncTimesSuggestedFromFilms();

    return NextResponse.json({
      success: true,
      message: `Bulk sync complete! Updated ${usersImported} users. Imported ${filmsImported} film columns, ${watchesImported} watch records, ${ratingsImported} ratings, backfilled ${backfilledDates} missing film dates, skipped ${duplicatesSkipped} duplicate movie columns inside this CSV.`,
    });
  } catch (error) {
    console.error('Bulk Import error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
