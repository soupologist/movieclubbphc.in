import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTWRating } from '@/lib/fotw/schemas';
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

    const userBulkOps = [];
    for (const u of data.users) {
      if (!u.email) continue;

      const parsedEmail = (u.email || '').toString().trim();
      const payload: any = {
        name: (u.name || '').toString().trim() || parsedEmail.split('@')[0],
        watchedCount: Number.isFinite(Number(u.watchedCount)) ? Number(u.watchedCount) : 0,
        timesSuggested: Number.isFinite(Number(u.timesSuggested)) ? Number(u.timesSuggested) : 0,
        filmSuggested: (u.filmSuggested || '').toString().trim(),
        whenSuggested: parseCsvDate(u.whenSuggested),
      };

      if (u.currentStreak !== undefined) payload.currentStreak = Number.isFinite(Number(u.currentStreak)) ? Number(u.currentStreak) : 0;
      if (u.longestStreak !== undefined) payload.longestStreak = Number.isFinite(Number(u.longestStreak)) ? Number(u.longestStreak) : 0;
      if (u.seasonWatchedCount !== undefined) payload.seasonWatchedCount = Number.isFinite(Number(u.seasonWatchedCount)) ? Number(u.seasonWatchedCount) : 0;
      if (u.excludeFromLeaderboard !== undefined) payload.excludeFromLeaderboard = u.excludeFromLeaderboard === 'true' || u.excludeFromLeaderboard === true;
      if (u.hasCompletedOnboarding !== undefined) payload.hasCompletedOnboarding = u.hasCompletedOnboarding === 'true' || u.hasCompletedOnboarding === true;
      if (u.username) payload.username = u.username.toString().trim();
      if (u.image) payload.image = u.image.toString().trim();
      if (u.lastWatchedWeek) payload.lastWatchedWeek = parseCsvDate(u.lastWatchedWeek);

      // Do not overwrite dates unless explicitly parsed
      if (u.createdAt) {
          const parsedCa = parseCsvDate(u.createdAt);
          if (parsedCa) payload.createdAt = parsedCa;
      }
      if (u.updatedAt) {
          const parsedUa = parseCsvDate(u.updatedAt);
          if (parsedUa) payload.updatedAt = parsedUa;
      }

      userBulkOps.push({
        updateOne: {
          filter: { email: parsedEmail },
          update: { $set: payload },
          upsert: true
        }
      });
      usersImported++;
    }
    
    if (userBulkOps.length > 0) {
      await FOTWUser.bulkWrite(userBulkOps);
    }

    const suggestionEntriesByFilm = new Map<string, Array<{ email: string; name: string; when: Date | null }>>();
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

    const seenInPayload = new Set<string>();
    for (const filmData of data.films) {
      if (!filmData.title || filmData.title.trim() === '') continue;

      const titleTrimmed = filmData.title.toString().trim();
      const normalizedTitle = normalizeTitle(titleTrimmed);
      if (!normalizedTitle) continue;
      if (seenInPayload.has(normalizedTitle)) {
        duplicatesSkipped++;
        continue;
      }
      seenInPayload.add(normalizedTitle);

      const watches = filmData.watches || [];
      const watchedBy = watches.map((w: any) => ({
        userEmail: w.email,
        watchedAt: new Date(),
      }));

      const existingFilm = await FOTWFilm.findOne({
        title: { $regex: `^${escapeRegex(titleTrimmed)}$`, $options: 'i' },
        lockedAt: { $ne: null },
      });

      const suggestionEntries = suggestionEntriesByFilm.get(normalizedTitle) || [];
      const preferredEmail = (existingFilm?.chosenByEmail || filmData.chosenByEmail || '').toString().trim().toLowerCase();
      const preferredName = (existingFilm?.chosenBy || filmData.chosenBy || '').toString().trim().toLowerCase();

      const chooserMatched =
        suggestionEntries.find((e) => !!preferredEmail && e.email === preferredEmail) ||
        suggestionEntries.find((e) => !!preferredName && e.name.toLowerCase() === preferredName) ||
        suggestionEntries[0];

      const parsedFilmDate = parseCsvDate(filmData.dateSuggested);
      const resolvedDateSuggested = parsedFilmDate || chooserMatched?.when || null;

      let importedFilmId;
      if (existingFilm) {
        existingFilm.tmdbUrl = filmData.tmdbUrl || existingFilm.tmdbUrl || '';
        existingFilm.posterUrl = filmData.posterUrl || existingFilm.posterUrl || '';
        existingFilm.dateSuggested = resolvedDateSuggested;
        existingFilm.watchedBy = watchedBy;
        if (!existingFilm.lockedAt) existingFilm.lockedAt = new Date();
        await existingFilm.save();
        importedFilmId = existingFilm._id;
      } else {
        const newFilm = await FOTWFilm.create({
          title: titleTrimmed,
          posterUrl: filmData.posterUrl || 'https://via.placeholder.com/600x900?text=No+Poster',
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

      const ratingsToInsert = [];
      for (const w of watches) {
        if (!w.email) continue;
        watchesImported++;

        if (w.rating !== undefined && w.rating !== null && w.rating >= 1 && w.rating <= 5) {
          ratingsToInsert.push({
            userEmail: w.email,
            filmId: importedFilmId,
            rating: w.rating,
          });
          ratingsImported++;
        }
      }

      if (ratingsToInsert.length > 0) {
        await FOTWRating.insertMany(ratingsToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported/Updated ${usersImported} users, ${filmsImported} films, ${watchesImported} watches, ${ratingsImported} ratings. Skipped ${duplicatesSkipped} duplicate titles.`,
    });
  } catch (error) {
    console.error('Import History Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
