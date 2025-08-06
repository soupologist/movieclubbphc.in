'use client';

import { Instrument_Serif } from 'next/font/google';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function EditorialsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 font-gotham">
      <div className="max-w-5xl mx-auto">
        <h1
          className={`text-8xl sm:text-9xl md:text-8xl lg:text-9xl mb-8 sm:mb-10 ${instrument.className}`}
        >
          Editorials
        </h1>

        <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-12">
          We often write editorials on films, directors, and cinematic trends. These pieces are more
          detailed than those found on our Instagram. The editorials section will be coming soon, so
          stay tuned.
        </p>

        <p className="text-base sm:text-lg text-gray-300">
          For now, you can check out our{' '}
          <a
            href="https://www.instagram.com/movieclubbphc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline hover:text-blue-400 transition"
          >
            Instagram page
          </a>{' '}
          for shorter pieces.
        </p>
      </div>
    </div>
  );
}
