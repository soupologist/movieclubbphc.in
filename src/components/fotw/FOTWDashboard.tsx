'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import {
  Trophy,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  Film,
  Clock,
  Heart,
  X,
  Activity,
  BookOpen,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';

/* ── Design tokens ───────────────────────────────────────── */
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
  inputBg: '#0a0a0a',
};

interface FOTWData {
  currentFilm: {
    _id: string;
    title: string;
    posterUrl: string;
    driveLink: string;
    chosenBy?: string;
    createdAt?: string;
  } | null;
  leaderboard: {
    _id: string;
    name: string;
    image: string;
    ratingsCount: number;
    email: string;
  }[];
  userRating: number | null;
  isAdmin: boolean;
  allRatings: {
    _id: string;
    rating: number;
    userEmail: string;
    userId: { name: string; image?: string };
    createdAt: string;
  }[];
  averageRating: number;
  watchedCount: number;
  hasWatched: boolean;
}

interface ActivityData {
  ratings: {
    _id: string;
    rating: number;
    ratedAt: string;
    filmId: string;
    filmTitle: string;
    filmPosterUrl: string;
  }[];
  totalWatched: number;
}

/* ── Shared simple MiniStars ──────────────────────────────── */
function MiniStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star style={{ width: size, height: size }} className="absolute" strokeWidth={1.5} color={C.dim} />
            {fill > 0 && (
              <span className="absolute top-0 left-0 overflow-hidden" style={{ width: fill === 1 ? '100%' : '50%', height: size }}>
                <Star style={{ width: size, height: size }} fill={C.green} color={C.green} strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function FOTWDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<FOTWData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRating, setPendingRating] = useState(0);
  const [rateLoading, setRateLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // TODO: persist like to DB
  const [liked, setLiked] = useState(false);

  // Log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [modalRating, setModalRating] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch('/api/fotw/data')
      .then((res) => res.json())
      .then((d) => {
        setData({
          ...d,
          leaderboard: d.leaderboard || [],
          allRatings: d.allRatings || [],
          averageRating: d.averageRating || 0,
          watchedCount: d.watchedCount || 0,
          hasWatched: d.hasWatched || false,
        });
        if (d.userRating) {
          setPendingRating(d.userRating);
          setModalRating(d.userRating);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchActivity = async () => {
    if (activity) {
      setShowActivity(true);
      return;
    }
    setActivityLoading(true);
    setShowActivity(true);
    try {
      const res = await fetch('/api/fotw/activity');
      const d = await res.json();
      setActivity(d);
    } catch (e) {
      console.error(e);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleRate = async (newRating: number) => {
    if (!data?.currentFilm) return;
    setPendingRating(newRating); // optimistic update
    try {
      await fetch('/api/fotw/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id, rating: newRating }),
      });
      // re-fetch main data to update histogram and stats
      fetchData();
    } catch (e) {
      console.error('Rating failed', e);
    }
  };

  const handleLogSave = async () => {
    if (!data?.currentFilm) return;
    setLogLoading(true);
    setLogError(null);
    try {
      // 1. Mark watched
      let res = await fetch('/api/fotw/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Failed to log watch');

      // 2. Rate (if > 0)
      if (modalRating > 0) {
        res = await fetch('/api/fotw/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filmId: data.currentFilm._id, rating: modalRating }),
        });
        if (!res.ok) throw new Error('Failed to save rating');
      }

      setShowLogModal(false);
      fetchData();
    } catch (e: any) {
      setLogError(e.message || 'An error occurred while saving.');
    } finally {
      setLogLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  if (loading) return <LoadingScreen />;

  const film = data?.currentFilm;
  const hasWatched = data?.hasWatched ?? false;

  /* ── Histogram calculations ─────────────────────────────── */
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const counts = starValues.map((v) => data?.allRatings.filter((r) => r.rating === v).length || 0);
  const maxCount = Math.max(...counts, 0); // actual max, can be 0

  /* ── Shared inline styles ─────────────────────────────────── */
  const ghostBtnStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.muted,
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    transition: 'all 0.2s',
  };

  const pillBtnStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    background: C.nested,
    borderRadius: 999,
    height: 38,
    padding: '0 16px',
    fontSize: 13,
    color: C.muted,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {/* ── 1. Page Header ────────────────────────────────── */}
      <div className="flex justify-between items-start mb-8 gap-4">
        <div>
          <h1 className={`text-white m-0 ${instrumentSerif.className}`} style={{ fontSize: '3rem', lineHeight: 1 }}>
            Film of the Week
          </h1>
          <p
            className="uppercase m-0 mt-2"
            style={{ color: C.dim, letterSpacing: '0.1em', fontSize: 11 }}
          >
            Watch · Rate · Discuss
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/club/filmoftheweek/archive"
            style={ghostBtnStyle}
            className="hover:!text-white hover:!border-[#2e2e2e]"
          >
            Archive
          </Link>
          {data?.isAdmin && (
            <Link
              href="/club/filmoftheweek/admin"
              style={ghostBtnStyle}
              className="hover:!text-white hover:!border-[#2e2e2e]"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      {film ? (
        <>
          {/* ── 2. Hero Card ───────────────────────────────── */}
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div className="flex flex-row">
              {/* Left Column: Poster */}
              <div style={{ flexShrink: 0 }}>
                <div
                  className="relative"
                  style={{
                    width: 200,
                    aspectRatio: '2/3',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={film.posterUrl}
                    alt={film.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Right Column */}
              <div
                style={{
                  flex: 1,
                  paddingLeft: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Title */}
                <h2
                  className={`m-0 text-white ${instrumentSerif.className}`}
                  style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
                >
                  {film.title}
                </h2>

                {/* Metadata row */}
                <div style={{ color: C.muted, fontSize: 13 }}>
                  {film.createdAt && (
                    <span>
                      {new Date(film.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {film.chosenBy && (
                    <>
                      <span> · Chosen by </span>
                      <span style={{ color: C.blue }}>{film.chosenBy}</span>
                    </>
                  )}
                </div>

                {/* Action pills row */}
                <div className="flex gap-[10px]">
                  {/* Log button */}
                  <button
                    onClick={() => setShowLogModal(true)}
                    style={{
                      ...pillBtnStyle,
                      color: hasWatched ? C.green : C.muted,
                    }}
                    className="hover:!text-white hover:!border-[#2e2e2e]"
                  >
                    <BookOpen size={15} color={hasWatched ? C.green : 'currentColor'} />
                    {hasWatched ? 'Logged' : 'Log'}
                  </button>
                </div>

                {/* Star rating row */}
                <div id="rating-section">
                  {hasWatched ? (
                    <StarRating
                      rating={pendingRating}
                      setRating={handleRate}
                      size="lg"
                    />
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <div style={{ pointerEvents: 'none', opacity: 0.5 }}>
                        <StarRating rating={0} setRating={() => {}} size="lg" />
                      </div>
                      <span style={{ color: C.dim, fontSize: 12 }}>
                        Log the film first
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center" style={{ gap: 16, color: C.dim, fontSize: 13 }}>
                  <div className="flex items-center gap-1.5">
                    <Eye size={14} />
                    <span>{data.watchedCount} watched</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} />
                    <span>{data.allRatings?.length || 0} ratings</span>
                  </div>
                </div>

                {/* View activity */}
                <div>
                  <button
                    onClick={fetchActivity}
                    style={{
                      color: C.blue,
                      fontSize: 13,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    className="hover:underline"
                  >
                    View your activity →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Ratings Histogram ────────────────────────── */}
          {data.allRatings && data.allRatings.length > 0 && (
            <div
              className="mt-6 flex items-center"
              style={{
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '20px 24px',
                gap: 24,
              }}
            >
              {/* Left Side: Chart */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 12,
                  }}
                >
                  RATINGS
                </div>
                <div className="flex items-end" style={{ height: 64, gap: 4 }}>
                  {starValues.map((v, i) => {
                    const count = counts[i];
                    // At least 4px tall, scale up to 60px
                    const heightPercent = maxCount > 0 ? (count / maxCount) : 0;
                    const heightPx = Math.max(4, heightPercent * 60);
                    const isPeak = maxCount > 0 && count === maxCount && count > 0;
                    return (
                      <div
                        key={v}
                        onClick={() => count > 0 && setSelectedRating(v)}
                        style={{
                          width: 'calc(10% - 4px)',
                          height: heightPx,
                          backgroundColor: isPeak ? C.green : '#1e1e1e',
                          borderRadius: '4px 4px 0 0',
                          cursor: count > 0 ? 'pointer' : 'default',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ color: C.dim, fontSize: 11 }}>0.5</span>
                  <span style={{ color: C.dim, fontSize: 11 }}>5.0</span>
                </div>
              </div>

              {/* Right Side: Stats */}
              <div className="flex flex-col items-end">
                <span style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase' }}>
                  {data.allRatings.length} FANS
                </span>
                <span style={{ color: 'white', fontSize: 40, fontWeight: 600, lineHeight: 1 }}>
                  {data.averageRating.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* ── 6. Leaderboard (Collapsible) ───────────────── */}
          <div className="mt-6">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full flex items-center justify-between transition-colors"
              style={{
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '16px 24px',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                  Leaderboard
                </span>
                {data?.leaderboard && data.leaderboard.length > 0 && (
                  <span style={{ color: C.dim, fontSize: 13 }}>
                    {data.leaderboard.length} members
                  </span>
                )}
              </div>
              <div style={{ color: C.muted }}>
                {showLeaderboard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {showLeaderboard && (
              <div
                className="mt-2"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '12px 24px',
                }}
              >
                {data?.leaderboard?.map((user, index) => {
                  let rankColor = C.dim;
                  if (index === 0) rankColor = '#f5c518';
                  else if (index === 1) rankColor = '#a8a9ad';
                  else if (index === 2) rankColor = '#cd7f32';

                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between"
                      style={{
                        padding: '10px 0',
                        borderBottom: index < (data.leaderboard.length - 1) ? `1px solid ${C.card}` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <span style={{ color: rankColor, fontSize: 13, width: 20 }}>
                          {index + 1}
                        </span>
                        <div
                          className="relative"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: C.nested,
                          }}
                        >
                          {user.image && (
                            <Image src={user.image} alt={user.name} fill className="object-cover" unoptimized />
                          )}
                        </div>
                        <span style={{ color: 'white', fontSize: 14 }}>{user.name}</span>
                      </div>
                      <span style={{ color: C.dim, fontSize: 13 }}>{user.ratingsCount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 3. Log Modal ───────────────────────────────── */}
          {showLogModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setShowLogModal(false)}
            >
              <div
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  width: 'min(600px, 90vw)',
                  padding: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>
                    I watched...
                  </span>
                  <button
                    onClick={() => setShowLogModal(false)}
                    style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}
                    className="hover:!text-white p-0 flex"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: 24, display: 'flex', gap: 20 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div
                      className="relative"
                      style={{
                        width: 120,
                        aspectRatio: '2/3',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <Image src={film.posterUrl} alt={film.title} fill className="object-cover" unoptimized />
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="mb-1 flex items-baseline gap-2">
                      <span style={{ color: 'white', fontSize: 20, fontWeight: 500 }}>{film.title}</span>
                      {film.createdAt && (
                        <span style={{ color: C.muted }}>
                          {new Date(film.createdAt).getFullYear()}
                        </span>
                      )}
                    </div>
                    
                    {/* Watch on Drive link */}
                    <a
                      href={film.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: C.blue, fontSize: 13, display: 'inline-block', marginBottom: 16 }}
                      className="hover:underline"
                    >
                      Watch on Drive ↗
                    </a>

                    <div className="flex items-center gap-2 mb-4">
                      <input type="checkbox" defaultChecked />
                      <span style={{ color: C.muted, fontSize: 13 }}>Watched on</span>
                      <div
                        style={{
                          background: C.nested,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '3px 10px',
                          color: 'white',
                          fontSize: 13,
                        }}
                      >
                        {todayStr}
                      </div>
                      <input type="checkbox" className="ml-2" />
                      <span style={{ color: C.muted, fontSize: 13 }}>
                        I've watched this before
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                      <div className="flex items-center gap-3">
                        <span style={{ color: C.muted, fontSize: 13 }}>Rating</span>
                        <StarRating rating={modalRating} setRating={(r) => setModalRating(r)} size="md" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: C.muted, fontSize: 13 }}>Like</span>
                        <button
                          onClick={() => setLiked(!liked)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: liked ? C.orange : C.muted,
                            padding: 0,
                            display: 'flex',
                          }}
                        >
                          <Heart size={22} color={liked ? C.orange : 'currentColor'} fill={liked ? C.orange : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  <button
                    onClick={handleLogSave}
                    disabled={logLoading}
                    style={{
                      backgroundColor: C.green,
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '10px 28px',
                      cursor: logLoading ? 'not-allowed' : 'pointer',
                      opacity: logLoading ? 0.7 : 1,
                    }}
                    className="hover:bg-[#00c94a] transition-colors"
                  >
                    {logLoading ? 'Saving...' : 'Save'}
                  </button>
                  {logError && <div style={{ color: '#ff4444', fontSize: 13 }}>{logError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── 5. Rating Detail Modal ─────────────────────── */}
          {selectedRating !== null && data?.allRatings && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setSelectedRating(null)}
            >
              <div
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  maxWidth: 520,
                  width: '90vw',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                    {data.allRatings.filter((r) => r.rating === selectedRating).length} ratings for {selectedRating} stars
                  </span>
                  <button
                    onClick={() => setSelectedRating(null)}
                    style={{ background: 'none', border: 'none', color: '#8a9bb0', cursor: 'pointer' }}
                    className="flex p-0 hover:!text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div className="space-y-3">
                    {data.allRatings
                      .filter((r) => r.rating === selectedRating)
                      .map((rating) => (
                        <div key={rating._id} className="flex items-center gap-4">
                          <div
                            className="relative"
                            style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', backgroundColor: C.nested }}
                          >
                            {rating.userId?.image && (
                              <Image src={rating.userId.image} alt={rating.userId.name} fill className="object-cover" unoptimized />
                            )}
                          </div>
                          <div>
                            <p style={{ color: 'white', fontSize: 14, margin: 0 }}>{rating.userId?.name || 'Anonymous'}</p>
                            <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>
                              {new Date(rating.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. Activity Modal ──────────────────────────── */}
          {showActivity && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setShowActivity(false)}
            >
              <div
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  maxWidth: 520,
                  width: '90vw',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                    Your Activity
                  </span>
                  <button
                    onClick={() => setShowActivity(false)}
                    style={{ background: 'none', border: 'none', color: '#8a9bb0', cursor: 'pointer' }}
                    className="flex p-0 hover:!text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  {activityLoading ? (
                    <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0' }}>Loading...</div>
                  ) : activity ? (
                    <>
                      <div className="flex gap-8 mb-6">
                        <div>
                          <span style={{ fontSize: 24, fontWeight: 700, color: 'white', display: 'block' }}>{activity.totalWatched}</span>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: C.dim }}>Films Watched</span>
                        </div>
                      </div>

                      {activity.ratings.length > 0 && (
                        <div className="mb-6">
                          <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Your Ratings</h3>
                          <div className="space-y-3">
                            {activity.ratings.map((r) => (
                              <div key={r._id} className="flex items-center gap-3">
                                <div className="relative" style={{ width: 40, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: C.nested }}>
                                  {r.filmPosterUrl && <Image src={r.filmPosterUrl} alt={r.filmTitle} fill className="object-cover" unoptimized />}
                                </div>
                                <div>
                                  <p style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: '0 0 2px 0' }}>{r.filmTitle}</p>
                                  <div className="flex items-center gap-2">
                                    <MiniStars value={r.rating} size={12} />
                                    <span style={{ color: C.dim, fontSize: 12 }}>
                                      {new Date(r.ratedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── 7. Empty State ──────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 mt-8">
          <div
            style={{
              width: 56,
              height: 56,
              backgroundColor: C.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Film size={28} color={C.dim} />
          </div>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>No film this week</span>
          <span style={{ color: C.dim, fontSize: 14, marginTop: 4 }}>Check back soon</span>
        </div>
      )}
    </div>
  );
}
