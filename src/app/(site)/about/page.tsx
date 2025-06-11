import Image from 'next/image';
import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import { Film, Megaphone, Palette, BookOpenText, Video } from 'lucide-react';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const cards = [
  {
    title: 'Filmmaking',
    description: 'Make short films and participate in competitions',
    icon: <Video className="w-8 h-8 text-green-500" />,
    border: 'border-green-500',
    image: '/images/filmmaking.jpg',
  },
  {
    title: 'Screenings',
    description: 'Organise screenings for the campus.',
    icon: <Film className="w-8 h-8 text-red-500" />,
    border: 'border-red-500',
    image: '/images/screenings.jpg',
  },
  {
    title: 'Editorial',
    description: 'Write reviews, essays, and film discourse.',
    icon: <BookOpenText className="w-8 h-8 text-blue-500" />,
    border: 'border-blue-500',
    image: '/images/editorial.jpg',
  },
  {
    title: 'Design',
    description: 'Craft the visual aspect of the club, through posters & merch',
    icon: <Palette className="w-8 h-8 text-yellow-500" />,
    border: 'border-yellow-500',
    image: '/images/design.jpg',
  },
  {
    title: 'Publicity',
    description: 'Promote events and manage outreach.',
    icon: <Megaphone className="w-8 h-8 text-purple-500" />,
    border: 'border-purple-500',
    image: '/images/publicity.jpg',
  },
];

const coreTeam = [
  {
    name: 'Aswanth Ganesan',
    role: 'Secretary',
    image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746465844/aswanth_hcjgw0.jpg',
  },
  {
    name: 'Harshid S',
    role: 'Joint Secretary',
    image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746465789/harshid-cool_bwaxbz.jpg',
  },
  {
    name: 'Tarun Manick Murugesan',
    role: 'Catharsis Convener',
    image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746358267/tarun_kqeltt.jpg',
  },
  {
    name: 'Shreya Meher',
    role: 'Treasurer',
    image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746356834/shreya_esmyy1.jpg',
  },
  {
    name: 'Sachin Siva Atluri',
    role: 'Club Representative',
    image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746539556/sachin-new_pgpnml.jpg',
  },
];

const teamLeads = [
  {
    team: 'Filmmaking Team',
    description: 'makes short films. competes in film festivals.',
    logo: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745659539/filmmaking-team_dcb0yq.png',
    members: [
      {
        name: 'Tejasvi Karri',
        role: 'Filmmaking Lead',
        image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746362098/tejasvi_op1ukf.jpg',
      },
      {
        name: 'Rishi Nair',
        role: 'Filmmaking Lead',
        image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746360205/rishi_zyy9s6.jpg',
      },
    ],
  },
  {
    team: 'Screenings Team',
    description: 'curate and organize film screenings on campus.',
    logo: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745659626/screenings-team_igzv9f.png',
    members: [
      {
        name: 'Akarsh Ramadugu',
        role: 'Screenings Lead',
        image:
          'https://res.cloudinary.com/dlglodixp/image/upload/v1746443298/akarsh-cowboy_fxm41t.jpg',
      },
      {
        name: 'Arjan Singh',
        role: 'Screenings Lead',
        image:
          'https://res.cloudinary.com/dlglodixp/image/upload/v1749641486/arjan-square_qdcito.jpg',
      },
    ],
  },
  {
    team: 'Editorial Team',
    description: 'run our review and editorial content on Instagram.',
    logo: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745659075/editorial-team_htghud.png',
    members: [
      {
        name: 'Mofasser Arafat Midda',
        role: 'Editorial Lead',
        image:
          'https://res.cloudinary.com/dlglodixp/image/upload/v1746362334/mofasser_1_kzkkpq.webp',
      },
      {
        name: 'Sachin Siva Atluri',
        role: 'Editorial Lead',
        image:
          'https://res.cloudinary.com/dlglodixp/image/upload/v1746539556/sachin-new_pgpnml.jpg',
      },
    ],
  },
  {
    team: 'Design Team',
    description: 'design our posters and define the visual identity of the club',
    logo: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745910032/design-transparent_ghudtp.png',
    members: [
      {
        name: 'Kavya Dholaria',
        role: 'Design Lead',
        image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746442789/kavya_alzo2g.jpg',
      },
      {
        name: 'Anirudh Yendalur',
        role: 'Design Lead',
        image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746442897/anirudh_tfpq4r.jpg',
      },
    ],
  },
  {
    team: 'Publicity & Sponsorship Team',
    description: 'handle outreach, collabs, and spreading the word about our work.',
    logo: 'https://res.cloudinary.com/dlglodixp/image/upload/v1745659895/publicity-sponsorship_yvtbbk.png',
    members: [
      {
        name: 'U.Shreyas',
        role: 'Publicity & Sponsorship Lead',
        image: 'https://res.cloudinary.com/dlglodixp/image/upload/v1746362072/shreyas_ezqxuf.jpg',
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <h1 className={`text-9xl mb-10 ${instrument.className} text-white`}>About Us</h1>

      {/* What We Do */}
      <p className="hidden sm:block text-xl text-gray-300 leading-relaxed max-w-6xl">
        Movie Club, BITS Hyderabad is a collective of student filmmakers and film enthusiasts at
        BITS Pilani, Hyderabad Campus. We create short films, host screenings, and celebrate cinema
        in all its forms.
      </p>
      <p className="block sm:hidden text-base text-gray-300 leading-relaxed">
        Movie Club, BITS Hyderabad is a collective of student filmmakers and film enthusiasts at
        BITS Pilani, Hyderabad Campus. We create short films, host screenings, and celebrate cinema
        in all its forms.
      </p>

      <section className="mt-10 mb-20">
        <div className="max-w-screen-xl mx-auto border-white">
          <h2 className="text-3xl font-medium text-blue-200 mb-8 text-center sm:text-left">
            What We Do
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl p-6 bg-white/5 backdrop-blur-sm shadow-md hover:shadow-xl transition border-2 ${card.border}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {card.icon}
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                </div>
                <p className="text-sm text-white/80">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 mb-20">
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
            <div key={team.team} className="flex flex-col md:flex-row md:items-start gap-10">
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
                  <h3 className="text-2xl font-medium text-white text-center md:text-left">
                    {team.team}
                  </h3>
                  <p className="text-gray-400 text-base text-center md:text-left">
                    {team.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {team.members.map((member) => (
                    <div key={member.name} className="flex items-start space-x-4">
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

      <section className="mb-16">
        <h2 className="text-3xl font-medium text-yellow-200 mb-4">History of the Club</h2>
        <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-2">
          Founded in 2014, the Movie Club originated as a club that organises movie screenings on
          campus, but has later expanded into other avenues as well, notably filmmaking and
          editorials. Over the years, the club has grown significantly, with new voices emerging
          every year. For more information, check out the Legacy page.
        </p>

        <Link href={'/about/legacy'}>
          <span className="inline-block mt-2 px-5 py-2 border border-white text-white text-sm tracking-wide uppercase hover:bg-white hover:text-black transition">
            Read More
          </span>
        </Link>
      </section>

      {/* Get Involved Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-medium text-green-200 mb-6">Get Involved</h2>
        <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-2">
          Interested in joining us? Whether you&apos;re into making short films or are just a huge
          film buff, we welcome new voices and ideas every semester. At the beginning of each
          semester, we float our induction form on our socials and the{' '}
          <Link
            href="https://www.facebook.com/groups/bphcshoutbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline"
          >
            BPHC SHOUTBOX
          </Link>{' '}
          Facebook group.
        </p>

        <Link href="/contact">
          <span className="inline-block mt-2 px-5 py-2 border border-white text-white text-sm tracking-wide uppercase hover:bg-white hover:text-black transition">
            Contact Us
          </span>
        </Link>
      </section>
    </div>
  );
}
