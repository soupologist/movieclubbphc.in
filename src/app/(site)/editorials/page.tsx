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

export default function EditorialsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-20 font-gotham">
      <div className="max-w-5xl mx-auto">
        <h1 className={`text-9xl mb-10 ${instrument.className}`}>Editorials</h1>
        <p className="text-lg text-gray-300 mb-12">
          We often write editorials on films, directors, and cinematic trends. These pieces are more
          detailed than those found on our Instagram.
        </p>
      </div>
    </div>
  );
}
