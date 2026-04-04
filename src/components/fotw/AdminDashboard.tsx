'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, ArrowLeft, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { instrumentSerif } from '@/app/fonts';

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  input: '#0a0a0a',
  border: '#1e1e1e',
  focus: '#2e2e2e',
  green: '#00e054',
  orange: '#ff8000',
  blue: '#40bcf4',
  muted: '#8a9bb0',
  dim: '#4a5568',
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // Add Film State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    posterUrl: '',
    driveLink: '',
    chosenBy: '',
  });
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Edit Film State
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({
    filmId: '',
    title: '',
    posterUrl: '',
    driveLink: '',
    chosenBy: '',
  });
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General State
  const [leaderboard, setLeaderboard] = useState<{ name: string; watchedCount: number }[]>([]);
  const [archiveFilms, setArchiveFilms] = useState<{ chosenBy?: string }[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [cycleReset, setCycleReset] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fotw/data').then((r) => r.json()),
      fetch('/api/fotw/archive').then((r) => r.json()),
    ])
      .then(([d, archive]) => {
        if (!d.isAdmin) {
          router.push('/club/filmoftheweek');
          return;
        }
        setLeaderboard(d.leaderboard || []);
        setArchiveFilms(Array.isArray(archive) ? archive : []);
        if (d.currentFilm) {
          setEditData({
            filmId: d.currentFilm._id,
            title: d.currentFilm.title || '',
            posterUrl: d.currentFilm.posterUrl || '',
            driveLink: d.currentFilm.driveLink || '',
            chosenBy: d.currentFilm.chosenBy || '',
          });
        }
      })
      .catch((err) => console.error(err));
  }, [router]);

  const showAddMessage = (type: 'success' | 'error', text: string) => {
    setAddMsg({ type, text });
    setTimeout(() => setAddMsg(null), 4000);
  };

  const showEditMessage = (type: 'success' | 'error', text: string) => {
    setEditMsg({ type, text });
    setTimeout(() => setEditMsg(null), 4000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAddMsg(null);
    try {
      const res = await fetch('/api/fotw/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showAddMessage('success', 'Film added successfully! Redirecting...');
        setFormData({ title: '', posterUrl: '', driveLink: '', chosenBy: '' });
        setAutoFilled(false);
        setTimeout(() => {
          router.push('/club/filmoftheweek');
        }, 1500);
      } else {
        const d = await res.json();
        showAddMessage('error', d.message || 'Failed to add film');
      }
    } catch (err) {
      showAddMessage('error', 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.filmId) return;
    setEditLoading(true);
    setEditMsg(null);
    try {
      const res = await fetch('/api/fotw/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        showEditMessage('success', 'Film updated successfully!');
      } else {
        const d = await res.json();
        showEditMessage('error', d.message || 'Failed to update film');
      }
    } catch (err) {
      showEditMessage('error', 'Error updating film');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSpin = () => {
    if (leaderboard.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    setCycleReset(false);

    const alreadyChosen = archiveFilms
      .map((f) => f.chosenBy)
      .filter(Boolean) as string[];

    const maxScore = Math.max(...leaderboard.map((u) => u.watchedCount), 0);
    const topTied = leaderboard.filter((u) => u.watchedCount === maxScore && maxScore > 0);
    const candidates = topTied.length > 0 ? topTied : leaderboard; // Fallback to all if none watched

    let pool = candidates.filter((u) => !alreadyChosen.includes(u.name));
    if (pool.length === 0) {
      // Full cycle complete — resetting eligibility
      pool = candidates;
      setCycleReset(true);
    }

    let elapsed = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const randomWinner = pool[Math.floor(Math.random() * pool.length)].name;
      setWinner(randomWinner);
      elapsed += 100;
      if (elapsed >= 3000) {
        clearInterval(timerRef.current!);
        setIsSpinning(false);
        setWinner(randomWinner);
        setFormData((prev) => ({ ...prev, chosenBy: randomWinner }));
        setAutoFilled(true);
      }
    }, 100);
  };

  const labelClass = "block uppercase tracking-[0.08em] mb-2";
  const labelStyle = { color: C.muted, fontSize: 11 };
  
  const inputClass = "w-full text-white transition-colors outline-none focus:border-[#2e2e2e]";
  const inputStyle = { 
    backgroundColor: C.input, 
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14 
  };

  return (
    <div className="pb-20 pt-8 max-w-3xl mx-auto px-4 sm:px-6" style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col mb-10 pt-4" style={{ gap: 8 }}>
        <Link
          href="/club/filmoftheweek"
          className="hover:text-white transition-colors"
          style={{ color: C.muted, fontSize: 14 }}
        >
          ← Film of the Week
        </Link>
        <h1 className={`text-4xl sm:text-5xl font-bold text-white tracking-tight m-0 ${instrumentSerif.className}`}>
          Admin Dashboard
        </h1>
      </div>

      {/* ── Add New Film ────────────────────────────────────── */}
      <section 
        className="mb-8"
        style={{ 
          backgroundColor: C.card, 
          border: `1px solid ${C.border}`, 
          borderRadius: 16, 
          padding: 24 
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Plus size={18} style={{ color: C.dim }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
            Add New Film
          </h2>
        </div>

        {addMsg && (
          <div 
            className="mb-6 p-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: addMsg.type === 'success' ? 'rgba(0,224,84,0.1)' : 'rgba(255,100,100,0.1)',
              color: addMsg.type === 'success' ? C.green : '#ff6464',
              border: `1px solid ${addMsg.type === 'success' ? 'rgba(0,224,84,0.2)' : 'rgba(255,100,100,0.2)'}`
            }}
          >
            {addMsg.text}
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div>
            <label className={labelClass} style={labelStyle}>Movie Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. Mulholland Drive"
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Poster Image URL</label>
            <input
              type="url"
              required
              value={formData.posterUrl}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              className={inputClass}
              style={inputStyle}
              placeholder="https://example.com/poster.jpg"
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Google Drive Link</label>
            <input
              type="url"
              required
              value={formData.driveLink}
              onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              className={inputClass}
              style={inputStyle}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Chosen By</label>
            <input
              type="text"
              value={formData.chosenBy}
              onChange={(e) => {
                setFormData({ ...formData, chosenBy: e.target.value });
                setAutoFilled(false);
              }}
              className={inputClass}
              style={inputStyle}
              placeholder="Name of the member who chose this film"
            />
            {autoFilled && (
              <p className="mt-2" style={{ color: C.blue, fontSize: 11 }}>
                Auto-filled from tie-breaker
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ 
              backgroundColor: C.green, 
              color: '#000', 
              borderRadius: 8, 
              fontWeight: 600, 
              padding: '10px 24px',
              fontSize: 14
            }}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Adding...' : 'Add Film'}
          </button>
        </form>
      </section>

      {/* ── Edit Current Film ────────────────────────────────── */}
      {editData.filmId && (
        <section 
          className="mb-8"
          style={{ 
            backgroundColor: C.card, 
            border: `1px solid ${C.border}`, 
            borderRadius: 16, 
            padding: 24 
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Edit2 size={16} style={{ color: C.dim }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
              Edit Current Film
            </h2>
          </div>

          {editMsg && (
            <div 
              className="mb-6 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: editMsg.type === 'success' ? 'rgba(0,224,84,0.1)' : 'rgba(255,100,100,0.1)',
                color: editMsg.type === 'success' ? C.green : '#ff6464',
                border: `1px solid ${editMsg.type === 'success' ? 'rgba(0,224,84,0.2)' : 'rgba(255,100,100,0.2)'}`
              }}
            >
              {editMsg.text}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div>
              <label className={labelClass} style={labelStyle}>Movie Title</label>
              <input
                type="text"
                required
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Poster Image URL</label>
              <input
                type="url"
                required
                value={editData.posterUrl}
                onChange={(e) => setEditData({ ...editData, posterUrl: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Google Drive Link</label>
              <input
                type="url"
                required
                value={editData.driveLink}
                onChange={(e) => setEditData({ ...editData, driveLink: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Chosen By</label>
              <input
                type="text"
                value={editData.chosenBy}
                onChange={(e) => setEditData({ ...editData, chosenBy: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={editLoading}
              className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: C.green, 
                color: '#000', 
                borderRadius: 8, 
                fontWeight: 600, 
                padding: '10px 24px',
                fontSize: 14
              }}
            >
              {editLoading && <Loader2 className="animate-spin" size={16} />}
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>
      )}

      {/* ── Tie Breaker ──────────────────────────────────────── */}
      <section 
        style={{ 
          backgroundColor: C.card, 
          border: `1px solid ${C.border}`, 
          borderRadius: 16, 
          padding: 24 
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: C.orange }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
              Tie Breaker
            </h2>
          </div>
          <button
            onClick={handleSpin}
            disabled={isSpinning || leaderboard.length === 0}
            className="rounded transition-all duration-200 disabled:opacity-50 hover:bg-[#ff8000]/10"
            style={{ 
              backgroundColor: 'transparent',
              border: `1px solid ${C.orange}`, 
              color: C.orange,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            {isSpinning ? 'Spinning...' : 'Spin for Winner'}
          </button>
        </div>

        <div 
          className="text-center py-14" 
          style={{ backgroundColor: C.input, borderRadius: 8, border: `1px solid ${C.border}` }}
        >
          {winner ? (
            <div>
              <p className="mb-2" style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isSpinning ? 'SPINNING...' : 'THE WINNER IS'}
              </p>
              <p
                className="font-bold transition-all duration-300"
                style={{ 
                  color: isSpinning ? C.muted : C.green,
                  fontSize: 32
                }}
              >
                {winner}
              </p>
              {!isSpinning && cycleReset && (
                <p style={{ color: '#8a9bb0', fontSize: 12, marginTop: 8 }}>
                  All eligible members have had a turn — starting a new cycle.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: C.dim }}>
              Click spin to pick a winner from the top scorers.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
