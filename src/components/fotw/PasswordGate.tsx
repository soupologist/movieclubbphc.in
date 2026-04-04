'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Film } from 'lucide-react';
import { instrumentSerif } from '@/app/fonts';

const LB = {
  green: '#00e054',
  bg1: '#14181c',
  bg2: '#1c2228',
  bg3: '#2c3440',
  muted: '#9ab',
  dim: '#678',
};

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
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: LB.bg3, color: LB.dim }}
          >
            <Film size={24} />
          </div>
        </div>

        <h2 className={`text-3xl font-bold text-white mb-2 text-center ${instrumentSerif.className}`}>
          Film of the Week
        </h2>
        <p className="mb-8 text-center text-sm" style={{ color: LB.dim }}>
          Enter the member password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: LB.dim }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded pl-10 pr-4 py-3 text-white outline-none text-sm border transition-colors focus:border-[#456]"
              style={{ backgroundColor: LB.bg1, borderColor: LB.bg3 }}
              required
            />
          </div>

          {error && <p className="text-red-400/80 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-3 rounded transition-all duration-200 disabled:opacity-50 text-sm"
            style={{ backgroundColor: LB.green, color: LB.bg1 }}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
