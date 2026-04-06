'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  setRating?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  rating,
  setRating,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const sizeMap = { sm: 16, md: 28, lg: 36 };
  const gapMap = { sm: 'gap-0', md: 'gap-0.5', lg: 'gap-1' };
  const iconSize = sizeMap[size];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readonly || !setRating) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const isHalf = x < width / 2;
    setHoverRating(isHalf ? index - 0.5 : index);
  };

  const handleClick = () => {
    if (readonly || !setRating || hoverRating === null) return;
    setRating(hoverRating);
  };

  return (
    <div
      className={`flex ${gapMap[size]}`}
      onMouseLeave={() => !readonly && setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const fill = displayRating >= index ? 100 : displayRating >= index - 0.5 ? 50 : 0;

        return (
          <div
            key={index}
            className={`relative ${readonly ? '' : 'cursor-pointer'}`}
            style={{ width: iconSize, height: iconSize }}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={handleClick}
          >
            {/* Empty Star */}
            <Star
              style={{ width: iconSize, height: iconSize }}
              className="absolute top-0 left-0"
              color="#4a5568"
              fill="transparent"
              strokeWidth={1.5}
            />

            {/* Filled Star Overlay */}
            <div
              className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none"
              style={{ width: `${fill}%` }}
            >
              <Star
                style={{ width: iconSize, height: iconSize }}
                color={hoverRating !== null ? '#8a9bb0' : '#00e054'}
                fill={hoverRating !== null ? '#8a9bb0' : '#00e054'}
                strokeWidth={1.5}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
