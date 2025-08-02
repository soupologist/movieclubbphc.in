'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IFilm } from '@/models/Film';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function EditFilmPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const router = useRouter();

  const [film, setFilm] = useState<Partial<IFilm> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!id) return;
    async function fetchFilm() {
      try {
        const res = await fetch(`/api/films/${id}`);
        const data = await res.json();
        setFilm(data);
      } catch (err) {
        console.error('Error fetching film: ', err);
        alert('Error fetching film.');
      } finally {
        setLoading(false);
      }
    }

    fetchFilm();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilm((prev) => ({
      ...(prev || {}),
      [name]:
        name === 'generalCredits' || name === 'btsPhotos'
          ? value.split(',').map((s) => s.trim())
          : value,
    }));
  };

  const handleCreditChange = (index: number, field: 'title' | 'names', value: string) => {
    const updatedCredits = [...(film?.credits || [])];
    if (!updatedCredits[index]) updatedCredits[index] = { title: '', names: [] };
    if (field === 'names') {
      updatedCredits[index].names = (value as string).split(',').map((s) => s.trim());
    } else {
      updatedCredits[index][field] = value;
    }

    setFilm((prev) => ({ ...(prev || {}), credits: updatedCredits }));
  };

  const handleAddCredit = () => {
    setFilm((prev) => ({
      ...(prev || {}),
      credits: [...(prev?.credits || []), { title: '', names: [] }],
    }));
  };

  const handleAwardChange = (index: number, field: 'title' | 'details', value: string) => {
    const updatedAwards = [...(film?.awards || [])];
    if (!updatedAwards[index]) updatedAwards[index] = { title: '', details: '' };
    updatedAwards[index][field] = value;

    setFilm((prev) => ({ ...(prev || {}), awards: updatedAwards }));
  };

  const handleAddAward = () => {
    setFilm((prev) => ({
      ...(prev || {}),
      awards: [...(prev?.awards || []), { title: '', details: '' }],
    }));
  };

  const handleDeleteAward = (index: number) => {
    const updated = [...(film?.awards || [])];
    updated.splice(index, 1);
    setFilm((prev) => ({ ...(prev || {}), awards: updated }));
  };

  const handleSave = async () => {
    const res = await fetch(`/api/films/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(film),
    });

    if (res.ok) alert('Film updated successfully!');
    else alert('Failed to update film.');
  };

  const handleDelete = async () => {
    const confirmDelete = confirm('Are you sure you want to delete this film?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/films/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Film deleted.');
      router.push('/admin/films');
    } else {
      alert('Failed to delete film.');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-10 text-white">Loading film...</div>;
  }

  if (!session || session.user?.role !== 'admin') return null;

  if (!id || !film) return <div className="p-10 text-white">No film ID or film data found.</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Edit Film: {film.title}</h1>

      <div className="space-y-4">
        <input
          name="title"
          value={film.title || ''}
          onChange={handleChange}
          placeholder="Film Title"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="id"
          value={film.id || ''}
          onChange={handleChange}
          placeholder="ID (unique)"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="date"
          value={film.date || ''}
          onChange={handleChange}
          placeholder="Release Date"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="poster"
          value={film.poster || ''}
          onChange={handleChange}
          placeholder="Poster URL"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="background"
          value={film.background || ''}
          onChange={handleChange}
          placeholder="Background"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="backgroundImage"
          value={film.backgroundImage || ''}
          onChange={handleChange}
          placeholder="Background Image"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="embed"
          value={film.embed || ''}
          onChange={handleChange}
          placeholder="Embed URL"
          className="p-2 w-full bg-gray-800"
        />
        <textarea
          name="description"
          value={film.description || ''}
          onChange={handleChange}
          placeholder="Description"
          className="p-2 w-full bg-gray-800"
        />
        <input
          name="generalCredits"
          value={(film.generalCredits || []).join(', ')}
          onChange={handleChange}
          placeholder="General Credits"
          className="p-2 w-full bg-gray-800"
        />
        <textarea
          name="btsPhotos"
          value={(film.btsPhotos || []).join(', ')}
          onChange={handleChange}
          placeholder="Behind-the-scenes Photos"
          className="p-2 w-full bg-gray-800"
        />
        <select
          name="status"
          value={film.status || ''}
          onChange={handleChange}
          className="p-2 w-full bg-gray-800"
        >
          <option value="">Select Status</option>
          <option value="released">Released</option>
          <option value="shelved">Shelved</option>
        </select>

        {/* Markdown Editor */}
        <div className="mt-6">
          <label className="block mb-2 text-sm text-gray-400">Production Notes (Markdown)</label>
          <div className="bg-gray-800 p-2 rounded">
            <MDEditor
              value={film.notes || ''}
              onChange={(val) => setFilm((prev) => ({ ...(prev || {}), notes: val || '' }))}
              height={300}
            />
          </div>
        </div>

        {/* Credits */}
        <div className="border-t border-gray-600 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Credits</h2>
          {(film.credits || []).map((credit, index) => (
            <div key={index} className="space-y-2 mb-4">
              <input
                value={credit.title}
                onChange={(e) => handleCreditChange(index, 'title', e.target.value)}
                placeholder="Title (e.g. Director)"
                className="p-2 w-full bg-gray-800"
              />
              <input
                value={credit.names?.join(', ') ?? ''}
                onChange={(e) => handleCreditChange(index, 'names', e.target.value)}
                placeholder="Names (comma-separated)"
                className="p-2 w-full bg-gray-800"
              />
            </div>
          ))}
          <button onClick={handleAddCredit} className="bg-blue-600 px-4 py-2 text-sm">
            Add Credit
          </button>
        </div>

        {/* Awards */}
        <div className="border-t border-gray-600 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Awards</h2>
          {(film.awards || []).map((award, index) => (
            <div key={index} className="space-y-2 mb-4">
              <input
                value={award.title}
                onChange={(e) => handleAwardChange(index, 'title', e.target.value)}
                placeholder="Award Title"
                className="p-2 w-full bg-gray-800"
              />
              <input
                value={award.details}
                onChange={(e) => handleAwardChange(index, 'details', e.target.value)}
                placeholder="Award Details"
                className="p-2 w-full bg-gray-800"
              />
              <button
                onClick={() => handleDeleteAward(index)}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Remove Award
              </button>
            </div>
          ))}
          <button onClick={handleAddAward} className="bg-blue-600 px-4 py-2 text-sm">
            Add Award
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap mt-10">
          <button onClick={handleSave} className="bg-green-600 px-6 py-3 font-bold">
            Save Changes
          </button>
          <button onClick={handleDelete} className="bg-red-600 px-6 py-3 font-bold">
            Delete Film
          </button>
          <button
            onClick={() => router.push('/admin/films')}
            className="bg-gray-700 px-6 py-3 font-bold"
          >
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );
}
