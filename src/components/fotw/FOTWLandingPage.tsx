'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import SeasonSelector, { Season } from './SeasonSelector';
import {
  Trophy,
  Eye,
  Star,
  Film,
  Heart,
  X,
  ExternalLink,
  FileText,
  Lock,
  Globe,
  Play,
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
function useCountdown(createdAt: string | undefined, timerDuration: number = 604800000) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    null
  );
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!createdAt) return;
    const deadline = new Date(createdAt).getTime() + timerDuration;

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
  }, [createdAt, timerDuration]);

  return { timeLeft, expired };
}

/* ── Countdown display ───────────────────────────────────── */
function CountdownDisplay({
  createdAt,
  onExpire,
  timerPaused,
  timerDuration,
}: {
  createdAt: string | undefined;
  onExpire: () => void;
  timerPaused?: boolean;
  timerDuration?: number;
}) {
  const { timeLeft, expired } = useCountdown(createdAt, timerDuration);
  const calledExpire = useRef(false);

  useEffect(() => {
    if (expired && !calledExpire.current) {
      calledExpire.current = true;
      onExpire();
    }
  }, [expired, onExpire]);

  if (timerPaused) {
    return <span style={{ color: C.orange, fontSize: 14 }}>Timer Paused</span>;
  }
  if (expired) {
    return <span style={{ color: C.dim, fontSize: 14 }}>Week ended</span>;
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
              fontSize: 14,
              color: 'white',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {String(val).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: 14,
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
  seasonWatchedCount: number;
  seasonWatchCount?: number;
  email: string;
}

interface RatingEntry {
  _id: string;
  rating: number;
  userEmail: string;
  userId: { name: string; image?: string };
  createdAt: string;
}

interface ReviewEntry {
  userEmail: string;
  name: string;
  image: string | null;
  body: string;
  hasSpoiler: boolean;
  createdAt: string;
}

interface FOTWData {
  currentFilm: {
    _id: string;
    title: string;
    posterUrl: string;
    chosenBy?: string;
    createdAt?: string;
    timerPaused?: boolean;
    tmdbUrl?: string;
    timerDuration?: number;
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
  userReview: { body: string; isPrivate: boolean } | null;
  publicReviews: ReviewEntry[];
}

interface ArchiveFilm {
  _id: string;
  title: string;
  posterUrl: string;
  dateSuggested?: string | null;
  createdAt: string;
  ratingsCount: number;
  watchedCount: number;
  averageRating: number;
  allRatings: { userEmail: string; name: string; rating: number; createdAt: string }[];
  watchedBy: { userEmail: string; watchedAt: string; name: string }[];
  chosenBy?: string;
  tmdbUrl?: string;
  likesCount?: number;
  publicReviews?: ReviewEntry[];
}

interface UserActivityData {
  name: string;
  image: string | null;
  watchedCount: number;
  currentStreak?: number;
  longestStreak?: number;
  ratings: {
    filmId: string;
    filmTitle: string;
    filmPosterUrl: string;
    rating: number;
    createdAt: string;
  }[];
  likes: { filmId: string; filmTitle: string; filmPosterUrl: string; createdAt: string }[];
  reviews: {
    filmId: string;
    filmTitle: string;
    filmPosterUrl: string;
    body: string;
    isPrivate: boolean;
    createdAt: string;
  }[];
}

function ArchiveReviewItem({ review, C }: { review: any; C: any }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 120;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (isLong) setExpanded(!expanded);
      }}
      style={{
        backgroundColor: '#141414',
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        cursor: isLong ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: avatarBg(review.name),
            color: 'white',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontWeight: 700,
          }}
        >
          {review.name.charAt(0).toUpperCase()}
        </div>
        <span
          style={{
            color: 'white',
            fontSize: 12,
            fontWeight: 500,
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {review.name}
        </span>
      </div>
      <p
        style={{
          color: C.dim,
          fontSize: 12,
          lineHeight: 1.4,
          margin: 0,
          whiteSpace: 'pre-wrap',
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        {review.body}
      </p>
      {isLong && (
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#40bcf4',
            fontSize: 11,
            padding: 0,
            marginTop: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
          className="hover:text-white transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

/* ── JustWatch Widget ────────────────────────────────────── */
function JustWatchWidget({
  title,
  scale = '1.',
  iconSize = '60px',
}: {
  title: string;
  scale?: string;
  iconSize?: string;
}) {
  const match = title.match(/^(.*?)(?:\s*\(([\d]{4})\))?$/);
  const jwTitle = match ? match[1].trim() : title;
  const jwYear = match && match[2] ? match[2] : undefined;

  useEffect(() => {
    let script = document.getElementById('justwatch-widget-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'justwatch-widget-script';
      script.src = 'https://widget.justwatch.com/justwatch_widget.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).JustWatch?.reloadWidgets) {
          (window as any).JustWatch.reloadWidgets();
        }
      }, 200);
    }
  }, [jwTitle]);

  return (
    <div style={{ marginTop: '32px', overflow: 'hidden', maxWidth: '100%' }} className="justwatch-wrapper">
      {/* 
        --- JustWatch Customization Options ---
        You can add the following data attributes to the div below to customize the widget:
        
        data-scale="1.0" (Size factor between 0.6 and 2)
        data-offer-label="price" (Options: "price", "none" - omit to show Rent/Buy/Subs labels)
        data-language="en" (Force a specific language, e.g., "en", "hi")
        data-max-offers="5" (Limit the number of visible streaming services)
        data-no-offers-message="Oopsy daisy, no offers for {{title}} at this time!"
        data-title-not-found-message="Oopsy daisy, title not found at this time!"
      */}
      <div
        key={`${jwTitle}-${jwYear}`}
        data-jw-widget=""
        data-append-iframe="true"
        data-offer-label="none"
        data-api-key={
          process.env.NEXT_PUBLIC_JUSTWATCH_API_KEY || 'BXrc0oeyF7EpG5Zw45GTgiYwM7v3qWOT'
        }
        data-object-type="movie"
        data-title={jwTitle}
        {...(jwYear ? { 'data-year': jwYear } : {})}
        data-theme="dark"
        data-scale={scale}
      />
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
        <a
          style={{
            display: 'flex',
            fontSize: '11px',
            color: '#8a9bb0',
            textDecoration: 'none',
            alignItems: 'center',
          }}
          target="_blank"
          rel="noopener noreferrer"
          data-original="https://www.justwatch.com"
          href="https://www.justwatch.com/in/"
        ></a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function FOTWLandingPage({ initialData }: { initialData?: any } = {}) {
  const { data: session } = useSession();
  const isFirstMount = useRef(true);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    // Need to safely call check if window is available during SSR / mounting
    if (typeof window !== 'undefined') {
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }
  }, []);

  // Core data
  const [data, setData] = useState<FOTWData | null>(initialData?.data || null);
  const [archiveFilms, setArchiveFilms] = useState<ArchiveFilm[]>(initialData?.archive?.films || []);
  const [loading, setLoading] = useState(!initialData);

  // Season state
  const [seasons, setSeasons] = useState<Season[]>(initialData?.seasons || []);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedArchiveSeason, setSelectedArchiveSeason] = useState<string>('');
  const [archiveLoading, setArchiveLoading] = useState(false);

  // All-time Letterboxd URL from site config
  const [archiveLetterboxdUrl, setArchiveLetterboxdUrl] = useState<string>(initialData?.archive?.seasonLetterboxdUrl || '');

  // Inline action state
  const [pendingRating, setPendingRating] = useState<number>(initialData?.data?.userRating || 0);
  const [liked, setLiked] = useState<boolean>(initialData?.data?.userLiked || false);
  const [likesCount, setLikesCount] = useState<number>(initialData?.data?.likesCount || 0);
  const [hasWatchedLocal, setHasWatchedLocal] = useState<boolean>(initialData?.data?.hasWatched || false);
  const [watchLoading, setWatchLoading] = useState(false);

  // Review state
  const [reviewExpanded, setReviewExpanded] = useState<boolean>(false);
  const [reviewBody, setReviewBody] = useState<string>(initialData?.data?.userReview?.body || '');
  const [reviewPrivate, setReviewPrivate] = useState<boolean>(initialData?.data?.userReview?.isPrivate || false);
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewLocal, setHasReviewLocal] = useState(!!initialData?.data?.userReview);
  const [showAllReviews, setShowAllReviews] = useState(false);

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
  const [activitySeasonId, setActivitySeasonId] = useState<string>('');

  // Archive multi-flip state — 0: poster, 1: info, 2: histogram, 3: watched-by
  const [flipStates, setFlipStates] = useState<Record<string, number>>({});

  const advanceFlip = (id: string, panels: number = 4) => {
    setFlipStates((prev) => {
      const current = prev[id] ?? 0;
      const next = (current + 1) % panels;
      return { ...prev, [id]: next };
    });
  };

  /* ── Data fetching ───────────────────────────────────────── */

  const fetchData = useCallback((seasonIdOverride?: string) => {
    if (!seasonIdOverride) {
      // Initial load uses the bootstrap endpoint
      fetch(`/api/fotw/bootstrap`)
        .then((r) => r.json())
        .then((boot) => {
          const d = boot.data || {};
          const archive = boot.archive || {};
          const seasonsList = boot.seasons || [];

          setSeasons(seasonsList);

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
          if (d.userReview) {
            setReviewBody(d.userReview.body);
            setReviewPrivate(d.userReview.isPrivate);
            setHasReviewLocal(true);
          } else {
            setReviewBody('');
            setReviewPrivate(false);
            setHasReviewLocal(false);
          }
          setArchiveFilms(archive.films || []);
          setArchiveLetterboxdUrl(archive.seasonLetterboxdUrl || '');
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    } else {
      // Season switch re-fetches just data
      fetch(`/api/fotw/data?seasonId=${seasonIdOverride}`)
        .then((r) => r.json())
        .then((d) => {
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
          if (d.userReview) {
            setReviewBody(d.userReview.body);
            setReviewPrivate(d.userReview.isPrivate);
            setHasReviewLocal(true);
          } else {
            setReviewBody('');
            setReviewPrivate(false);
            setHasReviewLocal(false);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (initialData && isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchData();
  }, [fetchData, initialData]);

  const handleSeasonChange = async (id: string) => {
    setSelectedSeason(id);
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`/api/fotw/data?seasonId=${id}`);
      const newData = await res.json();
      setData((prev) => (prev ? { ...prev, leaderboard: newData.leaderboard || [] } : newData));
    } catch (e) {
      console.error(e);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleArchiveSeasonChange = async (id: string) => {
    setSelectedArchiveSeason(id);
    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/fotw/archive?seasonId=${id}`);
      const newArchive = await res.json();
      // archive is now { films, seasonLetterboxdUrl }
      setArchiveFilms(newArchive.films || []);
      setArchiveLetterboxdUrl(newArchive.seasonLetterboxdUrl || '');
    } catch (e) {
      console.error(e);
    } finally {
      setArchiveLoading(false);
    }
  };

  /* ── My activity ─────────────────────────────────────────── */
  const openMyActivity = () => {
    setShowMyActivity(true);
    setActivitySeasonId(selectedSeason || 'all');
  };

  /* ── Public user activity ────────────────────────────────── */
  const openUserActivity = (user: LeaderboardUser) => {
    setViewingUser(user);
    setActivitySeasonId(selectedSeason || 'all');
  };

  useEffect(() => {
    if (!showMyActivity || !session?.user?.email) return;
    let isMounted = true;
    const fetchAct = async () => {
      setMyActivityLoading(true);
      try {
        const res = await fetch(
          `/api/fotw/user-activity?email=${encodeURIComponent(session.user.email || '')}&seasonId=${activitySeasonId || 'all'}`,
          {
            cache: 'no-store',
          }
        );
        const d = await res.json();
        if (isMounted) setMyActivity(d);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setMyActivityLoading(false);
      }
    };
    fetchAct();
    return () => {
      isMounted = false;
    };
  }, [showMyActivity, activitySeasonId, session?.user?.email]);

  useEffect(() => {
    if (!viewingUser) return;
    let isMounted = true;
    const fetchAct = async () => {
      setUserActivityLoading(true);
      try {
        const res = await fetch(
          `/api/fotw/user-activity?userId=${encodeURIComponent(viewingUser._id)}&seasonId=${activitySeasonId || 'all'}`,
          {
            cache: 'no-store',
          }
        );
        const d = await res.json();
        if (isMounted) setUserActivity(d);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setUserActivityLoading(false);
      }
    };
    fetchAct();
    return () => {
      isMounted = false;
    };
  }, [viewingUser, activitySeasonId]);

  /* ── Watch handler ───────────────────────────────────────── */
  const handleWatch = async () => {
    if (!data?.currentFilm || watchLoading) return;
    setWatchLoading(true);

    const currentlyWatched = hasWatchedLocal;
    const method = currentlyWatched ? 'DELETE' : 'POST';

    try {
      const res = await fetch('/api/fotw/watch', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (!res.ok) throw new Error('Failed to update watch status');

      const responseData = await res.json();

      const newWatchedState = !currentlyWatched;
      setHasWatchedLocal(newWatchedState);

      if (!newWatchedState) {
        setPendingRating(0);
        if (liked) {
          setLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      }

      setData((prev) => {
        if (!prev) return prev;

        let newUserRating = prev.userRating;
        let newUserLiked = prev.userLiked;
        let newLikesCount = prev.likesCount;

        if (!newWatchedState) {
          newUserRating = null;
          if (newUserLiked) {
            newUserLiked = false;
            newLikesCount = Math.max(0, newLikesCount - 1);
          }
          setReviewBody('');
          setReviewPrivate(false);
          setHasReviewLocal(false);
          setReviewExpanded(false);
        }

        return {
          ...prev,
          hasWatched: newWatchedState,
          watchedCount: newWatchedState
            ? prev.watchedCount + 1
            : Math.max(0, prev.watchedCount - 1),
          userRating: newUserRating,
          userLiked: newUserLiked,
          likesCount: newLikesCount,
        };
      });

      // Lightweight leaderboard-only refresh — much cheaper than a full bootstrap.
      // All other state (watchedCount, hasWatched, userRating, likesCount) was already
      // updated optimistically above.
      const seasonParam = selectedSeason ? `?seasonId=${selectedSeason}` : '';
      fetch(`/api/fotw/data${seasonParam}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setData((prev) => (prev ? { ...prev, leaderboard: d.leaderboard } : prev));
          }
        })
        .catch(() => {}); // non-critical
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
      // Optimistic update: reflect the new rating in allRatings + recompute average.
      // No network re-fetch needed — the star UI already shows the new value.
      setData((prev) => {
        if (!prev) return prev;
        const userEmail = session?.user?.email || '';
        // Preserve the user's existing display name/image if already in the list
        const existing = prev.allRatings.find((r) => r.userEmail === userEmail);
        const updatedEntry = {
          _id: existing?._id || `temp-${Date.now()}`,
          userEmail,
          userId: existing?.userId || {
            name: session?.user?.name || '',
            image: session?.user?.image ?? undefined,
          },
          rating: newRating,
          createdAt: existing?.createdAt || new Date().toISOString(),
        };
        const newRatings = [
          ...prev.allRatings.filter((r) => r.userEmail !== userEmail),
          updatedEntry,
        ];
        const avg =
          newRatings.length > 0
            ? Math.round(
                (newRatings.reduce((s, r) => s + r.rating, 0) / newRatings.length) * 10
              ) / 10
            : 0;
        return { ...prev, allRatings: newRatings, averageRating: avg, userRating: newRating };
      });
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

  /* ── Review handlers ─────────────────────────────────────── */
  const handleSaveReview = async () => {
    if (!data?.currentFilm || !reviewBody.trim()) return;
    setReviewLoading(true);
    try {
      const res = await fetch('/api/fotw/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmId: data.currentFilm._id,
          body: reviewBody.trim(),
          isPrivate: reviewPrivate,
          hasSpoiler: reviewSpoiler,
        }),
      });
      if (res.ok) {
        setHasReviewLocal(true);
        setReviewExpanded(false);
        // Optimistic update: add/replace the review in publicReviews without a re-fetch.
        setData((prev) => {
          if (!prev) return prev;
          const userEmail = session?.user?.email || '';
          // Try to find the user's formatted display name from an existing entry
          const existingReview = prev.publicReviews?.find((r) => r.userEmail === userEmail);
          const displayName = existingReview?.name || session?.user?.name || '';
          const displayImage = existingReview?.image ?? session?.user?.image ?? null;
          if (reviewPrivate) {
            // Private review — remove from public list if it was there
            return {
              ...prev,
              publicReviews: (prev.publicReviews || []).filter((r) => r.userEmail !== userEmail),
            };
          }
          const newReview = {
            userEmail,
            name: displayName,
            image: displayImage,
            body: reviewBody.trim(),
            hasSpoiler: reviewSpoiler,
            createdAt: new Date().toISOString(),
          };
          return {
            ...prev,
            publicReviews: [
              newReview,
              ...(prev.publicReviews || []).filter((r) => r.userEmail !== userEmail),
            ],
          };
        });
      }
    } catch (e) {
      console.error('Review save failed', e);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!data?.currentFilm) return;
    setReviewLoading(true);
    try {
      const res = await fetch('/api/fotw/review', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId: data.currentFilm._id }),
      });
      if (res.ok) {
        setReviewBody('');
        setReviewPrivate(false);
        setReviewSpoiler(false);
        setHasReviewLocal(false);
        setReviewExpanded(false);
        // Optimistic update: remove from publicReviews without a re-fetch.
        setData((prev) => {
          if (!prev) return prev;
          const userEmail = session?.user?.email || '';
          return {
            ...prev,
            publicReviews: (prev.publicReviews || []).filter((r) => r.userEmail !== userEmail),
          };
        });
      }
    } catch (e) {
      console.error('Review delete failed', e);
    } finally {
      setReviewLoading(false);
    }
  };

  /* ── Derived values ──────────────────────────────────────── */
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  // True on any screen narrower than 1024px — used so the 3-column hero
  // stacks vertically on tablets as well as phones.
  const isNarrow = isMobile || isTablet;

  if (loading) return <LoadingScreen />;

  const film = data?.currentFilm;
  const hasWatched = hasWatchedLocal || (data?.hasWatched ?? false);
  // Archive API already excludes the current film server-side (lockedAt: { $ne: null })
  const previousFilms = archiveFilms;
  // archiveLetterboxdUrl comes from state — updated by every archive fetch, always fresh

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
    fontSize: 14,
    transition: 'all 0.2s',
  };

  const pillBtnBase: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    background: '#141414',
    borderRadius: 999,
    height: 38,
    padding: '0 18px',
    fontSize: 14,
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
              style={{ fontSize: 14, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}
            >
              Ratings
            </h3>
            <div className="space-y-3">
              {act.ratings.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="relative shrink-0"
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
                      style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}
                      className="truncate"
                    >
                      {r.filmTitle}
                    </p>
                    <div className="flex items-center gap-2">
                      <MiniStars value={r.rating} size={12} />
                      <span style={{ color: C.dim, fontSize: 14 }}>
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
              style={{ fontSize: 14, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}
            >
              Likes
            </h3>
            <div className="space-y-3">
              {act.likes.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="relative shrink-0"
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
                      style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}
                      className="truncate"
                    >
                      {l.filmTitle}
                    </p>
                    <div className="flex items-center gap-2">
                      <Heart size={12} color={C.orange} fill={C.orange} />
                      <span style={{ color: C.dim, fontSize: 14 }}>
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
        {act.reviews?.length > 0 && (
          <div className="mb-4">
            <h3
              style={{ fontSize: 14, textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}
            >
              Reviews
            </h3>
            <div className="space-y-3">
              {act.reviews.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="relative shrink-0"
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
                    <div className="flex items-center justify-between mb-1">
                      <p
                        style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: 0 }}
                        className="truncate"
                      >
                        {r.filmTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        {r.isPrivate && <Lock size={12} color={C.muted} />}
                        <span style={{ color: C.dim, fontSize: 12 }}>
                          {new Date(r.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        color: C.muted,
                        fontSize: 13,
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {act.ratings.length === 0 &&
          act.likes.length === 0 &&
          (!act.reviews || act.reviews.length === 0) && (
            <div style={{ color: C.dim, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
              No activity yet
            </div>
          )}
      </>
    );
  };

  /* ── Archive multi-flip card ─────────────────────────────── */
  // Panels: 0 = poster, 1 = info, 2 = histogram, 3 = watched-by, 4 = reviews
  const renderFlipCard = (af: ArchiveFilm) => {
    const step = flipStates[af._id] ?? 0;
    const afCounts = starValues.map((v) => af.allRatings.filter((r) => r.rating === v).length);
    const afMax = Math.max(...afCounts, 0);

    const hasRatings = af.allRatings && af.allRatings.length > 0;
    const hasReviews = af.publicReviews && af.publicReviews.length > 0;

    let PANELS = 4; // Poster, Info, Streaming, WatchedBy (base)
    if (hasRatings) PANELS++;
    if (hasReviews) PANELS++;

    // Helper to determine panel indexes
    let currentPanelIdx = 1; // 0 is always poster
    const infoPanelIdx = currentPanelIdx++;
    const streamingPanelIdx = currentPanelIdx++;
    const ratingPanelIdx = hasRatings ? currentPanelIdx++ : -1;
    const watchedByPanelIdx = currentPanelIdx++;
    const reviewPanelIdx = hasReviews ? currentPanelIdx++ : -1;

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
          onClick={() => advanceFlip(af._id, PANELS)}
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
              <div
                className="group"
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <Image
                  src={af.posterUrl}
                  alt={af.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 120px, 160px"
                />
                {/* Hover overlay on poster: rating + watch count */}
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1,
                      marginBottom: 12,
                    }}
                  >
                    {af.ratingsCount > 4 ? af.averageRating.toFixed(1) : '—'}
                  </span>
                  <div className="flex items-center gap-2" style={{ color: C.muted }}>
                    <Eye size={13} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{af.watchedCount}</span>
                  </div>
                  <div
                    style={{
                      color: C.dim,
                      fontSize: 14,
                      marginTop: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    click to explore
                  </div>
                </div>
              </div>
            </div>

            {/* ── Panel 1: Info ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: isMobile ? '10px' : '14px 12px',
                fontSize: isMobile ? '13px' : 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {Array.from({ length: PANELS }, (_, idx) => idx).map((i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step - 1 ? 14 : 4,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: i === step - 1 ? C.green : C.border,
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
              <h3
                style={{
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {af.title.replace(/\s*\(\d{4}\)$/, '')}
              </h3>
              {af.chosenBy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Film size={10} color={C.dim} />
                  <span style={{ color: C.dim, fontSize: 11 }}>picked by</span>
                  <span style={{ color: C.blue, fontSize: 12, fontWeight: 600 }}>
                    {af.chosenBy}
                  </span>
                </div>
              )}
              <div style={{ color: C.dim, fontSize: 12 }}>
                {new Date(af.dateSuggested || '').toString() !== 'Invalid Date'
                  ? new Date(af.dateSuggested as string).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </div>
              {/* Key stats */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 0',
                  borderTop: `1px solid ${C.border}`,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                    {af.watchedCount}
                  </span>
                  <span
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Watched
                  </span>
                </div>
                <div style={{ width: 1, backgroundColor: C.border }} />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                    {af.ratingsCount}
                  </span>
                  <span
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Ratings
                  </span>
                </div>
                <div style={{ width: 1, backgroundColor: C.border }} />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <span style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>
                    {af.ratingsCount > 4 ? af.averageRating.toFixed(1) : '—'}
                  </span>
                  <span
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Avg
                  </span>
                </div>
              </div>
              {/* TMDB link */}
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
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  TMDB
                </a>
              )}
              <div
                style={{
                  color: C.dim,
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                  letterSpacing: '0.08em',
                }}
              >
                CLICK FOR STREAMS →
              </div>
            </div>

            {/* ── Panel X: Streaming ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: isMobile ? '10px' : '14px 12px',
                fontSize: isMobile ? '13px' : 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {Array.from({ length: PANELS }, (_, idx) => idx).map((i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step - 1 ? 14 : 4,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: i === step - 1 ? '#8a9bb0' : C.border,
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  marginTop: 4,
                }}
              >
                <h3
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}
                >
                  Where to Watch
                </h3>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    af.title + ' trailer'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 400,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                >
                  <Play size={14} fill="currentColor" />
                  Trailer
                </a>
              </div>
              
              {/* Horizontal line */}
              <div style={{ height: 1, backgroundColor: C.border, width: '100%' }} />

              <div style={{ flex: 1, marginTop: -20, paddingBottom: 16 }}>
                <JustWatchWidget title={af.title} scale="1.0" iconSize="36px" />
              </div>

              <div
                style={{
                  color: C.dim,
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 'auto',
                  letterSpacing: '0.08em',
                }}
              >
                CLICK FOR {hasRatings ? 'RATINGS' : hasReviews ? 'REVIEWS' : 'VIEWERS'} →
              </div>
            </div>

            {hasRatings && (
              <>
                {/* ── Panel 2: Histogram + ratings list ── */}
                <div
                  style={{
                    width: `${100 / PANELS}%`,
                    flexShrink: 0,
                    padding: isMobile ? '10px' : '14px 12px',
                    fontSize: isMobile ? '13px' : 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    height: '100%',
                    maxHeight: '100%',
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Step indicator */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                    {Array.from({ length: PANELS }, (_, idx) => idx).map((i) => (
                      <div
                        key={i}
                        style={{
                          width: i === step - 1 ? 14 : 4,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: i === step - 1 ? C.orange : C.border,
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: C.muted,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      Ratings
                    </span>
                    <span style={{ color: C.green, fontSize: 15, fontWeight: 700 }}>
                      {af.ratingsCount > 4 ? af.averageRating.toFixed(1) : '—'}
                    </span>
                  </div>
                  {/* MiniStars for avg */}
                  <div>
                    {af.ratingsCount > 4 && <MiniStars value={af.averageRating} size={12} />}
                    <span style={{ color: C.dim, fontSize: 14, marginLeft: 4 }}>
                      {af.ratingsCount} ratings
                    </span>
                  </div>
                  {/* Histogram bars */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      height: 36,
                      gap: 2,
                      marginBottom: 2,
                    }}
                  >
                    {starValues.map((v, i) => {
                      const c = afCounts[i];
                      const hp = afMax > 0 ? c / afMax : 0;
                      const isTop = afMax > 0 && c === afMax && c > 0;
                      return (
                        <div
                          key={v}
                          title={`★${v}: ${c}`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: Math.max(2, hp * 32),
                              backgroundColor: isTop ? '#5f5f5f' : c > 0 ? '#2a2a2a' : '#181818',
                              borderRadius: '2px 2px 0 0',
                              transition: 'height 0.4s ease',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}
                  >
                    <span style={{ color: C.dim, fontSize: 14 }}>½★</span>
                    <span style={{ color: C.dim, fontSize: 14 }}>5★</span>
                  </div>
                  {/* Individual ratings list */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: 6,
                    }}
                    className="space-y-1 pr-1"
                  >
                    {af.allRatings.length === 0 ? (
                      <div
                        style={{ color: C.dim, fontSize: 14, textAlign: 'center', paddingTop: 8 }}
                      >
                        No ratings yet
                      </div>
                    ) : (
                      af.allRatings.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: avatarBg(r.name),
                              color: C.blue,
                              fontSize: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 700,
                            }}
                          >
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className="truncate"
                            style={{ fontSize: 12, flex: 1, color: '#ccc' }}
                          >
                            {r.name}
                          </div>
                          <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>
                            {r.rating}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div
                    style={{
                      color: C.dim,
                      fontSize: 14,
                      textAlign: 'center',
                      paddingTop: 4,
                      letterSpacing: '0.08em',
                    }}
                  >
                    CLICK FOR {hasReviews ? 'REVIEWS' : 'VIEWERS'} →
                  </div>
                </div>
              </>
            )}
            {/* ── Panel 3: Watched by ── */}
            <div
              style={{
                width: `${100 / PANELS}%`,
                flexShrink: 0,
                padding: isMobile ? '10px' : '14px 12px',
                fontSize: isMobile ? '13px' : 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                {Array.from({ length: PANELS }, (_, idx) => idx).map((i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step - 1 ? 14 : 4,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: i === step - 1 ? C.blue : C.border,
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    color: C.muted,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  WHO ALL WATCHED
                </span>
                <span style={{ color: C.blue, fontSize: 14, fontWeight: 700 }}>
                  {af.watchedCount}
                </span>
              </div>
              {af.watchedBy.length === 0 ? (
                <div style={{ color: C.dim, fontSize: 14, textAlign: 'center', paddingTop: 16 }}>
                  No viewers yet
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }} className="space-y-2 pr-1">
                  {af.watchedBy.map((w, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: avatarBg(w.name),
                          color: 'white',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 700,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {w.name}
                        </div>
                        <div style={{ color: C.dim, fontSize: 11 }}>
                          {new Date(w.watchedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <Eye size={10} color={C.dim} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                <div
                  style={{
                    color: C.dim,
                    fontSize: 14,
                    textAlign: 'center',
                    letterSpacing: '0.08em',
                  }}
                >
                  CLICK FOR {hasReviews ? 'REVIEWS' : 'RESTART'} →
                </div>
              </div>
            </div>

            {/* ── Panel 4: Reviews ── */}
            {hasReviews && (
              <div
                style={{
                  width: `${100 / PANELS}%`,
                  flexShrink: 0,
                  padding: isMobile ? '10px' : '14px 12px',
                  fontSize: isMobile ? '13px' : 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  height: '100%',
                  maxHeight: '100%',
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {/* Step indicator */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                  {Array.from({ length: PANELS }, (_, idx) => idx).map((i) => (
                    <div
                      key={i}
                      style={{
                        width: i === step - 1 ? 14 : 4,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: i === step - 1 ? C.green : C.border,
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      color: C.muted,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    REVIEWS
                  </span>
                  <span style={{ color: C.green, fontSize: 14, fontWeight: 700 }}>
                    {af.publicReviews?.length || 0}
                  </span>
                </div>
                <div
                  style={{ flex: 1, overflowY: 'auto' }}
                  className="space-y-3 pr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {af.publicReviews?.map((r, idx) => (
                    <ArchiveReviewItem key={idx} review={r} C={C} />
                  ))}
                </div>
                <div
                  style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.border}` }}
                >
                  <div
                    style={{
                      color: C.dim,
                      fontSize: 14,
                      textAlign: 'center',
                      letterSpacing: '0.08em',
                    }}
                  >
                    CLICK TO RESTART →
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Film title below card */}
        <div className="mt-2">
          <h3
            className="m-0 text-white"
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {af.title.replace(/\s*\(\d{4}\)$/, '')}
          </h3>
          {step === 0 && af.chosenBy && (
            <div style={{ color: C.blue, fontSize: 11, marginTop: 2 }}>picked by {af.chosenBy}</div>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════ RENDER ══════════════════════════ */
  return (
    <div
      style={{
        backgroundColor: C.bg,
        minHeight: '100vh',
        paddingBottom: 96,
        padding: isNarrow ? '16px' : '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── Page Header ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: isMobile ? '16px' : '40px',
        }}
      >
        <div>
          <h1
            className={`text-white m-0 ${instrumentSerif.className}`}
            style={{ fontSize: isMobile ? '3.5rem' : '7.5rem', lineHeight: 1 }}
          >
            Film of the Week
          </h1>
        </div>
        <div className="flex gap-2">
          {data?.isAdmin && (
            <Link
              href="/club/filmoftheweek/admin"
              style={ghostBtnStyle}
              className="hover:text-white! hover:border-[#2e2e2e]!"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap" style={{ marginBottom: '24px' }}>
        <Link
          href="/club/filmoftheweek/rules"
          style={{
            color: '#4a5568',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#8a9bb0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
        >
          About →
        </Link>
        <Link
          href="/club/filmoftheweek/stats"
          style={{
            color: '#4a5568',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#8a9bb0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
        >
          Stats →
        </Link>
        <button
          onClick={openMyActivity}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#4a5568',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#8a9bb0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
        >
          Activity →
        </button>
        <Link
          href="/club/filmoftheweek/members"
          style={{
            color: '#4a5568',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#8a9bb0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
        >
          Members →
        </Link>
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
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: isNarrow ? 'column' : 'row',
              gap: isNarrow ? '16px' : '32px',
              alignItems: isNarrow ? 'center' : 'flex-start',
              padding: isNarrow ? '16px' : '32px',
            }}
          >
            {/* ── Column A: Poster ── */}
            <div
              style={{
                width: isNarrow ? '280px' : '220px',
                flexShrink: 0,
                position: 'relative',
                margin: isNarrow ? '0 auto' : '0',
              }}
            >
              <div
                style={{
                  display: 'block',
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '100%',
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
                    priority
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 320px"
                  />
                </div>
              </div>
            </div>

            {/* ── Column B: Film Info ── */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: isNarrow ? '100%' : 'auto',
                paddingLeft: '0',
                alignItems: isNarrow ? 'center' : 'flex-start',
                textAlign: isNarrow ? 'center' : 'left',
              }}
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
                  fontSize: 14,
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
                  fontSize: isNarrow ? '1.6rem' : 'clamp(1.6rem, 3vw, 2.4rem)',
                  lineHeight: 1.1,
                }}
              >
                {film.title}
              </h2>

              {/* Metadata */}
              <p style={{ color: '#8a9bb0', fontSize: 14, margin: 0 }}>
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
                    · picked by <span style={{ color: '#40bcf4' }}>{film.chosenBy}</span>
                  </>
                )}
              </p>

              {/* Countdown */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: isNarrow ? 'center' : 'flex-start',
                }}
              >
                <CountdownDisplay
                  createdAt={film.createdAt}
                  timerPaused={film.timerPaused}
                  timerDuration={film.timerDuration}
                  onExpire={() => setTimeout(fetchData, 500)}
                />
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: isNarrow ? 'center' : 'flex-start',
                }}
              >
                <button
                  id="btn-watched"
                  onClick={handleWatch}
                  disabled={watchLoading}
                  style={{
                    ...pillBtnBase,
                    background: hasWatched ? '#0a1a0a' : '#141414',
                    borderColor: hasWatched ? C.green : C.border,
                    color: hasWatched ? C.green : C.muted,
                    cursor: watchLoading ? 'wait' : 'pointer',
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
                  {hasWatched ? 'Watched' : 'Watch'}
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

                <button
                  id="btn-review"
                  onClick={() => setReviewExpanded(!reviewExpanded)}
                  disabled={!hasWatched}
                  style={{
                    ...pillBtnBase,
                    background: hasReviewLocal ? '#0a1a0a' : '#141414',
                    borderColor: hasReviewLocal ? C.green : C.border,
                    color: hasReviewLocal ? C.green : C.muted,
                    opacity: hasWatched ? 1 : 0.5,
                    cursor: hasWatched ? 'pointer' : 'not-allowed',
                  }}
                  title={!hasWatched ? 'Watch the film to write a review' : ''}
                >
                  <FileText size={15} color={hasReviewLocal ? C.green : 'currentColor'} />
                  {hasReviewLocal ? 'Reviewed' : 'Review'}
                </button>
              </div>

              {/* Star rating */}
              <div
                id="rating-section"
                style={{
                  display: 'flex',
                  justifyContent: isNarrow ? 'center' : 'flex-start',
                  width: '100%',
                }}
              >
                {hasWatched ? (
                  <StarRating rating={pendingRating} setRating={handleRate} size="lg" />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isNarrow ? 'center' : 'flex-start',
                      gap: 4,
                    }}
                  >
                    <div style={{ pointerEvents: 'none', opacity: 0.4 }}>
                      <StarRating rating={0} setRating={() => {}} size="lg" />
                    </div>
                    <span style={{ color: C.dim, fontSize: 14 }}>Watch the film first</span>
                  </div>
                )}
              </div>

              {/* Review Composer */}
              {reviewExpanded && (
                <div
                  style={{
                    backgroundColor: '#0f0f0f',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Add a review..."
                    maxLength={1000}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '12px',
                      color: 'white',
                      fontSize: 14,
                      resize: 'vertical',
                      outline: 'none',
                      marginBottom: 12,
                    }}
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2" style={{ rowGap: isNarrow ? 8 : 4 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setReviewPrivate(!reviewPrivate)}
                        style={{
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: reviewPrivate ? C.muted : '#40bcf4',
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {reviewPrivate ? <Lock size={14} /> : <Globe size={14} />}
                        {reviewPrivate ? 'Private' : 'Visible to all'}
                      </button>
                      <button
                        onClick={() => setReviewSpoiler(!reviewSpoiler)}
                        style={{
                          background: reviewSpoiler ? 'rgba(251,191,36,0.15)' : 'none',
                          border: reviewSpoiler
                            ? '1px solid rgba(251,191,36,0.4)'
                            : '1px solid transparent',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: reviewSpoiler ? '#fbbf24' : C.muted,
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: '2px 8px',
                          transition: 'all 0.15s ease',
                        }}
                        title="Mark as spoiler — readers will need to click to reveal"
                      >
                        {reviewSpoiler ? 'Contains spoiler' : 'Spoiler?'}
                      </button>
                      <span style={{ color: C.dim, fontSize: 12 }}>{reviewBody.length} / 1000</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasReviewLocal && (
                        <button
                          onClick={handleDeleteReview}
                          disabled={reviewLoading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: C.orange,
                            fontSize: 13,
                            cursor: 'pointer',
                            padding: '6px 12px',
                            opacity: reviewLoading ? 0.5 : 1,
                          }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={handleSaveReview}
                        disabled={reviewLoading || !reviewBody.trim() || reviewBody.length > 1000}
                        style={{
                          background:
                            reviewBody.trim() && reviewBody.length <= 1000 ? '#40bcf4' : C.border,
                          color: reviewBody.trim() && reviewBody.length <= 1000 ? 'black' : C.muted,
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 16px',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor:
                            reviewBody.trim() && reviewBody.length <= 1000
                              ? 'pointer'
                              : 'not-allowed',
                          opacity: reviewLoading ? 0.5 : 1,
                        }}
                      >
                        {reviewLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#4a5568',
                  fontSize: 14,
                  flexWrap: 'wrap',
                  justifyContent: isNarrow ? 'center' : 'flex-start',
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

              {/* View reviews */}
              <button
                onClick={() => setShowAllReviews(true)}
                style={{
                  color: '#40bcf4',
                  fontSize: 14,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: isNarrow ? 'center' : 'left',
                  textDecoration: 'none',
                  width: '100%',
                  marginTop: 24,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                View reviews →
              </button>
            </div>

            {/* ── Column C: Histogram ── */}
            <div
              style={{
                width: isNarrow ? '100%' : '450px',
                flexShrink: isNarrow ? 1 : 0,
                minWidth: 0,
                paddingLeft: isNarrow ? '0' : '32px',
                borderTop: isNarrow ? '1px solid #1e1e1e' : 'none',
                paddingTop: isNarrow ? '24px' : '0',
              }}
            >
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
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  RATINGS
                </span>
                <span style={{ color: '#2e2e2e', fontSize: 14, textTransform: 'uppercase' }}>
                  {data.allRatings?.length || 0} FANS
                </span>
              </div>

              <div
                style={{
                  display: isNarrow ? 'flex' : 'block',
                  flexDirection: isNarrow ? 'row' : 'column',
                  alignItems: isNarrow ? 'flex-end' : 'stretch',
                  gap: isNarrow ? '12px' : '0',
                }}
              >
                {/* Average rating number */}
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#8a9bb0',
                    lineHeight: 1,
                    marginBottom: isNarrow ? 0 : 14,
                    width: isNarrow ? '60px' : 'auto',
                    flexShrink: 0,
                    textAlign: isNarrow ? 'center' : 'left',
                  }}
                >
                  {data.allRatings && data.allRatings.length > 4
                    ? (data.averageRating || 0).toFixed(1)
                    : '—'}
                </div>

                <div style={{ flex: 1, width: '100%' }}>
                  {/* Bars */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      height: isNarrow ? 60 : 100,
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
                            height: isNarrow ? `${hpx}%` : `${hpx}%`,
                            backgroundColor: isPeak ? '#5f5f5f' : '#1e1e1e',
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
                    <span style={{ color: '#4a5568', fontSize: 14 }}>0.5</span>
                    <span style={{ color: '#4a5568', fontSize: 14 }}>5.0</span>
                  </div>
                </div>
              </div>

              {/* Where to Watch & Trailer Header + JustWatch Widget */}
              <div
                style={{
                  marginTop: 32,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      color: C.muted,
                      fontSize: 14,
                      fontWeight: 400,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Where to Watch
                  </span>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      film.title + ' trailer'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: C.muted,
                      fontSize: 14,
                      fontWeight: 400,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                  >
                    <Play size={18} fill="currentColor" />
                    Trailer
                  </a>
                </div>
                
                {/* Horizontal line */}
                <div style={{ height: 1, backgroundColor: C.border, width: '100%' }} />

                <div style={{ marginTop: -16 }}>
                  <JustWatchWidget title={film.title} />
                </div>
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
        if (!data) return null;

        const getCount = (u: LeaderboardUser) =>
          selectedSeason && selectedSeason !== 'all'
            ? (u.seasonWatchCount ?? u.seasonWatchedCount ?? 0)
            : u.watchedCount;

        const lb = data.leaderboard
          ? [...data.leaderboard].sort((a, b) => getCount(b) - getCount(a))
          : [];

        const labels = lb.map((u) => u.name.split(' ')[0]); // first name only
        const lbCounts = lb.map((u) => getCount(u));
        const lbMax = Math.max(...lbCounts, 1);

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
              barThickness: isNarrow ? 20 : 28,
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
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: '#8a9bb0',
                font: { size: isNarrow ? 11 : 13 },
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
                font: { size: isNarrow ? 11 : 12 },
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

        const activeSeasonName = seasons.find((s) => s._id === selectedSeason)?.name;
        const displayLabel =
          selectedSeason && selectedSeason !== 'all' && activeSeasonName
            ? activeSeasonName
            : 'All Time';

        return (
          <>
            <div
              className="flex items-start justify-between"
              style={{
                marginTop: isNarrow ? 24 : 48,
                paddingTop: isNarrow ? 20 : 32,
                paddingBottom: 16,
              }}
            >
              <div>
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
                <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>
                  Showing: {displayLabel}
                </div>
              </div>
              <span style={{ color: C.dim, fontSize: 14 }}>{lb.length} members</span>
            </div>

            <SeasonSelector
              seasons={seasons}
              selected={selectedSeason}
              onChange={handleSeasonChange}
            />

            {lb.length > 0 ? (
              <div
                style={{
                  background: '#0f0f0f',
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  padding: isNarrow ? '16px' : '24px',
                  marginTop: 16,
                  position: 'relative',
                }}
              >
                {leaderboardLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15, 15, 15, 0.7)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-around',
                      borderRadius: '16px',
                      padding: isNarrow ? '16px' : '24px',
                      paddingBottom: isNarrow ? '40px' : '60px',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    {Array.from({ length: Math.min(8, lb.length || 8) }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse"
                        style={{
                          width: isNarrow ? 20 : 28,
                          height: `${30 + Math.random() * 70}%`,
                          backgroundColor: '#40bcf4',
                          opacity: 0.3,
                          borderRadius: 4,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div
                  style={{
                    width: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <div
                    style={{
                      height: isNarrow ? '240px' : '360px',
                      minWidth: `max(100%, ${lb.length * (isNarrow ? 32 : 40)}px)`,
                    }}
                  >
                    <Bar data={chartData} options={options as any} />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 mt-4"
                style={{
                  backgroundColor: C.card,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                }}
              >
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
                  <Trophy size={24} color={C.dim} />
                </div>
                <span style={{ color: C.muted, fontSize: 14 }}>
                  {selectedSeason && selectedSeason !== 'all'
                    ? 'No members on the leaderboard for this season yet'
                    : 'No members on the leaderboard yet'}
                </span>
              </div>
            )}
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          SECTION 3: PREVIOUS FILMS (archive grid)
      ══════════════════════════════════════════════════════ */}
      <>
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: isNarrow ? 24 : 48,
            paddingTop: isNarrow ? 20 : 32,
            paddingBottom: 16,
          }}
        >
          <div className="flex items-center gap-4">
            <span style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>Previous Films</span>
            {archiveLetterboxdUrl && (
              <a
                href={archiveLetterboxdUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'none',
                  border: '1px solid #1e1e1e',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  color: '#4a5568',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#8a9bb0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
              >
                Letterboxd List
              </a>
            )}
          </div>
          {previousFilms.length > 0 && (
            <span style={{ color: C.dim, fontSize: 14 }}>{previousFilms.length} films</span>
          )}
        </div>

        <SeasonSelector
          seasons={seasons}
          selected={selectedArchiveSeason}
          onChange={handleArchiveSeasonChange}
        />

        {archiveLoading ? (
          <div
            className="mt-4"
            style={{
              display: 'grid',
              gridTemplateColumns: isNarrow
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: isNarrow ? '12px' : '20px',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  backgroundColor: C.nested,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        ) : previousFilms.length > 0 ? (
          <div
            className="mt-4"
            style={{
              display: 'grid',
              gridTemplateColumns: isNarrow
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: isNarrow ? '12px' : '20px',
            }}
          >
            {previousFilms.map((af) => renderFlipCard(af))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 mt-4"
            style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}
          >
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
            <span style={{ color: C.muted, fontSize: 14 }}>
              {selectedArchiveSeason && selectedArchiveSeason !== 'all'
                ? 'No films in this season yet'
                : 'No previous films yet'}
            </span>
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
            alignItems: isNarrow ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isNarrow ? '0' : '16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedRating(null)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: isNarrow ? '20px 20px 0 0' : 20,
              maxWidth: isNarrow ? 'none' : '520px',
              width: isNarrow ? '100%' : '90vw',
              maxHeight: isNarrow ? '90vh' : '85vh',
              overflowY: 'auto',
              marginTop: isNarrow ? 'auto' : undefined,
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
                className="hover:text-white!"
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
                        <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>
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
            alignItems: isNarrow ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isNarrow ? '0' : '16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowMyActivity(false)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: isNarrow ? '20px 20px 0 0' : 20,
              maxWidth: isNarrow ? 'none' : '480px',
              width: isNarrow ? '100%' : '90vw',
              maxHeight: isNarrow ? '90vh' : '85vh',
              overflowY: 'auto',
              marginTop: isNarrow ? 'auto' : undefined,
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
              <div className="flex items-center gap-4">
                <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>Your Activity</span>
              </div>
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
                className="hover:text-white!"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 24 }}>
                <SeasonSelector
                  seasons={seasons}
                  selected={activitySeasonId}
                  onChange={setActivitySeasonId}
                />
              </div>
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

                      <span style={{ fontSize: 13, textTransform: 'uppercase', color: C.dim }}>
                        Films Watched
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: '#f5c518',
                          display: 'block',
                        }}
                      >
                        {myActivity.currentStreak || 0}
                      </span>
                      <span style={{ fontSize: 13, textTransform: 'uppercase', color: C.dim }}>
                        Current Streak
                      </span>
                    </div>
                    <div>
                      <span
                        style={{ fontSize: 24, fontWeight: 700, color: 'white', display: 'block' }}
                      >
                        {myActivity.longestStreak || 0}
                      </span>
                      <span style={{ fontSize: 13, textTransform: 'uppercase', color: C.dim }}>
                        Longest Streak
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
            alignItems: isNarrow ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isNarrow ? '0' : '16px',
            overflowY: 'auto',
          }}
          onClick={() => setViewingUser(null)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: isNarrow ? '20px 20px 0 0' : 20,
              maxWidth: isNarrow ? 'none' : '480px',
              width: isNarrow ? '100%' : '90vw',
              maxHeight: isNarrow ? '90vh' : '85vh',
              overflowY: 'auto',
              marginTop: isNarrow ? 'auto' : undefined,
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
                    <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>
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
                className="hover:text-white!"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 24 }}>
                <SeasonSelector
                  seasons={seasons}
                  selected={activitySeasonId}
                  onChange={setActivitySeasonId}
                />
              </div>
              {renderActivityBody(userActivity, userActivityLoading)}
            </div>
          </div>
        </div>
      )}

      {/* ── All Reviews Modal ───────────────────────────────── */}
      {showAllReviews && data?.publicReviews && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 50,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowAllReviews(false)}
        >
          <div
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: isMobile ? '20px 20px 0 0' : 20,
              maxWidth: isMobile ? 'none' : '800px',
              width: isMobile ? '100%' : '90vw',
              maxHeight: isMobile ? '90vh' : '92vh',
              overflowY: 'auto',
              marginTop: isMobile ? 'auto' : undefined,
              display: 'flex',
              flexDirection: 'column',
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
                position: 'sticky',
                top: 0,
                backgroundColor: C.card,
                zIndex: 2,
              }}
            >
              <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                {data.publicReviews.length} {data.publicReviews.length === 1 ? 'Review' : 'Reviews'}{' '}
                for {data.currentFilm?.title}
              </span>
              <button
                onClick={() => setShowAllReviews(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
                className="hover:text-white!"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="space-y-4">
                {data.publicReviews.map((review, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#0f0f0f',
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: C.nested,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {review.image ? (
                          <Image
                            src={review.image}
                            alt={review.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-sm font-medium text-white"
                            style={{ backgroundColor: avatarBg(review.name) }}
                          >
                            {review.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          style={{
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 500,
                            display: 'block',
                          }}
                        >
                          {review.name}
                        </span>
                        <span style={{ color: C.dim, fontSize: 12 }}>
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        color: '#e2e8f0',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {review.body}
                    </p>
                  </div>
                ))}
              </div>
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
