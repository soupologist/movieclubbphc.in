import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";
import { IFilm } from "@/models/Film";

interface FilmPageProps {
  params: { id: string };
}

function getInstagramId(url: string): string | undefined {
  const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : undefined;
}

export default async function FilmPage({ params }: FilmPageProps) {
  await dbConnect();
  const film: IFilm | null = await Film.findOne({ id: params.id }).lean();

  if (!film) return notFound();

  return (
      <div className="relative min-h-screen text-white overflow-hidden font-gotham">
            {film.background?.endsWith(".mp4") ? (
        <video
          src={film.background}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <Image
          src={film.backgroundImage || film.background || "/fallback.jpg"}
          alt="Background"
          fill
          className="object-cover z-0"
        />
      )}

      <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

      <div className="relative z-20 p-6 md:p-16 max-w-5xl mx-auto">
        <Link
          href="/films"
          className="text-gray-300 hover:text-white text-xl mb-10 block"
        >
          ← Back to Films
        </Link>

        <h1 className="text-5xl md:text-7xl font-semibold mb-4">
          {film.title}
        </h1>

        {film.date && (
          <p className="text-gray-400 italic text-lg mb-8">
            Released on {film.date}
          </p>
        )}

        {film.description && (
          <div className="my-10 border-t border-gray-600 pt-6">
            <p className="text-xl text-gray-200">
              {film.description}
            </p>
          </div>
        )}


        {film.embed && (
          <div className="mt-12 aspect-video w-full">
            {film.embed.includes("instagram.com") ? (
              <iframe
                src={`https://www.instagram.com/p/${getInstagramId(film.embed)}/embed`}
                className="w-full h-full rounded-xl"
                title="Instagram Embed"
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <iframe
                src={film.embed}
                className="w-full h-full rounded-xl"
                title="Embedded video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
        )}

        {film.credits?.length > 0 && (
          <div className="mb-10 mt-10">
            <h2 className="text-4xl font-light text-blue-100 mb-4">Credits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              {film.credits.map((credit, i) => (
                <div key={i}>
                  <p className="text-lg text-gray-400 italic">{credit.title}</p>
                  <p className="text-lg text-gray-300">
                    {credit.names?.join(", ") ?? ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {film.awards?.length > 0 && (
          <div className="mt-14">
            <h2 className="text-4xl font-light text-yellow-100 mb-4">Awards</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              {film.awards.map((a, i) => (
                <li key={i}>
                  <strong>{a.title}</strong> - {a.details}
                </li>
              ))}
            </ul>
          </div>
        )}

        {film.notes?.length > 0 && (
          <div className="mt-14">
            <h2 className="text-4xl font-light text-green-200 mb-4">
              Production Notes
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              {film.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {film.btsPhotos?.length > 0 && (
          <div className="mt-14">
            <h2 className="text-4xl font-light text-pink-100 mb-4">
              Behind The Scenes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {film.btsPhotos.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt={`BTS ${i + 1}`}
                  width={400}
                  height={300}
                  className="rounded-xl w-full h-auto object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
