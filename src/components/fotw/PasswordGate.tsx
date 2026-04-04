'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Film } from 'lucide-react';
import { instrumentSerif } from '@/app/fonts';

export default function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/fotw/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.refresh();
      } else {
        setError(data.message || 'Incorrect password');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/40 flex items-center justify-center">
            <Film size={28} className="text-zinc-500" />
          </div>
        </div>

        <h2
          className={`text-3xl font-bold text-white mb-2 text-center ${instrumentSerif.className}`}
        >
          Film of the Week
        </h2>
        <p className="text-zinc-600 mb-8 text-center text-sm">
          Enter the member password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-zinc-600/50 transition-colors placeholder:text-zinc-700 text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-red-400/80 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
