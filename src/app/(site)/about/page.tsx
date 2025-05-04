import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const coreTeam = [
  {
    name: "Aswanth Ganesan",
    role: "Secretary",
    image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744185653/asw_i6fugs.jpg",
  },
  {
    name: "Harshid S",
    role: "Joint Secretary",
    image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg",
  },
  {
    name: "Tarun Manick Murugesan",
    role: "Catharsis Convener",
    image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746358267/tarun_kqeltt.jpg",
  },
  {
    name: "Shreya Meher",
    role: "Treasurer",
    image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746356834/shreya_esmyy1.jpg",
  },
  {
    name: "Sachin Siva Atluri",
    role: "Club Representative",
    image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744185653/asw_i6fugs.jpg",
  },
];

const teamLeads = [
  {
    team: "Filmmaking Team",
    description: "makes short films. competes in film festivals.",
    logo: "https://res.cloudinary.com/dlglodixp/image/upload/v1745659539/filmmaking-team_dcb0yq.png",
    members: [
      {
        name: "Tejasvi Karri",
        role: "Filmmaking Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746362098/tejasvi_op1ukf.jpg",
      },
      {
        name: "Rishi Nair",
        role: "Filmmaking Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746360205/rishi_zyy9s6.jpg",
      },
    ],
  },
  {
    team: "Screenings Team",
    description: "curate and organize film screenings on campus.",
    logo: "https://res.cloudinary.com/dlglodixp/image/upload/v1745659626/screenings-team_igzv9f.png",
    members: [
      {
        name: "Mufidh Muhsin",
        role: "Screenings Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg",
      },
      {
        name: "Akarsh Ramadugu",
        role: "Screenings Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg",
      },
    ],
  },
  {
    team: "Editorial Team",
    description: "run our review and editorial content on Instagram.",
    logo: "https://res.cloudinary.com/dlglodixp/image/upload/v1745659075/editorial-team_htghud.png",
    members: [
      {
        name: "Mofasser Arafat Midda",
        role: "Editorial Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746362334/mofasser_1_kzkkpq.webp",
      },
      {
        name: "Mufidh Muhsin",
        role: "Editorial Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744187241/mufidh_cnvbzx.jpg",
      },
    ],
  },
  {
    team: "Design Team",
    description: "design our posters and define the visual identity of the club",
    logo: "https://res.cloudinary.com/dlglodixp/image/upload/v1745910032/design-transparent_ghudtp.png",
    members: [
      {
        name: "Kavya Dholaria",
        role: "Design Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg",
      },
      {
        name: "Anirudh Yendalur",
        role: "Design Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1744130174/harshid-cropped_gdsqtz.jpg",
      },
    ],
  },
  {
    team: "Publicity & Sponsorship Team",
    description: "handle outreach, collabs, and spreading the word about our work.",
    logo: "https://res.cloudinary.com/dlglodixp/image/upload/v1745659895/publicity-sponsorship_yvtbbk.png",
    members: [
      {
        name: "U.Shreyas",
        role: "Publicity & Sponsorship Lead",
        image: "https://res.cloudinary.com/dlglodixp/image/upload/v1746362072/shreyas_ezqxuf.jpg",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <h1 className={`text-9xl sm:text-9xl mb-10 ${instrument.className} text-white`}>
        About Us
      </h1>

      {/* About Section */}
      <section className="mb-16">
        <p className="text-l sm:text-xl text-gray-300 leading-relaxed max-w-5xl">
          Movie Club, BITS Hyderabad is the filmmaking and review collective of BITS Pilani, Hyderabad Campus. We are a community of active filmmakers and film lovers committed to strengthening film culture on campus.
        </p>
      </section>

      {/* What We Do */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-blue-200 mb-6">What We Do</h2>
        <ul className="list-disc pl-5 space-y-3 text-gray-300 text-base sm:text-lg">
          <li>Make short films, spanning both traditional and experimental styles of filmmaking.</li>
          <li>Participate in short film competitions and film festivals throughout India, both online and offline.</li>
          <li>Screen films regularly in lecture halls, bringing alternative cinema to the General Body&apos;s radar.</li>
          <li>Write reviews, editorials, and recommendations for films on our Instagram page.</li>
          <li>Conduct fun movie-related events for the campus.</li>
        </ul>
      </section>

      <section className="mb-20">
      <h2 className="text-4xl font-bold text-pink-200 mb-12">The Senate</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
          {coreTeam.map((person) => (
            <div key={person.name + person.role} className="flex items-start space-x-4">
              <Image
                src={person.image}
                alt={person.name}
                width={140}
                height={140}
                className="rounded-xl object-cover w-36 h-36"
              />
              <div className="pt-2">
                <p className="text-lg font-semibold text-white">{person.name}</p>
                <p className="text-gray-400 text-sm">{person.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20">
        {/* <h2 className="text-4xl font-bold text-yellow-200 mb-8">Teams</h2> */}

        <div className="space-y-20">
          {teamLeads.map((team) => (
            <div
              key={team.team}
              className="flex flex-col md:flex-row md:items-start gap-10"
            >
              {/* Logo on top (mobile) / left (desktop) */}
              <div className="flex justify-center md:justify-start md:w-1/5">
                <Image
                  src={team.logo}
                  alt={`${team.team} Logo`}
                  width={1000}
                  height={1000}
                  className="rounded-lg object-contain w-48 h-48 md:w-64 md:h-64"
                />
              </div>

              {/* Info + Leads */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white text-center md:text-left">{team.team}</h3>
                  <p className="text-gray-400 text-base text-center md:text-left">
                    {team.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {team.members.map((member) => (
                    <div
                      key={member.name}
                      className="flex items-start space-x-4"
                    >
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={140}
                        height={140}
                        className="rounded-xl object-cover w-36 h-36"
                      />
                      <div className="pt-3 space-y-1">
                        <p className="text-lg font-semibold text-white">{member.name}</p>
                        <p className="text-gray-400 text-sm">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-green-200 mb-6">Get Involved</h2>
        <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
        Interested in joining us? Whether you&apos;re into making short films or are just a huge film buff, we welcome new voices and ideas every semester.
          At the beginning of each semester, we float our induction form on our socials and the{" "}
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

