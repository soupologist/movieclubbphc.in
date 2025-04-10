'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IFilm } from '@/models/Film';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function EditFilmPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [film, setFilm] = useState<Partial<IFilm> | null>(null);
  const [loading, setLoading] = useState(true);

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

    setFilm((prev: Partial<IFilm> | null) => ({
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
      updatedCredits[index].names = value.split(',').map((s) => s.trim());
    } else {
      updatedCredits[index].title = value;
    }

    setFilm((prev: Partial<IFilm> | null) => ({
      ...(prev || {}),
      credits: updatedCredits,
    }));
  };

  const handleAddCredit = () => {
    setFilm((prev: Partial<IFilm> | null) => ({
      ...(prev || {}),
      credits: [...(prev?.credits || []), { title: '', names: [] }],
    }));
  };

  const handleSave = async () => {
    const res = await fetch(`/api/films/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(film),
    });

    if (res.ok) {
      alert('Film updated successfully!');
    } else {
      alert('Failed to update film.');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm('Are you sure you want to delete this film?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/films/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      alert('Film deleted.');
      router.push('/admin/films');
    } else {
      alert('Failed to delete film.');
    }
  };

  if (!id) return <div className="p-10 text-white">No film ID provided.</div>;
  if (loading) return <div className="p-10 text-white">Loading film...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Edit Film: {film?.title}</h1>

      <div className="space-y-4">
        <input name="title" value={film?.title || ''} onChange={handleChange} placeholder="Film Title" className="p-2 w-full bg-gray-800" />
        <input name="id" value={film?.id || ''} onChange={handleChange} placeholder="ID (unique)" className="p-2 w-full bg-gray-800" />
        <input name="date" value={film?.date || ''} onChange={handleChange} placeholder="Release Date" className="p-2 w-full bg-gray-800" />
        <input name="poster" value={film?.poster || ''} onChange={handleChange} placeholder="Poster URL" className="p-2 w-full bg-gray-800" />
        <input name="background" value={film?.background || ''} onChange={handleChange} placeholder="Background video or image" className="p-2 w-full bg-gray-800" />
        <input name="backgroundImage" value={film?.backgroundImage || ''} onChange={handleChange} placeholder="Optional background image URL" className="p-2 w-full bg-gray-800" />
        <input name="embed" value={film?.embed || ''} onChange={handleChange} placeholder="Embed URL (YouTube, Instagram)" className="p-2 w-full bg-gray-800" />
        <textarea name="description" value={film?.description || ''} onChange={handleChange} placeholder="Description" className="p-2 w-full bg-gray-800" />

        <input
          name="generalCredits"
          value={(film?.generalCredits || []).join(', ')}
          onChange={handleChange}
          placeholder="General Credits (e.g. Written by X, Directed by Y)"
          className="p-2 w-full bg-gray-800"
        />

        <div className="mt-10">
          <label className="block mb-2 text-sm text-gray-400">Production Notes (Markdown)</label>
          <div className="bg-gray-800 p-2 rounded">
            <MDEditor
              value={typeof film?.notes === 'string' ? film.notes : (film?.notes || []).join('\n')}
              onChange={(val) =>
                setFilm((prev: Partial<IFilm> | null) => ({
                  ...(prev || {}),
                  notes: val || '',
                }))
              }
              height={400}
            />
          </div>
        </div>

        <textarea
          name="btsPhotos"
          value={(film?.btsPhotos || []).join(', ')}
          onChange={handleChange}
          placeholder="Behind-the-scenes photo URLs (comma-separated)"
          className="p-2 w-full bg-gray-800"
        />

        <select name="status" value={film?.status || ''} onChange={handleChange} className="p-2 w-full bg-gray-800">
          <option value="">Select Status</option>
          <option value="released">Released</option>
          <option value="shelved">Shelved</option>
        </select>

        <div className="border-t border-gray-600 pt-6 mt-6">
          <h2 className="text-xl mb-4 font-semibold">Detailed Credits</h2>
          {(film?.credits || []).map((credit, index) => (
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

        <div className="flex gap-4 flex-wrap mt-10">
          <button onClick={handleSave} className="bg-green-600 px-6 py-3 font-bold">
            Save Changes
          </button>
          <button onClick={handleDelete} className="bg-red-600 px-6 py-3 font-bold">
            Delete Film
          </button>
          <button onClick={() => router.push('/admin/films')} className="bg-gray-700 px-6 py-3 font-bold">
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );
}
