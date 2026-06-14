'use client';

import React, { useState } from 'react';
import { instrumentSerif } from '@/app/fonts';

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  border: '#1e1e1e',
  dim: '#4a5568',
  muted: '#8a9bb0',
  blue: '#40bcf4',
  green: '#00e054',
  orange: '#ff9500',
  red: '#ff453a',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Film = {
  _id: string;
  title: string;
  posterUrl: string;
  tmdbUrl: string;
  year: number;
  dateSuggested: string | null;
};

type UserProfileProps = {
  profile: {
    _id: string;
    email: string;
    username: string;
    name: string;
    image: string | null;
    stats: {
      watchedCount: number;
      currentStreak: number;
      longestStreak: number;
      timesSuggested: number;
    };
    watchHistory: { film: Film; watchedAt: string | null }[];
    ratingHistory: { _id: string; film: Film; rating: number; createdAt: string }[];
    likeHistory: { _id: string; film: Film; createdAt: string }[];
    reviews: { _id: string; film: Film; body: string; isPrivate: boolean; hasSpoiler: boolean; createdAt: string }[];
  };
};

export default function UserProfile({ profile }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'watches' | 'ratings' | 'likes' | 'reviews'>('watches');

  const tabs = [
    { id: 'watches', label: `Watches (${profile.watchHistory.length})` },
    { id: 'ratings', label: `Ratings (${profile.ratingHistory.length})` },
    { id: 'likes', label: `Likes (${profile.likeHistory.length})` },
    { id: 'reviews', label: `Reviews (${profile.reviews.length})` },
  ];

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: 'clamp(16px, 4vw, 24px)', paddingBottom: 96, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '32px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '20px',
        padding: '32px',
        flexWrap: 'wrap',
      }}>
        {profile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt={profile.name}
            style={{ width: 'clamp(72px, 20vw, 128px)', height: 'clamp(72px, 20vw, 128px)', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 'clamp(72px, 20vw, 128px)', height: 'clamp(72px, 20vw, 128px)', borderRadius: '50%', backgroundColor: C.border,
            color: 'white', fontSize: 'clamp(28px, 8vw, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, flexShrink: 0,
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className={instrumentSerif.className} style={{ fontSize: 'clamp(1.6rem, 6vw, 3rem)', color: 'white', margin: 0, lineHeight: 1 }}>{profile.name}</h1>
          
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Watches</span>
              <span style={{ color: C.blue, fontSize: '24px', fontWeight: 600 }}>{profile.stats.watchedCount}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Streak</span>
              <span style={{ color: C.green, fontSize: '24px', fontWeight: 600 }}>{profile.stats.currentStreak} <span style={{ fontSize: '14px', color: C.dim, fontWeight: 'normal' }}>wks</span></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Longest Streak</span>
              <span style={{ color: C.orange, fontSize: '24px', fontWeight: 600 }}>{profile.stats.longestStreak} <span style={{ fontSize: '14px', color: C.dim, fontWeight: 'normal' }}>wks</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginTop: '40px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? C.card : 'transparent',
              border: `1px solid ${activeTab === tab.id ? C.border : 'transparent'}`,
              color: activeTab === tab.id ? 'white' : C.dim,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ minHeight: '400px', marginTop: '24px' }}>
        {activeTab === 'watches' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {profile.watchHistory.map((item, idx) => (
              <FilmCard key={idx} film={item.film} subtitle={item.watchedAt ? `Watched ${formatDate(item.watchedAt)}` : undefined} />
            ))}
            {profile.watchHistory.length === 0 && <EmptyState message="No watches yet." />}
          </div>
        )}

        {activeTab === 'ratings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {profile.ratingHistory.map((item) => (
              <FilmCard key={item._id} film={item.film} badge={`${item.rating}/5 ⭐️`} />
            ))}
            {profile.ratingHistory.length === 0 && <EmptyState message="No ratings yet." />}
          </div>
        )}

        {activeTab === 'likes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {profile.likeHistory.map((item) => (
              <FilmCard key={item._id} film={item.film} badge="❤️" />
            ))}
            {profile.likeHistory.length === 0 && <EmptyState message="No likes yet." />}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.reviews.map((item) => (
              <div key={item._id} style={{ display: 'flex', gap: '16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.film.posterUrl} alt={item.film.title} style={{ width: 120, borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>{item.film.title} <span style={{ color: C.dim, fontSize: '0.875rem', fontWeight: 'normal' }}>({item.film.year})</span></h3>
                  <p style={{ color: C.dim, fontSize: '0.875rem', marginTop: '4px', marginBottom: '16px' }}>{formatDate(item.createdAt)}</p>
                  <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.hasSpoiler ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: C.red }}>Show spoiler review</summary>
                        <p style={{ marginTop: '12px' }}>{item.body}</p>
                      </details>
                    ) : (
                      <p>{item.body}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {profile.reviews.length === 0 && <EmptyState message="No reviews yet." />}
          </div>
        )}
      </div>
    </div>
  );
}

function FilmCard({ film, subtitle, badge }: { film: Film; subtitle?: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.posterUrl}
          alt={film.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        {badge && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'white', border: `1px solid ${C.border}` }}>
            {badge}
          </div>
        )}
      </div>
      <div style={{ padding: '0 4px' }}>
        <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{film.title}</p>
        {(subtitle || film.year) && (
          <p style={{ color: C.dim, fontSize: '11px', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle || film.year}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ gridColumn: '1 / -1', color: C.dim, textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
      {message}
    </div>
  );
}
