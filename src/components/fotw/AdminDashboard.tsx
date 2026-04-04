'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { instrumentSerif } from '@/app/fonts';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    posterUrl: '',
    driveLink: '',
    chosenBy: '',
  });

  const [leaderboard, setLeaderboard] = useState<{ name: string; ratingsCount: number }[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    fetch('/api/fotw/data')
      .then((res) => res.json())
      .then((d) => {
        if (!d.isAdmin) {
          router.push('/club/filmoftheweek');
        }
        setLeaderboard(d.leaderboard);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/fotw/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Film added successfully!');
        setFormData({ title: '', posterUrl: '', driveLink: '', chosenBy: '' });
      } else {
        alert('Failed to add film');
      }
    } catch (err) {
      alert('Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = () => {
    if (leaderboard.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    const maxScore = Math.max(...leaderboard.map((u) => u.ratingsCount));
    const candidates = leaderboard.filter((u) => u.ratingsCount === maxScore);

    let duration = 3000;
    let interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * candidates.length);
      setWinner(candidates[randomIdx].name);
      elapsed += interval;
      if (elapsed >= duration) {
        clearInterval(timer);
        setIsSpinning(false);
        const finalIdx = Math.floor(Math.random() * candidates.length);
        setWinner(candidates[finalIdx].name);
      }
    }, interval);
  };

  return (
    <div className="pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/club/filmoftheweek"
          className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800/60 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1
          className={`text-4xl font-bold text-white ${instrumentSerif.className}`}
        >
          Admin Dashboard
        </h1>
      </div>

      {/* Add Film Section */}
      <section className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Plus size={20} className="text-zinc-500" />
          <h2 className="text-xl font-semibold text-white">Add New Film</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-zinc-500 text-sm mb-1.5">Movie Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 text-white focus:border-zinc-600/50 transition-colors text-sm placeholder:text-zinc-700"
              placeholder="e.g. Mulholland Drive"
            />
          </div>
          <div>
            <label className="block text-zinc-500 text-sm mb-1.5">Poster Image URL</label>
            <input
              type="url"
              required
              value={formData.posterUrl}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 text-white focus:border-zinc-600/50 transition-colors text-sm placeholder:text-zinc-700"
              placeholder="https://example.com/poster.jpg"
            />
          </div>
          <div>
            <label className="block text-zinc-500 text-sm mb-1.5">Google Drive Link</label>
            <input
              type="url"
              required
              value={formData.driveLink}
              onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 text-white focus:border-zinc-600/50 transition-colors text-sm placeholder:text-zinc-700"
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <label className="block text-zinc-500 text-sm mb-1.5">Chosen By</label>
            <input
              type="text"
              value={formData.chosenBy}
              onChange={(e) => setFormData({ ...formData, chosenBy: e.target.value })}
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 text-white focus:border-zinc-600/50 transition-colors text-sm placeholder:text-zinc-700"
              placeholder="Name of the member who chose this film"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-zinc-200 text-black font-bold py-3 px-8 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Adding...' : 'Add Film'}
          </button>
        </form>
      </section>

      {/* Spin Wheel Section */}
      <section className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Tie Breaker</h2>
          </div>
          <button
            onClick={handleSpin}
            disabled={isSpinning || leaderboard.length === 0}
            className="bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-purple-200 px-5 py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isSpinning ? 'Spinning...' : 'Spin for Winner'}
          </button>
        </div>

        <div className="text-center py-14 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
          {winner ? (
            <div>
              <p className="text-zinc-600 mb-2 text-sm uppercase tracking-wider">
                {isSpinning ? 'Spinning...' : 'The winner is'}
              </p>
              <p
                className={`text-3xl font-bold ${isSpinning ? 'text-zinc-400' : 'text-emerald-400'} transition-all duration-300`}
              >
                {winner}
              </p>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Click spin to pick a winner from the top scorers.</p>
          )}
        </div>
      </section>
    </div>
  );
}
