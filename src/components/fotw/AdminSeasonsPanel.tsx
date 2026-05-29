'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Link as LinkIcon, Save } from 'lucide-react';

const C = {
  bg: '#000000',
  card: '#0f0f0f',
  border: '#1e1e1e',
  muted: '#8a9bb0',
  dim: '#4a5568',
  green: '#00e054',
  inputBg: '#0a0a0a',
};

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  letterboxdUrl?: string;
  filmCount: number;
  totalWatches: number;
  uniqueWatchers: number;
  avgRating: number | null;
}

export default function AdminSeasonsPanel() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  // All-time URL config
  const [allTimeUrl, setAllTimeUrl] = useState('');
  const [allTimeUrlInput, setAllTimeUrlInput] = useState('');
  const [savingAllTime, setSavingAllTime] = useState(false);
  const [allTimeMsg, setAllTimeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isActive: false, letterboxdUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSeasons();
    fetchAllTimeConfig();
  }, []);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fotw/admin/seasons');
      const data = await res.json();
      if (res.ok) {
        setSeasons(data.seasons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTimeConfig = async () => {
    try {
      const res = await fetch('/api/fotw/admin/config');
      const data = await res.json();
      if (res.ok) {
        setAllTimeUrl(data.letterboxdAllTimeUrl || '');
        setAllTimeUrlInput(data.letterboxdAllTimeUrl || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveAllTimeUrl = async () => {
    setSavingAllTime(true);
    setAllTimeMsg(null);
    try {
      const res = await fetch('/api/fotw/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterboxdAllTimeUrl: allTimeUrlInput }),
      });
      if (res.ok) {
        setAllTimeUrl(allTimeUrlInput);
        setAllTimeMsg({ type: 'success', text: 'Saved!' });
        setTimeout(() => setAllTimeMsg(null), 3000);
      } else {
        const d = await res.json();
        setAllTimeMsg({ type: 'error', text: d.message || 'Failed to save' });
      }
    } catch (e) {
      setAllTimeMsg({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSavingAllTime(false);
    }
  };

  const openCreate = () => {
    setEditingSeason(null);
    setFormData({ name: '', startDate: '', endDate: '', isActive: false, letterboxdUrl: '' });
    setShowModal(true);
  };

  const openEdit = (s: Season) => {
    setEditingSeason(s);
    setFormData({
      name: s.name,
      startDate: s.startDate.split('T')[0],
      endDate: s.endDate ? s.endDate.split('T')[0] : '',
      isActive: s.isActive,
      letterboxdUrl: s.letterboxdUrl || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate) return;

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        isActive: formData.isActive,
        letterboxdUrl: formData.letterboxdUrl,
      };

      const url = editingSeason ? `/api/fotw/admin/seasons/${editingSeason._id}` : `/api/fotw/admin/seasons`;
      const method = editingSeason ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.message || 'Failed to save season');
      } else {
        setShowModal(false);
        fetchSeasons();
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('This will only delete the season definition. All film and watch data is unaffected.')) {
      return;
    }

    try {
      const res = await fetch(`/api/fotw/admin/seasons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSeasons(seasons.filter(s => s._id !== id));
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting.');
    }
  };

  const setAsActive = async (id: string) => {
    try {
      const res = await fetch(`/api/fotw/admin/seasons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        fetchSeasons();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to update season');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while setting active season.');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <section className="mb-12">
      {/* ── General Settings ─────────────────────────────── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon size={18} color={C.muted} />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>General Settings</h2>
        </div>

        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6 }}>
            All Time Letterboxd URL
            <span style={{ color: C.dim, marginLeft: 8, fontWeight: 400 }}>shown when no season is selected</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={allTimeUrlInput}
              onChange={e => setAllTimeUrlInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                color: 'white',
                fontSize: 14,
              }}
              placeholder="e.g. https://letterboxd.com/movieclubbphc/lists/"
            />
            <button
              onClick={saveAllTimeUrl}
              disabled={savingAllTime || allTimeUrlInput === allTimeUrl}
              style={{
                backgroundColor: allTimeUrlInput !== allTimeUrl ? 'white' : C.inputBg,
                color: allTimeUrlInput !== allTimeUrl ? 'black' : C.dim,
                border: `1px solid ${allTimeUrlInput !== allTimeUrl ? 'white' : C.border}`,
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: allTimeUrlInput !== allTimeUrl ? 'pointer' : 'default',
                transition: 'all 0.2s',
                opacity: savingAllTime ? 0.6 : 1,
              }}
            >
              <Save size={14} />
              {savingAllTime ? 'Saving...' : 'Save'}
            </button>
          </div>
          {allTimeMsg && (
            <p style={{ fontSize: 12, marginTop: 6, margin: '6px 0 0 0', color: allTimeMsg.type === 'success' ? C.green : '#ef4444' }}>
              {allTimeMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* ── Seasons Management ────────────────────────────── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} color={C.muted} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>Seasons Management</h2>
          </div>
          <button
            onClick={openCreate}
            style={{
              backgroundColor: 'white',
              color: 'black',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            className="hover:bg-gray-200 transition-colors"
          >
            <Plus size={14} /> New Season
          </button>
        </div>

        {loading ? (
          <div style={{ color: C.dim, textAlign: 'center', padding: '20px 0' }}>Loading seasons...</div>
        ) : seasons.length === 0 ? (
          <div style={{ color: C.dim, textAlign: 'center', padding: '40px 0', border: `1px dashed ${C.border}`, borderRadius: 8 }}>
            No seasons found. Create one to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {seasons.map(s => (
              <div
                key={s._id}
                style={{
                  border: `1px solid ${s.isActive ? C.green : C.border}`,
                  backgroundColor: s.isActive ? 'rgba(0, 224, 84, 0.03)' : C.inputBg,
                  borderRadius: 12,
                  padding: '16px 20px',
                  position: 'relative',
                  boxShadow: s.isActive ? `0 0 12px rgba(0, 224, 84, 0.05)` : 'none'
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>{s.name}</h3>
                      {s.isActive && (
                        <span style={{ backgroundColor: C.green, color: 'black', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Active Season
                        </span>
                      )}
                    </div>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                      {formatDate(s.startDate)} — {s.endDate ? formatDate(s.endDate) : 'Ongoing'}
                    </p>
                    {s.letterboxdUrl && (
                      <a
                        href={s.letterboxdUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: C.dim, fontSize: 11, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                        className="hover:text-[#8a9bb0] transition-colors"
                      >
                        <LinkIcon size={10} /> {s.letterboxdUrl}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!s.isActive && (
                      <button
                        onClick={() => setAsActive(s._id)}
                        style={{ fontSize: 12, color: C.muted, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 6, background: 'none' }}
                        className="hover:text-white hover:border-gray-500 transition-colors"
                      >
                        Set as Active
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(s)}
                      style={{ background: 'none', border: 'none', color: C.muted, padding: 6, cursor: 'pointer' }}
                      className="hover:text-white transition-colors"
                      title="Edit Season"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', padding: 6, cursor: 'pointer' }}
                      className="hover:text-red-400 transition-colors"
                      title="Delete Season"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <p style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Films</p>
                    <p style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>{s.filmCount}</p>
                  </div>
                  <div>
                    <p style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Watches</p>
                    <p style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>{s.totalWatches}</p>
                  </div>
                  <div>
                    <p style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Unique Watchers</p>
                    <p style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>{s.uniqueWatchers}</p>
                  </div>
                  <div>
                    <p style={{ color: C.dim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Avg Rating</p>
                    <p style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>{s.avgRating !== null ? s.avgRating.toFixed(1) : '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: 0 }}>
                {editingSeason ? 'Edit Season' : 'Create Season'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }} className="hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 8 }}>Season Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }}
                  placeholder="e.g. Summer 2026"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 8 }}>
                  Letterboxd List URL
                  <span style={{ color: C.dim, marginLeft: 6, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.letterboxdUrl}
                  onChange={e => setFormData({ ...formData, letterboxdUrl: e.target.value })}
                  style={{ width: '100%', backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }}
                  placeholder="https://letterboxd.com/movieclubbphc/list/season-1/"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 8 }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 8 }}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ accentColor: C.green, width: 16, height: 16 }}
                  />
                  <span style={{ color: 'white', fontSize: 14 }}>Set as active season</span>
                </label>
                <p style={{ color: C.dim, fontSize: 12, margin: '4px 0 0 24px' }}>
                  This will unset any currently active season.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: 'transparent', color: 'white', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 8 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: 'white', color: 'black', fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 8, opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
