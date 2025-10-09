'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import FilmForm from '@/components/admin/FilmForm';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function AdminFilmsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [filmId, setFilmId] = useState('');
  const [newFilm, setNewFilm] = useState({
    id: '',
    title: '',
    date: '',
    poster: '',
    background: '',
    backgroundImage: '',
    embed: '',
    description: '',
    generalCredits: '',
    notes: '',
    btsPhotos: '',
    status: '',
    awards: [] as { title: string; details: string }[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const handleNavigate = () => {
    if (filmId) {
      router.push(`/admin/films/edit/${filmId}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewFilm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    const filmToSend = {
      ...newFilm,
      generalCredits: newFilm.generalCredits.split(',').map((s) => s.trim()),
      btsPhotos: newFilm.btsPhotos.split(',').map((s) => s.trim()),
    };

    const res = await fetch('/api/films', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filmToSend),
    });

    if (res.ok) {
      alert('Film added successfully!');
      setNewFilm({
        id: '',
        title: '',
        date: '',
        poster: '',
        background: '',
        backgroundImage: '',
        embed: '',
        description: '',
        generalCredits: '',
        notes: '',
        btsPhotos: '',
        status: '',
        awards: [],
      });
    } else {
      alert('Error adding film');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl mb-10 font-bold">Admin</h1>

      <div className="mb-20">
        <h2 className="text-2xl mb-2">Edit Existing Film</h2>
        <input
          type="text"
          placeholder="Enter Film ID"
          value={filmId}
          onChange={(e) => setFilmId(e.target.value)}
          className="p-2 bg-gray-800 w-full mb-2"
        />
        <button onClick={handleNavigate} className="bg-blue-600 px-4 py-2">
          Go to Edit Page
        </button>
      </div>

      <FilmForm
        film={{
          id: '',
          title: '',
          date: '',
          poster: '',
          background: '',
          backgroundImage: '',
          embed: '',
          description: '',
          generalCredits: '',
          notes: '',
          btsPhotos: '',
          status: '',
          tags: [],
          awards: [],
        }}
        onSubmit={handleAdd}
      />
    </div>
  );
}
