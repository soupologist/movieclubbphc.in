import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWFilm, FOTWRating, FOTWUser, FOTWLike, FOTWSeason } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';
import { Parser } from 'json2csv';

export async function GET(req: Request) {
  try {
    const [session, _] = await Promise.all([
      getServerSession(authOptions),
      dbConnect(),
    ]);
    if (!session || !session.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Fetch data concurrently
    const [filmsRaw, ratingsRaw, usersRaw, likesRaw, seasonsRaw] = await Promise.all([
      FOTWFilm.find().sort({ createdAt: 1 }).lean(),
      FOTWRating.find().lean(),
      FOTWUser.find().lean(),
      FOTWLike.find().lean(),
      FOTWSeason.find().lean()
    ]);

    if (format === 'json') {
      return NextResponse.json({ users: usersRaw, films: filmsRaw, ratings: ratingsRaw, likes: likesRaw, seasons: seasonsRaw });
    }

    // Comprehensive CSV Formatter 
    // Combines all User attributes on the left, and arrays of Film rating values as trailing columns.
    const filmColumns = filmsRaw.map((f: any) => f.title);
    
    // Hash ratings for quick O(1) lookup: key -> `${email}_${filmId}`
    const ratingsMap = new Map<string, number>();
    ratingsRaw.forEach((r: any) => {
      ratingsMap.set(`${r.userEmail}_${r.filmId.toString()}`, r.rating);
    });

    const csvDataOptions = usersRaw.map((u: any) => {
      const row: Record<string, any> = {
        name: u.name || '',
        username: u.username || '',
        email: u.email || '',
        hascompletedonboarding: u.hasCompletedOnboarding ? 'true' : 'false',
        lastusernamechange: u.lastUsernameChange ? new Date(u.lastUsernameChange).toISOString().split('T')[0] : '',
        image: u.image || '',
        watchcount: u.watchedCount || 0,
        seasonwatchedcount: u.seasonWatchedCount || 0,
        excludefromleaderboard: u.excludeFromLeaderboard ? 'true' : 'false',
        timessuggested: u.timesSuggested || 0,
        filmsuggested: u.filmSuggested || '',
        whensuggested: u.whenSuggested ? new Date(u.whenSuggested).toISOString().split('T')[0] : '',
        currentstreak: u.currentStreak || 0,
        longeststreak: u.longestStreak || 0,
        lastwatchedweek: u.lastWatchedWeek ? new Date(u.lastWatchedWeek).toISOString().split('T')[0] : '',
        createdat: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        updatedat: u.updatedAt ? new Date(u.updatedAt).toISOString().split('T')[0] : '',
      };

      // Add each film as a trailing column
      filmsRaw.forEach((f: any) => {
        const rating = ratingsMap.get(`${u.email}_${f._id.toString()}`);
        
        let val = '';
        if (rating !== undefined && rating !== null) {
          val = rating.toString();
        } else if (Array.isArray(f.watchedBy) && f.watchedBy.some((w: any) => w.userEmail === u.email)) {
          // They explicitly mark watched, but without rating it
          val = '0'; // 0 indicates watched-but-unrated in the PapaParse import loop setup
        }
        
        row[f.title] = val;
      });

      return row;
    });

    const headerFields = [
      'name',
      'username',
      'email',
      'hascompletedonboarding',
      'lastusernamechange',
      'image',
      'watchcount',
      'seasonwatchedcount',
      'excludefromleaderboard',
      'timessuggested',
      'filmsuggested',
      'whensuggested',
      'currentstreak',
      'longeststreak',
      'lastwatchedweek',
      'createdat',
      'updatedat',
      ...filmColumns
    ];

    const parser = new Parser({ fields: headerFields });
    const csvOutput = csvDataOptions.length > 0 ? parser.parse(csvDataOptions) : headerFields.join(',');
    
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(csvOutput, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fotw-comprehensive-export-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
