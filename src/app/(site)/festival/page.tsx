import Image from "next/image";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function FestivalPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className={`text-9xl mb-10 ${instrument.className}`}>Catharsis Film Festival</h1>

      {/* Intro */}
      <section className="mb-16">
        <p className="text-xl text-gray-300 leading-relaxed">
          Every year during Pearl, the Cultural Festival of BPHC, we organizes a vibrant, multi-day film festival that celebrates cinema through a plethora of engaging events.
        </p>
      </section>

      {/* Events */}
      <section className="mb-16">
        <h2 className="text-5xl font-bold text-yellow-200 mb-12">Events</h2>

        <div className="space-y-16">
            {/* Event 1 */}
            <div className="flex flex-col md:flex-row gap-8">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744187680/kaleidoscope_ary62s.png"
                alt="Kaleidoscope - Short Film Competition"
                width={500}
                height={300}
                className="rounded-xl object-cover shadow-lg w-full md:w-1/2"
            />
            <div className="flex flex-col justify-center text-gray-300 md:w-1/2">
                <h3 className="text-3xl font-semibold text-white">Kaleidoscope</h3>
                <p className="text-lg text-gray-400 mb-2 italic">Short Film Competition</p>
                <p>
                A showcase of original short films from across India, where all submissions follow a unifying theme. Creative boundaries are pushed as filmmakers respond to a single idea in their own distinct styles.
                </p>
            </div>
            </div>

            {/* Event 2 */}
            <div className="flex flex-col md:flex-row gap-8">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744188530/slumber-party-combined_x0asuh.png"
                alt="Slumber Party Screenings"
                width={500}
                height={300}
                className="rounded-xl object-cover shadow-lg w-full md:w-1/2"
            />
            <div className="flex flex-col justify-center text-gray-300 md:w-1/2">
                <h3 className="text-3xl font-semibold text-white">Slumber Party</h3>
                <p className="text-lg text-gray-400 mb-2 italic">All-Night Screenings</p>
                <p>
                    We turn the lecture halls into a cineplex, curating a wide assortment of cinema ranging different genres and languages, screening films all night long.
                </p>
            </div>
            </div>

            {/* Event 3 */}
            <div className="flex flex-col md:flex-row gap-8">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744189662/Prepare_yourselves_BITS_Hyderabad_as_captivating_filmmaker_Rakeysh_Omprakash_Mehra_will_be_gracing_the_stage_on_the_BITS_PEARL_Fest_25_with_his_immeasurable_talents._He_has_not_only_engraved_his_name_in_our_hea_snjbl9.webp"
                alt="Panel Discussions"
                width={500}
                height={300}
                className="rounded-xl object-cover shadow-lg w-full md:w-1/2"
            />
            <div className="flex flex-col justify-center text-gray-300 md:w-1/2">
                <h3 className="text-3xl font-semibold text-white">Panel Discussions</h3>
                <p className="text-lg text-gray-400 mb-2 italic">Conversations on Craft</p>
                <p>
                    As a collaboration with BITS Embryo, we call renown filmmakers to our campus for interactive sessions and insightful conversations.
                </p>
            </div>
            </div>

            {/* Event 4 */}
            <div className="flex flex-col md:flex-row gap-8">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744189042/SPOILER_ALERT_1_mwrykk.png"
                alt="Spoiler Alert"
                width={500}
                height={300}
                className="rounded-xl object-cover shadow-lg w-full md:w-1/2"
            />
            <div className="flex flex-col justify-center text-gray-300 md:w-1/2">
                <h3 className="text-3xl font-semibold text-white">Spoiler Alert</h3>
                <p className="text-lg text-gray-400 mb-2 italic">Film Trivia Quiz</p>
                <p>
                    A collab with Quiz Club BPHC to find the most knowledgable film buff on campus.
                </p>
            </div>
            </div>

            {/* Event 5 */}
            <div className="flex flex-col md:flex-row gap-8">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744190023/posterwall_hdapdv.jpg"
                alt="Movie Wall"
                width={500}
                height={300}
                className="rounded-xl object-cover shadow-lg w-full md:w-1/2"
            />
            <div className="flex flex-col justify-center text-gray-300 md:w-1/2">
                <h3 className="text-3xl font-semibold text-white">The Movie Wall</h3>
                <p className="text-lg text-gray-400 mb-2 italic">A Wall of Posters</p>
                <p>
                    A yearly tradition where we take the wall next to F104 and completely fill it with posters, usually following a centralised theme.
                </p>
            </div>
            </div>
        </div>
        </section>

      {/* Gallery */}
        {/* <section className="mb-16">
        <h2 className="text-3xl font-medium text-pink-200 mb-6">Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="w-full overflow-hidden rounded-xl shadow-lg">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744099905/WhatsApp_Image_2025-03-31_at_01.08.33_181ef795_mmb48l.jpg"
                alt="Festival Crowd"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
            />
            </div>
            <div className="w-full overflow-hidden rounded-xl shadow-lg">
            <Image
                src="https://res.cloudinary.com/dlglodixp/image/upload/v1744188530/slumber-party-combined_x0asuh.png"
                alt="Workshop"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
            />
            </div>
            <div className="w-full overflow-hidden rounded-xl shadow-lg">
            <Image
                src="/images/festival/screening.jpg"
                alt="Outdoor Screening"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
            />
            </div>
        </div>
        </section> */}

      {/* Call to Action */}
      <section className="mt-10 border-t border-gray-700 pt-10">
        <h2 className="text-3xl text-white mb-4">Be a Part of It</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Whether you want to showcase your short film, attend a workshop, or just experience the thrill of watching films with fellow cinephiles, there's something for everyone at the festival.
        </p>
        <p className="text-gray-300 leading-relaxed">
          Follow us on our social media for announcements, submission forms, and schedules. Let's celebrate cinema, together.
        </p>
      </section>
    </div>
  );
}
