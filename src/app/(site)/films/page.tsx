'use client';

import { useEffect, useState, useMemo } from 'react';
import { Instrument_Serif } from 'next/font/google';
import FilmCard from '@/components/FilmCard';
import FiltersBar from '@/components/FiltersBar';
import LoadingScreen from '@/components/LoadingScreen';
import { IFilm } from '@/models/Film';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function FilmsPage() {
  const [films, setFilms] = useState<IFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filters
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(['clubFilm']); // default
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['released']);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilms() {
      const res = await fetch('/api/films');
      const data: IFilm[] = await res.json();
      setFilms(data);
      setLoading(false);
    }
    fetchFilms();
  }, []);

  const uniqueYears = useMemo(
    () =>
      Array.from(new Set(films.map((f) => new Date(f.date).getFullYear().toString())))
        .sort()
        .reverse(),
    [films]
  );

  const filteredFilms = useMemo(() => {
    return films
      .filter((film) => {
        // Origin filter
        const originMatch =
          selectedOrigins.length === 0 || selectedOrigins.includes(film.origin || 'clubFilm');

        // Status filter
        const statusMatch =
          selectedStatuses.length === 0 || selectedStatuses.includes(film.status || 'released');

        // Year filter
        const yearMatch = selectedYear
          ? new Date(film.date).getFullYear().toString() === selectedYear
          : true;

        // Search filter
        const search = searchTerm.toLowerCase();
        const searchMatch =
          film.title.toLowerCase().includes(search) ||
          film.description?.toLowerCase().includes(search) ||
          (film.tags || []).some((t) => t.toLowerCase().includes(search));

        return originMatch && statusMatch && yearMatch && searchMatch;
      })
      .sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [films, selectedOrigins, selectedYear, selectedStatuses, searchTerm, sortOrder]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16">
      <div className="mb-24 mx-2">
        <h1 className={`text-9xl mb-4 ${instrument.className}`}>Our Films</h1>
      </div>

      <FiltersBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedOrigins={selectedOrigins}
        setSelectedOrigins={setSelectedOrigins}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        uniqueYears={uniqueYears}
      />

      <div className="space-y-28">
        {filteredFilms.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </div>
  );
}
