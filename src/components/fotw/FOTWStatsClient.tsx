'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { instrumentSerif } from '@/app/fonts';
import SeasonSelector, { Season } from './SeasonSelector';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  border: '#1e1e1e',
  muted: '#8a9bb0',
  dim: '#4a5568',
  green: '#00e054',
  skeleton: '#1a1a1a',
};

interface StatsData {
  overview: {
    totalFilms: number;
    totalWatches: number;
    totalRatings: number;
    totalUniqueWatchers: number;
    avgRating: number | null;
    avgWatchesPerFilm: number;
  };
  films: {
    filmId: string;
    title: string;
    year: number;
    language: string;
    dateSuggested: string | null;
    chosenBy: string;
    watchCount: number;
    avgRating: number | null;
    ratingCount: number;
  }[];
  leaderboard: {
    username: string | null;
    name: string;
    email: string;
    watchCount: number;
    currentStreak: number;
    longestStreak: number;
  }[];
  ratingDistribution: Record<string, number>;
  participationByFilm: { title: string; watchCount: number; dateSuggested: string | null }[];
  languageBreakdown: { language: string; count: number }[];
  chosenByBreakdown: { name: string; count: number }[];
}

export default function FOTWStatsClient({ initialSeasons }: { initialSeasons: Season[] }) {
  const [seasonId, setSeasonId] = useState<string>('');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Table sort state
  const [sortCol, setSortCol] = useState<'date' | 'watches' | 'avg'>('date');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!seasonId) return;
    
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fotw/stats?seasonId=${seasonId}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStats();
    return () => { isMounted = false; };
  }, [seasonId]);

  // Handle sort toggle
  const handleSort = (col: 'date' | 'watches' | 'avg') => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(col === 'date'); // Default asc for date, else desc usually but let's just default to true (asc) first click
    }
  };

  const sortedFilms = data?.films ? [...data.films].sort((a, b) => {
    let diff = 0;
    if (sortCol === 'date') {
      const dateA = a.dateSuggested ? new Date(a.dateSuggested).getTime() : 0;
      const dateB = b.dateSuggested ? new Date(b.dateSuggested).getTime() : 0;
      diff = dateA - dateB;
    } else if (sortCol === 'watches') {
      diff = a.watchCount - b.watchCount;
    } else if (sortCol === 'avg') {
      diff = (a.avgRating ?? -1) - (b.avgRating ?? -1);
    }
    return sortAsc ? diff : -diff;
  }) : [];

  const formatDate = (val: string | null) => {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(d);
  };

  const Skeleton = ({ className, style }: { className?: string; style?: any }) => (
    <div className={`animate-pulse rounded ${className || ''}`} style={{ backgroundColor: C.skeleton, ...style }} />
  );

  return (
    <div className="pb-20 pt-8 max-w-5xl mx-auto px-4 sm:px-6" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <div className="flex flex-col gap-2 mb-8 pt-4">
        <Link href="/club/filmoftheweek" className="hover:text-white transition-colors" style={{ color: C.muted, fontSize: 14 }}>
          ← Back to Film of the Week
        </Link>
        <h1 className={`text-4xl sm:text-5xl font-bold text-white tracking-tight m-0 ${instrumentSerif.className}`}>
          Film of the Week Stats
        </h1>
      </div>

      <div className="mb-8">
        <SeasonSelector seasons={initialSeasons} selected={seasonId} onChange={setSeasonId} />
      </div>

      {/* Section 1: Overview Strip */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Total Films', val: data?.overview?.totalFilms },
          { label: 'Total Watches', val: data?.overview?.totalWatches },
          { label: 'Unique Watchers', val: data?.overview?.totalUniqueWatchers },
          { label: 'Average Rating', val: data?.overview?.avgRating !== undefined && data?.overview?.avgRating !== null ? data.overview.avgRating.toFixed(2) : '-' },
          { label: 'Avg Watches/Film', val: data?.overview?.avgWatchesPerFilm !== undefined ? data.overview.avgWatchesPerFilm.toFixed(1) : '-' }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <p style={{ color: C.dim, margin: 0, fontSize: 12 }}>{stat.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p style={{ color: 'white', margin: '6px 0 0 0', fontSize: 24, fontWeight: 700 }}>{stat.val}</p>
            )}
          </div>
        ))}
      </section>

      {/* Section 2: Films Table */}
      <section className="mb-10">
        <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>Films</h2>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', color: C.muted, fontSize: 13, borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500 }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500 }}>Year</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500 }}>Language</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500 }}>Picked By</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('date')}>
                    Date {sortCol === 'date' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('watches')}>
                    Watches {sortCol === 'watches' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('avg')}>
                    Avg Rating {sortCol === 'avg' ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500 }}>Ratings</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td colSpan={8} style={{ padding: '12px 16px' }}><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))
                ) : sortedFilms.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px 16px', textAlign: 'center', color: C.dim }}>No films to display.</td>
                  </tr>
                ) : (
                  sortedFilms.map((f, i) => (
                    <tr key={f.filmId} style={{ borderBottom: i === sortedFilms.length - 1 ? 'none' : `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 16px', color: 'white' }}>{f.title.replace(/\s*\(\d{4}\)$/, '')}</td>
                      <td style={{ padding: '8px 16px' }}>{f.year || '-'}</td>
                      <td style={{ padding: '8px 16px' }}>{f.language || '-'}</td>
                      <td style={{ padding: '8px 16px' }}>{f.chosenBy || 'Unknown'}</td>
                      <td style={{ padding: '8px 16px' }}>{formatDate(f.dateSuggested)}</td>
                      <td style={{ padding: '8px 16px' }}>{f.watchCount}</td>
                      <td style={{ padding: '8px 16px' }}>{f.avgRating !== null ? f.avgRating.toFixed(2) : '-'}</td>
                      <td style={{ padding: '8px 16px' }}>{f.ratingCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Leaderboard */}
      <section className="mb-10">
        <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>Leaderboard</h2>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
             <div className="p-4 flex flex-col gap-3">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
             </div>
          ) : data?.leaderboard && data.leaderboard.length > 0 ? (
            <div className="flex flex-col">
              {data.leaderboard.map((user, i) => (
                <div key={user.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i === data.leaderboard.length - 1 ? 'none' : `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: C.dim, fontSize: 13, minWidth: 20 }}>{i + 1}</span>
                    <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{user.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: C.muted, fontSize: 11, display: 'block' }}>Streaks (Cur/Max)</span>
                      <span style={{ color: 'white', fontSize: 13 }}>{user.currentStreak} / {user.longestStreak}</span>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <span style={{ color: C.muted, fontSize: 11, display: 'block' }}>Watches</span>
                      <span style={{ color: C.green, fontSize: 14, fontWeight: 600 }}>{user.watchCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: C.dim }}>No watchers yet.</div>
          )}
        </div>
      </section>

      {/* Section 4: Charts */}
      <section>
        <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>Charts</h2>
        <div className="flex flex-col gap-6">
          
          {/* Participation Over Time */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: C.muted, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Participation Over Time</h3>
            {loading ? <Skeleton className="h-96 w-full" /> : 
             !data?.participationByFilm || data.participationByFilm.length === 0 ? <div className="h-96 flex items-center justify-center" style={{ color: C.dim }}>No data</div> : (
              <div className="h-96">
                <Bar 
                  data={{
                    labels: data.participationByFilm.map(d => d.title.replace(/\s*\(\d{4}\)$/, '')),
                    datasets: [{
                      label: 'Watches',
                      data: data.participationByFilm.map(d => d.watchCount),
                      backgroundColor: C.green,
                      borderRadius: 4,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: C.dim, maxRotation: 45, minRotation: 45, callback: function(val, index) { const title = data.participationByFilm[index].title.replace(/\s*\(\d{4}\)$/, ''); return title.length > 15 ? title.substring(0, 15) + '...' : title; } }, grid: { display: false } },
                      y: { ticks: { color: C.dim, stepSize: 1 }, grid: { color: C.border } }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: C.muted, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Rating Distribution</h3>
            {loading ? <Skeleton className="h-96 w-full" /> : 
             !data?.ratingDistribution || Object.keys(data.ratingDistribution).length === 0 ? <div className="h-96 flex items-center justify-center" style={{ color: C.dim }}>No data</div> : (
              <div className="h-96">
                {(() => {
                  const labels = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
                  const vals = labels.map(l => data.ratingDistribution[l] || 0);
                  return (
                    <Bar 
                      data={{
                        labels,
                        datasets: [{
                          label: 'Count',
                          data: vals,
                          backgroundColor: '#4a5568',
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ticks: { color: C.dim }, grid: { display: false } },
                          y: { ticks: { color: C.dim, stepSize: 1 }, grid: { color: C.border } }
                        }
                      }}
                    />
                  );
                })()}
              </div>
            )}
          </div>

          {/* Language Breakdown */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: C.muted, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Language Breakdown</h3>
            {loading ? <Skeleton className="h-96 w-full" /> : 
             !data?.languageBreakdown || data.languageBreakdown.length === 0 ? <div className="h-96 flex items-center justify-center" style={{ color: C.dim }}>No data</div> : (
              <div className="h-96 flex items-center justify-center">
                <Doughnut 
                  data={{
                    labels: data.languageBreakdown.map(d => d.language),
                    datasets: [{
                      data: data.languageBreakdown.map(d => d.count),
                      backgroundColor: ['#00e054', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#64748b'],
                      borderColor: C.card,
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { color: C.muted, font: { size: 12 } } }
                    },
                    cutout: '70%'
                  }}
                />
              </div>
            )}
          </div>

          {/* Picked By Breakdown */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: C.muted, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Picked By Breakdown</h3>
            {loading ? <Skeleton className="h-96 w-full" /> : 
             !data?.chosenByBreakdown || data.chosenByBreakdown.length === 0 ? <div className="h-96 flex items-center justify-center" style={{ color: C.dim }}>No data</div> : (
              <div style={{ height: Math.max(384, data.chosenByBreakdown.length * 32) }}>
                <Bar 
                  data={{
                    labels: data.chosenByBreakdown.map(d => d.name),
                    datasets: [{
                      label: 'Weeks',
                      data: data.chosenByBreakdown.map(d => d.count),
                      backgroundColor: '#3b82f6',
                      borderRadius: 4,
                    }]
                  }}
                  options={{
                    indexAxis: 'y', // horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: C.dim, stepSize: 1 }, grid: { color: C.border } },
                      y: { ticks: { color: C.dim }, grid: { display: false } }
                    }
                  }}
                />
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
