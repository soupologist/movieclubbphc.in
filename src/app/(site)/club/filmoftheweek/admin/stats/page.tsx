import Link from 'next/link';
import type { Metadata } from 'next';
import dbConnect from '@/lib/dbConnect';
import FOTWUser from '@/models/FOTWUser';
import FOTWFilm from '@/models/FOTWFilm';
import FOTWRating from '@/models/FOTWRating';
import { instrumentSerif } from '@/app/fonts';
import { syncTimesSuggestedFromFilms } from '@/lib/fotwTimesSuggested';

export const metadata: Metadata = {
  title: 'Film of the Week Stats',
};

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  border: '#1e1e1e',
  muted: '#8a9bb0',
  dim: '#4a5568',
  green: '#00e054',
};

type SortKey = 'watches' | 'avg' | 'date';
type SortOrder = 'asc' | 'desc';

const normalizeTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\(\d{4}\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const formatDateDDMMYYYY = (value: unknown) => {
  if (!value) return '-';
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export default async function FOTWAdminStatsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; order?: string }>;
}) {
  await dbConnect();
  await syncTimesSuggestedFromFilms();

  const params = (await searchParams) || {};
  const sortKey: SortKey = ['watches', 'avg', 'date'].includes(params.sort || '')
    ? (params.sort as SortKey)
    : 'watches';
  const sortOrder: SortOrder = params.order === 'asc' ? 'asc' : 'desc';

  const [users, archivedFilms, ratings, currentFilm] = await Promise.all([
    FOTWUser.find({})
      .select('name email watchedCount timesSuggested filmSuggested whenSuggested')
      .lean(),
    FOTWFilm.find({ lockedAt: { $ne: null } })
      .select('title watchedBy chosenBy chosenByEmail createdAt dateSuggested')
      .sort({ createdAt: -1 })
      .lean(),
    FOTWRating.find({}).select('filmId rating').lean(),
    FOTWFilm.findOne({ lockedAt: null }).select('title').sort({ createdAt: -1 }).lean(),
  ]);

  const ratingsByFilm = new Map<string, number[]>();
  for (const r of ratings as any[]) {
    const key = String(r.filmId);
    if (!ratingsByFilm.has(key)) ratingsByFilm.set(key, []);
    ratingsByFilm.get(key)!.push(r.rating);
  }

  const totalUsers = users.length;
  const eligibleUsers = (users as any[]).filter(
    (u) => (u.watchedCount ?? 0) > 0 && (u.timesSuggested ?? 0) === 0
  ).length;
  const totalArchivedFilms = archivedFilms.length;
  const totalWatches = (archivedFilms as any[]).reduce(
    (acc, film) => acc + (Array.isArray(film.watchedBy) ? film.watchedBy.length : 0),
    0
  );
  const totalRatings = ratings.length;
  const globalAverageRating =
    totalRatings > 0
      ? Number(
          ((ratings as any[]).reduce((acc, r) => acc + (r.rating || 0), 0) / totalRatings).toFixed(
            2
          )
        )
      : 0;

  const allUsers = [...(users as any[])].sort((a, b) => {
    const watchDiff = (b.watchedCount || 0) - (a.watchedCount || 0);
    if (watchDiff !== 0) return watchDiff;
    return (a.name || '').localeCompare(b.name || '');
  });

  const userSuggestedDateByFilm = new Map<string, Date>();
  for (const u of users as any[]) {
    const title = (u.filmSuggested || '').toString().trim();
    const when = u.whenSuggested ? new Date(u.whenSuggested) : null;
    if (!title || !when || Number.isNaN(when.getTime())) continue;
    const key = normalizeTitle(title);
    const existing = userSuggestedDateByFilm.get(key);
    if (!existing || when.getTime() > existing.getTime()) {
      userSuggestedDateByFilm.set(key, when);
    }
  }

  const filmsWithStats = (archivedFilms as any[])
    .map((film) => {
      const filmRatings = ratingsByFilm.get(String(film._id)) || [];
      const avgRating =
        filmRatings.length > 0
          ? Number((filmRatings.reduce((acc, v) => acc + v, 0) / filmRatings.length).toFixed(2))
          : null;
      return {
        id: String(film._id),
        title: film.title || 'Untitled',
        chosenBy: film.chosenBy || 'Unknown',
        dateSuggested:
          film.dateSuggested ||
          userSuggestedDateByFilm.get(normalizeTitle(film.title || '')) ||
          null,
        watchCount: Array.isArray(film.watchedBy) ? film.watchedBy.length : 0,
        ratingsCount: filmRatings.length,
        avgRating,
      };
    })
    .sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      if (sortKey === 'watches') return dir * (a.watchCount - b.watchCount);
      if (sortKey === 'avg') return dir * ((a.avgRating ?? -1) - (b.avgRating ?? -1));

      const aDate = a.dateSuggested ? new Date(a.dateSuggested).getTime() : 0;
      const bDate = b.dateSuggested ? new Date(b.dateSuggested).getTime() : 0;
      return dir * (aDate - bDate);
    });

  const sortLinkStyle = (active: boolean) => ({
    color: active ? 'white' : C.muted,
    fontSize: 12,
    textDecoration: 'none',
    border: `1px solid ${active ? C.green : C.border}`,
    borderRadius: 999,
    padding: '6px 10px',
  });

  const statCardStyle = {
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 16,
  } as const;

  return (
    <div
      className="pb-20 pt-8 max-w-5xl mx-auto px-4 sm:px-6"
      style={{ backgroundColor: C.bg, minHeight: '100vh' }}
    >
      <div className="flex flex-col gap-2 mb-10 pt-4">
        <Link
          href="/club/filmoftheweek"
          className="hover:text-white transition-colors"
          style={{ color: C.muted, fontSize: 14 }}
        >
          ← Back to Film of the Week
        </Link>
        <h1
          className={`text-4xl sm:text-5xl font-bold text-white tracking-tight m-0 ${instrumentSerif.className}`}
        >
          Film of the Week Stats
        </h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Tie-breaker eligibility uses users with watched count {'>'} 0 and times suggested = 0.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Total Users</p>
          <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {totalUsers}
          </p>
        </div>
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Eligible Users</p>
          <p style={{ color: C.green, margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {eligibleUsers}
          </p>
        </div>
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Archived Films</p>
          <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {totalArchivedFilms}
          </p>
        </div>
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Total Watches</p>
          <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {totalWatches}
          </p>
        </div>
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Total Ratings</p>
          <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {totalRatings}
          </p>
        </div>
        <div style={statCardStyle}>
          <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>Global Avg Rating</p>
          <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 28, fontWeight: 700 }}>
            {globalAverageRating}
          </p>
        </div>
      </section>

      <section
        className="mb-8"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: 15 }}>Current Film</h2>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
          {currentFilm?.title || 'No active film'}
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 15 }}>Most Watched Films</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <Link
              href={`/club/filmoftheweek/admin/stats?sort=watches&order=${sortOrder}`}
              scroll={false}
              style={sortLinkStyle(sortKey === 'watches')}
            >
              Sort: Most Watched
            </Link>
            <Link
              href={`/club/filmoftheweek/admin/stats?sort=avg&order=${sortOrder}`}
              scroll={false}
              style={sortLinkStyle(sortKey === 'avg')}
            >
              Sort: Highest Avg
            </Link>
            <Link
              href={`/club/filmoftheweek/admin/stats?sort=date&order=${sortOrder}`}
              scroll={false}
              style={sortLinkStyle(sortKey === 'date')}
            >
              Sort: Date
            </Link>
            <Link
              href={`/club/filmoftheweek/admin/stats?sort=${sortKey}&order=asc`}
              scroll={false}
              style={sortLinkStyle(sortOrder === 'asc')}
            >
              Asc
            </Link>
            <Link
              href={`/club/filmoftheweek/admin/stats?sort=${sortKey}&order=desc`}
              scroll={false}
              style={sortLinkStyle(sortOrder === 'desc')}
            >
              Desc
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', color: C.muted, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Film</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Suggested By</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Date</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Watches</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {filmsWithStats.map((f) => (
                  <tr key={f.id}>
                    <td style={{ padding: '6px 0' }}>{f.title}</td>
                    <td style={{ padding: '6px 0' }}>{f.chosenBy || 'Unknown'}</td>
                    <td style={{ padding: '6px 0' }}>{formatDateDDMMYYYY(f.dateSuggested)}</td>
                    <td style={{ padding: '6px 0' }}>{f.watchCount}</td>
                    <td style={{ padding: '6px 0' }}>{f.avgRating ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 15 }}>All Users</h2>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', color: C.muted, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Watches</th>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Times Suggested</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u: any, i) => (
                  <tr key={`${u.email}-${i}`}>
                    <td style={{ padding: '6px 0' }}>{u.name || u.email}</td>
                    <td style={{ padding: '6px 0' }}>{u.watchedCount || 0}</td>
                    <td style={{ padding: '6px 0' }}>{u.timesSuggested || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
