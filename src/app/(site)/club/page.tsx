'use client';

import {
  FilmIcon,
  UsersIcon,
  VideoIcon,
  PaintbrushIcon,
  MegaphoneIcon,
  FileTextIcon,
} from 'lucide-react';

const cards = [
  {
    title: 'Screening Guidelines',
    description: 'Everything you need to know to organize and run a screening.',
    link: '#',
    category: 'screening',
    icon: <VideoIcon className="w-6 h-6 text-white" />,
    border: 'border-pink-500',
  },
  {
    title: 'Editorial Style Guide',
    description: 'Standard formatting and tone guidelines for all published writing.',
    link: '#',
    category: 'editorial',
    icon: <FileTextIcon className="w-6 h-6 text-white" />,
    border: 'border-blue-500',
  },
  {
    title: 'Design Toolkit',
    description: 'Fonts, logos, and templates for consistent design work.',
    link: '#',
    category: 'design',
    icon: <PaintbrushIcon className="w-6 h-6 text-white" />,
    border: 'border-purple-500',
  },
  {
    title: 'Publicity Checklist',
    description: 'Use this before every campaign launch.',
    link: '#',
    category: 'publicity',
    icon: <MegaphoneIcon className="w-6 h-6 text-white" />,
    border: 'border-yellow-400',
  },
  {
    title: 'Club Constitution',
    description: 'An overview of the club’s vision, structure, and rules.',
    link: '#',
    category: 'general',
    icon: <UsersIcon className="w-6 h-6 text-white" />,
    border: 'border-green-500',
  },
  {
    title: 'How to Make a Short Film',
    description: 'From idea to edit: a simple guide to short filmmaking.',
    link: '#',
    category: 'filmmaking',
    icon: <FilmIcon className="w-6 h-6 text-white" />,
    border: 'border-red-500',
  },
];

export default function ClubPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">Club Resources</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <a
            href={card.link}
            key={card.title}
            className={`rounded-2xl p-6 bg-white/5 backdrop-blur-sm shadow-md hover:shadow-xl transition border-2 ${card.border}`}
          >
            <div className="flex items-center gap-4 mb-4">
              {card.icon}
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            </div>
            <p className="text-sm text-white/80">{card.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
