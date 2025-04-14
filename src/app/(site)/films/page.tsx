// app/films/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ChevronDown } from "lucide-react";

function StyledSelect({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full bg-transparent border border-white text-white px-4 py-2 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-white font-gotham"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
    </div>
  );
}

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
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
}

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilms() {
      const res = await fetch("/api/films");
      const data = await res.json();
      setFilms(data);
      setLoading(false);
    }
  
    fetchFilms();
  }, []);

  const uniqueYears = Array.from(new Set(films.map((f) => new Date(f.date).getFullYear().toString()))).sort().reverse();
  const uniqueCredits = Array.from(
    new Set(films.flatMap((f) => f.generalCredits))
  ).sort();

  const filteredFilms = films
  .filter((film) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      film.title.toLowerCase().includes(search) ||
      film.generalCredits.some((credit) => credit.toLowerCase().includes(search));

    const matchesYear = selectedYear ? new Date(film.date).getFullYear().toString() === selectedYear : true;
    const matchesCredit = selectedCredit ? film.generalCredits.includes(selectedCredit) : true;

    return matchesSearch && matchesYear && matchesCredit;
  })
  .sort((a, b) =>
    sortOrder === "newest"
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-white mb-6" />
        <p className="text-lg tracking-wide font-gotham">Loading Films...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16">

      <div className="mb-24 mx-2">
        <h1 className={`text-9xl mb-10 ${instrument.className}`}>Our Films</h1>
      </div>

      <div className="px-4 md:px-4 mb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-white font-gotham">
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search films..."
          className="w-full md:w-1/2 bg-transparent border border-white placeholder-gray-400 px-5 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Dropdowns (Stacked on mobile, inline on desktop) */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
          
          <StyledSelect value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")} className="w-full sm:w-auto">
            <option className="text-black" value="newest">Newest</option>
            <option className="text-black" value="oldest">Oldest</option>
          </StyledSelect>

          <StyledSelect value={selectedYear || ""} onChange={(e) => setSelectedYear(e.target.value || null)} className="w-full sm:w-auto">
            <option className="text-black" value="">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} className="text-black" value={year}>
                {year}
              </option>
            ))}
          </StyledSelect>

          <StyledSelect value={selectedCredit || ""} onChange={(e) => setSelectedCredit(e.target.value || null)} className="w-full sm:w-auto">
            <option className="text-black" value="">All Credits</option>
            {uniqueCredits.map((credit) => (
              <option key={credit} className="text-black" value={credit}>
                {credit}
              </option>
            ))}
          </StyledSelect>
        </div>
      </div>

      </div>


      <div className="space-y-28">
        {filteredFilms.map((film) => (
          <Link key={film._id} href={`/films/${film.id}`} className="block group">
            <div className="relative flex flex-col md:flex-row items-start gap-12 md:gap-20 cursor-pointer group-hover:opacity-90 transition-opacity duration-300 overflow-hidden rounded-s px-4 py-16">
              {/* Background Video */}
              {film.background?.trim() !== "" && (
                <video
                  src={film.background}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="none"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 z-0 pointer-events-none"
                />
              )}

              {/* Foreground Content */}
              <div className="relative w-full md:w-1/3 z-10">
                <Image
                  src={film.poster}
                  alt={film.title}
                  width={400}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="relative flex-1 z-10 space-y-6 md:space-y-8">
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-4xl md:text-5xl font-semibold font-gotham">
                    {film.title}
                  </h2>
                  <p className="text-lg text-gray-300">
                    A film by {film.generalCredits?.join(", ")}
                  </p>
                  <p className="text-md text-gray-400 italic">
                    Released on {film.date}
                  </p>
                </div>

                <p className="text-lg text-gray-300 leading-relaxed line-clamp-4">
                  {film.description}
                </p>

                {film.awards?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-2xl font-light font-gotham mb-2 text-yellow-100">
                      AWARDS
                    </h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {film.awards.map((award, index) => (
                        <li key={index}>
                          <span className="font-bold">{award.title}</span> - {award.details}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <span className="inline-block mt-2 px-5 py-2 border border-white text-white text-sm tracking-wide uppercase hover:bg-white hover:text-black transition">
                    Read More
                  </span>
                </div>
              </div>
            </div>
            
          </Link>
        ))}
      </div>
    </div>
  );
}
