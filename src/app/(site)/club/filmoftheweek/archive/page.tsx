'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MessageCircle, ArrowLeft, Eye, Users, X, ExternalLink } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { instrumentSerif } from '@/app/fonts';

interface ArchiveFilm {
  _id: string;
  title: string;
  posterUrl: string;
  driveLink: string;
  createdAt: string;
  ratingsCount: number;
  watchedCount: number;
  averageRating: number;
  commentsCount: number;
  chosenBy?: string;
}

export default function FOTWArchivePage() {
  const [films, setFilms] = useState<ArchiveFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState<ArchiveFilm | null>(null);

  useEffect(() => {
    fetch('/api/fotw/archive')
      .then((res) => res.json())
      .then((data) => setFilms(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/club/filmoftheweek"
          className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800/60 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1
            className={`text-4xl sm:text-5xl font-bold text-white tracking-tight ${instrumentSerif.className}`}
          >
            Archive
          </h1>
          <p className="text-zinc-600 mt-1 text-sm">
            {films.length} {films.length === 1 ? 'film' : 'films'} featured
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {films.map((film, index) => (
          <div
            key={film._id}
            onClick={() => setSelectedFilm(film)}
            className="cursor-pointer group"
          >
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-white/15 transition-all duration-300">
              <Image
                src={film.posterUrl}
                alt={film.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-white">
                        {film.averageRating > 0 ? film.averageRating.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="flex items-center gap-0.5">
                        <Eye size={11} />
                        {film.watchedCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={11} />
                        {film.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Week number badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Current
                </div>
              )}
            </div>

            <div className="mt-2 px-0.5">
              <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-zinc-200 transition-colors">
                {film.title}
              </h3>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {new Date(film.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {film.chosenBy && (
                  <span>
                    {' '}
                    · <span className="text-zinc-500">{film.chosenBy}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {films.length === 0 && (
        <div className="text-center text-zinc-600 py-24">
          <p className="text-sm">No films in the archive yet.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFilm && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFilm(null)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content */}
            <div className="relative">
              {/* Background blur header */}
              <div className="absolute inset-0 h-48 overflow-hidden rounded-t-2xl">
                <Image
                  src={selectedFilm.posterUrl}
                  alt=""
                  fill
                  className="object-cover blur-3xl opacity-20 scale-125"
                  unoptimized
                />
              </div>

              {/* Close */}
              <button
                onClick={() => setSelectedFilm(null)}
                className="absolute top-4 right-4 z-20 text-zinc-500 hover:text-white transition-colors w-8 h-8 rounded-lg hover:bg-zinc-800/60 flex items-center justify-center"
              >
                <X size={18} />
              </button>

              <div className="relative flex flex-col sm:flex-row gap-6 p-6">
                {/* Poster */}
                <div className="flex-shrink-0 w-40 sm:w-48">
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <Image
                      src={selectedFilm.posterUrl}
                      alt={selectedFilm.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow">
                  <h2
                    className={`text-3xl font-bold text-white mb-3 ${instrumentSerif.className}`}
                  >
                    {selectedFilm.title}
                  </h2>

                  {/* Meta */}
                  <div className="space-y-2 mb-6">
                    <p className="text-zinc-500 text-sm">
                      {new Date(selectedFilm.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {selectedFilm.chosenBy && (
                      <p className="text-sm text-amber-400/80 flex items-center gap-1.5">
                        <Users size={14} />
                        Chosen by{' '}
                        <span className="font-semibold">{selectedFilm.chosenBy}</span>
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-2xl font-bold text-white">
                          {selectedFilm.averageRating > 0
                            ? selectedFilm.averageRating.toFixed(1)
                            : '—'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 uppercase tracking-wider">
                        Avg Rating
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Eye size={16} className="text-blue-400" />
                        <span className="text-2xl font-bold text-white">
                          {selectedFilm.watchedCount}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 uppercase tracking-wider">
                        Watched
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MessageCircle size={16} className="text-zinc-400" />
                        <span className="text-2xl font-bold text-white">
                          {selectedFilm.commentsCount}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 uppercase tracking-wider">
                        Comments
                      </span>
                    </div>
                  </div>

                  {/* Watch button */}
                  <a
                    href={selectedFilm.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm"
                  >
                    <ExternalLink size={16} />
                    Watch on Drive
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
