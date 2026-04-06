import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWUser from '@/models/FOTWUser';
import FOTWRating from '@/models/FOTWRating';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

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

    // 1) Sync leaderboard users from CSV (create missing users, update existing).
    for (const u of data.users) {
      if (!u.email) continue;

      await FOTWUser.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            name: u.name || u.email.split('@')[0],
            watchedCount: u.watchedCount || 0,
            timesSuggested: u.timesSuggested || 0,
          },
        },
        { upsert: true, new: true }
      );
      usersImported++;
    }

    // 2) Import/Update archive films and attach watched/rating relations.
    for (const filmData of data.films) {
      if (!filmData.title || !filmData.posterUrl) continue;

      // Extract watches and ratings
      const watches = filmData.watches || [];
      const watchedBy = watches.map((w: any) => ({
        userEmail: w.email,
        watchedAt: new Date(),
      }));

      const existingFilm = await FOTWFilm.findOne({
        title: filmData.title,
        lockedAt: { $ne: null },
      });

      let importedFilmId;
      if (existingFilm) {
        existingFilm.posterUrl = filmData.posterUrl;
        existingFilm.tmdbUrl = filmData.tmdbUrl || '';
        existingFilm.chosenBy = filmData.chosenBy || '';
        existingFilm.chosenByEmail = filmData.chosenByEmail || '';
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
          chosenBy: filmData.chosenBy || '',
          chosenByEmail: filmData.chosenByEmail || '',
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

    return NextResponse.json({
      success: true,
      message: `Bulk sync complete! Updated ${usersImported} users. Imported ${filmsImported} films, ${watchesImported} watch records, and ${ratingsImported} ratings.`,
    });
  } catch (error) {
    console.error('Bulk Import error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
