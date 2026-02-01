'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        router.refresh(); // Reload to hit server layout check again
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
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-white mb-6 text-center font-gotham">
          Film of the Week
        </h2>
        <p className="text-zinc-400 mb-6 text-center">
          Enter the secret member password to access this section.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-white to-zinc-200 text-black font-bold py-3 rounded-lg hover:from-zinc-100 hover:to-zinc-300 transition-all duration-200 disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
