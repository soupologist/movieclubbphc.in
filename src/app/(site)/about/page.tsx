import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className={`text-9xl mb-10 ${instrument.className}`}>About Us</h1>

      <section className="mb-16">
        <p className="text-xl text-gray-300 leading-relaxed">
          Movie Club, BITS Hyderabad is the filmmaking and review collective of BITS Pilani, Hyderabad Campus. We are a community of active filmmakers and film lovers committed to strengthening film culture on campus.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-medium text-blue-200 mb-4">What We Do</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Make short films, spanning both traditional and experimental styles of filmmaking.</li>
          <li>Participate in short film competitions and film festivals throughout India, both online and offline.</li>
          <li>Screen films regularly in lecture halls, trying to bring more alternative cinema to the General Body&rsquo;s radar.</li>
          <li>Write reviews, editorials, and recommendations for films on our Instagram page.</li>
          <li>Conduct fun movie-related events for the campus.</li>
        </ul>
      </section>

      <section className="mb-20 px-4">
        <h2 className="text-center text-4xl sm:text-5xl font-bold text-pink-200 mb-14">Meet the Team</h2>

        {/* Secretary + Joint Secretary */}
        <div className="grid sm:grid-cols-2 gap-12 mb-16">
          <div className="flex flex-col items-center text-center">
            <Image
              src="https://res.cloudinary.com/dlglodixp/image/upload/v1744187255/pranay_axnjwm.jpg"
              alt="Pranay Vajrapu"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
            />
            <p className="text-2xl font-semibold text-white">Pranay Vajrapu</p>
            <p className="text-m text-gray-400">Secretary</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Image
              src="https://res.cloudinary.com/dlglodixp/image/upload/v1744100582/ashish_klnruy.jpg"
              alt="Sai Ashish Vure"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
            />
            <p className="text-2xl font-semibold text-white">Sai Ashish Vure</p>
            <p className="text-m text-gray-400">Joint Secretary</p>
          </div>
        </div>

        {/* Rest of the team */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <Image
              src="https://res.cloudinary.com/dlglodixp/image/upload/v1744187241/mufidh_cnvbzx.jpg"
              alt="Mufidh"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
            />
            <p className="text-xl font-semibold text-white">Mufidh Muhsin</p>
            <p className="text-sm text-gray-400">Treasurer</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Image
              src="https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg"
              alt="Harshid"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
            />
            <p className="text-xl font-semibold text-white">Harshid S</p>
            <p className="text-sm text-gray-400">Catharsis Convener</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Image
              src="https://res.cloudinary.com/dlglodixp/image/upload/v1744185653/asw_i6fugs.jpg"
              alt="Aswanth"
              width={160}
              height={160}
              className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
            />
            <p className="text-xl font-semibold text-white">Aswanth Ganesan</p>
            <p className="text-sm text-gray-400">Club Representative</p>
          </div>
        </div>
      </section>


      {/* <section className="mb-16">
        <h2 className="text-3xl font-medium text-pink-200 mb-4">Photos</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Image
            src="https://res.cloudinary.com/dlglodixp/image/upload/v1744099905/WhatsApp_Image_2025-03-31_at_01.08.33_181ef795_mmb48l.jpg"
            alt="Group photo"
            width={600}
            height={400}
            className="rounded-xl shadow-lg object-cover"
          />
          <Image
            src="/images/event1.jpg"
            alt="Event 1"
            width={600}
            height={400}
            className="rounded-xl shadow-lg object-cover"
          />
          <Image
            src="/images/event2.jpg"
            alt="Event 2"
            width={600}
            height={400}
            className="rounded-xl shadow-lg object-cover"
          />
        </div>
      </section> */}

      <section className="mb-6">
        <h2 className="text-3xl font-medium text-green-200 mb-4">Get Involved</h2>
        <p className="text-gray-300 leading-relaxed">
          Interested in joining us? Whether you&rsquo;re interested in making short films or are just a huge film buff, we welcome new voices and ideas every semester.
          At the beginning of every semester, we float our induction form on our socials and the{" "}
          <Link
            href="https://www.facebook.com/groups/bphcshoutbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline"
          >
            BPHC SHOUTBOX
          </Link>{" "}
          Facebook group.
        </p>
      </section>
    </div>
  );
}
