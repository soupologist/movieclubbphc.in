'use client';

import { useState } from 'react';
import Image from 'next/image';

type Slide = {
  src: string;
  caption?: string;
};

type Props = {
  slides: Slide[];
};

export function ImageCarousel({ slides }: Props) {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-md mb-6">
      <div className="relative w-full h-64 sm:h-80 md:h-96">
        <Image
          src={slides[current].src}
          alt={slides[current].caption || `Slide ${current + 1}`}
          layout="fill"
          objectFit="cover"
          className="rounded-xl"
        />
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded-full hover:bg-black/70"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded-full hover:bg-black/70"
          >
            ›
          </button>
        </>
      )}

      {slides[current].caption && (
        <div className="mt-2 text-sm text-gray-400 text-center">{slides[current].caption}</div>
      )}
    </div>
  );
}
