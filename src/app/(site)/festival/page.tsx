'use client';

import EmblaCarousel from '@/components/EmblaCarousel';
import { Instrument_Serif } from 'next/font/google';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function FestivalPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 font-gotham">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <h1
          className={`text-7xl sm:text-7xl md:text-8xl lg:text-9xl mb-10 ${instrument.className}`}
        >
          Catharsis Film Festival
        </h1>

        {/* Intro */}
        <section className="mb-12 sm:mb-16">
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Every year during Pearl, the Cultural Festival of BPHC, we organize a vibrant, multi-day
            film festival that celebrates cinema through a variety of engaging events.
          </p>
        </section>

        {/* Events Outline */}
        <section className="space-y-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-yellow-100">
              Kaleidoscope
            </h2>
            <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-8">
              The Annual Shortfilm Competition of BPHC
            </p>
            <EmblaCarousel
              slides={[
                {
                  src: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744187680/kaleidoscope_ary62s.png',
                  caption: 'Poster for Kaleidoscope 2025',
                },
                {
                  src: '/images/catharsis/award.jpg',
                  caption: 'SPIRIT - Winner of Best Picture at Kaleidoscope 2025',
                },
              ]}
            />

            <p className="text-gray-300 leading-relaxed text-base sm:text-lg mt-4">
              Every year, we invite filmmakers from across the country to submit their short films
              revolving around a particular theme. After a rigorous selection process, the
              shortlisted films are screened on campus during the festival, with awards being given
              to the best entries.
            </p>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-red-200">Slumber Party</h2>
            <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-8">
              All Night Screenings
            </p>
            <EmblaCarousel
              slides={[
                {
                  src: 'https://res.cloudinary.com/dlglodixp/image/upload/v1754635501/day1-combined_u38f3a.webp',
                  caption: 'Slumber Party List for Pearl 2025 - Day 1',
                },
                {
                  src: '/images/screen/aaveshamscreening.jpg',
                  caption: 'Crowd for Aavesham Screening',
                },
              ]}
            />

            <p className="text-gray-300 leading-relaxed text-base sm:text-lg mt-4">
              Slumber Party is the crowd favourite event for Catharsis Film Festival and one of the
              highlights of every fest in BPHC. With a lineup of curated films from various genres
              and languages, we host all-night screenings that even go until 5AM for every day of
              the fest.
            </p>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-blue-100">
              Panel Discussions
            </h2>
            <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-8">
              Filmmaker sessions and conversations in collaboration with BITS Embryo.
            </p>
            <EmblaCarousel
              slides={[
                {
                  src: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744189662/Prepare_yourselves_BITS_Hyderabad_as_captivating_filmmaker_Rakeysh_Omprakash_Mehra_will_be_gracing_the_stage_on_the_BITS_PEARL_Fest_25_with_his_immeasurable_talents._He_has_not_only_engraved_his_name_in_our_hea_snjbl9.webp',
                  caption: 'Discussion with Rakeysh Omprakash Mehra',
                },
                {
                  src: '/images/catharsis/rakeyshgroupphoto.jpg',
                  caption: 'a few club members with Rakeysh Omprakash Mehra',
                },
              ]}
            />

            <p className="text-gray-300 leading-relaxed text-base sm:text-lg mt-4">
              We often invite filmmakers and professionals from the industry to share their insights
              in discussions with us, often in collaboration with BITS Embryo. These sessions
              provide a unique opportunity for students to learn from and interact with experienced
              filmmakers.
            </p>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-green-200">
              Spoiler Alert
            </h2>
            <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-8">
              A test of film trivia in collab with Quiz Club BPHC
            </p>
            <EmblaCarousel
              slides={[
                {
                  src: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744189042/SPOILER_ALERT_1_mwrykk.png',
                  caption: 'Spoiler Alert 2025 Poster',
                },
                {
                  src: '/images/catharsis/spoileralert-screen.jpg',
                  caption: 'Spoiler Alert 2025 in action',
                },
                {
                  src: '/images/catharsis/broflabbergasted.png',
                  caption: 'blud being absolutely flabbergasted at the questions',
                },
              ]}
            />

            <p className="text-gray-300 leading-relaxed text-base sm:text-lg mt-4">
              One of the flagship events of Catharsis, Spoiler Alert is a film quiz that tests the
              participants&apos; knowledge of cinema, organised in close collaboration with our
              homies from Quiz Club BPHC.
            </p>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-blue-100">Movie Wall</h2>
            <p className="text-gray-200 leading-relaxed text-base sm:text-lg mb-8">
              The wall of film posters outside F104
            </p>
            <EmblaCarousel
              slides={[
                {
                  src: '/images/review/moviewall2025.jpg',
                  caption: 'Movie Wall at Pearl 2025 - Films of the 2020s',
                },
                {
                  src: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745132361/wall_iujbnn.jpg',
                  caption: 'Movie Wall at Pearl 2024',
                },
                {
                  src: '/images/catharsis/moviewall2023.jpg',
                  caption: 'Movie Wall at Pearl 2023',
                },
                {
                  src: '/images/catharsis/moviewall2022.jpg',
                  caption: 'Movie Wall at Pearl 2022',
                },
                {
                  src: '/images/catharsis/moviewall2014.jpg',
                  caption: 'The first ever Movie Wall at Pearl 2014',
                },
              ]}
            />

            <p className="text-gray-300 leading-relaxed text-base sm:text-lg mt-4">
              Every year, we have an annual club tradition of creating a wall of film posters
              outside F104. This wall is an expression of our love for cinema to wider audience
              during the fest.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 pt-10 border-t border-gray-700">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-4">Be a Part of It</h3>
          <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-4">
            Whether you want to submit your short film, attend a session, or just enjoy a night of
            cinema, there&apos; something for everyone.
          </p>
          <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
            Follow us on our social media for updates and submission calls.
          </p>
        </section>
      </div>
    </div>
  );
}
