'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status !== 'loading') {
      setChecking(false);
    }
  }, [status, session, router]);

  if (status === 'loading' || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg mb-2">Loading...</p>
          <p>Status: {status}</p>
        </div>
      </div>
    );
  }

  const { user } = session || {};
  const role = user?.role || 'unknown';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>

      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg mb-6">
        <p>
          <strong>Name:</strong> {user?.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {user?.email || 'N/A'}
        </p>
        <p>
          <strong>Access Level:</strong> {role}
        </p>
      </div>

      {role === 'admin' && (
        <button
          onClick={() => router.push('/admin/films')}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white transition"
        >
          Go to Film Admin Page
        </button>
      )}
    </div>
  );
}
