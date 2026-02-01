'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import CommentSection from './CommentSection';
import { ExternalLink, Trophy } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';

interface FOTWData {
  currentFilm: {
    _id: string;
    title: string;
    posterUrl: string;
    driveLink: string;
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
}

export default function FOTWDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<FOTWData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    fetch('/api/fotw/data')
      .then((res) => res.json())
      .then((d) => {
        // Ensure all required fields are present
        setData({
          ...d,
          leaderboard: d.leaderboard || [],
          allRatings: d.allRatings || [],
          averageRating: d.averageRating || 0,
        });
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

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
        // Optimistic update
        setData((prev) =>
          prev
            ? {
                ...prev,
                userRating: rating,
                leaderboard: prev.leaderboard || [],
              }
            : null
        );
        // Reload data to reflect leaderboard changes
        fetch('/api/fotw/data')
          .then((res) => res.json())
          .then((d) => setData(d));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRateLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className={`text-6xl font-bold text-white tracking-tight ${instrumentSerif.className}`}>
            Film of the Week
          </h1>
          <p className="text-zinc-500 mt-2">Watch, Rate & Discuss</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/club/filmoftheweek/archive"
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-zinc-900/50"
          >
            Archive
          </Link>
          {data?.isAdmin && (
            <Link
              href="/club/filmoftheweek/admin"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-red-900/50"
            >
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Film & Rating */}
        <div className="flex flex-col">
          {data?.currentFilm ? (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl hover:shadow-zinc-900/80 transition-shadow duration-300">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image
                  src={data.currentFilm.posterUrl}
                  alt={data.currentFilm.title}
                  fill
                  className="object-contain bg-black"
                  unoptimized
                />
              </div>
              <div className="p-6 bg-gradient-to-b from-zinc-900/50 to-zinc-900">
                <h2 className="text-3xl font-bold text-white mb-4">{data.currentFilm.title}</h2>

                {/* Average Rating Display */}
                {data.averageRating > 0 && (
                  <div className="mb-6 p-4 bg-black/30 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-yellow-400">
                          {data.averageRating.toFixed(1)}
                        </span>
                        <span className="text-2xl text-zinc-400">/5</span>
                      </div>
                      <div className="text-sm text-zinc-400 border-l border-zinc-700 pl-4">
                        <div className="font-semibold text-white">
                          {data.allRatings?.length || 0}
                        </div>
                        <div className="text-xs uppercase tracking-wider">Ratings</div>
                      </div>
                    </div>
                  </div>
                )}

                <a
                  href={data.currentFilm.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-bold mb-8 transition-all duration-200 shadow-lg hover:shadow-blue-900/50 hover:scale-105"
                >
                  <ExternalLink size={20} />
                  Watch on Drive
                </a>

                <div className="border-t border-zinc-700 pt-6">
                  <h3 className="text-xl font-bold text-zinc-300 mb-4">
                    {data.userRating ? 'Your Rating' : 'Rate this Film'}
                  </h3>

                  <div className="flex items-center gap-4">
                    <StarRating
                      rating={data.userRating || rating}
                      setRating={!data.userRating ? setRating : undefined}
                      readonly={!!data.userRating}
                    />
                    {data.userRating && (
                      <span className="text-yellow-400 font-bold text-lg">{data.userRating}/5</span>
                    )}
                  </div>

                  {!data.userRating && (
                    <button
                      onClick={handleRate}
                      disabled={rateLoading || rating === 0}
                      className="mt-6 w-full bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rateLoading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  )}
                  {data.userRating && (
                    <p className="mt-4 text-green-400">
                      Thanks for watching! Your view has been counted on the leaderboard.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-zinc-900 rounded-lg">
              <p className="text-gray-400">No film currently active.</p>
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800 flex-shrink-0">
            <Trophy className="text-yellow-500" size={32} />
            <h2 className="text-2xl font-bold text-white">
              Leaderboard
            </h2>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
            {data?.leaderboard &&
              data.leaderboard.map((user, index) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                    index < 3
                      ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700 shadow-lg'
                      : 'bg-zinc-900/50 border-b border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-bold w-8 text-center ${
                        index === 0
                          ? 'text-yellow-400'
                          : index === 1
                            ? 'text-zinc-300'
                            : index === 2
                              ? 'text-amber-700'
                              : 'text-zinc-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700">
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
                    <div>
                      <p className="font-bold text-white">{user.name}</p>
                      {/* Hide email for privacy, maybe show masked? */}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-white">{user.ratingsCount}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Films</span>
                  </div>
                </div>
              ))}

            {(!data?.leaderboard || data.leaderboard.length === 0) && (
              <p className="text-gray-400 text-center py-8">No stats yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Member Ratings Section */}
      {data?.currentFilm && data.allRatings && data.allRatings.length > 0 && (
        <div className="mt-12 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-6">
            Member Ratings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.allRatings.map((rating) => (
              <div
                key={rating._id}
                className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
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
                  <p className="font-bold text-white text-sm">
                    {rating.userId?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-yellow-400">{rating.rating}</span>
                  <span className="text-sm text-zinc-400">/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Section */}
      {data?.currentFilm && session?.user && (
        <CommentSection
          filmId={data.currentFilm._id}
          currentUserEmail={session.user.email || ''}
          currentUserName={session.user.name || 'Anonymous'}
        />
      )}
    </div>
  );
}
