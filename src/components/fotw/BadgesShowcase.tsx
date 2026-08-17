'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { instrumentSerif } from '@/app/fonts';
import { BADGE_DEFINITIONS, UserBadgeResult } from '@/lib/badges';

const C = {
  bg: '#000000',
  dim: '#4a5568',
  muted: '#8a9bb0',
  blue: '#40bcf4',
  green: '#00e054',
  border: '#1e1e1e',
};

interface BadgesShowcaseProps {
  userBadges?: UserBadgeResult[];
}

export default function BadgesShowcase({ userBadges }: BadgesShowcaseProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userBadgeMap = new Map<string, UserBadgeResult>();
  if (userBadges) {
    userBadges.forEach((b) => userBadgeMap.set(b.id, b));
  }

  const filteredBadges = BADGE_DEFINITIONS.filter((badge) => {
    return (
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalBadges = BADGE_DEFINITIONS.length;
  const unlockedCount = userBadges ? userBadges.filter((b) => b.earned).length : null;

  return (
    <div
      style={{
        backgroundColor: C.bg,
        minHeight: '100vh',
        padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 32px)',
        paddingBottom: 112,
        maxWidth: '1440px',
        margin: '0 auto',
      }}
    >
      {/* Navigation Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '36px' }}>
        <Link
          href="/club/filmoftheweek"
          style={{ color: C.muted, fontSize: 14, textDecoration: 'none', width: 'fit-content' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          ← Back to Film of the Week
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1
              className={`text-white m-0 ${instrumentSerif.className}`}
              style={{ fontSize: '3.8rem', lineHeight: 1 }}
            >
              Badges
            </h1>
            <p
              style={{
                color: C.muted,
                fontSize: '16px',
                marginTop: '10px',
                maxWidth: '680px',
                lineHeight: 1.5,
              }}
            >
              All achievements and collectible badges available on Film of the Week. Earn badges by
              watching movies, writing reviews, discovering foreign languages, and participating in
              seasons!
            </p>
          </div>

          {unlockedCount !== null && (
            <div
              style={{
                background: 'rgba(0, 224, 84, 0.06)',
                border: '1px solid rgba(0, 224, 84, 0.25)',
                borderRadius: '16px',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    color: C.dim,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                  }}
                >
                  Your Unlocked Badges
                </div>
                <div style={{ color: C.green, fontSize: '20px', fontWeight: 700 }}>
                  {unlockedCount} / {totalBadges} Unlocked
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '48px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
          All Badges ({totalBadges})
        </div>

        <input
          type="text"
          placeholder="Search badges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '13px',
            outline: 'none',
            minWidth: '240px',
          }}
        />
      </div>

      {/* Badges Grid (Extra large 210px logos without boxes) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '56px 40px',
        }}
      >
        {filteredBadges.map((badge) => {
          const userResult = userBadgeMap.get(badge.id);
          const isEarned = userResult?.earned ?? false;
          const displayImage = isEarned
            ? badge.imageUrl
            : badge.lockedImageUrl || badge.imageUrl;

          return (
            <div
              key={badge.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                opacity: userBadges ? (isEarned ? 1 : 0.65) : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Extra Large Badge Logo (210px x 210px, no bounding box) */}
              <div
                style={{
                  width: '210px',
                  height: '210px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt={badge.name}
                    style={{
                      width: 210,
                      height: 210,
                      objectFit: 'contain',
                      filter: isEarned
                        ? 'drop-shadow(0 10px 24px rgba(0,224,84,0.18))'
                        : 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '96px' }}>{badge.symbol}</span>
                )}
              </div>

              {/* Status Pill if logged in */}
              {userBadges && (
                <div style={{ marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: isEarned
                        ? 'rgba(0, 224, 84, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isEarned ? C.green : C.dim,
                      border: `1px solid ${
                        isEarned ? 'rgba(0, 224, 84, 0.3)' : 'rgba(255, 255, 255, 0.08)'
                      }`,
                    }}
                  >
                    {isEarned ? '✓ Unlocked' : 'Locked'}
                  </span>
                </div>
              )}

              {/* Badge Title */}
              <h2
                className={`text-white m-0 ${instrumentSerif.className}`}
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  lineHeight: 1.2,
                }}
              >
                {badge.name}
              </h2>

              {/* Description */}
              <p
                style={{
                  color: C.muted,
                  fontSize: '14px',
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '260px',
                }}
              >
                {userResult?.description || badge.description}
              </p>

              {/* Progress Bar for locked badge */}
              {userBadges && !isEarned && userResult?.progress && userResult.progress.target > 1 && (
                <div style={{ width: '100%', maxWidth: '200px', marginTop: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: C.dim,
                      marginBottom: '4px',
                    }}
                  >
                    <span>Progress</span>
                    <span>
                      {userResult.progress.current} / {userResult.progress.target}
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
                        width: `${Math.min(
                          100,
                          (userResult.progress.current / userResult.progress.target) * 100
                        )}%`,
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
        <div style={{ color: C.dim, textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
          No badges match your search.
        </div>
      )}
    </div>
  );
}
