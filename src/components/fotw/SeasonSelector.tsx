'use client';
import { useEffect, useRef } from 'react';

export interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  letterboxdUrl?: string;
}

interface SeasonSelectorProps {
  seasons: Season[];
  selected: string;
  onChange: (id: string) => void;
}

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  nested: '#141414',
  border: '#1e1e1e',
  green: '#00e054',
  muted: '#8a9bb0',
};

export default function SeasonSelector({ seasons, selected, onChange }: SeasonSelectorProps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Only set default selection on initial load if no explicit selection is provided
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!selected) {
        const activeSeason = seasons.find((s) => s.isActive);
        if (activeSeason) {
          onChange(activeSeason._id);
        } else {
          onChange('all');
        }
      }
    }
  }, [selected, seasons, onChange]);

  const pillStyle = (isSelected: boolean) => ({
    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.8)' : C.border}`,
    background: isSelected ? 'rgba(255,255,255,0.1)' : C.nested,
    color: isSelected ? 'white' : C.muted,
    borderRadius: 999,
    height: 32,
    padding: '0 16px',
    fontSize: 13,
    fontWeight: isSelected ? 600 : 400,
    transition: 'all 0.2s',
  });

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto py-2 w-full no-scrollbar"
      style={{
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <button
        onClick={() => onChange('all')}
        className="shrink-0 flex items-center justify-center transition-colors hover:text-white"
        style={pillStyle(selected === 'all' || !selected)}
      >
        All Time
      </button>

      {seasons.map((season) => {
        const isSelected = selected === season._id;
        return (
          <button
            key={season._id}
            onClick={() => onChange(season._id)}
            className="shrink-0 flex items-center gap-2 transition-colors hover:text-white"
            style={pillStyle(isSelected)}
          >
            {season.name}
            {season.isActive && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: C.green,
                  marginLeft: 2,
                  boxShadow: `0 0 6px ${C.green}80`,
                }}
                title="Current Season"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
