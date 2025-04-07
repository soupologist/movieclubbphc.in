import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const films = [
  {
    id: 1,
    title: "Our Narrow Slice",
    credits: "A film by Pranay Vajrapu, Sai Ashish Vure, Advik Kulkarni",
    date: "November 12, 2024",
    description:
      "A space enthusiast desires to capture a rare astronomical phenomenon, a comet seen only once in every 83 years.",
    notes: [
      "The path followed by the main character was traced out and rehearsed for days before the final shoot.",
    ],
    image: "/images/full-poster.jpg",
    link: "https://youtu.be/DW6HONyici0",
    awards: [
      {
        title: "1st Place",
        details: "Drishya '25 - Chalchitra Film Festival - IIT Guwahati",
      },
      { title: "2nd Place", details: "SHO(R)T - BITS Goa" },
    ],
  },
  {
    id: 2,
    title: "VOLTOV",
    credits: "A film by Shubh Tripathi, Pranay Vajrapu, Sai Ashish Vure",
    date: "February 5, 2024",
    description:
      "A short film shot in one continuous shot on an iPhone 12, showing the continuous cycle of self-destruction from one's actions and their consequences.",
    notes: [
      "This film was screened for Pearl Inaug in the auditorium for Pearl '24",
    ],
    image: "/images/poster.png",
    link: "https://example.com/voltov",
    awards: [
      {
        title: "Best Editing",
        details: "Chalchitra Short Film Festival 2025 - UPES Dehradun",
      },
      { title: "Wise Owl Critic's Prize", details: "Talking Films Online" },
      {
        title: "Best Phone Film",
        details:
          "Kaleidoscope '24 - Catharsis Film Festival 2024 - BITS Hyderabad",
      },
    ],
  },
  {
    id: 3,
    title: "VENDETTA",
    credits: "A film by Tejasvi Karri, Rishi Nair, Shreya Meher",
    date: "April 2024",
    description:
      "This is the third film description, highlighting the artistic direction and storytelling elements.",
    notes: [],
    image: "/images/POSTER1.png",
    link: "https://example.com/vendetta",
    awards: [],
  },
];

export default function FilmsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-16 space-y-40">
      {/* Large title aligned to the left */}
      <div className="mb-20">
        <h1 className={`${instrument.className} text-8xl text-center ml-8`}>
          Our Films
        </h1>
      </div>

      {films.map((film) => (
        <Link key={film.id} href={`/films/${film.id}`} className="block group">
          <div className="relative flex flex-col md:flex-row items-start gap-16 px-12 cursor-pointer group-hover:opacity-90 transition-opacity duration-300">
            {/* Poster on the left (smaller) */}
            <div className="relative w-full md:w-1/3 z-10">
              <Image
                src={film.image}
                alt={film.title}
                width={400}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Film Info on the right */}
            <div className="relative flex-1 z-10 space-y-9">
              <div className="space-y-3">
                <h2 className="text-5xl font-bold font-gotham mb-4">
                  {film.title}
                </h2>
                <p className="text-lg text-gray-300">{film.credits}</p>
                <p className="text-md text-gray-400 italic mt-2 mb-4">
                  Released on {film.date}
                </p>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed">
                {film.description}
              </p>

              {/* Awards Section */}
              {film.awards.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-3xl font-light font-gotham mb-4 text-yellow-100">
                    AWARDS
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    {film.awards.map((award, index) => (
                      <li key={index}>
                        <span className="font-bold">{award.title}</span> -{" "}
                        {award.details}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes Section */}
              {film.notes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-3xl font-light font-gotham mb-4 text-blue-200">
                    NOTES
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    {film.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
