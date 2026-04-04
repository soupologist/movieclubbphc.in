'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Eye, X } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  nested: '#141414',
  border: '#1e1e1e',
  green: '#00e054',
  orange: '#ff8000',
  blue: '#40bcf4',
  muted: '#8a9bb0',
  dim: '#4a5568',
};

function MiniStars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star style={{ width: size, height: size }} className="absolute" color={C.dim} strokeWidth={1.5} />
            {fill > 0 && (
              <span
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: fill === 1 ? '100%' : '50%', height: size }}
              >
                <Star style={{ width: size, height: size }} fill={C.green} color={C.green} strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

interface ArchiveFilm {
  _id: string;
  title: string;
  posterUrl: string;
  driveLink: string;
  createdAt: string;
  ratingsCount: number;
  watchedCount: number;
  averageRating: number;
  allRatings: {
    userEmail: string;
    name: string;
    rating: number;
    createdAt: string;
  }[];
  watchedBy: {
    userEmail: string;
    watchedAt: string;
  }[];
  chosenBy?: string;
}

export default function FOTWArchivePage() {
  const [films, setFilms] = useState<ArchiveFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fotw/archive')
      .then((res) => res.json())
      .then((data) => setFilms(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }} className="pb-20">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col mb-10 pt-8" style={{ gap: 8 }}>
        <Link
          href="/club/filmoftheweek"
          className="hover:text-white transition-colors"
          style={{ color: C.muted, fontSize: 14 }}
        >
          ← Film of the Week
        </Link>
        <h1 className={`text-4xl sm:text-5xl font-bold text-white tracking-tight m-0 ${instrumentSerif.className}`}>
          Archive
        </h1>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {films.map((film, index) => {
          const isFlipped = flippedId === film._id;

          const counts = starValues.map((v) =>
            film.allRatings.filter((r) => r.rating === v).length
          );
          const maxCount = Math.max(...counts, 0);

          return (
            <div
              key={film._id}
              style={{ perspective: '1000px', width: '100%', minWidth: 180 }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.45s ease',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ── Front Face ──────────────────────────────── */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    position: 'relative',
                    width: '100%',
                    zIndex: isFlipped ? 0 : 2,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFlipped) setFlippedId(film._id);
                  }}
                >
                  <div
                    className="group relative overflow-hidden"
                    style={{ borderRadius: 12, aspectRatio: '2/3', width: '100%' }}
                  >
                    <Image
                      src={film.posterUrl}
                      alt={film.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />

                    {index === 0 && (
                      <div
                        className="absolute top-2 left-2 z-10"
                        style={{
                          background: C.green,
                          color: '#000',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 999,
                          padding: '3px 8px',
                        }}
                      >
                        Current
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.88)',
                        borderRadius: 12,
                      }}
                    >
                      <div className="text-center">
                        <span style={{ fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                          {film.averageRating.toFixed(1)}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1 mb-4">
                          <MiniStars value={film.averageRating} size={14} />
                        </div>

                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                            <Eye size={14} />
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{film.watchedCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Below Poster */}
                  <div className="mt-2 text-left">
                    <h3
                      className="m-0 text-white truncate"
                      style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}
                    >
                      {film.title}
                    </h3>
                    {film.chosenBy && (
                      <div style={{ color: C.blue, fontSize: 11, marginTop: 2 }}>
                        chosen by {film.chosenBy}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Back Face ───────────────────────────────── */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#0f0f0f',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    zIndex: isFlipped ? 2 : 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      padding: 14,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className="m-0 text-white truncate"
                        style={{ fontSize: 13, fontWeight: 600, flex: 1 }}
                      >
                        {film.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlippedId(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: C.muted,
                          cursor: 'pointer',
                          padding: 2,
                          flexShrink: 0,
                        }}
                        className="hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Chosen By Row */}
                    {film.chosenBy && (
                      <div className="flex items-center gap-1">
                        <span style={{ color: C.dim, fontSize: 10 }}>chosen by</span>
                        <span style={{ color: C.blue, fontSize: 11 }}>{film.chosenBy}</span>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex items-center gap-1" style={{ color: C.muted, fontSize: 11 }}>
                        <Eye size={11} style={{ color: C.dim }} />
                        {film.watchedCount} watched
                      </div>
                      <div className="flex items-center gap-1" style={{ color: C.muted, fontSize: 11 }}>
                        <Star size={11} style={{ color: C.dim }} />
                        {film.ratingsCount} ratings
                      </div>
                      <div style={{ color: C.green, fontSize: 13, fontWeight: 600, marginLeft: 'auto' }}>
                        {film.averageRating.toFixed(1)}
                      </div>
                    </div>

                    {/* Ratings Breakdown Section */}
                    <div className="mb-4">
                      <div style={{ color: C.dim, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        RATINGS
                      </div>
                      {/* Mini Histogram */}
                      <div className="flex items-end mb-2" style={{ height: 32, gap: 2 }}>
                        {starValues.map((v, i) => {
                          const count = counts[i];
                          const heightPercent = maxCount > 0 ? (count / maxCount) : 0;
                          const heightPx = Math.max(2, heightPercent * 32); 
                          const isPeak = maxCount > 0 && count === maxCount && count > 0;
                          return (
                            <div
                              key={v}
                              style={{
                                width: 'calc(10% - 2px)',
                                height: heightPx,
                                backgroundColor: isPeak ? C.green : '#1e1e1e',
                                borderRadius: '2px 2px 0 0',
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* Ratings List */}
                      <div style={{ maxHeight: 80, overflowY: 'auto' }} className="space-y-1.5 pr-1">
                        {film.allRatings.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                backgroundColor: '#1a1a3a',
                                color: C.blue,
                                fontSize: 9,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate text-white" style={{ fontSize: 10, flex: 1 }}>
                              {r.name}
                            </div>
                            <div style={{ color: C.green, fontSize: 10, fontWeight: 600 }}>
                              {r.rating}
                            </div>
                            <div style={{ color: C.dim, fontSize: 9 }}>
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                            </div>
                          </div>
                        ))}
                        {film.allRatings.length === 0 && (
                          <div style={{ color: C.dim, fontSize: 10 }}>No ratings yet</div>
                        )}
                      </div>
                    </div>

                    {/* Who Watched Section */}
                    {film.watchedBy.length > 0 && (
                      <div className="mb-4">
                        <div style={{ color: C.dim, fontSize: 9, textTransform: 'uppercase', marginBottom: 4 }}>
                          WATCHED BY
                        </div>
                        <div className="flex flex-wrap" style={{ gap: 4 }}>
                          {film.watchedBy.map((w, idx) => (
                            <div
                              key={idx}
                              title={w.userEmail}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                backgroundColor: C.border,
                                color: 'white',
                                fontSize: 9,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {w.userEmail.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <div style={{ color: C.dim, fontSize: 10 }}>
                        Added {new Date(film.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {films.length === 0 && (
        <div className="text-center py-24">
          <p className="text-sm" style={{ color: C.dim }}>No films in the archive yet.</p>
        </div>
      )}
    </div>
  );
}
