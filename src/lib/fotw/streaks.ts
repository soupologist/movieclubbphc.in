import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWFilm } from '@/lib/fotw/schemas';

/**
 * Streak Calculation for Film of the Week (FOTW)
 * 
 * Rule:
 * - Films are ordered chronologically by release date (dateSuggested or createdAt).
 * - A member's streak is the count of consecutive weekly film editions watched without skipping.
 * - Example: If there are 8 films in sequence and a member watches films 1, 2, 3, misses 4, and watches 5, 6, 7, 8:
 *   - Skipping film 4 resets the current run to 0.
 *   - Watching 5, 6, 7, 8 gives a current streak of 4.
 * - For the latest film (most recent in the sequence), if the member has not watched it yet,
 *   their streak does not reset to 0 immediately to allow time during the active week.
 */
export function calculateUserStreak(
  allFilms: Array<{
    _id?: any;
    dateSuggested?: Date | string | null;
    createdAt?: Date | string;
    lockedAt?: Date | string | null;
    watchedBy?: Array<{ userEmail: string }>;
  }>,
  userEmail: string,
  storedLongestStreak: number = 0
): { currentStreak: number; longestStreak: number } {
  const targetEmail = (userEmail || '').toLowerCase().trim();
  if (!targetEmail) {
    return { currentStreak: 0, longestStreak: storedLongestStreak };
  }

  // Filter films with valid dates and sort ascending by date (oldest to newest)
  const sortedFilms = [...(allFilms || [])]
    .filter((f) => f && (f.dateSuggested || f.createdAt))
    .sort((a, b) => {
      const timeA = new Date(a.dateSuggested || a.createdAt!).getTime();
      const timeB = new Date(b.dateSuggested || b.createdAt!).getTime();
      return timeA - timeB;
    });

  if (sortedFilms.length === 0) {
    return { currentStreak: 0, longestStreak: storedLongestStreak };
  }

  let currentRun = 0;
  let maxRun = 0;
  const lastIndex = sortedFilms.length - 1;

  for (let i = 0; i < sortedFilms.length; i++) {
    const film = sortedFilms[i];
    const isWatched =
      Array.isArray(film.watchedBy) &&
      film.watchedBy.some(
        (w) => (w.userEmail || '').toLowerCase().trim() === targetEmail
      );

    if (isWatched) {
      currentRun += 1;
      if (currentRun > maxRun) {
        maxRun = currentRun;
      }
    } else {
      // If this is a past film (not the latest ongoing film), skipping it breaks the streak!
      if (i < lastIndex) {
        currentRun = 0;
      }
      // If i === lastIndex (the latest film), missing it does NOT reset currentRun yet.
    }
  }

  return {
    currentStreak: currentRun,
    longestStreak: Math.max(storedLongestStreak, maxRun),
  };
}

/**
 * Bulk updates currentStreak and longestStreak for all FOTWUser documents in MongoDB.
 */
export async function syncAllUserStreaks() {
  await dbConnect();
  const [users, allFilms] = await Promise.all([
    FOTWUser.find({}).select('_id email currentStreak longestStreak').lean(),
    FOTWFilm.find({}).select('_id dateSuggested createdAt lockedAt watchedBy').lean(),
  ]);

  const bulkOps = [];
  for (const user of users as any[]) {
    const { currentStreak, longestStreak } = calculateUserStreak(
      allFilms as any[],
      user.email,
      user.longestStreak || 0
    );

    bulkOps.push({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { currentStreak, longestStreak } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await FOTWUser.bulkWrite(bulkOps);
  }
}
