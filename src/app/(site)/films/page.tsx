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

  const films = rawFilms.map((film) => ({
    ...film,
    _id: film._id.toString(),
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
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16">
      <div className="mb-24">
        <h1 className={`text-9xl mb-10 ${instrument.className}`}>Our Films</h1>
      </div>

      <div className="space-y-28">
        {films.map((film) => (
          <Link key={film._id} href={`/films/${film.id}`} className="block group">
            <div className="relative flex flex-col md:flex-row items-start gap-12 md:gap-20 cursor-pointer group-hover:opacity-85 transition-opacity duration-300">
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
