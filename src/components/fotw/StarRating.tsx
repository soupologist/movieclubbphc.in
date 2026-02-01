'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  setRating?: (rating: number) => void;
  readonly?: boolean;
}

export default function StarRating({ rating, setRating, readonly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readonly || !setRating) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    // index is 1-based (1..5)
    // Left half = index - 0.5, Right half = index
    const isHalf = x < width / 2;
    setHoverRating(isHalf ? index - 0.5 : index);
  };

  const handleClick = () => {
    if (readonly || !setRating || hoverRating === null) return;
    setRating(hoverRating);
  };

  return (
    <div className="flex gap-1" onMouseLeave={() => !readonly && setHoverRating(null)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const fill = displayRating >= index ? 100 : displayRating >= index - 0.5 ? 50 : 0;

        return (
          <div
            key={index}
            className={`relative w-8 h-8 ${readonly ? '' : 'cursor-pointer'}`}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={handleClick}
          >
            {/* Empty Star Background */}
            <Star className="absolute top-0 left-0 w-full h-full text-gray-600" />

            {/* Filled Star Overlay */}
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: `${fill}%` }}
            >
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
