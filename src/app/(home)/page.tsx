import React from "react";
import { Instrument_Serif } from 'next/font/google';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function Home() {
  return (
    <div className="font-gotham bg-black text-white">
      <main className="pt-0">
        <div className="relative w-full h-screen overflow-hidden">
          <video 
            className="absolute top-0 left-0 w-full h-full object-cover"
            src="/videos/our-narrow-slice-shots.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className={`${instrumentSerif.className} text-7xl lg:text-9xl text-white text-center`}>
              We love film.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
