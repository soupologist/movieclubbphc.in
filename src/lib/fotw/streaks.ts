import dbConnect from '@/lib/dbConnect';
import { FOTWUser, FOTWFilm } from '@/lib/fotw/schemas';

/**
 * Streak Calculation for Film of the Week (FOTW)
 * 
 * A "streak" represents consecutive weekly film editions watched without missing an edition.
 * 
 * Rules:
 * 1. Films are ordered chronologically by date (dateSuggested or createdAt).
 * 2. Walking through films from oldest to newest:
 *    - If the user HAS watched the film -> currentRun += 1, maxRun = max(maxRun, currentRun)
 *    - If the user HAS NOT watched an archived film (lockedAt != null) -> currentRun = 0 (streak breaks!)
 *    - If the user HAS NOT watched the active film (lockedAt == null) -> currentRun stays intact (active week grace period)
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
      const dA = new Date(a.dateSuggested || a.createdAt!).getTime();
      const dB = new Date(b.dateSuggested || b.createdAt!).getTime();
      return dA - dB;
    });

  let currentRun = 0;
  let maxRun = 0;

  for (const film of sortedFilms) {
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
      // If film is locked/archived, missing it breaks the streak.
      // If film is unlocked (lockedAt == null), it is the active week so don't break streak yet.
      if (film.lockedAt !== null && film.lockedAt !== undefined) {
        currentRun = 0;
      }
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
