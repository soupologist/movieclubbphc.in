'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminFilmsPage() {
  const [filmId, setFilmId] = useState('');
  const [newFilm, setNewFilm] = useState({
    id: '',
    title: '',
    date: '',
    poster: '',
    description: '',
  });

  const router = useRouter();

  const handleNavigate = () => {
    if (filmId) {
      router.push(`/admin/films/edit?id=${filmId}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewFilm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    const res = await fetch('/api/films', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFilm),
    });

    if (res.ok) {
      alert('Film added successfully!');
      setNewFilm({ id: '', title: '', date: '', poster: '', description: '' });
    } else {
      alert('Error adding film');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
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

      <div className="border border-gray-700 p-6 rounded-lg space-y-4">
        <h2 className="text-2xl">Add New Film</h2>
        <input name="id" value={newFilm.id} onChange={handleChange} placeholder="ID (e.g. the-film-id)" className="p-2 bg-gray-800 w-full" />
        <input name="title" value={newFilm.title} onChange={handleChange} placeholder="Title (e.g. The Film Title)" className="p-2 bg-gray-800 w-full" />
        <input name="date" value={newFilm.date} onChange={handleChange} placeholder="Date (e.g. 2024-10-05)" className="p-2 bg-gray-800 w-full" />
        <input name="poster" value={newFilm.poster} onChange={handleChange} placeholder="Poster URL (e.g. https://...)" className="p-2 bg-gray-800 w-full" />
        <textarea name="description" value={newFilm.description} onChange={handleChange} placeholder="Description" className="p-2 bg-gray-800 w-full" />
        <button onClick={handleAdd} className="bg-green-600 px-4 py-2">
          Add Film
        </button>
      </div>
    </div>
  );
}
