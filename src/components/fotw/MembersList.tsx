'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
};

const avatarBg = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#40bcf4', '#00e054', '#ff9500', '#ff3b30', '#bf5af2',
    '#5e5ce6', '#32ade6', '#00c7be', '#a2845e', '#8e8e93',
  ];
  return colors[hash % colors.length];
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Member {
  _id: string;
  email: string;
  username: string;
  name: string;      // display name (username-first)
  realName: string;  // title-cased actual name from auth provider
  image: string | null;
  watchedCount: number;
  currentStreak: number;
  longestStreak: number;
  timesSuggested: number;
}

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

type Film = {
  _id: string;
  title: string;
  posterUrl: string;
  tmdbUrl: string;
  year: number;
  dateSuggested: string | null;
};

type MemberProfile = {
  _id: string;
  email: string;
  username: string;
  name: string;      // display name (username-first)
  realName: string;  // title-cased actual name
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

// Filter by season date range using film.dateSuggested
function filterBySeason<T extends { film: Film }>(items: T[], season: Season | null): T[] {
  if (!season) return items;
  const start = new Date(season.startDate).getTime();
  const end = season.endDate ? new Date(season.endDate).getTime() : Infinity;
  return items.filter(item => {
    if (!item.film?.dateSuggested) return false;
    const d = new Date(item.film.dateSuggested).getTime();
    return d >= start && d <= end;
  });
}

export default function MembersList({ members }: { members: Member[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'watches' | 'ratings' | 'likes' | 'reviews'>('watches');

  // Seasons
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');

  useEffect(() => {
    fetch('/api/fotw/seasons')
      .then(r => r.json())
      .then(d => setSeasons(d.seasons || []))
      .catch(() => {});
  }, []);

  const selectedSeason = selectedSeasonId === 'all' ? null : (seasons.find(s => s._id === selectedSeasonId) || null);

  // Filtered data based on season
  const filteredWatches = profile ? filterBySeason(profile.watchHistory, selectedSeason) : [];
  const filteredRatings = profile ? filterBySeason(profile.ratingHistory, selectedSeason) : [];
  const filteredLikes = profile ? filterBySeason(profile.likeHistory, selectedSeason) : [];
  const filteredReviews = profile ? filterBySeason(profile.reviews, selectedSeason) : [];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.username && m.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openMember = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setProfile(null);
    setActiveTab('watches');
    setSelectedSeasonId('all');
    setLoadingProfile(true);
    try {
      const key = encodeURIComponent(member.username || member.email);
      const res = await fetch(`/api/fotw/members/${key}`);
      if (res.ok) setProfile(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedMember(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  const tabs = profile ? [
    { id: 'watches', label: `Watches (${filteredWatches.length})` },
    { id: 'ratings', label: `Ratings (${filteredRatings.length})` },
    { id: 'likes', label: `Likes (${filteredLikes.length})` },
    { id: 'reviews', label: `Reviews (${filteredReviews.length})` },
  ] : [];

  const selectStyle = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    color: C.muted,
    fontSize: '13px',
    padding: '6px 10px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '32px 24px', paddingBottom: 96, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        <Link href="/club/filmoftheweek" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
          ← Back to Film of the Week
        </Link>
        <h1 className={`text-white m-0 ${instrumentSerif.className}`} style={{ fontSize: '3rem', lineHeight: 1 }}>
          Members
        </h1>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="Search members..."
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '14px',
            width: '100%',
            maxWidth: '320px',
            outline: 'none',
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {filteredMembers.map((member) => (
          <button
            key={member._id}
            onClick={() => openMember(member)}
            style={{
              display: 'flex', flexDirection: 'column',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '16px',
              textDecoration: 'none', transition: 'border-color 0.2s',
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.dim)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.image} alt={member.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', backgroundColor: avatarBg(member.name),
                  color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, flexShrink: 0,
                }}>
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {member.realName || member.name}
                </div>
                <div style={{ color: C.dim, fontSize: '12px' }}>
                  {member.username ? `@${member.username}` : member.name}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Films Watched</div>
                <div style={{ color: C.blue, fontSize: '14px', fontWeight: 600 }}>{member.watchedCount}</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Longest Streak</div>
                <div style={{ color: C.green, fontSize: '14px', fontWeight: 600 }}>{member.longestStreak} wks</div>
              </div>
            </div>
          </button>
        ))}
        {filteredMembers.length === 0 && (
          <div style={{ color: C.dim, gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
            No members found matching &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedMember && (
        <div onClick={closeModal} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', overflowY: 'auto',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: '20px', width: '100%', maxWidth: '900px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              padding: '24px 28px', borderBottom: `1px solid ${C.border}`,
              flexWrap: 'wrap', flexShrink: 0,
            }}>
              {selectedMember.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMember.image} alt={selectedMember.name}
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', backgroundColor: avatarBg(selectedMember.name),
                  color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, flexShrink: 0,
                }}>
                  {selectedMember.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className={instrumentSerif.className} style={{ color: 'white', fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>
                  {selectedMember.realName || selectedMember.name}
                </h2>
                {selectedMember.username && (
                  <div style={{ color: C.dim, fontSize: '13px', marginTop: '3px' }}>@{selectedMember.username}</div>
                )}
                {profile && (
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: C.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Watches</div>
                      {/* Use filtered count if a season is selected, otherwise total */}
                      <div style={{ color: C.blue, fontSize: '16px', fontWeight: 700 }}>
                        {selectedSeasonId === 'all' ? filteredWatches.length : filteredWatches.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Streak</div>
                      <div style={{ color: C.green, fontSize: '16px', fontWeight: 700 }}>{profile.stats.currentStreak} <span style={{ fontSize: '11px', color: C.dim, fontWeight: 'normal' }}>wks</span></div>
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Streak</div>
                      <div style={{ color: C.orange, fontSize: '16px', fontWeight: 700 }}>{profile.stats.longestStreak} <span style={{ fontSize: '11px', color: C.dim, fontWeight: 'normal' }}>wks</span></div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={closeModal} style={{
                background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.dim, width: 32, height: 32, fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = C.dim; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = C.border; }}
              >✕</button>
            </div>

            {/* Tabs + Season filter */}
            {!loadingProfile && profile && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '8px', padding: '12px 28px', borderBottom: `1px solid ${C.border}`,
                flexWrap: 'wrap', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
                      background: activeTab === tab.id ? C.card : 'transparent',
                      border: `1px solid ${activeTab === tab.id ? C.border : 'transparent'}`,
                      color: activeTab === tab.id ? 'white' : C.dim,
                      padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Season selector */}
                {seasons.length > 0 && (
                  <select
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">All Time</option>
                    {seasons.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {loadingProfile && (
                <div style={{ color: C.dim, textAlign: 'center', paddingTop: '60px', fontSize: '14px' }}>Loading…</div>
              )}

              {!loadingProfile && profile && activeTab === 'watches' && (
                filteredWatches.length === 0
                  ? <EmptyState message="No watches in this period." />
                  : <FilmGrid>
                    {filteredWatches.map((item, idx) => (
                      <FilmCard key={idx} film={item.film} subtitle={item.watchedAt ? formatDate(item.watchedAt) : undefined} />
                    ))}
                  </FilmGrid>
              )}

              {!loadingProfile && profile && activeTab === 'ratings' && (
                filteredRatings.length === 0
                  ? <EmptyState message="No ratings in this period." />
                  : <FilmGrid>
                    {filteredRatings.map((item) => (
                      <FilmCard key={item._id} film={item.film} badge={`${item.rating}/5 ⭐`} />
                    ))}
                  </FilmGrid>
              )}

              {!loadingProfile && profile && activeTab === 'likes' && (
                filteredLikes.length === 0
                  ? <EmptyState message="No likes in this period." />
                  : <FilmGrid>
                    {filteredLikes.map((item) => (
                      <FilmCard key={item._id} film={item.film} badge="❤" />
                    ))}
                  </FilmGrid>
              )}

              {!loadingProfile && profile && activeTab === 'reviews' && (
                filteredReviews.length === 0
                  ? <EmptyState message="No reviews in this period." />
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredReviews.map((item) => (
                      <div key={item._id} style={{
                        display: 'flex', gap: '20px', background: C.card,
                        border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', flexWrap: 'wrap',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.film.posterUrl} alt={item.film.title}
                          style={{ width: 80, borderRadius: '8px', objectFit: 'cover', alignSelf: 'flex-start' }} />
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>
                            {item.film.title} <span style={{ color: C.dim, fontSize: '13px', fontWeight: 'normal' }}>({item.film.year})</span>
                          </div>
                          <div style={{ color: C.dim, fontSize: '12px', marginTop: '2px', marginBottom: '12px' }}>{formatDate(item.createdAt)}</div>
                          <div style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {item.hasSpoiler ? (
                              <details>
                                <summary style={{ cursor: 'pointer', color: '#ff453a' }}>Show spoiler review</summary>
                                <p style={{ marginTop: '8px' }}>{item.body}</p>
                              </details>
                            ) : <p style={{ margin: 0 }}>{item.body}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilmGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
      {children}
    </div>
  );
}

function FilmCard({ film, subtitle, badge }: { film: Film; subtitle?: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={film.posterUrl} alt={film.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        {badge && (
          <div style={{
            position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.85)',
            padding: '3px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', color: 'white',
          }}>{badge}</div>
        )}
      </div>
      <div>
        <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{film.title}</p>
        {(subtitle || film.year) && (
          <p style={{ color: C.dim, fontSize: '10px', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle || film.year}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ color: C.dim, textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
      {message}
    </div>
  );
}
