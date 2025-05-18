import { Film, Megaphone, Palette, BookOpenText, Video } from 'lucide-react';

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

export default function ColorCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-screen-xl mx-auto px-4 py-12">
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
  );
}
