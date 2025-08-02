'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Instrument_Serif } from 'next/font/google';
import ReactMarkdown from 'react-markdown';

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

// Mock data (you'll replace this with fetch logic)
const MOCK_EDITORIALS = [
  {
    id: 'interstellar-review',
    title: 'Interstellar: A Journey Through Time and Space',
    author: 'Sachin Siva Atluri',
    date: 'August 2, 2025',
    body: `# Interstellar: A Journey Through Time and Space
The film begins. You see dust on bookshelves. You see an old woman, she says, “Well, my dad was a farmer. Like everybody else back then.” Crops appear. 
Corn, probably. Visuals of a man piloting an aircraft flash across the screen, until he’s woken up by his daughter who says to him, “I thought you were 
the ghost.” INTERSTELLAR begins with a sort of dissonance. A flurry of images seemingly unrelated to one another. Words that don’t fit together quite right. 
But anyone that has seen the film will tell you that within these opening frames lies the story of the film as a whole. And with these fragments of information
 we begin our journey into the world of INTERSTELLAR, a film which has seemingly attained modern classic status, and has taken up the mantle of being the most 
 important space picture since Kubrick’s 2001.

## Interesting thing

The most interesting thing about INTERSTELLAR in my opinion is the reality the characters find themselves in. It resembles our own, but within the very first frames of the film Nolan establishes through sound and imagery that it is entirely different. Not in an obvious manner, not akin to a normal Sci-fi film that’ll show you of its world’s otherworldly quality through holograms and alien species. He does so by showing us the changed priorities of the human race as a whole. Cooper, an engineer that was seemingly born a few generations too late is the shares ideals very close to our own. The want for more, to progress, to transgress nature’s hold on us. What Nolan presents however is a world where that hold has caught up to the human race as a whole.
We’re also introduced to Cooper’s two children, the especially bright Murph, and the smart but not smart enough for college Tom. And these characters, along with the Brand father-daughter duo form the emotional crux of the film. And it is an emotional crux far stronger than anything we might have previously encountered in a Nolan film; these characters speak to one another like people and less like parts in a complex tapestry.. And this is perhaps why I can confidently say that this is the one Nolan film that is infinitely more interested in the thoughts and feelings of its characters than the spectacle that can be produced. I truly hope that this doesn’t come off as criticism of his other films – it’s not, just an observation in the change in approach.
There is also a great amount of emotional depth in the way the Cooper-Murph relationship is written. Cooper is an explorer, that’s what he was meant to do in life, and he was never given the opportunity to do it. And it is precisely why he impulsively dives into the mission Dr. Brand gives him. In the space of 5-10 screen minutes, we go from Cooper being a dedicated father and farmer to throwing it all away to go on an oedipal mission to save humanity. And his constant moral dilemma throughout the film, his constant second guessing of his own decision, especially once Mann tells him of Brand’s true intentions is what makes this character so tragic. And it’s also what makes the ending so deeply satisfying.
But here’s the best part – what makes this film truly exceptional is how Nolan combines his obsession for spectacle and gargantuan images with the human emotions at play. At the end of the day, INTERSTELLAR is about a father being away from his two children for an extended period of time and how both party’s deal with that reality. But obviously, it’s not. And it’s so much more because of the Nolanisms – the bookshelf, the watch, Miller’s planet. The high concept ideas at play are so tangible and so real because of their implications for these people’s lives. One of the strongest scenes in the film comes to life in this exact manner. We’re told before we enter Miller’s planet that an hour on it is equivalent to 7 years on earth, Cooper expresses his dismay. But it’s that scene when he finally gets off the planet and arrives to messages from his children, his fully grown children that we are fully able to comprehend the reality of this character. It is so powerful because it is such a deeply human fear come to life.
This brings me to one of the main points I wanted to make – the purpose behind the so-called complexity of Nolan’s work. He has no desire to confuse audiences, to make them sit through physics jargon, to weave together unnecessarily complex screenplays. It is to breathe to life moments that you could never witness, never even conceive in your wildest dreams. The best example, in my opinion is when Cooper is stuck in the blackhole and he manages to spell out ’STAY’ in morse code, and then he crosscuts to Murph begging him to believe her when she says she’s cracked the code and that the message is stay. A moment that I, and most of you could not dream of. I marvel at the sheer brilliance of it all.
It has taken me 11 years and 3 watches to finally fall in love with INTERSTELLAR. I still have some qualms with it, I still don’t think it is close to being Nolan’s best film, but I cannot deny that is some piece of cinema, I cannot deny that it is a film destined for a place in the canon.
`,
  },
];

export default function EditorialPage() {
  const params = useParams();
  const { id } = params;

  const [editorial, setEditorial] = useState<null | (typeof MOCK_EDITORIALS)[0]>(null);

  useEffect(() => {
    // In real use, fetch(`/api/editorials/${id}`).then(...);
    const found = MOCK_EDITORIALS.find((e) => e.id === id);
    setEditorial(found || null);
  }, [id]);

  if (!editorial) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500 text-lg">Editorial not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-20 font-gotham">
      <div className="max-w-3xl mx-auto">
        <h1 className={`text-5xl md:text-7xl mb-6 ${instrument.className}`}>{editorial.title}</h1>

        <div className="text-gray-400 mb-10 text-sm">
          By {editorial.author} · {editorial.date}
        </div>

        <div className="prose prose-invert max-w-none text-white">
          <ReactMarkdown>{editorial.body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
