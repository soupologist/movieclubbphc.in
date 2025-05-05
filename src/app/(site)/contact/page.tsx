// app/(site)/contact/page.tsx
'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { SiInstagram, SiLetterboxd, SiYoutube } from 'react-icons/si';
import { Instrument_Serif } from 'next/font/google';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-20 font-gotham">
      <div className="max-w-3xl mx-auto">
        <h1 className={`text-9xl mb-10 ${instrument.className}`}>Contact Us</h1>
        <p className="text-lg text-gray-300 mb-12">
          For sponsorships, collaborations, or general inquiries — get in touch with us.
        </p>

        <div className="space-y-8 text-left">
          <div className="flex items-center space-x-4">
            <Mail className="w-6 h-6 text-gray-400" />
            <a
              href="mailto:movieclub@hyderabad.bits-pilani.ac.in"
              className="hover:underline text-lg"
            >
              movieclub@hyderabad.bits-pilani.ac.in
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <SiInstagram className="w-6 h-6 text-pink-500" />
            <Link
              href="https://instagram.com/movieclubbphc"
              target="_blank"
              className="hover:underline text-lg"
            >
              @movieclubbphc
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <SiLetterboxd className="w-6 h-6 text-green-400" />
            <Link
              href="https://letterboxd.com/movieclubbphc"
              target="_blank"
              className="hover:underline text-lg"
            >
              @movieclubbphc
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <SiYoutube className="w-6 h-6 text-red-500" />
            <Link
              href="https://youtube.com/@movieclubbphc"
              target="_blank"
              className="hover:underline text-lg"
            >
              Movie Club, BITS Hyderabad
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl mb-4">Sponsorship Deck</h2>
          <iframe
            src="https://drive.google.com/file/d/1MXUaw5wilmDwm13fRfOmlkkiBf_E2Xtg/preview"
            width="100%"
            height="600"
            className="border border-gray-700 rounded-xl w-full"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
