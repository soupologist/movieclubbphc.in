'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MessageCircle, ArrowLeft } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

interface ArchiveFilm {
  _id: string;
  title: string;
  posterUrl: string;
  driveLink: string;
  createdAt: string;
  ratingsCount: number;
  averageRating: number;
  commentsCount: number;
}

export default function FOTWArchivePage() {
  const [films, setFilms] = useState<ArchiveFilm[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center gap-4 mb-12">
        <Link
          href="/club/filmoftheweek"
          className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-5xl font-gotham font-bold text-white uppercase tracking-tight">
            FOTW Archive
          </h1>
          <p className="text-zinc-500 mt-2">Explore previous films</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {films.map((film) => (
          <div
            key={film._id}
            className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-300 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-900/50"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden">
              <Image
                src={film.posterUrl}
                alt={film.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <a
                    href={film.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded font-bold transition-colors"
                  >
                    Watch
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-white mb-2 line-clamp-2">{film.title}</h3>
              <p className="text-xs text-zinc-500 mb-3">
                {new Date(film.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">
                    {film.averageRating > 0 ? film.averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-zinc-500">({film.ratingsCount})</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <MessageCircle size={16} />
                  <span>{film.commentsCount}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {films.length === 0 && (
        <div className="text-center text-zinc-500 py-20">
          <p>No films in the archive yet.</p>
        </div>
      )}
    </div>
  );
}
