'use client';

import { useEffect, useRef, useState } from 'react';
import { Instrument_Serif } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import './home.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const sections = [
  {
    id: 'filmmaking',
    heading: 'We make film.',
    before: 'We',
    middle: 'make',
    after: 'film.',
    middleColor: 'text-green-400',
    images: [
      './images/make/onsbts.webp',
      './images/make/plato.jpg',
      './images/make/voltovbts2.jpg',
      './images/make/lastshotbeforesundownbts.jpg',
      './images/make/onsbts2.jpg',
      './images/make/gunscene.jpg',
    ],
    content: `We make short films on campus, and often compete in film festivals. Our films explore a variety of themes and styles, trying to push the boundaries of student filmmaking with minimal equipment.`,
    buttonText: 'View Films',
    href: '/films',
  },
  {
    id: 'screenings',
    heading: 'We screen film.',
    before: 'We',
    middle: 'screen',
    after: 'film.',
    middleColor: 'text-red-500',
    images: [
      // './images/screen/legobatman.jpg',
      './images/screen/coolaf.jpg',
      './images/screen/deadpoets.jpg',
      './images/screen/sid.jpg',
      './images/screen/ladybird.jpg',
      './images/screen/fervour.jpg',
      './images/screen/audience.jpg',
      // './images/screen/clubroom.jpg',
      './images/screen/aaveshamscreening.jpg',
      './images/screen/trees.jpg',
    ],
    content: `We host screenings on campus regularly, showcasing a wide range of films across genres, languages, and styles. Screenings are open to everyone, and conducted in the F Block Classrooms.`,
    buttonText: 'Explore Screenings',
    href: '/festival',
  },
  {
    id: 'editorials',
    heading: 'We review film.',
    before: 'We',
    middle: 'review',
    after: 'film.',
    middleColor: 'text-sky-400',
    images: [
      // './images/review/wall24.jpg',
      './images/review/slumberpartyplanning.jpg',
      './images/review/mickey.jpg',
      './images/review/iith.jpg',
      // './images/review/skibidi.jpg',
      './images/review/inductions.jpg',
      './images/review/prasads.jpg',
      './images/review/mcxmc.jpg',
    ],
    content: `We write longform editorials and reviews on films with short content found on instagram and longer content found here. (it would be boring to put images of us writing so here are some other fun club photos)`,
    buttonText: 'Read Editorials',
    href: '/editorials',
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          const index = sectionRefs.current.findIndex((el) => el === visible.target);
          if (index !== -1) setActiveIndex(index);
        }
      },
      { threshold: 0.5 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-gotham bg-black text-white">
      <main className="pt-0">
        {/* Hero */}
        <div className="relative w-full h-screen overflow-hidden">
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src="/videos/our-narrow-slice-shots.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/images/video-poster.jpg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p
              className={`${instrumentSerif.className} text-7xl lg:text-9xl text-white text-center`}
            >
              We love film.
            </p>
          </div>
        </div>

        <section className="relative flex flex-col md:flex-row">
          {/* Desktop View */}
          <div className="hidden md:flex sticky top-0 h-screen md:w-1/2 justify-center items-center px-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={sections[activeIndex].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className={`${instrumentSerif.className} text-6xl md:text-9xl text-center`}
              >
                {sections[activeIndex].before}{' '}
                <span className={sections[activeIndex].middleColor}>
                  {sections[activeIndex].middle}
                </span>{' '}
                {sections[activeIndex].after}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Right Side Content (Both Mobile & Desktop) */}
          <div className="w-full md:w-1/2 px-6 md:px-12 space-y-16 py-16">
            {sections.map((sec, i) => (
              <div
                key={sec.id}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="min-h-screen flex flex-col justify-center"
              >
                {/* Mobile View Heading */}
                <div className="md:hidden mb-8">
                  <p className={`${instrumentSerif.className} text-6xl text-left`}>
                    {sec.before} <span className={sec.middleColor}>{sec.middle}</span> {sec.after}
                  </p>
                </div>

                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Images */}
                  <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {sec.images?.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`${sec.id}-${idx}`}
                        className="rounded-xl w-full mb-2 break-inside-avoid"
                      />
                    ))}
                  </div>

                  {/* Text + Button */}
                  <div className="mt-6">
                    <p className="text-gray-300 mb-4">{sec.content}</p>
                    <Link
                      href={sec.href}
                      className="inline-block px-5 py-2 border border-white text-white text-sm tracking-wide uppercase hover:bg-white hover:text-black transition"
                    >
                      {sec.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
