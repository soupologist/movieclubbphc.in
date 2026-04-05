'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import { Trophy, Eye, Star, Film, Heart, X, ExternalLink } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);

const avgLinePlugin = {
  id: 'avgLine',
  afterDraw(chart: any) {
    const { ctx, chartArea, scales } = chart;
    const avgCount = chart.options.plugins?.avgLine?.value;
    if (avgCount === undefined || !scales.y) return;
    const y = scales.y.getPixelForValue(avgCount);

    // Bounds check
    if (y < chartArea.top || y > chartArea.bottom) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    ctx.fillStyle = '#4a5568';
    ctx.font = '10px sans-serif';
    ctx.fillText('avg', chartArea.right + 6, y + 4);
    ctx.restore();
  },
};

ChartJS.register(avgLinePlugin);

/* ── Design tokens ───────────────────────────────────────── */
const C = {
  bg: '#000000',
  card: '#0f0f0f',
  nested: '#141414',
  border: '#1e1e1e',
  inputBg: '#0a0a0a',
  green: '#00e054',
  orange: '#ff8000',
  blue: '#40bcf4',
  muted: '#8a9bb0',
  dim: '#4a5568',
};

const AVATAR_COLORS = ['#1a2a3a', '#1a3a2a', '#3a1a2a', '#2a1a3a', '#3a2a1a'];
function avatarBg(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Shared mini star renderer ───────────────────────────── */
function MiniStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              style={{ width: size, height: size }}
              className="absolute"
              strokeWidth={1.5}
              color={C.dim}
            />
            {fill > 0 && (
              <span
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: fill === 1 ? '100%' : '50%', height: size }}
              >
                <Star
                  style={{ width: size, height: size }}
                  fill={C.green}
                  color={C.green}
                  strokeWidth={1.5}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ── Countdown hook ──────────────────────────────────────── */
function useCountdown(createdAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    null
  );
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!createdAt) return;
    const deadline = new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setTimeLeft({ d, h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  return { timeLeft, expired };
}

/* ── Countdown display ───────────────────────────────────── */
function CountdownDisplay({
  createdAt,
  onExpire,
  timerPaused,
}: {
  createdAt: string | undefined;
  onExpire: () => void;
  timerPaused?: boolean;
}) {
  const { timeLeft, expired } = useCountdown(createdAt);
  const calledExpire = useRef(false);

  useEffect(() => {
    if (expired && !calledExpire.current) {
      calledExpire.current = true;
      onExpire();
    }
  }, [expired, onExpire]);

  if (timerPaused) {
    return <span style={{ color: C.orange, fontSize: 12 }}>Timer Paused</span>;
  }
  if (expired) {
    return <span style={{ color: C.dim, fontSize: 12 }}>Week ended</span>;
  }
  if (!timeLeft) return null;

  const units = [
    { val: timeLeft.d, label: 'D' },
    { val: timeLeft.h, label: 'H' },
    { val: timeLeft.m, label: 'M' },
    { val: timeLeft.s, label: 'S' },
  ];

  return (
    <div className="flex gap-2">
      {units.map(({ val, label }) => (
        <div
          key={label}
          style={{
            background: '#0a0a0a',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 40,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: 'white',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {String(val).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: 9,
              color: C.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Interfaces ──────────────────────────────────────────── */
interface LeaderboardUser {
  _id: string;
  name: string;
  image?: string;
  watchedCount: number;
  email: string;
}

interface RatingEntry {
  _id: string;
  rating: number;
  userEmail: string;
  userId: { name: string; image?: string };
  createdAt: string;
}

interface FOTWData {
  currentFilm: {
    _id: string;
    title: string;
    posterUrl: string;
    driveLink: string;
    chosenBy?: string;
    createdAt?: string;
    timerPaused?: boolean;
    tmdbUrl?: string;
  } | null;
  leaderboard: LeaderboardUser[];
  userRating: number | null;
  isAdmin: boolean;
  allRatings: RatingEntry[];
  averageRating: number;
  watchedCount: number;
  hasWatched: boolean;
  userLiked: boolean;
  likesCount: number;
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
  allRatings: { userEmail: string; name: string; rating: number; createdAt: string }[];
  watchedBy: { userEmail: string; watchedAt: string; name: string }[];
  chosenBy?: string;
  tmdbUrl?: string;
  likesCount?: number;
}

interface UserActivityData {
  name: string;
  image: string | null;
  watchedCount: number;
  ratings: {
    filmId: string;
    filmTitle: string;
    filmPosterUrl: string;
    rating: number;
    createdAt: string;
  }[];
  likes: { filmId: string; filmTitle: string; filmPosterUrl: string; createdAt: string }[];
}

/* ═══════════════════════════════════════════════════════════ */
export default function FOTWLandingPage() {
  const { data: session } = useSession();

  // Core data
  const [data, setData] = useState<FOTWData | null>(null);
  const [archiveFilms, setArchiveFilms] = useState<ArchiveFilm[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline action state
  const [pendingRating, setPendingRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasWatchedLocal, setHasWatchedLocal] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  // Rating detail modal
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // My activity modal
  const [showMyActivity, setShowMyActivity] = useState(false);
  const [myActivity, setMyActivity] = useState<UserActivityData | null>(null);
  const [myActivityLoading, setMyActivityLoading] = useState(false);

  // User activity modal (public — any leaderboard user)
  const [viewingUser, setViewingUser] = useState<LeaderboardUser | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityData | null>(null);
  const [userActivityLoading, setUserActivityLoading] = useState(false);

  // Archive multi-flip state — 0: poster, 1: info, 2: histogram, 3: watched-by
  const [flipStates, setFlipStates] = useState<Record<string, number>>({});

  const advanceFlip = (id: string) => {
    setFlipStates((prev) => {
      const current = prev[id] ?? 0;
      const next = (current + 1) % 4;
      return { ...prev, [id]: next };
    });
  };

  /* ── Data fetching ───────────────────────────────────────── */
  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/fotw/data').then((r) => r.json()),
      fetch('/api/fotw/archive').then((r) => r.json()),
    ])
      .then(([d, archive]) => {
        setData({
          ...d,
          leaderboard: d.leaderboard || [],
          allRatings: d.allRatings || [],
          averageRating: d.averageRating || 0,
          watchedCount: d.watchedCount || 0,
          hasWatched: d.hasWatched || false,
          userLiked: d.userLiked || false,
          likesCount: d.likesCount || 0,
        });
        setLiked(d.userLiked || false);
        setLikesCount(d.likesCount || 0);
        setHasWatchedLocal(d.hasWatched || false);
        if (d.userRating) {
          setPendingRating(d.userRating);
        }
        setArchiveFilms(Array.isArray(archive) ? archive : []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── My activity ─────────────────────────────────────────── */
  const openMyActivity = async () => {
    setShowMyActivity(true);
    if (myActivity) return;
    setMyActivityLoading(true);
    try {
      const email = session?.user?.email;
      if (!email) return;
      const res = await fetch(`/api/fotw/user-activity?email=${encodeURIComponent(email)}`, {
        cache: 'no-store',
      });
      const d = await res.json();
      setMyActivity(d);
    } catch (e) {
      console.error(e);
    } finally {
      setMyActivityLoading(false);
    }
  };

  /* ── Public user activity ────────────────────────────────── */
  const openUserActivity = async (user: LeaderboardUser) => {
    setViewingUser(user);
    setUserActivity(null);
    setUserActivityLoading(true);
    try {
      const res = await fetch(`/api/fotw/user-activity?userId=${encodeURIComponent(user._id)}`, {
        cache: 'no-store',
      });
      const d = await res.json();
      setUserActivity(d);
    } catch (e) {
      console.error(e);
    } finally {
      setUserActivityLoading(false);
    }
  };

  /* ── Watch handler ───────────────────────────────────────── */
  const handleWatch = async () => {
    if (!data?.currentFilm || hasWatchedLocal || watchLoading) return;
    setWatchLoading(true);
    try {
      const res = await fetch('/api/fotw/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Failed to log watch');
      setHasWatchedLocal(true);
      fetchData();
    } catch (e) {
      console.error('Watch failed', e);
    } finally {
      setWatchLoading(false);
    }
  };

  /* ── Rating handler ──────────────────────────────────────── */
  const handleRate = async (newRating: number) => {
    if (!data?.currentFilm) return;
    setPendingRating(newRating);
    try {
      await fetch('/api/fotw/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id, rating: newRating }),
      });
      fetchData();
    } catch (e) {
      console.error('Rating failed', e);
    }
  };

  /* ── Like handler ────────────────────────────────────────── */
  const handleLike = async () => {
    if (!data?.currentFilm) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((p) => (newLiked ? p + 1 : Math.max(0, p - 1)));
    try {
      const res = await fetch('/api/fotw/like', {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Like failed');
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount((p) => (!newLiked ? p + 1 : Math.max(0, p - 1)));
      console.error(e);
    }
  };

  /* ── Derived values ──────────────────────────────────────── */
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  if (loading) return <LoadingScreen />;

  const film = data?.currentFilm;
  const hasWatched = hasWatchedLocal || (data?.hasWatched ?? false);
  // Archive API already excludes the current film server-side (lockedAt: { $ne: null })
  const previousFilms = archiveFilms;

  /* ── Histogram ───────────────────────────────────────────── */
  const counts = starValues.map((v) => data?.allRatings.filter((r) => r.rating === v).length || 0);
  const maxCount = Math.max(...counts, 0);

  /* ── Shared styles ───────────────────────────────────────── */
  const ghostBtnStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.muted,
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    transition: 'all 0.2s',
  };

  const pillBtnBase: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    background: '#141414',
    borderRadius: 999,
    height: 38,
    padding: '0 18px',
    fontSize: 13,
    color: C.muted,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  /* ── User activity modal body ────────────────────────────── */
  const renderActivityBody = (act: UserActivityData | null, actLoading: boolean) => {
    if (actLoading)
      return <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0' }}>Loading...</div>;
    if (!act) return null;
    return (
      <>
        {act.ratings.length > 0 && (
          <div className="mb-6">
            <h3
              style={{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}
            >
              Ratings
            </h3>
            <div className="space-y-3">
              {act.ratings.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: 40,
                      height: 60,
                      borderRadius: 6,
                      overflow: 'hidden',
                      backgroundColor: C.nested,
                    }}
                  >
                    {r.filmPosterUrl && (
                      <Image
                        src={r.filmPosterUrl}
                        alt={r.filmTitle}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 4px 0' }}
                      className="truncate"
                    >
                      {r.filmTitle}
                    </p>
                    <div className="flex items-center gap-2">
                      <MiniStars value={r.rating} size={12} />
                      <span style={{ color: C.dim, fontSize: 11 }}>
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {act.likes.length > 0 && (
          <div className="mb-4">
            <h3
              style={{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}
            >
              Likes
            </h3>
            <div className="space-y-3">
              {act.likes.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: 40,
                      height: 60,
                      borderRadius: 6,
                      overflow: 'hidden',
                      backgroundColor: C.nested,
                    }}
                  >
                    {l.filmPosterUrl && (
                      <Image
                        src={l.filmPosterUrl}
                        alt={l.filmTitle}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 4px 0' }}
                      className="truncate"
                    >
                      {l.filmTitle}
                    </p>
                    <div className="flex items-center gap-2">
                      <Heart size={12} color={C.orange} fill={C.orange} />
                      <span style={{ color: C.dim, fontSize: 11 }}>
                        {new Date(l.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {act.ratings.length === 0 && act.likes.length === 0 && (
          <div style={{ color: C.dim, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No activity yet
          </div>
        )}
      </>
    );
  };

  /* ── Archive multi-flip card ─────────────────────────────── */
  // Panels: 0 = poster, 1 = info+drive, 2 = histogram+ratings, 3 = watched-by
  const renderFlipCard = (af: ArchiveFilm) => {
    const step = flipStates[af._id] ?? 0;
    const afCounts = starValues.map((v) => af.allRatings.filter((r) => r.rating === v).length);
    const afMax = Math.max(...afCounts, 0);

    const PANELS = 4;

    return (
      <div key={af._id} style={{ width: '100%', minWidth: 150 }}>
        {/* Outer wrapper: clips overflow, sets visible size */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: 12,
            cursor: 'pointer',
            aspectRatio: '2/3',
            backgroundColor: C.card,
            border: `1px solid ${step === 0 ? 'transparent' : C.border}`,
            transition: 'border-color 0.3s',
          }}
          onClick={() => advanceFlip(af._id)}
        >
          {/* Sliding strip: 4 panels side-by-side */}
          <div
            style={{
              display: 'flex',
              width: `${PANELS * 100}%`,
              height: '100%',
              transform: `translateX(-${(step * 100) / PANELS}%)`,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* ── Panel 0: Poster ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                position: 'relative',
                height: '100%',
              }}
            >
              <div className="group" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image src={af.posterUrl} alt={af.title} fill className="object-cover" unoptimized />
                {/* Hover overlay on poster: rating + watch count */}
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                >
                  <span style={{ fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                    {af.averageRating > 0 ? af.averageRating.toFixed(1) : '—'}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-1 mb-3">
                    <MiniStars value={af.averageRating} size={14} />
                  </div>
                  <div className="flex items-center gap-2" style={{ color: C.muted }}>
                    <Eye size={13} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{af.watchedCount}</span>
                  </div>
                  <div style={{ color: C.dim, fontSize: 9, marginTop: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    click to explore
                  </div>
                </div>
              </div>
            </div>

            {/* ── Panel 1: Info + drive link ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: i === step - 1 ? 14 : 4,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === step - 1 ? C.green : C.border,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                {af.title}
              </h3>
              {af.chosenBy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Film size={10} color={C.dim} />
                  <span style={{ color: C.dim, fontSize: 9 }}>chosen by</span>
                  <span style={{ color: C.blue, fontSize: 10, fontWeight: 600 }}>{af.chosenBy}</span>
                </div>
              )}
              <div style={{ color: C.dim, fontSize: 10 }}>
                {new Date(af.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {/* Key stats */}
              <div style={{
                display: 'flex',
                gap: 10,
                padding: '8px 0',
                borderTop: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>{af.watchedCount}</span>
                  <span style={{ color: C.dim, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Watched</span>
                </div>
                <div style={{ width: 1, backgroundColor: C.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>{af.ratingsCount}</span>
                  <span style={{ color: C.dim, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ratings</span>
                </div>
                <div style={{ width: 1, backgroundColor: C.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ color: C.green, fontSize: 15, fontWeight: 700 }}>{af.averageRating > 0 ? af.averageRating.toFixed(1) : '—'}</span>
                  <span style={{ color: C.dim, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg</span>
                </div>
              </div>
              {/* Drive link */}
              {af.driveLink && (
                <a
                  href={af.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#0a1a0a',
                    border: `1px solid ${C.green}22`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    color: C.green,
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: 'none',
                    marginTop: 'auto',
                  }}
                >
                  <ExternalLink size={12} />
                  Watch on Drive
                </a>
              )}
              {af.tmdbUrl && (
                <a
                  href={af.tmdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#0a0f1a',
                    border: `1px solid ${C.blue}22`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    color: C.blue,
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  TMDB
                </a>
              )}
              <div style={{ color: C.dim, fontSize: 9, textAlign: 'center', marginTop: 4, letterSpacing: '0.08em' }}>CLICK FOR RATINGS →</div>
            </div>

            {/* ── Panel 2: Histogram + ratings list ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                height: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: i === step - 1 ? 14 : 4,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === step - 1 ? C.orange : C.border,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ratings</span>
                <span style={{ color: C.green, fontSize: 15, fontWeight: 700 }}>
                  {af.averageRating > 0 ? af.averageRating.toFixed(1) : '—'}
                </span>
              </div>
              {/* MiniStars for avg */}
              <div>
                <MiniStars value={af.averageRating} size={12} />
                <span style={{ color: C.dim, fontSize: 9, marginLeft: 4 }}>{af.ratingsCount} ratings</span>
              </div>
              {/* Histogram bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 36, gap: 2, marginBottom: 2 }}>
                {starValues.map((v, i) => {
                  const c = afCounts[i];
                  const hp = afMax > 0 ? c / afMax : 0;
                  const isTop = afMax > 0 && c === afMax && c > 0;
                  return (
                    <div key={v} title={`★${v}: ${c}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <div style={{
                        width: '100%',
                        height: Math.max(2, hp * 32),
                        backgroundColor: isTop ? C.green : (c > 0 ? '#2a2a2a' : '#181818'),
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.4s ease',
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                <span style={{ color: C.dim, fontSize: 7 }}>½★</span>
                <span style={{ color: C.dim, fontSize: 7 }}>5★</span>
              </div>
              {/* Individual ratings list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                borderTop: `1px solid ${C.border}`,
                paddingTop: 6,
              }} className="space-y-1 pr-1">
                {af.allRatings.length === 0 ? (
                  <div style={{ color: C.dim, fontSize: 9, textAlign: 'center', paddingTop: 8 }}>No ratings yet</div>
                ) : af.allRatings.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: avatarBg(r.name),
                      color: C.blue,
                      fontSize: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                    }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate" style={{ fontSize: 9, flex: 1, color: '#ccc' }}>{r.name}</div>
                    <div style={{ color: C.green, fontSize: 9, fontWeight: 700 }}>★{r.rating}</div>
                  </div>
                ))}
              </div>
              <div style={{ color: C.dim, fontSize: 9, textAlign: 'center', paddingTop: 4, letterSpacing: '0.08em' }}>CLICK FOR VIEWERS →</div>
            </div>

            {/* ── Panel 3: Watched by ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: i === step - 1 ? 14 : 4,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === step - 1 ? C.blue : C.border,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Watched by</span>
                <span style={{ color: C.blue, fontSize: 12, fontWeight: 700 }}>{af.watchedCount}</span>
              </div>
              {af.watchedBy.length === 0 ? (
                <div style={{ color: C.dim, fontSize: 10, textAlign: 'center', paddingTop: 16 }}>No viewers yet</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }} className="space-y-2 pr-1">
                  {af.watchedBy.map((w, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: avatarBg(w.name),
                        color: 'white',
                        fontSize: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 700,
                        border: `1px solid ${C.border}`,
                      }}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.name}
                        </div>
                        <div style={{ color: C.dim, fontSize: 8 }}>
                          {new Date(w.watchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <Eye size={10} color={C.dim} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                <div style={{ color: C.dim, fontSize: 9, textAlign: 'center', letterSpacing: '0.08em' }}>CLICK TO RESTART →</div>
              </div>
            </div>
          </div>
        </div>

        {/* Film title below card */}
        <div className="mt-2">
          <h3 className="m-0 text-white truncate" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>
            {af.title}
          </h3>
          {step === 0 && af.chosenBy && (
            <div style={{ color: C.blue, fontSize: 10, marginTop: 2 }}>chosen by {af.chosenBy}</div>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════ RENDER ══════════════════════════ */
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', paddingBottom: 96 }}>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-10 gap-4">
        <div>
          <h1
            className={`text-white m-0 ${instrumentSerif.className}`}
            style={{ fontSize: '3rem', lineHeight: 1 }}
          >
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

      {/* ══════════════════════════════════════════════════════
          SECTION 1: CURRENT FILM HERO
      ══════════════════════════════════════════════════════ */}
      {film ? (
        <>
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid #1e1e1e',
              borderRadius: 20,
              padding: 32,
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'row',
              gap: 32,
              alignItems: 'flex-start',
            }}
          >
            {/* ── Column A: Poster ── */}
            <div style={{ width: 220, flexShrink: 0, position: 'relative' }}>
              <a
                href={film.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.poster-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.poster-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <div
                  style={{
                    width: 220,
                    aspectRatio: '2/3',
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  <Image
                    src={film.posterUrl}
                    alt={film.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <div
                  className="poster-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: 0,
                    transition: 'opacity 150ms',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ExternalLink size={20} color="white" />
                </div>
              </a>
            </div>

            {/* ── Column B: Film Info ── */}
            <div
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#0a1a0a',
                  border: '1px solid #00e054',
                  color: '#00e054',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '4px 12px',
                  width: 'fit-content',
                }}
              >
                FILM OF THE WEEK
              </div>

              {/* Title */}
              <h2
                className={instrumentSerif.className}
                style={{
                  margin: 0,
                  color: 'white',
                  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                  lineHeight: 1.1,
                }}
              >
                {film.title}
              </h2>

              {/* Metadata */}
              <p style={{ color: '#8a9bb0', fontSize: 13, margin: 0 }}>
                {film.createdAt && (
                  <span>
                    {new Date(film.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {film.chosenBy && (
                  <>
                    {' '}
                    · Chosen by <span style={{ color: '#40bcf4' }}>{film.chosenBy}</span>
                  </>
                )}
              </p>

              {/* Countdown */}
              <CountdownDisplay
                createdAt={film.createdAt}
                timerPaused={film.timerPaused}
                onExpire={() => setTimeout(fetchData, 500)}
              />

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  id="btn-watched"
                  onClick={handleWatch}
                  disabled={hasWatched || watchLoading}
                  style={{
                    ...pillBtnBase,
                    background: hasWatched ? '#0a1a0a' : '#141414',
                    borderColor: hasWatched ? C.green : C.border,
                    color: hasWatched ? C.green : C.muted,
                    cursor: hasWatched ? 'default' : watchLoading ? 'wait' : 'pointer',
                    opacity: watchLoading ? 0.7 : 1,
                  }}
                >
                  {watchLoading ? (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: `2px solid ${C.muted}`,
                        borderTopColor: 'transparent',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                  ) : (
                    <Eye
                      size={15}
                      color={hasWatched ? C.green : 'currentColor'}
                      fill={hasWatched ? C.green : 'none'}
                    />
                  )}
                  {hasWatched ? 'Watched' : 'Watched'}
                </button>

                <button
                  id="btn-like"
                  onClick={handleLike}
                  style={{
                    ...pillBtnBase,
                    background: liked ? '#1a0a00' : '#141414',
                    borderColor: liked ? C.orange : C.border,
                    color: liked ? C.orange : C.muted,
                  }}
                >
                  <Heart
                    size={15}
                    color={liked ? C.orange : 'currentColor'}
                    fill={liked ? C.orange : 'none'}
                  />
                  {liked ? 'Liked' : 'Like'}
                </button>
              </div>

              {/* Star rating */}
              <div id="rating-section">
                {hasWatched ? (
                  <StarRating rating={pendingRating} setRating={handleRate} size="lg" />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                    }}
                  >
                    <div style={{ pointerEvents: 'none', opacity: 0.4 }}>
                      <StarRating rating={0} setRating={() => {}} size="lg" />
                    </div>
                    <span style={{ color: C.dim, fontSize: 12 }}>Watch the film first</span>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#4a5568',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={13} />
                  <span>{data.watchedCount} watched</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} />
                  <span>{data.allRatings?.length || 0} ratings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={13} />
                  <span>{likesCount} likes</span>
                </div>
              </div>

              {/* View my activity */}
              <button
                onClick={openMyActivity}
                style={{
                  color: '#40bcf4',
                  fontSize: 13,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                View your activity →
              </button>
            </div>

            {/* ── Column C: Histogram ── */}
            <div style={{ width: 450, flexShrink: 0 }}>
              {/* Top row: label + fan count */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: '#2e2e2e',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  RATINGS
                </span>
                <span style={{ color: '#2e2e2e', fontSize: 9, textTransform: 'uppercase' }}>
                  {data.allRatings?.length || 0} FANS
                </span>
              </div>

              {/* Average rating number */}
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#8a9bb0',
                  lineHeight: 1,
                  marginBottom: 14,
                }}
              >
                {data.averageRating ? data.averageRating.toFixed(1) : '—'}
              </div>

              {/* Bars */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  height: 100,
                  width: '100%',
                  gap: 3,
                }}
              >
                {starValues.map((v, i) => {
                  const count = counts[i];
                  const isPeak = maxCount > 0 && count === maxCount && count > 0;
                  const hpx = maxCount > 0 ? Math.max(3, (count / maxCount) * 100) : 3;
                  return (
                    <div
                      key={v}
                      onClick={() => count > 0 && setSelectedRating(v)}
                      style={{
                        flex: 1,
                        height: hpx,
                        backgroundColor: isPeak ? '#00e054' : '#1e1e1e',
                        borderRadius: '2px 2px 0 0',
                        minHeight: 3,
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'background-color 0.15s',
                      }}
                    />
                  );
                })}
              </div>

              {/* Scale */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#4a5568', fontSize: 9 }}>0.5</span>
                <span style={{ color: '#4a5568', fontSize: 9 }}>5.0</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20">
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

      {/* ══════════════════════════════════════════════════════
          SECTION 2: LEADERBOARD BAR CHART (Chart.js)
      ══════════════════════════════════════════════════════ */}
      {(() => {
        if (!data || data.leaderboard.length === 0) return null;

        const lb = [...data.leaderboard].sort((a, b) => b.watchedCount - a.watchedCount);

        const labels = lb.map((u) => u.name.split(' ')[0]); // first name only
        const lbCounts = lb.map((u) => u.watchedCount);
        const lbMax = Math.max(...lbCounts, 1);
        const avgCount = lbCounts.reduce((a, b) => a + b, 0) / lbCounts.length;

        // All bars the same flat blue — no gold/silver/bronze
        const barColors = lb.map(() => '#40bcf4');

        const chartData = {
          labels,
          datasets: [
            {
              data: lbCounts,
              backgroundColor: barColors,
              borderRadius: 4,
              borderSkipped: false,
              barThickness: 28,
            },
          ],
        };

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#141414',
              borderColor: '#1e1e1e',
              borderWidth: 1,
              titleColor: '#ffffff',
              bodyColor: '#8a9bb0',
              padding: 10,
              callbacks: {
                title: (items: any) => lb[items[0].dataIndex].name,
                label: (item: any) => `${item.raw} films watched`,
              },
            },
            avgLine: { value: avgCount },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: '#8a9bb0',
                font: { size: 11 },
                maxRotation: 45,
                minRotation: 45,
                autoSkip: false,
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#1a1a1a',
                drawBorder: false,
              },
              border: { display: false, dash: [4, 4] },
              ticks: {
                color: '#4a5568',
                font: { size: 10 },
                stepSize: Math.ceil(lbMax / 4),
              },
            },
          },
          onClick: (_: any, elements: any[]) => {
            if (elements.length > 0) {
              const user = lb[elements[0].index];
              openUserActivity(user);
            }
          },
        };

        return (
          <>
            <div
              className="flex items-center justify-between"
              style={{ marginTop: 48 }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Trophy size={16} color="#f5c518" />
                Leaderboard
              </span>
              <span style={{ color: C.dim, fontSize: 13 }}>{lb.length} members</span>
            </div>

            <div
              style={{
                background: '#0f0f0f',
                border: `1px solid ${C.border}`,
                borderRadius: '16px',
                padding: '24px',
                marginTop: 16,
              }}
            >
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ height: '360px', minWidth: `max(100%, ${lb.length * 40}px)` }}>
                  <Bar data={chartData} options={options as any} />
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          SECTION 3: PREVIOUS FILMS (archive grid)
      ══════════════════════════════════════════════════════ */}
      <>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 48 }}
        >
          <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>Previous Films</span>
          {previousFilms.length > 0 && (
            <span style={{ color: C.dim, fontSize: 13 }}>{previousFilms.length} films</span>
          )}
        </div>

        {previousFilms.length > 0 ? (
          <div
            className="mt-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
            }}
          >
            {previousFilms.map((af) => renderFlipCard(af))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 mt-4">
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: C.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <Film size={24} color={C.dim} />
            </div>
            <span style={{ color: C.muted, fontSize: 14 }}>No previous films yet</span>
          </div>
        )}
      </>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* ── Rating Detail Modal ─────────────────────────────── */}
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
                {data.allRatings.filter((r) => r.rating === selectedRating).length} ratings for{' '}
                {selectedRating} stars
              </span>
              <button
                onClick={() => setSelectedRating(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
                className="hover:!text-white"
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
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          backgroundColor: C.nested,
                        }}
                      >
                        {rating.userId?.image && (
                          <Image
                            src={rating.userId.image}
                            alt={rating.userId.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div>
                        <p style={{ color: 'white', fontSize: 14, margin: 0 }}>
                          {rating.userId?.name || 'Anonymous'}
                        </p>
                        <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>
                          {new Date(rating.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── My Activity Modal ───────────────────────────────── */}
      {showMyActivity && (
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
          onClick={() => setShowMyActivity(false)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              maxWidth: 480,
              width: '90vw',
              maxHeight: '75vh',
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
              <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>Your Activity</span>
              <button
                onClick={() => setShowMyActivity(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
                className="hover:!text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {myActivityLoading ? (
                <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0' }}>
                  Loading...
                </div>
              ) : myActivity ? (
                <>
                  <div className="flex gap-8 mb-6">
                    <div>
                      <span
                        style={{ fontSize: 24, fontWeight: 700, color: 'white', display: 'block' }}
                      >
                        {myActivity.watchedCount}
                      </span>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: C.dim }}>
                        Films Watched
                      </span>
                    </div>
                  </div>
                  {renderActivityBody(myActivity, false)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Public User Activity Modal ──────────────────────── */}
      {viewingUser && (
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
          onClick={() => setViewingUser(null)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              maxWidth: 480,
              width: '90vw',
              maxHeight: '75vh',
              overflowY: 'auto',
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
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: avatarBg(viewingUser.name || '?'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {viewingUser.image ? (
                    <Image
                      src={viewingUser.image}
                      alt={viewingUser.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    (viewingUser.name || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 500, margin: 0 }}>
                    {viewingUser.name}
                  </p>
                  {userActivity && (
                    <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>
                      {userActivity.watchedCount} films watched
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
                className="hover:!text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {renderActivityBody(userActivity, userActivityLoading)}
            </div>
          </div>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
