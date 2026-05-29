'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, X } from 'lucide-react';

export default function ChangeUsernameModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state and fetch current username when opened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setIsAvailable(null);
      setIsLoadingInitial(true);

      fetch('/api/fotw/onboarding/status')
        .then((res) => res.json())
        .then((data) => {
          const fetchedUsername = data?.username || '';
          setCurrentUsername(fetchedUsername);
          setUsername(fetchedUsername);
        })
        .catch(console.error)
        .finally(() => {
          setIsLoadingInitial(false);
        });
    }
  }, [isOpen]);

  const checkAvailability = useCallback(
    async (name: string) => {
      // If they type their own current username, it's valid/available
      if (name === currentUsername) {
        setIsAvailable(true);
        setIsChecking(false);
        return;
      }

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
    },
    [currentUsername]
  );

  useEffect(() => {
    if (!isOpen) return;

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
  }, [username, checkAvailability, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isChecking) return;
    if (username === currentUsername) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/fotw/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change username');
      }

      setSuccessMsg('Username changed successfully!');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Change Username</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          You can change your username once every 7 days. This will update your display name across
          the Film of the Week platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">New Username</label>
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
                {!isChecking && isAvailable === true && username !== currentUsername && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {!isChecking && isAvailable === false && username.length > 0 && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              3-20 characters, letters, numbers, and underscores only.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMsg && <p className="text-green-500 text-sm">{successMsg}</p>}

          <button
            type="submit"
            disabled={!isAvailable || isChecking || isSubmitting || username === currentUsername}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
