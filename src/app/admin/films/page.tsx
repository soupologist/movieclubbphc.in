'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FilmForm, { FilmFormData } from '@/components/admin/FilmForm';

// --- Default empty film template ---
const emptyFilm: FilmFormData = {
  id: '',
  title: '',
  date: '',
  poster: '',
  background: '',
  backgroundImage: '',
  embed: '',
  description: '',
  generalCredits: '',
  credits: [],
  notes: '',
  btsPhotos: '',
  status: '',
  visibility: '',
  origin: '',
  awards: [],
  tags: [],
};

export default function AdminFilmsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [filmId, setFilmId] = useState('');
  const [newFilm, setNewFilm] = useState<FilmFormData>(emptyFilm);

  // --- Auth check ---
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  // --- Navigate to film editor by ID ---
  const handleNavigate = () => {
    if (filmId.trim()) router.push(`/admin/films/edit/${filmId.trim()}`);
  };

  // --- Handle new film submission ---
  const handleAdd = async (filmData: FilmFormData) => {
    const res = await fetch('/api/films', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filmData),
    });

    if (res.ok) {
      alert('✅ Film added successfully!');
      setNewFilm(emptyFilm);
    } else {
      const err = await res.text();
      alert(`❌ Error adding film:\n${err}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
    );
  }

  if (!session || session.user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto space-y-16">
      {/* --- Header --- */}
      <header>
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400">Manage films and add new entries.</p>
      </header>

      {/* --- Edit Existing Film --- */}
      <section>
        <h2 className="text-2xl mb-3">Edit Existing Film</h2>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Enter Film ID"
            value={filmId}
            onChange={(e) => setFilmId(e.target.value)}
            className="p-2 bg-gray-800 w-full sm:flex-1"
          />
          <button
            onClick={handleNavigate}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
          >
            Go to Edit Page
          </button>
        </div>
      </section>

      {/* --- Add New Film --- */}
      <section>
        <FilmForm film={newFilm} onSubmit={handleAdd} isEditing={false} />
      </section>
    </div>
  );
}
