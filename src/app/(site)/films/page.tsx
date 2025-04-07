import dbConnect from "@/lib/dbConnect";
import FilmModel from "@/models/Film";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function FilmsPage() {
  await dbConnect();
  const rawFilms = await FilmModel.find({}).lean();

  // Convert to plain objects and strip nested _id fields
  const films = rawFilms.map((film) => ({
    ...film,
    _id: film._id.toString(), // serialize top-level _id
    credits: film.credits?.map((credit) => ({
      title: credit.title,
      names: credit.names,
    })) || [],
    awards: film.awards?.map((award) => ({
      title: award.title,
      details: award.details,
    })) || [],
  }));

  return (
    <div className="min-h-screen bg-black text-white p-16 space-y-40">
      <div className="mb-20">
        <h1 className={`${instrument.className} text-9xl text-center ml-4`}>
          Our Films
        </h1>
      </div>

      {films.map((film) => (
        <Link key={film._id} href={`/films/${film.id}`} className="block group">
          <div className="relative flex flex-col md:flex-row items-start gap-16 px-3 cursor-pointer group-hover:opacity-90 transition-opacity duration-300">
            <div className="relative w-full md:w-1/3 z-10">
              <Image
                src={film.poster}
                alt={film.title}
                width={400}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="relative flex-1 z-10 space-y-9">
              <div className="space-y-3">
                <h2 className="text-5xl font-semibold font-gotham mb-4">
                  {film.title}
                </h2>
                <p className="text-lg text-gray-300">
                  A film by {film.generalCredits?.join(", ")}
                </p>
                <p className="text-md text-gray-400 italic mt-2 mb-4">
                  Released on {film.date}
                </p>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed">
                {film.description}
              </p>

              {film.awards?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-3xl font-light font-gotham mb-4 text-yellow-100">
                    AWARDS
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    {film.awards.map((award, index) => (
                      <li key={index}>
                        <span className="font-bold">{award.title}</span> - {award.details}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {film.notes?.length > 0 && (
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
