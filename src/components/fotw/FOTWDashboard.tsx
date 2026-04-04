'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import CommentSection from './CommentSection';
import {
  ExternalLink,
  Trophy,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Film,
  Clock,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';

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
    userId: {
      name: string;
      image?: string;
    };
    createdAt: string;
  }[];
  averageRating: number;
  watchedCount: number;
}

export default function FOTWDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<FOTWData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [rateLoading, setRateLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAllRatings, setShowAllRatings] = useState(false);

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
        });
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRate = async () => {
    if (!data?.currentFilm || rating === 0) return;
    setRateLoading(true);
    try {
      const res = await fetch('/api/fotw/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmId: data.currentFilm._id,
          rating,
        }),
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                userRating: rating,
                watchedCount: prev.watchedCount + 1,
              }
            : null
        );
        // Reload data to reflect all changes
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRateLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const film = data?.currentFilm;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1
            className={`text-5xl sm:text-6xl font-bold text-white tracking-tight ${instrumentSerif.className}`}
          >
            Film of the Week
          </h1>
          <p className="text-zinc-500 mt-1 text-sm tracking-wide uppercase">
            Watch · Rate · Discuss
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/club/filmoftheweek/archive"
            className="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <Clock size={16} />
              Archive
            </span>
          </Link>
          {data?.isAdmin && (
            <Link
              href="/club/filmoftheweek/admin"
              className="bg-red-950/60 hover:bg-red-900/60 border border-red-900/50 hover:border-red-700/50 text-red-400 hover:text-red-300 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      {film ? (
        <>
          {/* ───── Hero Film Card ───── */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-950">
            {/* Background blur */}
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={film.posterUrl}
                alt=""
                fill
                className="object-cover blur-3xl opacity-15 scale-110"
                unoptimized
              />
            </div>

            <div className="relative flex flex-col md:flex-row gap-8 p-6 md:p-10">
              {/* Poster */}
              <div className="flex-shrink-0 w-full md:w-72 lg:w-80">
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/5">
                  <Image
                    src={film.posterUrl}
                    alt={film.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Film Info */}
              <div className="flex-grow flex flex-col justify-between min-w-0">
                <div>
                  {/* Title */}
                  <h2
                    className={`text-4xl md:text-5xl font-bold text-white leading-tight mb-4 ${instrumentSerif.className}`}
                  >
                    {film.title}
                  </h2>

                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {film.chosenBy && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/30 text-amber-400 px-3 py-1.5 rounded-lg text-sm">
                        <Users size={14} />
                        Chosen by <span className="font-semibold">{film.chosenBy}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-blue-950/40 border border-blue-800/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm">
                      <Eye size={14} />
                      <span className="font-semibold">{data.watchedCount}</span>{' '}
                      {data.watchedCount === 1 ? 'person' : 'people'} watched
                    </span>
                    {film.createdAt && (
                      <span className="inline-flex items-center gap-1.5 bg-zinc-800/40 border border-zinc-700/30 text-zinc-400 px-3 py-1.5 rounded-lg text-sm">
                        <Clock size={14} />
                        {new Date(film.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Average Rating */}
                  {data.averageRating > 0 && (
                    <div className="mb-8">
                      <div className="flex items-end gap-3">
                        <span className="text-6xl font-bold text-yellow-400 leading-none">
                          {data.averageRating.toFixed(1)}
                        </span>
                        <div className="pb-1">
                          <div className="flex mb-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={18}
                                className={
                                  i <= Math.round(data.averageRating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-zinc-700'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-zinc-500 text-sm">
                            {data.allRatings?.length || 0} ratings
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA & Rating */}
                <div className="space-y-6">
                  <a
                    href={film.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-white hover:bg-zinc-100 text-black px-7 py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-white/5 hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ExternalLink size={18} />
                    Watch on Drive
                  </a>

                  {/* Your Rating */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 border border-zinc-800/50">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                      {data.userRating ? 'Your Rating' : 'Rate this Film'}
                    </h3>

                    <div className="flex items-center gap-4">
                      <StarRating
                        rating={data.userRating || rating}
                        setRating={!data.userRating ? setRating : undefined}
                        readonly={!!data.userRating}
                      />
                      {data.userRating && (
                        <span className="text-yellow-400 font-bold text-xl">
                          {data.userRating}/5
                        </span>
                      )}
                    </div>

                    {!data.userRating && (
                      <button
                        onClick={handleRate}
                        disabled={rateLoading || rating === 0}
                        className="mt-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-2.5 px-8 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm"
                      >
                        {rateLoading ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    )}
                    {data.userRating && (
                      <p className="mt-3 text-emerald-500/80 text-sm flex items-center gap-1.5">
                        <Eye size={14} />
                        Your watch has been counted on the leaderboard.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───── Ratings Distribution ───── */}
          {data.allRatings && data.allRatings.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowAllRatings(!showAllRatings)}
                className="w-full flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/60 rounded-2xl px-6 py-4 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-semibold text-white">Ratings Breakdown</span>
                  <span className="text-zinc-500 text-sm">
                    {data.allRatings.length} {data.allRatings.length === 1 ? 'rating' : 'ratings'}
                  </span>
                </div>
                {showAllRatings ? (
                  <ChevronUp size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
                ) : (
                  <ChevronDown size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
                )}
              </button>

              {showAllRatings && (
                <div className="mt-2 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((starValue) => {
                      const count = data.allRatings.filter((r) => r.rating === starValue).length;
                      const percentage = (count / data.allRatings.length) * 100;
                      const allCounts = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((v) =>
                        data.allRatings.filter((r) => r.rating === v).length
                      );
                      const maxCount = Math.max(...allCounts);
                      const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div key={starValue} className="group">
                          <div className="flex items-center gap-4">
                            {/* Star label */}
                            <div className="flex items-center gap-1 w-28 flex-shrink-0">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => {
                                  const fillValue = starValue - i;
                                  return (
                                    <span key={i} className="relative text-base">
                                      {fillValue >= 1 ? (
                                        <span className="text-yellow-400">★</span>
                                      ) : fillValue === 0.5 ? (
                                        <>
                                          <span className="text-zinc-700">★</span>
                                          <span
                                            className="absolute left-0 top-0 overflow-hidden text-yellow-400"
                                            style={{ width: '50%' }}
                                          >
                                            ★
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-zinc-800">★</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bar */}
                            <div
                              onClick={() => count > 0 && setSelectedRating(starValue)}
                              className={`flex-grow relative h-6 bg-zinc-900/60 rounded-full overflow-hidden transition-colors ${
                                count > 0
                                  ? 'cursor-pointer group-hover:bg-zinc-800/60'
                                  : 'cursor-default'
                              }`}
                            >
                              <div
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-500/70 to-yellow-400/70 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${barWidth}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold z-10">
                                <span className={count > 0 ? 'text-white/90' : 'text-zinc-600'}>
                                  {count > 0 && count}
                                </span>
                                {count > 0 && (
                                  <span className="text-white/60">{percentage.toFixed(0)}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───── Leaderboard (Collapsible) ───── */}
          <div className="mt-6">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/60 rounded-2xl px-6 py-4 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Trophy size={20} className="text-yellow-500" />
                <span className="text-lg font-semibold text-white">Leaderboard</span>
                {data?.leaderboard && data.leaderboard.length > 0 && (
                  <span className="text-zinc-500 text-sm">
                    {data.leaderboard.length} {data.leaderboard.length === 1 ? 'member' : 'members'}
                  </span>
                )}
              </div>
              {showLeaderboard ? (
                <ChevronUp size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
              )}
            </button>

            {showLeaderboard && (
              <div className="mt-2 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  {data?.leaderboard &&
                    data.leaderboard.map((user, index) => (
                      <div
                        key={user._id}
                        className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                          index < 3
                            ? 'bg-zinc-800/40 border border-zinc-700/40'
                            : 'hover:bg-zinc-800/20'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`text-lg font-bold w-7 text-center ${
                              index === 0
                                ? 'text-yellow-400'
                                : index === 1
                                  ? 'text-zinc-300'
                                  : index === 2
                                    ? 'text-amber-700'
                                    : 'text-zinc-600'
                            }`}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </span>
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-700 ring-1 ring-white/5">
                            {user.image && (
                              <Image
                                src={user.image}
                                alt={user.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <span className="font-medium text-white text-sm">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Film size={14} className="text-zinc-500" />
                          <span className="text-lg font-bold text-white">{user.ratingsCount}</span>
                        </div>
                      </div>
                    ))}

                  {(!data?.leaderboard || data.leaderboard.length === 0) && (
                    <p className="text-zinc-500 text-center py-6 text-sm">No stats yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ───── Rating Detail Modal ───── */}
          {selectedRating !== null && data?.allRatings && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedRating(null)}
            >
              <div
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => {
                        const fillValue = selectedRating - i;
                        return (
                          <span key={i} className="relative text-xl">
                            {fillValue >= 1 ? (
                              <span className="text-yellow-400">★</span>
                            ) : fillValue === 0.5 ? (
                              <>
                                <span className="text-zinc-700">★</span>
                                <span
                                  className="absolute left-0 top-0 overflow-hidden text-yellow-400"
                                  style={{ width: '50%' }}
                                >
                                  ★
                                </span>
                              </>
                            ) : (
                              <span className="text-zinc-700">★</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-lg font-bold text-white">
                      {data.allRatings.filter((r) => r.rating === selectedRating).length}{' '}
                      {data.allRatings.filter((r) => r.rating === selectedRating).length === 1
                        ? 'rating'
                        : 'ratings'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedRating(null)}
                    className="text-zinc-500 hover:text-white transition-colors text-xl w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  {data.allRatings
                    .filter((r) => r.rating === selectedRating)
                    .map((rating) => (
                      <div
                        key={rating._id}
                        className="flex items-center gap-3 p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/40"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0 ring-1 ring-white/5">
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
                        <div className="flex-grow">
                          <p className="font-medium text-white text-sm">
                            {rating.userId?.name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ───── Discussion ───── */}
          {session?.user && (
            <CommentSection
              filmId={film._id}
              currentUserEmail={session.user.email || ''}
              currentUserName={session.user.name || 'Anonymous'}
            />
          )}
        </>
      ) : (
        <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
          <Film size={48} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">No film currently active.</p>
          <p className="text-zinc-600 text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </div>
  );
}
