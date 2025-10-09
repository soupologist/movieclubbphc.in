// app/films/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Instrument_Serif } from 'next/font/google';
import FilmCard from '../../../components/FilmCard';
import FiltersBar from '../../../components/FiltersBar';
import LoadingScreen from '../../../components/LoadingScreen';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

interface Film {
  _id: string;
  id: string;
  title: string;
  background: string;
  generalCredits: string[];
  credits: { title: string; names: string[] }[];
  date: string;
  poster: string;
  description: string;
  awards: { title: string; details: string }[];
  tags?: string[];
}

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilms() {
      const res = await fetch('/api/films');
      const data = await res.json();
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

  const uniqueCredits = useMemo(
    () => Array.from(new Set(films.flatMap((f) => f.generalCredits))).sort(),
    [films]
  );

  const filteredFilms = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return films
      .filter((film) => {
        const matchesSearch =
          film.title.toLowerCase().includes(search) ||
          film.generalCredits.some((credit) => credit.toLowerCase().includes(search));
        const matchesYear = selectedYear
          ? new Date(film.date).getFullYear().toString() === selectedYear
          : true;
        const matchesCredit = selectedCredit ? film.generalCredits.includes(selectedCredit) : true;
        return matchesSearch && matchesYear && matchesCredit;
      })
      .sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [films, searchTerm, sortOrder, selectedYear, selectedCredit]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16">
      <div className="mb-24 mx-2">
        <h1 className={`text-9xl mb-10 ${instrument.className}`}>Our Films</h1>
      </div>

      <FiltersBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedCredit={selectedCredit}
        setSelectedCredit={setSelectedCredit}
        uniqueYears={uniqueYears}
        uniqueCredits={uniqueCredits}
      />

      <div className="space-y-28">
        {filteredFilms.map((film) => (
          <FilmCard key={film._id} film={film} />
        ))}
      </div>
    </div>
  );
}
