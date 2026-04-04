'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import {
  Trophy,
  Eye,
  Star,
  Film,
  Heart,
  X,
  BookOpen,
} from 'lucide-react';
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
  }
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
  likesCount?: number;
}

interface UserActivityData {
  name: string;
  image: string | null;
  watchedCount: number;
  ratings: { filmId: string; filmTitle: string; filmPosterUrl: string; rating: number; createdAt: string }[];
  likes: { filmId: string; filmTitle: string; filmPosterUrl: string; createdAt: string }[];
}

/* ═══════════════════════════════════════════════════════════ */
export default function FOTWLandingPage() {
  const { data: session } = useSession();

  // Core data
  const [data, setData] = useState<FOTWData | null>(null);
  const [archiveFilms, setArchiveFilms] = useState<ArchiveFilm[]>([]);
  const [loading, setLoading] = useState(true);

  // Rating / like state
  const [pendingRating, setPendingRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [modalRating, setModalRating] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

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

  // Archive flip state
  const [flippedId, setFlippedId] = useState<string | null>(null);

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
        if (d.userRating) {
          setPendingRating(d.userRating);
          setModalRating(d.userRating);
        }
        setArchiveFilms(Array.isArray(archive) ? archive : []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── My activity ─────────────────────────────────────────── */
  const openMyActivity = async () => {
    setShowMyActivity(true);
    if (myActivity) return;
    setMyActivityLoading(true);
    try {
      const email = session?.user?.email;
      if (!email) return;
      const res = await fetch(`/api/fotw/user-activity?email=${encodeURIComponent(email)}`);
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
      const res = await fetch(`/api/fotw/user-activity?email=${encodeURIComponent(user.email)}`);
      const d = await res.json();
      setUserActivity(d);
    } catch (e) {
      console.error(e);
    } finally {
      setUserActivityLoading(false);
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
    setLikesCount((p) => newLiked ? p + 1 : Math.max(0, p - 1));
    try {
      const res = await fetch('/api/fotw/like', {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Like failed');
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount((p) => !newLiked ? p + 1 : Math.max(0, p - 1));
      console.error(e);
    }
  };

  /* ── Log modal save ──────────────────────────────────────── */
  const handleLogSave = async () => {
    if (!data?.currentFilm) return;
    setLogLoading(true);
    setLogError(null);
    try {
      let res = await fetch('/api/fotw/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Failed to log watch');
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
      setLogError(e.message || 'An error occurred');
    } finally {
      setLogLoading(false);
    }
  };

  /* ── Derived values ──────────────────────────────────────── */
  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  if (loading) return <LoadingScreen />;

  const film = data?.currentFilm;
  const hasWatched = data?.hasWatched ?? false;
  const previousFilms = archiveFilms.filter((f) => f._id !== film?._id);

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

  const sectionHeader = (label: string, count?: number) => (
    <div
      className="flex items-center justify-between"
      style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, marginTop: 48 }}
    >
      <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>{label}</span>
      {count !== undefined && (
        <span style={{ color: C.dim, fontSize: 13 }}>{count} {count === 1 ? 'member' : 'members'}</span>
      )}
    </div>
  );

  /* ── User activity modal body ────────────────────────────── */
  const renderActivityBody = (act: UserActivityData | null, actLoading: boolean) => {
    if (actLoading) return <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0' }}>Loading...</div>;
    if (!act) return null;
    return (
      <>
        {act.ratings.length > 0 && (
          <div className="mb-6">
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Ratings</h3>
            <div className="space-y-3">
              {act.ratings.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative flex-shrink-0" style={{ width: 40, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: C.nested }}>
                    {r.filmPosterUrl && <Image src={r.filmPosterUrl} alt={r.filmTitle} fill className="object-cover" unoptimized />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 4px 0' }} className="truncate">{r.filmTitle}</p>
                    <div className="flex items-center gap-2">
                      <MiniStars value={r.rating} size={12} />
                      <span style={{ color: C.dim, fontSize: 11 }}>
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Likes</h3>
            <div className="space-y-3">
              {act.likes.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative flex-shrink-0" style={{ width: 40, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: C.nested }}>
                    {l.filmPosterUrl && <Image src={l.filmPosterUrl} alt={l.filmTitle} fill className="object-cover" unoptimized />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 4px 0' }} className="truncate">{l.filmTitle}</p>
                    <div className="flex items-center gap-2">
                      <Heart size={12} color={C.orange} fill={C.orange} />
                      <span style={{ color: C.dim, fontSize: 11 }}>
                        {new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {act.ratings.length === 0 && act.likes.length === 0 && (
          <div style={{ color: C.dim, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No activity yet</div>
        )}
      </>
    );
  };

  /* ── Archive flip-card ───────────────────────────────────── */
  const renderFlipCard = (af: ArchiveFilm) => {
    const isFlipped = flippedId === af._id;
    const afCounts = starValues.map((v) => af.allRatings.filter((r) => r.rating === v).length);
    const afMax = Math.max(...afCounts, 0);

    return (
      <div key={af._id} style={{ perspective: '1000px', width: '100%', minWidth: 150 }}>
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
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'relative', width: '100%', zIndex: isFlipped ? 0 : 2, cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); if (!isFlipped) setFlippedId(af._id); }}
          >
            <div className="group relative overflow-hidden" style={{ borderRadius: 12, aspectRatio: '2/3', width: '100%' }}>
              <Image src={af.posterUrl} alt={af.title} fill className="object-cover" unoptimized />
              {/* Hover overlay */}
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 12 }}
              >
                <div className="text-center">
                  <span style={{ fontSize: 34, fontWeight: 700, color: 'white', lineHeight: 1 }}>{af.averageRating.toFixed(1)}</span>
                  <div className="flex items-center justify-center gap-1 mt-1 mb-3">
                    <MiniStars value={af.averageRating} size={13} />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1" style={{ color: C.muted }}>
                      <Eye size={13} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{af.watchedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="m-0 text-white truncate" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>{af.title}</h3>
              {af.chosenBy && <div style={{ color: C.blue, fontSize: 10, marginTop: 2 }}>chosen by {af.chosenBy}</div>}
            </div>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              zIndex: isFlipped ? 2 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', inset: 0, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Back header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="m-0 text-white truncate" style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{af.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); setFlippedId(null); }}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, flexShrink: 0 }}
                  className="hover:text-white"
                >
                  <X size={11} />
                </button>
              </div>
              {af.chosenBy && (
                <div className="flex items-center gap-1 mb-1">
                  <span style={{ color: C.dim, fontSize: 9 }}>chosen by</span>
                  <span style={{ color: C.blue, fontSize: 10 }}>{af.chosenBy}</span>
                </div>
              )}
              {/* Stats */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex items-center gap-1" style={{ color: C.muted, fontSize: 10 }}>
                  <Eye size={10} style={{ color: C.dim }} />
                  {af.watchedCount}
                </div>
                <div className="flex items-center gap-1" style={{ color: C.muted, fontSize: 10 }}>
                  <Star size={10} style={{ color: C.dim }} />
                  {af.ratingsCount}
                </div>
                <div style={{ color: C.green, fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>
                  {af.averageRating.toFixed(1)}
                </div>
              </div>
              {/* Mini histogram */}
              <div className="mb-3">
                <div style={{ color: C.dim, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>RATINGS</div>
                <div className="flex items-end mb-1" style={{ height: 28, gap: 2 }}>
                  {starValues.map((v, i) => {
                    const c = afCounts[i];
                    const hp = afMax > 0 ? (c / afMax) : 0;
                    return (
                      <div key={v} style={{ width: 'calc(10% - 2px)', height: Math.max(2, hp * 28), backgroundColor: afMax > 0 && c === afMax && c > 0 ? C.green : '#1e1e1e', borderRadius: '2px 2px 0 0' }} />
                    );
                  })}
                </div>
                {/* Ratings list */}
                <div style={{ maxHeight: 72, overflowY: 'auto' }} className="space-y-1 pr-1">
                  {af.allRatings.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#1a1a3a', color: C.blue, fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate text-white" style={{ fontSize: 9, flex: 1 }}>{r.name}</div>
                      <div style={{ color: C.green, fontSize: 9, fontWeight: 600 }}>{r.rating}</div>
                    </div>
                  ))}
                  {af.allRatings.length === 0 && <div style={{ color: C.dim, fontSize: 9 }}>No ratings yet</div>}
                </div>
              </div>
              {/* Watched by */}
              {af.watchedBy.length > 0 && (
                <div className="mb-3">
                  <div style={{ color: C.dim, fontSize: 8, textTransform: 'uppercase', marginBottom: 3 }}>WATCHED BY</div>
                  <div className="flex flex-wrap" style={{ gap: 3 }}>
                    {af.watchedBy.map((w, idx) => (
                      <div key={idx} title={w.name} style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: C.border, color: 'white', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                <div style={{ color: C.dim, fontSize: 9 }}>
                  Added {new Date(af.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
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
          <h1 className={`text-white m-0 ${instrumentSerif.className}`} style={{ fontSize: '3rem', lineHeight: 1 }}>
            Film of the Week
          </h1>
          <p className="uppercase m-0 mt-2" style={{ color: C.dim, letterSpacing: '0.1em', fontSize: 11 }}>
            Watch · Rate · Discuss
          </p>
        </div>
        <div className="flex gap-2">
          {data?.isAdmin && (
            <Link href="/club/filmoftheweek/admin" style={ghostBtnStyle} className="hover:!text-white hover:!border-[#2e2e2e]">
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
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: 32,
            }}
          >
            <div className="flex flex-row">
              {/* Poster */}
              <div style={{ flexShrink: 0 }}>
                <div
                  className="relative"
                  style={{
                    width: 220,
                    aspectRatio: '2/3',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  <Image src={film.posterUrl} alt={film.title} fill className="object-cover" unoptimized />
                </div>
              </div>

              {/* Right column */}
              <div style={{ flex: 1, paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#0a1a0a',
                  border: `1px solid ${C.green}`,
                  color: C.green,
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '4px 12px',
                  width: 'fit-content',
                }}>
                  FILM OF THE WEEK
                </div>

                {/* Title */}
                <h2 className={`m-0 text-white ${instrumentSerif.className}`} style={{ fontSize: '3rem', lineHeight: 1 }}>
                  {film.title}
                </h2>

                {/* Metadata */}
                <div style={{ color: C.muted, fontSize: 13 }}>
                  {film.createdAt && (
                    <span>{new Date(film.createdAt).toLocaleDateString('en-US', { year: 'numeric' })}</span>
                  )}
                  {film.chosenBy && (
                    <>
                      <span> · Chosen by </span>
                      <span style={{ color: C.blue }}>{film.chosenBy}</span>
                    </>
                  )}
                </div>

                {/* Action row */}
                <div className="flex gap-[10px]">
                  <button
                    onClick={() => setShowLogModal(true)}
                    style={{ ...pillBtnStyle, color: hasWatched ? C.green : C.muted }}
                    className="hover:!text-white hover:!border-[#2e2e2e]"
                  >
                    <BookOpen size={15} color={hasWatched ? C.green : 'currentColor'} />
                    {hasWatched ? 'Logged' : 'Log'}
                  </button>
                </div>

                {/* Star rating */}
                <div id="rating-section">
                  {hasWatched ? (
                    <StarRating rating={pendingRating} setRating={handleRate} size="lg" />
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <div style={{ pointerEvents: 'none', opacity: 0.4 }}>
                        <StarRating rating={0} setRating={() => {}} size="lg" />
                      </div>
                      <span style={{ color: C.dim, fontSize: 12 }}>Log the film first</span>
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
                  <div className="flex items-center gap-1.5">
                    <Heart size={14} />
                    <span>{likesCount} likes</span>
                  </div>
                </div>

                {/* View my activity */}
                <div>
                  <button
                    onClick={openMyActivity}
                    style={{ color: C.blue, fontSize: 13, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    className="hover:underline"
                  >
                    View your activity →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings histogram */}
          {data.allRatings && data.allRatings.length > 0 && (
            <div
              className="mt-5 flex items-center"
              style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', gap: 24 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  RATINGS
                </div>
                <div className="flex items-end" style={{ height: 64, gap: 4 }}>
                  {starValues.map((v, i) => {
                    const count = counts[i];
                    const hp = maxCount > 0 ? (count / maxCount) : 0;
                    const hpx = Math.max(4, hp * 60);
                    const isPeak = maxCount > 0 && count === maxCount && count > 0;
                    return (
                      <div
                        key={v}
                        onClick={() => count > 0 && setSelectedRating(v)}
                        style={{ width: 'calc(10% - 4px)', height: hpx, backgroundColor: isPeak ? C.green : '#1e1e1e', borderRadius: '4px 4px 0 0', cursor: count > 0 ? 'pointer' : 'default' }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ color: C.dim, fontSize: 11 }}>0.5</span>
                  <span style={{ color: C.dim, fontSize: 11 }}>5.0</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase' }}>{data.allRatings.length} FANS</span>
                <span style={{ color: 'white', fontSize: 40, fontWeight: 600, lineHeight: 1 }}>{data.averageRating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <div style={{ width: 56, height: 56, backgroundColor: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 16 }}>
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

        const labels = lb.map(u => u.name.split(' ')[0]); // first name only
        const counts = lb.map(u => u.watchedCount);
        const maxCount = Math.max(...counts, 1);
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
        const topCount = counts[0] ?? 0;

        const barColors = lb.map((u, idx) => {
          if (u.watchedCount === topCount && topCount > 0) return '#f5c518';
          if (idx === 1) return '#a8a9ad';
          if (idx === 2) return '#cd7f32';
          return '#40bcf4';
        });

        const chartData = {
          labels,
          datasets: [{
            data: counts,
            backgroundColor: barColors,
            borderRadius: 4,
            borderSkipped: false,
            barThickness: 28,
          }]
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
              }
            },
            avgLine: { value: avgCount }
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
                autoSkip: false
              }
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
                stepSize: Math.ceil(maxCount / 4),
              }
            }
          },
          onClick: (_: any, elements: any[]) => {
            if (elements.length > 0) {
              const user = lb[elements[0].index];
              openUserActivity(user);
            }
          }
        };

        return (
          <>
            <div
              className="flex items-center justify-between"
              style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, marginTop: 48 }}
            >
              <span style={{ color: 'white', fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="#f5c518" />
                Leaderboard
              </span>
              <span style={{ color: C.dim, fontSize: 13 }}>{lb.length} members</span>
            </div>

            <div style={{
              background: '#0f0f0f',
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              padding: '24px',
              marginTop: 16,
            }}>
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ height: '280px', minWidth: `max(100%, ${lb.length * 40}px)` }}>
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
        <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, marginTop: 48 }}>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>Previous Films</span>
          {previousFilms.length > 0 && (
            <span style={{ color: C.dim, fontSize: 13 }}>{previousFilms.length} films</span>
          )}
        </div>

        {previousFilms.length > 0 ? (
          <div
            className="mt-4"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}
          >
            {previousFilms.map((af) => renderFlipCard(af))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 mt-4">
            <div style={{ width: 48, height: 48, backgroundColor: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 12 }}>
              <Film size={24} color={C.dim} />
            </div>
            <span style={{ color: C.muted, fontSize: 14 }}>No previous films yet</span>
          </div>
        )}
      </>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* ── Log Modal ──────────────────────────────────────── */}
      {showLogModal && film && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLogModal(false)}
        >
          <div
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: 'min(600px, 90vw)', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>I watched...</span>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 0 }} className="hover:!text-white">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                <div className="relative" style={{ width: 120, aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden' }}>
                  <Image src={film.posterUrl} alt={film.title} fill className="object-cover" unoptimized />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="mb-1 flex items-baseline gap-2">
                  <span style={{ color: 'white', fontSize: 20, fontWeight: 500 }}>{film.title}</span>
                  {film.createdAt && <span style={{ color: C.muted }}>{new Date(film.createdAt).getFullYear()}</span>}
                </div>
                <a href={film.driveLink} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontSize: 13, display: 'inline-block', marginBottom: 16 }} className="hover:underline">
                  Watch on Drive ↗
                </a>
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" defaultChecked />
                  <span style={{ color: C.muted, fontSize: 13 }}>Watched on</span>
                  <div style={{ background: C.nested, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', color: 'white', fontSize: 13 }}>
                    {todayStr}
                  </div>
                  <input type="checkbox" className="ml-2" />
                  <span style={{ color: C.muted, fontSize: 13 }}>I've watched this before</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <div className="flex items-center gap-3">
                    <span style={{ color: C.muted, fontSize: 13 }}>Rating</span>
                    <StarRating rating={modalRating} setRating={(r) => setModalRating(r)} size="md" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: C.muted, fontSize: 13 }}>Like</span>
                    <button
                      onClick={handleLike}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? C.orange : C.muted, padding: 0, display: 'flex' }}
                    >
                      <Heart size={22} color={liked ? C.orange : 'currentColor'} fill={liked ? C.orange : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <button
                onClick={handleLogSave}
                disabled={logLoading}
                style={{ backgroundColor: C.green, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, padding: '10px 28px', cursor: logLoading ? 'not-allowed' : 'pointer', opacity: logLoading ? 0.7 : 1 }}
                className="hover:bg-[#00c94a] transition-colors"
              >
                {logLoading ? 'Saving...' : 'Save'}
              </button>
              {logError && <div style={{ color: '#ff4444', fontSize: 13 }}>{logError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Rating Detail Modal ─────────────────────────────── */}
      {selectedRating !== null && data?.allRatings && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedRating(null)}
        >
          <div
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 520, width: '90vw', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                {data.allRatings.filter((r) => r.rating === selectedRating).length} ratings for {selectedRating} stars
              </span>
              <button onClick={() => setSelectedRating(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 0 }} className="hover:!text-white">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="space-y-3">
                {data.allRatings.filter((r) => r.rating === selectedRating).map((rating) => (
                  <div key={rating._id} className="flex items-center gap-4">
                    <div className="relative" style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', backgroundColor: C.nested }}>
                      {rating.userId?.image && <Image src={rating.userId.image} alt={rating.userId.name} fill className="object-cover" unoptimized />}
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

      {/* ── My Activity Modal ───────────────────────────────── */}
      {showMyActivity && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowMyActivity(false)}
        >
          <div
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 480, width: '90vw', maxHeight: '75vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>Your Activity</span>
              <button onClick={() => setShowMyActivity(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 0 }} className="hover:!text-white">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {myActivityLoading ? (
                <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0' }}>Loading...</div>
              ) : myActivity ? (
                <>
                  <div className="flex gap-8 mb-6">
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'white', display: 'block' }}>{myActivity.watchedCount}</span>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: C.dim }}>Films Watched</span>
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
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewingUser(null)}
        >
          <div
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 480, width: '90vw', maxHeight: '75vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    backgroundColor: avatarBg(viewingUser.name || '?'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'white',
                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                  }}
                >
                  {viewingUser.image
                    ? <Image src={viewingUser.image} alt={viewingUser.name} fill className="object-cover" unoptimized />
                    : (viewingUser.name || '?').charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 500, margin: 0 }}>{viewingUser.name}</p>
                  {userActivity && (
                    <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>{userActivity.watchedCount} films watched</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 0 }}
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
    </div>
  );
}
