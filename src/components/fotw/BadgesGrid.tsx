'use client';

import React, { useState } from 'react';
import { UserBadgeResult } from '@/lib/badges';

const C = {
  card: '#0f0f0f',
  cardHover: '#141414',
  border: '#1e1e1e',
  borderEarned: '#2a4a38',
  dim: '#4a5568',
  muted: '#8a9bb0',
  blue: '#40bcf4',
  green: '#00e054',
  orange: '#ff9500',
  gold: '#ffd700',
};

const categoryLabels: Record<string, string> = {
  all: 'All',
  earned: 'Earned',
  watch: 'Watching',
  review: 'Reviews',
  season: 'Seasons',
  recommendation: 'Recommendations',
  community: 'Community',
};

export default function BadgesGrid({ badges }: { badges: UserBadgeResult[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const earnedCount = badges.filter((b) => b.earned).length;

  const filteredBadges = badges.filter((badge) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'earned') return badge.earned;
    return badge.category === selectedCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Badges Summary & Filter Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Badges</span>
          <span style={{ color: C.green, fontSize: '14px', fontWeight: 600 }}>
            {earnedCount} / {badges.length} Unlocked
          </span>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(categoryLabels).map(([catKey, label]) => {
            const active = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                style={{
                  background: active ? '#1f293d' : C.card,
                  border: `1px solid ${active ? C.blue : C.border}`,
                  color: active ? C.blue : C.muted,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              style={{
                background: badge.earned ? 'rgba(0, 224, 84, 0.03)' : C.card,
                border: `1px solid ${badge.earned ? 'rgba(0, 224, 84, 0.3)' : C.border}`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: badge.earned ? 1 : 0.65,
                transition: 'transform 0.2s, border-color 0.2s',
                position: 'relative',
                boxShadow: badge.earned ? '0 0 15px rgba(0,224,84,0.06)' : 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  {/* Symbol / Image */}
                  <div
                    style={{
                      fontSize: '32px',
                      lineHeight: 1,
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: badge.earned ? 'rgba(0, 224, 84, 0.1)' : 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${badge.earned ? 'rgba(0,224,84,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {badge.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={badge.imageUrl} alt={badge.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    ) : (
                      badge.symbol
                    )}
                  </div>

                  {/* Status Badge Pill */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: badge.earned ? 'rgba(0, 224, 84, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: badge.earned ? C.green : C.dim,
                      border: `1px solid ${badge.earned ? 'rgba(0, 224, 84, 0.3)' : C.border}`,
                    }}
                  >
                    {badge.earned ? 'Unlocked ✓' : 'Locked 🔒'}
                  </div>
                </div>

                <div style={{ color: 'white', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                  {badge.name}
                </div>

                <div style={{ color: C.muted, fontSize: '12px', lineHeight: 1.4 }}>
                  {badge.description}
                </div>
              </div>

              {/* Progress bar if not earned */}
              {!badge.earned && badge.progress && badge.progress.target > 1 && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.dim, marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>
                      {badge.progress.current} / {badge.progress.target}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                        background: C.blue,
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
          No badges match this category filter.
        </div>
      )}
    </div>
  );
}
