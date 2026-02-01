'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    posterUrl: '',
    driveLink: '',
  });

  const [leaderboard, setLeaderboard] = useState<{ name: string; ratingsCount: number }[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    // Fetch data for leaderboard spinner
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
        setFormData({ title: '', posterUrl: '', driveLink: '' });
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

    // Find max score
    const maxScore = Math.max(...leaderboard.map((u) => u.ratingsCount));
    // Filter top scorers (ties)
    const candidates = leaderboard.filter((u) => u.ratingsCount === maxScore);

    // Simple animation effect
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
        // Final pick
        const finalIdx = Math.floor(Math.random() * candidates.length);
        setWinner(candidates[finalIdx].name);
      }
    }, interval);
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <h1 className="text-4xl font-gotham font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Add Film Section */}
      <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Add New Film</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-zinc-400 mb-2">Movie Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-2">Poster Image URL</label>
            <input
              type="url"
              required
              value={formData.posterUrl}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-2">Google Drive Link</label>
            <input
              type="url"
              required
              value={formData.driveLink}
              onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black font-bold py-3 px-8 rounded hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" />}
            {loading ? 'Adding...' : 'Add Film'}
          </button>
        </form>
      </section>

      {/* Spin Wheel Section */}
      <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Tie Breaker Spin</h2>
          <button
            onClick={handleSpin}
            disabled={isSpinning || leaderboard.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
          >
            {isSpinning ? 'Spinning...' : 'Spin for Winner'}
          </button>
        </div>

        <div className="text-center py-12 bg-black rounded-lg border border-zinc-800">
          {winner ? (
            <div>
              <p className="text-zinc-500 mb-2">{isSpinning ? 'Spinning...' : 'The Winner is'}</p>
              <p
                className={`text-4xl font-bold ${isSpinning ? 'text-zinc-300' : 'text-green-400 scale-110 transition-transform'}`}
              >
                {winner}
              </p>
            </div>
          ) : (
            <p className="text-zinc-500">Click spin to pick a winner from the top scorers.</p>
          )}
        </div>
      </section>
    </div>
  );
}
