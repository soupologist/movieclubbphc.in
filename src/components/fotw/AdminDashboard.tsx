'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, Edit2, Upload } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown, { type Components } from 'react-markdown';
import Papa from 'papaparse';
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

  const parseDuration = (ms?: number) => {
    const val = ms ?? 604800000;
    const totalS = Math.floor(val / 1000);
    return {
      timerD: Math.floor(totalS / 86400),
      timerH: Math.floor((totalS % 86400) / 3600),
      timerM: Math.floor((totalS % 3600) / 60),
      timerS: totalS % 60,
    };
  };

  // Add Film State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    posterUrl: '',
    chosenBy: '',
    chosenByEmail: '',
    tmdbUrl: '',
    timerD: 7,
    timerH: 0,
    timerM: 0,
    timerS: 0,
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
    timerD: 7,
    timerH: 0,
    timerM: 0,
    timerS: 0,
  });
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General State
  const [currentFilm, setCurrentFilm] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<
    { name: string; watchedCount: number; email: string; timesSuggested?: number }[]
  >([]);
  const [archiveFilms, setArchiveFilms] = useState<any[]>([]);
  const [winner, setWinner] = useState<{ name: string; email: string } | null>(null);
  const [cycleReset, setCycleReset] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Single Bulk CSV Import State
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [historyStep, setHistoryStep] = useState<1 | 2>(1); // 1 = Upload, 2 = Review & Submit
  const [preparedUsers, setPreparedUsers] = useState<any[]>([]);
  const [preparedHistoryFilms, setPreparedHistoryFilms] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMsg, setHistoryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const historyInputRef = useRef<HTMLInputElement>(null);

  // Rules Editor State
  const [rulesContent, setRulesContent] = useState('');
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesMessage, setRulesMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [rulesUpdatedAt, setRulesUpdatedAt] = useState<string | null>(null);
  const [rulesUpdatedBy, setRulesUpdatedBy] = useState<string | null>(null);
  const [rulesPreview, setRulesPreview] = useState(false);

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
            ...parseDuration(d.currentFilm.timerDuration),
          });
        }
      })
      .catch((err) => console.error(err));

    loadRules();
  }, []);

  const showAddMessage = (type: 'success' | 'error', text: string) => {
    setAddMsg({ type, text });
    setTimeout(() => setAddMsg(null), 4000);
  };

  const showEditMessage = (type: 'success' | 'error', text: string) => {
    setEditMsg({ type, text });
    setTimeout(() => setEditMsg(null), 4000);
  };

  const loadRules = async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const res = await fetch('/api/fotw/rules');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load rules');
      setRulesContent(data.content || '');
      setRulesUpdatedAt(data.updatedAt || null);
      setRulesUpdatedBy(data.updatedBy || null);
    } catch (error: any) {
      setRulesError(error?.message || 'Failed to load rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleSaveRules = async () => {
    setRulesSaving(true);
    setRulesMessage(null);
    try {
      const res = await fetch('/api/fotw/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rulesContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save rules');
      setRulesUpdatedAt(data.updatedAt || null);
      setRulesUpdatedBy(data.updatedBy || null);
      setRulesMessage({ type: 'success', text: 'Rules saved successfully' });
    } catch (error: any) {
      setRulesMessage({ type: 'error', text: error?.message || 'Failed to save rules' });
    } finally {
      setRulesSaving(false);
    }
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
      const title = d.title;
      const posterUrl = d.posterUrl;
      const year = d.year;
      if (!title || !posterUrl || !year) {
        throw new Error('TMDB response missing movie data');
      }
      setFetchedMovie({ title, posterUrl, year });
      setFormData((prev) => ({
        ...prev,
        title: `${title} (${year})`,
        posterUrl,
        tmdbUrl: tmdbUrlInput,
      }));
      setFetchError(null);
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
      const payload = {
        ...formData,
        timerDuration:
          (formData.timerD * 86400 +
            formData.timerH * 3600 +
            formData.timerM * 60 +
            formData.timerS) *
          1000,
      };

      const res = await fetch('/api/fotw/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showAddMessage('success', 'Film added successfully! Redirecting...');
        setFormData({
          title: '',
          posterUrl: '',
          chosenBy: '',
          chosenByEmail: '',
          tmdbUrl: '',
          timerD: 7,
          timerH: 0,
          timerM: 0,
          timerS: 0,
        });
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
      const payload = {
        ...editData,
        timerDuration:
          (editData.timerD * 86400 +
            editData.timerH * 3600 +
            editData.timerM * 60 +
            editData.timerS) *
          1000,
      };

      const res = await fetch('/api/fotw/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

    // Filter out candidates with no name and users who already suggested before.
    candidates = candidates.filter(
      (u) => u.name && u.name.trim() !== '' && (u.timesSuggested ?? 0) === 0
    );
    if (candidates.length === 0) {
      alert(
        'No eligible users found. Either names are missing or everyone already suggested a film.'
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

  const handleHistoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHistoryFile(file);
    setHistoryMsg(null);

    const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as string[][];

        if (rawData.length < 2 || (rawData[0] || []).length < 6) {
          setHistoryMsg({
            type: 'error',
            text: 'CSV must include at least 6 columns: name, email, watch count, times suggested, film suggested, and films.',
          });
          return;
        }

        const topRow = rawData[0];

        const required = ['name', 'email', 'watchcount', 'timessuggested', 'filmsuggested'];
        const normalizedFirstFive = topRow
          .slice(0, 5)
          .map((h) => normalizeHeader((h || '').trim()));
        const headersMatch = required.every((field, idx) => normalizedFirstFive[idx] === field);

        if (!headersMatch) {
          setHistoryMsg({
            type: 'error',
            text: 'CSV headers must be ordered as: name, email, watch count, times suggested, film suggested, then movie columns.',
          });
          return;
        }

        const filmsFound: any[] = topRow.slice(5).map((filmTitleRaw) => ({
          title: (filmTitleRaw || '').trim(),
          originalTitle: (filmTitleRaw || '').trim(),
          chosenBy: '',
          chosenByEmail: '',
          tmdbUrl: '',
          posterUrl: '',
          watches: [],
          fetchLoading: false,
          fetchError: null,
        }));

        const usersFound: any[] = [];

        for (let r = 1; r < rawData.length; r++) {
          const row = rawData[r] || [];
          const name = (row[0] || '').trim();
          const email = (row[1] || '').trim();
          if (!email) continue;

          const timesSuggested = Number.parseInt((row[3] || '0').trim(), 10);
          const filmSuggested = (row[4] || '').trim();
          let computedWatchCount = 0;

          for (let col = 5; col < topRow.length; col++) {
            const cellVal = (row[col] || '').trim();
            if (!cellVal) continue;

            // Any non-blank cell means user watched this film.
            computedWatchCount += 1;

            const film = filmsFound[col - 5];
            if (!film?.title) continue;

            let rating: number | null = null;
            if (cellVal !== '0') {
              const parsed = Number(cellVal);
              if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5) {
                rating = parsed;
              }
            }

            film.watches.push({
              name: name || email.split('@')[0],
              email,
              rating,
            });
          }

          usersFound.push({
            name: name || email.split('@')[0],
            email,
            watchedCount: computedWatchCount,
            timesSuggested: Number.isNaN(timesSuggested) ? 0 : timesSuggested,
            filmSuggested,
          });
        }

        const filmsWithTitles = filmsFound.filter((f) => f.title);
        usersFound.forEach((u) => {
          if (!u.filmSuggested || u.timesSuggested <= 0) return;
          const matchedFilm = filmsWithTitles.find(
            (f) => f.title.toLowerCase() === u.filmSuggested.toLowerCase()
          );
          if (matchedFilm && !matchedFilm.chosenByEmail) {
            matchedFilm.chosenBy = u.name;
            matchedFilm.chosenByEmail = u.email;
          }
        });

        setPreparedUsers(usersFound);
        setPreparedHistoryFilms(filmsWithTitles);
        setHistoryStep(2);
      },
      error: (error) => {
        setHistoryMsg({ type: 'error', text: 'Failed to parse CSV: ' + error.message });
      },
    });
  };

  const fetchTmdbForHistory = async (index: number, tmdbUrl: string) => {
    const films = [...preparedHistoryFilms];
    films[index].fetchLoading = true;
    films[index].fetchError = null;
    setPreparedHistoryFilms(films);

    try {
      const res = await fetch('/api/fotw/admin/resolve-tmdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbUrl }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to fetch movie data');
      films[index].title = `${d.title} (${d.year})`;
      films[index].posterUrl = d.posterUrl;
      films[index].tmdbUrl = tmdbUrl;
      films[index].fetchError = null;
    } catch (e: any) {
      films[index].fetchError = e.message;
    } finally {
      films[index].fetchLoading = false;
      setPreparedHistoryFilms([...films]);
    }
  };

  const handleHistorySubmit = async () => {
    const validFilms = preparedHistoryFilms.filter((f) => f.posterUrl && f.title);
    if (validFilms.length < preparedHistoryFilms.length) {
      if (
        !window.confirm(
          "Some films don't have a poster (TMDB fetch needed). They will be skipped. Continue?"
        )
      )
        return;
    }

    setHistoryLoading(true);
    setHistoryMsg(null);
    try {
      const payload = { users: preparedUsers, films: validFilms };
      const res = await fetch('/api/fotw/admin/import-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Import failed');

      setHistoryMsg({ type: 'success', text: d.message });
      setHistoryStep(1);
      setHistoryFile(null);
      setPreparedUsers([]);
      setPreparedHistoryFilms([]);

      const [adminRes, archiveRes] = await Promise.all([
        fetch('/api/fotw/admin/leaderboard').then((r) => r.json()),
        fetch('/api/fotw/archive').then((r) => r.json()),
      ]);
      setLeaderboard(adminRes.leaderboard || []);
      setArchiveFilms(Array.isArray(archiveRes) ? archiveRes : []);
    } catch (err: any) {
      setHistoryMsg({ type: 'error', text: err.message || 'Error importing history' });
    } finally {
      setHistoryLoading(false);
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

  const lastSavedLabel = useMemo(() => {
    if (!rulesUpdatedAt) return null;
    const date = new Date(rulesUpdatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [rulesUpdatedAt]);

  const markdownComponents = useMemo<Components>(
    () => ({
      h1: ({ children }) => (
        <h1
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.6rem' }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.4rem' }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.2rem' }}
        >
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p style={{ color: '#8a9bb0', lineHeight: 1.8, fontSize: 15 }}>{children}</p>
      ),
      ul: ({ children }) => (
        <ul style={{ color: '#8a9bb0', paddingLeft: 20, lineHeight: 2 }}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol style={{ color: '#8a9bb0', paddingLeft: 20, lineHeight: 2 }}>{children}</ol>
      ),
      li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
      strong: ({ children }) => <strong style={{ color: 'white' }}>{children}</strong>,
      hr: () => <hr style={{ borderColor: '#1e1e1e', margin: '24px 0' }} />,
      code: ({ children }) => (
        <code
          style={{
            background: '#141414',
            border: '1px solid #1e1e1e',
            borderRadius: 4,
            padding: '2px 6px',
            color: '#00e054',
            fontSize: 13,
          }}
        >
          {children}
        </code>
      ),
    }),
    []
  );

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
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Timer (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.timerD}
                onChange={(e) => setFormData({ ...formData, timerD: Number(e.target.value) })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.timerH}
                onChange={(e) => setFormData({ ...formData, timerH: Number(e.target.value) })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.timerM}
                onChange={(e) => setFormData({ ...formData, timerM: Number(e.target.value) })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                (Seconds)
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.timerS}
                onChange={(e) => setFormData({ ...formData, timerS: Number(e.target.value) })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
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
                    ...parseDuration(currentFilm.timerDuration),
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
                    ...parseDuration(f.timerDuration),
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
                        ...parseDuration(f.timerDuration),
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

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={labelClass} style={labelStyle}>
                  Timer (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editData.timerD}
                  onChange={(e) => setEditData({ ...editData, timerD: Number(e.target.value) })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editData.timerH}
                  onChange={(e) => setEditData({ ...editData, timerH: Number(e.target.value) })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editData.timerM}
                  onChange={(e) => setEditData({ ...editData, timerM: Number(e.target.value) })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  (Seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editData.timerS}
                  onChange={(e) => setEditData({ ...editData, timerS: Number(e.target.value) })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
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

      {/* ── Bulk CSV Import ──────────────────────────────────────── */}
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
          <Upload size={18} style={{ color: C.dim }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
            Bulk CSV Upload (Users + Archive)
          </h2>
        </div>
        <p style={{ color: C.dim, fontSize: 12, marginBottom: 16 }}>
          Column order must be: name, email, watch count, times suggested, film suggested, then one
          column per film. Watch count column is ignored and recomputed from movie cells. Blank
          means not watched, 0 means watched without rating, 1-5 is rating.
        </p>

        {historyMsg && (
          <div
            className="mb-6 p-3 rounded-lg text-sm"
            style={{
              backgroundColor:
                historyMsg.type === 'success' ? 'rgba(0,224,84,0.1)' : 'rgba(255,100,100,0.1)',
              color: historyMsg.type === 'success' ? C.green : '#ff6464',
              border: `1px solid ${historyMsg.type === 'success' ? 'rgba(0,224,84,0.2)' : 'rgba(255,100,100,0.2)'}`,
            }}
          >
            {historyMsg.text}
          </div>
        )}

        {historyStep === 1 && (
          <div
            onClick={() => historyInputRef.current?.click()}
            style={{
              border: `1px dashed ${historyFile ? C.blue : '#2e2e2e'}`,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              marginBottom: 16,
            }}
          >
            <Upload size={20} style={{ color: C.dim, margin: '0 auto 8px' }} />
            <p style={{ color: historyFile ? 'white' : C.dim, fontSize: 13, margin: 0 }}>
              {historyFile ? historyFile.name : 'Drop Bulk CSV here or click to upload'}
            </p>
            <input
              ref={historyInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleHistoryFileUpload}
            />
          </div>
        )}

        {historyStep === 2 && (
          <div className="space-y-6">
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 12,
                background: '#141414',
              }}
            >
              <p style={{ color: 'white', fontSize: 13, margin: 0 }}>
                Parsed {preparedUsers.length} users and {preparedHistoryFilms.length} films. Review
                before saving.
              </p>
              <p style={{ color: C.muted, fontSize: 12, margin: '10px 0 0 0' }}>
                Re-upload behavior: for existing films, poster and chosen-by are preserved; watch
                data, ratings, and TMDB URL are refreshed from this CSV.
              </p>
            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <h3 style={{ color: 'white', fontSize: 13, margin: '0 0 8px 0' }}>Users Preview</h3>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', fontSize: 12, color: C.muted }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', paddingBottom: 8 }}>Name</th>
                      <th style={{ textAlign: 'left', paddingBottom: 8 }}>Email</th>
                      <th style={{ textAlign: 'left', paddingBottom: 8 }}>Watch Count</th>
                      <th style={{ textAlign: 'left', paddingBottom: 8 }}>Times Suggested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparedUsers.slice(0, 12).map((u, i) => (
                      <tr key={`${u.email}-${i}`}>
                        <td style={{ padding: '4px 0' }}>{u.name}</td>
                        <td style={{ padding: '4px 0' }}>{u.email}</td>
                        <td style={{ padding: '4px 0' }}>{u.watchedCount}</td>
                        <td style={{ padding: '4px 0' }}>{u.timesSuggested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preparedUsers.length > 12 && (
                <p style={{ color: C.dim, fontSize: 11, margin: '8px 0 0 0' }}>
                  Showing first 12 users.
                </p>
              )}
            </div>

            {preparedHistoryFilms.map((film, i) => (
              <div
                key={i}
                style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {film.posterUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={film.posterUrl}
                      alt="Poster"
                      style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 4 }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0' }}>
                      {film.title}{' '}
                      <span style={{ color: C.dim, fontSize: 12, fontWeight: 400 }}>
                        ({film.originalTitle})
                      </span>
                    </h3>
                    <p style={{ color: C.dim, fontSize: 12, margin: '0 0 8px 0' }}>
                      Chosen by: {film.chosenBy || 'Unknown'} • Watches: {film.watches.length} •
                      Ratings: {film.watches.filter((w: any) => Number(w.rating) > 0).length}
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        placeholder="TMDB URL"
                        value={film.tmdbUrl}
                        readOnly={!!film.posterUrl}
                        onChange={(e) => {
                          const f = [...preparedHistoryFilms];
                          f[i].tmdbUrl = e.target.value;
                          setPreparedHistoryFilms(f);
                        }}
                        className={inputClass}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      {!film.posterUrl && (
                        <button
                          onClick={() => fetchTmdbForHistory(i, film.tmdbUrl)}
                          disabled={film.fetchLoading || !film.tmdbUrl}
                          style={{
                            background: '#2e2e2e',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 16px',
                            cursor: film.fetchLoading || !film.tmdbUrl ? 'not-allowed' : 'pointer',
                            fontSize: 13,
                          }}
                        >
                          {film.fetchLoading ? 'Fetching...' : 'Fetch'}
                        </button>
                      )}
                    </div>
                    {film.fetchError && (
                      <p style={{ color: '#ff6464', fontSize: 12, margin: '8px 0 0 0' }}>
                        {film.fetchError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setHistoryStep(1)}
                style={{
                  ...inputStyle,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2e2e2e',
                  color: 'white',
                  fontWeight: 600,
                  padding: '10px 24px',
                }}
              >
                Back
              </button>
              <button
                onClick={handleHistorySubmit}
                disabled={historyLoading}
                style={{
                  ...inputStyle,
                  border: 'none',
                  cursor: historyLoading ? 'not-allowed' : 'pointer',
                  background: C.green,
                  color: 'black',
                  fontWeight: 600,
                  padding: '10px 24px',
                  opacity: historyLoading ? 0.7 : 1,
                }}
              >
                {historyLoading ? 'Saving...' : 'Save to Database'}
              </button>
            </div>
          </div>
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

      {/* ── Rules Editor ───────────────────────────────────── */}
      <section
        className="mb-12"
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Edit Rules</h2>
          <button
            onClick={() => setRulesPreview((prev) => !prev)}
            style={{
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.muted,
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
            className="hover:text-white! hover:border-[#2e2e2e]!"
          >
            {rulesPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {rulesError && (
          <p style={{ color: '#ff6464', fontSize: 12, marginBottom: 12 }}>{rulesError}</p>
        )}

        <div className={rulesPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : undefined}>
          <div>
            <textarea
              value={rulesContent}
              onChange={(e) => setRulesContent(e.target.value)}
              placeholder="Enter rules in Markdown format..."
              disabled={rulesLoading}
              style={{
                width: '100%',
                minHeight: 400,
                background: '#0a0a0a',
                border: '1px solid #1e1e1e',
                borderRadius: 8,
                color: 'white',
                fontFamily: 'monospace',
                fontSize: 13,
                padding: 14,
                lineHeight: 1.6,
                opacity: rulesLoading ? 0.6 : 1,
              }}
            />
            <p style={{ color: '#4a5568', fontSize: 11, marginTop: 8, marginBottom: 0 }}>
              Supports Markdown. Use ## for headings, **bold**, - for bullet points.
            </p>
          </div>

          {rulesPreview && (
            <div
              style={{
                background: '#0a0a0a',
                border: '1px solid #1e1e1e',
                borderRadius: 8,
                padding: 16,
                minHeight: 400,
              }}
            >
              <ReactMarkdown components={markdownComponents}>{rulesContent}</ReactMarkdown>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveRules}
          disabled={rulesSaving || rulesLoading}
          className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            marginTop: 16,
            backgroundColor: C.green,
            color: '#000',
            borderRadius: 8,
            fontWeight: 600,
            padding: '10px 24px',
            fontSize: 14,
            width: '100%',
          }}
        >
          {rulesSaving ? 'Saving...' : 'Save Rules'}
        </button>

        {rulesMessage && (
          <p
            style={{
              color: rulesMessage.type === 'success' ? C.green : '#ff6464',
              fontSize: 12,
              marginTop: 10,
            }}
          >
            {rulesMessage.text}
          </p>
        )}

        {lastSavedLabel && (
          <p style={{ color: '#4a5568', fontSize: 11, marginTop: 8, marginBottom: 0 }}>
            Last saved by {rulesUpdatedBy || 'system'} on {lastSavedLabel}
          </p>
        )}
      </section>
    </div>
  );
}
