'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

type Slide = {
  src: string;
  caption?: string;
};

export default function EmblaCarousel({ slides }: { slides: Slide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [heights, setHeights] = useState<number[]>([]); // store each slide's height

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Detect natural heights for all images
  useEffect(() => {
    Promise.all(
      slides.map(
        (slide) =>
          new Promise<number>((resolve) => {
            const img = new window.Image();
            img.src = slide.src;
            img.onload = () => {
              const scale = Math.min(400 / img.naturalHeight, 1); // scale down if bigger than 400px
              resolve(img.naturalHeight * scale);
            };
          })
      )
    ).then(setHeights);
  }, [slides]);

  // Update selected index on carousel change
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            const height = heights[index] ?? 400; // default to 400 until loaded
            return (
              <div
                key={index}
                className="min-w-full relative bg-black flex items-center justify-center"
                style={{ height }}
              >
                <Image
                  src={slide.src}
                  alt={slide.caption || `Slide ${index + 1}`}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-xl"
                  priority
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={scrollPrev}
        className="absolute top-1/2 left-3 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full"
      >
        ‹
      </button>
      <button
        onClick={scrollNext}
        className="absolute top-1/2 right-3 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full"
      >
        ›
      </button>

      {/* Caption */}
      {slides[selectedIndex]?.caption && (
        <div className="mt-2 text-base text-center text-gray-400">
          {slides[selectedIndex].caption}
        </div>
      )}
    </div>
  );
}
