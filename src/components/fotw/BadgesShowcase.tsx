'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { instrumentSerif } from '@/app/fonts';
import { BADGE_DEFINITIONS, UserBadgeResult } from '@/lib/badges';

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  cardHover: '#141414',
  border: '#1e1e1e',
  dim: '#4a5568',
  muted: '#8a9bb0',
  blue: '#40bcf4',
  green: '#00e054',
  orange: '#ff9500',
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
        padding: 'clamp(16px, 4vw, 32px) clamp(16px, 4vw, 24px)',
        paddingBottom: 96,
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* Navigation Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        <Link
          href="/club/filmoftheweek"
          style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}
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
              style={{ fontSize: '3.5rem', lineHeight: 1 }}
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

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          padding: '16px 24px',
        }}
      >
        <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
          All Badges ({totalBadges})
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search badges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '10px 18px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            minWidth: '260px',
          }}
        />
      </div>

      {/* Badges Grid with Large Logos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredBadges.map((badge) => {
          const userResult = userBadgeMap.get(badge.id);
          const isEarned = userResult?.earned ?? false;
          const displayImage = isEarned ? badge.imageUrl : badge.lockedImageUrl || badge.imageUrl;

          return (
            <div
              key={badge.id}
              style={{
                background: isEarned ? 'rgba(0, 224, 84, 0.03)' : C.card,
                border: `1px solid ${isEarned ? 'rgba(0, 224, 84, 0.3)' : C.border}`,
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                position: 'relative',
                boxShadow: isEarned ? '0 0 24px rgba(0,224,84,0.06)' : 'none',
              }}
            >
              <div>
                {/* Header row: Large Badge Logo + Unlocked status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  {/* Large Badge Logo Container */}
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '20px',
                      background: isEarned ? 'rgba(0, 224, 84, 0.08)' : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${
                        isEarned ? 'rgba(0,224,84,0.25)' : 'rgba(255,255,255,0.08)'
                      }`,
                      flexShrink: 0,
                    }}
                  >
                    {displayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayImage}
                        alt={badge.name}
                        style={{ width: 84, height: 84, objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: '54px' }}>{badge.symbol}</span>
                    )}
                  </div>

                  {/* Status Indicator Pill */}
                  {userBadges && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: isEarned
                          ? 'rgba(0, 224, 84, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isEarned ? C.green : C.dim,
                        border: `1px solid ${isEarned ? 'rgba(0, 224, 84, 0.3)' : C.border}`,
                      }}
                    >
                      {isEarned ? '✓ Unlocked' : 'Locked'}
                    </span>
                  )}
                </div>

                {/* Badge Title */}
                <div
                  style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}
                >
                  {badge.name}
                </div>

                {/* Description */}
                <div style={{ color: C.muted, fontSize: '14px', lineHeight: 1.5 }}>
                  {userResult?.description || badge.description}
                </div>
              </div>

              {/* Progress Footer if locked */}
              {userBadges && !isEarned && userResult?.progress && userResult.progress.target > 1 && (
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '14px',
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', color: C.dim }}>Progress</span>
                  <span style={{ fontSize: '13px', color: C.dim, fontWeight: 600 }}>
                    {userResult.progress.current} / {userResult.progress.target}
                  </span>
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
