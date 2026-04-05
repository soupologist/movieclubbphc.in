'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, Edit2, Upload } from 'lucide-react';
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
    chosenBy: '',
    chosenByEmail: '',
    tmdbUrl: '',
  });
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // TMDB Fetch State
  const [tmdbUrlInput, setTmdbUrlInput] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedMovie, setFetchedMovie] = useState<{
    title: string;
    posterUrl: string;
    year: number;
  } | null>(null);

  // Edit Film State
  const [editTab, setEditTab] = useState<'current' | 'previous'>('current');

  // Edit Film State
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({
    filmId: '',
    title: '',
    posterUrl: '',
    chosenBy: '',
    chosenByEmail: '',
    timerPaused: false,
    tmdbUrl: '',
  });
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General State
  const [currentFilm, setCurrentFilm] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<
    { name: string; watchedCount: number; email: string }[]
  >([]);
  const [archiveFilms, setArchiveFilms] = useState<any[]>([]);
  const [winner, setWinner] = useState<{ name: string; email: string } | null>(null);
  const [cycleReset, setCycleReset] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Import Leaderboard State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fotw/admin/leaderboard').then((r) => r.json()),
      fetch('/api/fotw/data').then((r) => r.json()),
      fetch('/api/fotw/archive').then((r) => r.json()),
    ])
      .then(([adminData, d, archive]) => {
        setLeaderboard(adminData.leaderboard || []);
        setArchiveFilms(Array.isArray(archive) ? archive : []);
        if (d.currentFilm) {
          setCurrentFilm(d.currentFilm);
          setEditData({
            filmId: d.currentFilm._id,
            title: d.currentFilm.title || '',
            posterUrl: d.currentFilm.posterUrl || '',
            chosenBy: d.currentFilm.chosenBy || '',
            chosenByEmail: d.currentFilm.chosenByEmail || '',
            timerPaused: d.currentFilm.timerPaused || false,
            tmdbUrl: d.currentFilm.tmdbUrl || '',
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const showAddMessage = (type: 'success' | 'error', text: string) => {
    setAddMsg({ type, text });
    setTimeout(() => setAddMsg(null), 4000);
  };

  const showEditMessage = (type: 'success' | 'error', text: string) => {
    setEditMsg({ type, text });
    setTimeout(() => setEditMsg(null), 4000);
  };

  const handleFetchMovie = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/fotw/admin/resolve-tmdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbUrl: tmdbUrlInput }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to fetch movie data');
      if (d.success) {
        setFetchedMovie({ title: d.title, posterUrl: d.posterUrl, year: d.year });
        setFormData((prev) => ({
          ...prev,
          title: `${d.title} (${d.year})`,
          posterUrl: d.posterUrl,
          tmdbUrl: tmdbUrlInput,
        }));
        setFetchError(null);
      }
    } catch (e: any) {
      setFetchError(e.message);
      setFetchedMovie(null);
    } finally {
      setFetchLoading(false);
    }
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
        setFormData({ title: '', posterUrl: '', chosenBy: '', chosenByEmail: '', tmdbUrl: '' });
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

  const handleResetLeaderboard = async () => {
    if (
      !window.confirm('Are you sure you want to reset all user scores to 0? This cannot be undone.')
    )
      return;
    try {
      const res = await fetch('/api/fotw/admin/reset-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET_LEADERBOARD' }),
      });
      if (res.ok) {
        setLeaderboard([]);
        alert('Leaderboard reset successfully.');
      } else {
        alert('Failed to reset leaderboard.');
      }
    } catch (err) {
      alert('Error resetting leaderboard.');
    }
  };

  const handleSpin = () => {
    if (leaderboard.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    setCycleReset(false);

    const alreadyChosenEmails = archiveFilms
      .map((f) => f.chosenByEmail)
      .filter(Boolean) as string[];
    const alreadyChosenNames = archiveFilms
      .filter((f) => !f.chosenByEmail)
      .map((f) => f.chosenBy)
      .filter(Boolean) as string[];

    const maxScore = Math.max(...leaderboard.map((u) => u.watchedCount), 0);
    const topTied = leaderboard.filter((u) => u.watchedCount === maxScore && maxScore > 0);
    // Fallback to all if none watched
    let candidates = topTied.length > 0 ? topTied : leaderboard;

    // Filter out candidates with no name
    candidates = candidates.filter((u) => u.name && u.name.trim() !== '');
    if (candidates.length === 0) {
      alert(
        'Some top members have no display name — ask them to update their Google account name.'
      );
      setIsSpinning(false);
      return;
    }

    let pool = candidates.filter(
      (u) => !alreadyChosenEmails.includes(u.email) && !alreadyChosenNames.includes(u.name)
    );
    if (pool.length === 0) {
      // Full cycle complete — resetting eligibility
      pool = candidates;
      setCycleReset(true);
    }

    let elapsed = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    // Pick the actual winner from the eligible pool
    const finalWinner = pool[Math.floor(Math.random() * pool.length)];

    timerRef.current = setInterval(() => {
      // Visually spin through ALL names for dramatic effect
      const randomVisual = leaderboard[Math.floor(Math.random() * leaderboard.length)];
      setWinner({ name: randomVisual.name, email: randomVisual.email });
      elapsed += 100;
      if (elapsed >= 3000) {
        clearInterval(timerRef.current!);
        setIsSpinning(false);
        setWinner({ name: finalWinner.name, email: finalWinner.email });
        setFormData((prev) => ({
          ...prev,
          chosenBy: finalWinner.name,
          chosenByEmail: finalWinner.email,
        }));
        setAutoFilled(true);
      }
    }, 100);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    setImportError(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await fetch('/api/fotw/admin/import-leaderboard', {
        method: 'POST',
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Import failed');
      setImportResult({ imported: d.imported, skipped: d.skipped });
      setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const labelClass = 'block uppercase tracking-[0.08em] mb-2';
  const labelStyle = { color: C.muted, fontSize: 11 };

  const inputClass = 'w-full text-white transition-colors outline-none focus:border-[#2e2e2e]';
  const inputStyle = {
    backgroundColor: C.input,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
  };

  return (
    <div
      className="pb-20 pt-8 max-w-3xl mx-auto px-4 sm:px-6"
      style={{ backgroundColor: C.bg, minHeight: '100vh' }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col mb-10 pt-4" style={{ gap: 8 }}>
        <Link
          href="/club/filmoftheweek"
          className="hover:text-white transition-colors"
          style={{ color: C.muted, fontSize: 14 }}
        >
          ← Film of the Week
        </Link>
        <h1
          className={`text-4xl sm:text-5xl font-bold text-white tracking-tight m-0 ${instrumentSerif.className}`}
        >
          Admin Dashboard
        </h1>
      </div>

      {/* ── Add New Film ─────────────────────────────────────── */}
      <section
        className="mb-12"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Plus size={18} style={{ color: C.dim }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Add New Film</h2>
        </div>

        {addMsg && (
          <div
            className="mb-6 p-3 rounded-lg text-sm"
            style={{
              backgroundColor:
                addMsg.type === 'success' ? 'rgba(0,224,84,0.1)' : 'rgba(255,100,100,0.1)',
              color: addMsg.type === 'success' ? C.green : '#ff6464',
              border: `1px solid ${addMsg.type === 'success' ? 'rgba(0,224,84,0.2)' : 'rgba(255,100,100,0.2)'}`,
            }}
          >
            {addMsg.text}
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div>
            <label className={labelClass} style={labelStyle}>
              TMDB MOVIE URL
            </label>
            <input
              type="text"
              value={tmdbUrlInput}
              onChange={(e) => setTmdbUrlInput(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://www.themoviedb.org/movie/597-titanic"
            />
            <p style={{ color: '#4a5568', fontSize: 11, marginTop: 6, marginBottom: 8 }}>
              Paste the TMDB page URL for the movie
            </p>
            <button
              type="button"
              onClick={handleFetchMovie}
              disabled={fetchLoading || !tmdbUrlInput}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.muted,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                cursor: fetchLoading || !tmdbUrlInput ? 'not-allowed' : 'pointer',
                opacity: fetchLoading || !tmdbUrlInput ? 0.5 : 1,
              }}
              className="hover:text-white! transition-colors"
            >
              {fetchLoading ? 'Fetching...' : 'Fetch Movie'}
            </button>
            {fetchError && (
              <p style={{ color: '#ff6464', fontSize: 12, marginTop: 8 }}>{fetchError}</p>
            )}
          </div>

          {fetchedMovie && (
            <div
              className="flex items-center gap-4 p-3 mb-4"
              style={{ background: '#141414', border: `1px solid ${C.border}`, borderRadius: 8 }}
            >
              <div
                style={{
                  width: 56,
                  aspectRatio: '2/3',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fetchedMovie.posterUrl}
                  alt={fetchedMovie.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                  {fetchedMovie.title}
                </span>
                <span style={{ color: C.muted, fontSize: 13 }}>{fetchedMovie.year}</span>
                <span
                  style={{
                    background: '#0a1a0a',
                    border: '1px solid #00e054',
                    color: '#00e054',
                    borderRadius: 999,
                    fontSize: 10,
                    padding: '2px 8px',
                    width: 'fit-content',
                    marginTop: 2,
                  }}
                >
                  ✓ Found
                </span>
              </div>
            </div>
          )}

          {fetchedMovie && (
            <div>
              <label className={labelClass} style={labelStyle}>
                Movie Title
              </label>
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
          )}
          <div>
            <label className={labelClass} style={labelStyle}>
              Chosen By
            </label>
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
          <div>
            <button
              type="submit"
              disabled={loading || !formData.posterUrl}
              className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: C.green,
                color: '#000',
                borderRadius: 8,
                fontWeight: 600,
                padding: '10px 24px',
                fontSize: 14,
                width: 'fit-content',
              }}
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Adding...' : 'Add Film'}
            </button>
            {!formData.posterUrl && (
              <p style={{ color: C.dim, fontSize: 12, marginTop: 10 }}>Fetch a movie first</p>
            )}
          </div>
        </form>
      </section>

      {/* ── Edit Film Details ────────────────────────────────── */}
      {(currentFilm || archiveFilms.length > 0) && (
        <section
          className="mb-12"
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Edit2 size={16} style={{ color: C.dim }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Edit Film Details</h2>
          </div>

          <div className="flex gap-4 mb-6 border-b pb-3" style={{ borderColor: C.border }}>
            <button
              onClick={() => {
                setEditTab('current');
                if (currentFilm) {
                  setEditData({
                    filmId: currentFilm._id,
                    title: currentFilm.title || '',
                    posterUrl: currentFilm.posterUrl || '',
                    chosenBy: currentFilm.chosenBy || '',
                    chosenByEmail: currentFilm.chosenByEmail || '',
                    timerPaused: currentFilm.timerPaused || false,
                    tmdbUrl: currentFilm.tmdbUrl || '',
                  });
                }
              }}
              style={{
                color: editTab === 'current' ? C.green : C.dim,
                fontWeight: 600,
                fontSize: 14,
                borderBottom: editTab === 'current' ? `2px solid ${C.green}` : 'none',
                paddingBottom: 4,
              }}
            >
              Edit Current
            </button>
            <button
              onClick={() => {
                setEditTab('previous');
                if (archiveFilms.length > 0) {
                  const f = archiveFilms[0];
                  setEditData({
                    filmId: f._id,
                    title: f.title || '',
                    posterUrl: f.posterUrl || '',
                    chosenBy: f.chosenBy || '',
                    chosenByEmail: f.chosenByEmail || '',
                    timerPaused: false,
                    tmdbUrl: f.tmdbUrl || '',
                  });
                }
              }}
              style={{
                color: editTab === 'previous' ? C.green : C.dim,
                fontWeight: 600,
                fontSize: 14,
                borderBottom: editTab === 'previous' ? `2px solid ${C.green}` : 'none',
                paddingBottom: 4,
              }}
            >
              Edit Previous
            </button>
          </div>

          {editMsg && (
            <div
              className="mb-6 p-3 rounded-lg text-sm"
              style={{
                backgroundColor:
                  editMsg.type === 'success' ? 'rgba(0,224,84,0.1)' : 'rgba(255,100,100,0.1)',
                color: editMsg.type === 'success' ? C.green : '#ff6464',
                border: `1px solid ${editMsg.type === 'success' ? 'rgba(0,224,84,0.2)' : 'rgba(255,100,100,0.2)'}`,
              }}
            >
              {editMsg.text}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-5">
            {editTab === 'previous' && (
              <div>
                <label className={labelClass} style={labelStyle}>
                  Select Film
                </label>
                <select
                  value={editData.filmId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const f = archiveFilms.find((x) => x && x._id === selectedId);
                    if (f) {
                      setEditData({
                        filmId: f._id,
                        title: f.title || '',
                        posterUrl: f.posterUrl || '',
                        chosenBy: f.chosenBy || '',
                        chosenByEmail: f.chosenByEmail || '',
                        timerPaused: false,
                        tmdbUrl: f.tmdbUrl || '',
                      });
                    }
                  }}
                  className={inputClass}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {archiveFilms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editTab === 'current' && (
              <>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Movie Title
                  </label>
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
                  <label className={labelClass} style={labelStyle}>
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editData.posterUrl}
                    onChange={(e) => setEditData({ ...editData, posterUrl: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClass} style={labelStyle}>
                TMDB URL
              </label>
              <input
                type="url"
                value={editData.tmdbUrl}
                onChange={(e) => setEditData({ ...editData, tmdbUrl: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>
                Chosen By
              </label>
              <input
                type="text"
                value={editData.chosenBy}
                onChange={(e) => setEditData({ ...editData, chosenBy: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {editTab === 'current' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="timerPaused"
                  checked={editData.timerPaused}
                  onChange={(e) => setEditData({ ...editData, timerPaused: e.target.checked })}
                  style={{ accentColor: C.green, width: 16, height: 16, cursor: 'pointer' }}
                />
                <label
                  htmlFor="timerPaused"
                  style={{ color: 'white', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}
                >
                  Pause countdown timer (prevent auto-archiving)
                </label>
              </div>
            )}
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
                fontSize: 14,
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
        className="mb-12"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: C.orange }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Tie Breaker</h2>
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
              fontWeight: 600,
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
              <p
                className="mb-2"
                style={{
                  color: C.dim,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {isSpinning ? 'SPINNING...' : 'THE WINNER IS'}
              </p>
              <p
                className="font-bold transition-all duration-300"
                style={{
                  color: isSpinning ? C.muted : C.green,
                  fontSize: 32,
                }}
              >
                {winner.name}
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

      {/* ── Import Leaderboard ───────────────────────────────── */}
      <section
        className="mb-12"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Upload size={16} style={{ color: C.dim }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>
            Import Leaderboard from CSV
          </h2>
        </div>
        <p style={{ color: C.dim, fontSize: 12, marginBottom: 20 }}>
          CSV must have columns: name, email, watchedCount
        </p>

        {/* Drag-drop zone */}
        <div
          onClick={() => importInputRef.current?.click()}
          style={{
            border: `1px dashed ${importFile ? C.blue : '#2e2e2e'}`,
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            marginBottom: 16,
          }}
        >
          <Upload size={20} style={{ color: C.dim, margin: '0 auto 8px' }} />
          <p style={{ color: importFile ? 'white' : C.dim, fontSize: 13, margin: 0 }}>
            {importFile ? importFile.name : 'Drop CSV here or click to upload'}
          </p>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              setImportFile(e.target.files?.[0] ?? null);
              setImportResult(null);
              setImportError(null);
            }}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={!importFile || importLoading}
          className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: C.green,
            color: '#000',
            borderRadius: 8,
            fontWeight: 600,
            padding: '10px 24px',
            fontSize: 14,
            border: 'none',
            cursor: !importFile || importLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {importLoading && <Loader2 className="animate-spin" size={16} />}
          {importLoading ? 'Importing...' : 'Import'}
        </button>

        {importResult && (
          <p style={{ color: C.green, fontSize: 13, marginTop: 12 }}>
            ✓ {importResult.imported} records imported, {importResult.skipped} skipped
          </p>
        )}
        {importError && (
          <p style={{ color: '#ff6464', fontSize: 13, marginTop: 12 }}>{importError}</p>
        )}
      </section>

      {/* ── Danger Zone ──────────────────────────────────────── */}
      <section
        className="mb-12"
        style={{
          backgroundColor: '#1a0a0a',
          border: '1px solid rgba(255,100,100,0.2)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#ff6464', margin: '0 0 4px 0' }}>
              Reset Leaderboard
            </h2>
            <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>
              Sets all user watched counts back to 0. This cannot be undone.
            </p>
          </div>
          <button
            onClick={handleResetLeaderboard}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #ff6464',
              color: '#ff6464',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            className="hover:bg-red-500/10 transition-colors"
          >
            Reset Leaderboard
          </button>
        </div>
      </section>
    </div>
  );
}
