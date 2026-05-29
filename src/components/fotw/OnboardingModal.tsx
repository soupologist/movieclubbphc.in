'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OnboardingModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if they need to onboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // The layout already protects this route, so we can just check onboarding status for any logged in user
      fetch('/api/fotw/onboarding/status')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.hasCompletedOnboarding === false) {
            setIsOpen(true);
          }
        })
        .catch(console.error);
    }
  }, [session, status]);

  const checkAvailability = useCallback(async (name: string) => {
    if (!name || name.length < 3 || name.length > 20 || !/^[a-zA-Z0-9_]+$/.test(name)) {
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }

    try {
      const res = await fetch(`/api/fotw/onboarding/check?username=${encodeURIComponent(name)}`);
      const data = await res.json();
      setIsAvailable(data.available);
    } catch (err) {
      console.error(err);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setIsAvailable(null);
      return;
    }
    setIsChecking(true);
    setIsAvailable(null);
    const delayDebounceFn = setTimeout(() => {
      checkAvailability(username);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isChecking) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/fotw/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set username');
      }

      setIsOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl max-w-md w-full m-4">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to FOTW!</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          Please choose a unique display username. This will be visible on the leaderboard, picks,
          and ratings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                placeholder="e.g. kino_enjoyer"
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                maxLength={20}
              />
              <div className="absolute right-3 top-2.5">
                {isChecking && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />}
                {!isChecking && isAvailable === true && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {!isChecking && isAvailable === false && username.length > 0 && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              3-20 characters, alphanumeric and underscores only.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!isAvailable || isChecking || isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Logging'}
          </button>
        </form>
      </div>
    </div>
  );
}
