'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function AdminFilmsPage() {

  const [authenticated, setAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");

  const checkPasskey = () => {
    if (passkey === ADMIN_KEY) {
      setAuthenticated(true);
    } else {
      alert("Incorrect key");
    }
  };

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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl mb-4">Enter Admin Passkey</h1>
        <input
          type="password"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          className="p-2 bg-gray-800 mb-4 w-72"
          placeholder="Passkey"
        />
        <button onClick={checkPasskey} className="bg-blue-600 px-4 py-2">
          Submit
        </button>
      </div>
    );
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

      <div className="border border-gray-700 p-6 rounded-lg space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Add New Film</h2>

        <input name="id" value={newFilm.id} onChange={handleChange} placeholder="ID (e.g. the-film-id)" className="p-2 bg-gray-800 w-full" />
        <input name="title" value={newFilm.title} onChange={handleChange} placeholder="Title (e.g. The Film Title)" className="p-2 bg-gray-800 w-full" />
        <input name="date" value={newFilm.date} onChange={handleChange} placeholder="Date (e.g. 2024-10-05)" className="p-2 bg-gray-800 w-full" />
        <input name="poster" value={newFilm.poster} onChange={handleChange} placeholder="Poster URL (e.g. https://...)" className="p-2 bg-gray-800 w-full" />
        <input name="background" value={newFilm.background} onChange={handleChange} placeholder="Background Video/Image URL" className="p-2 bg-gray-800 w-full" />
        <input name="backgroundImage" value={newFilm.backgroundImage} onChange={handleChange} placeholder="Optional Background Image URL" className="p-2 bg-gray-800 w-full" />
        <input name="embed" value={newFilm.embed} onChange={handleChange} placeholder="Embed URL (YouTube/Instagram)" className="p-2 bg-gray-800 w-full" />
        <textarea name="description" value={newFilm.description} onChange={handleChange} placeholder="Description" className="p-2 bg-gray-800 w-full" />

        <input
          name="generalCredits"
          value={newFilm.generalCredits}
          onChange={handleChange}
          placeholder="General Credits (comma-separated)"
          className="p-2 bg-gray-800 w-full"
        />

        <textarea
          name="btsPhotos"
          value={newFilm.btsPhotos}
          onChange={handleChange}
          placeholder="Behind-the-scenes photo URLs (comma-separated)"
          className="p-2 bg-gray-800 w-full"
        />

        <select name="status" value={newFilm.status} onChange={handleChange} className="p-2 bg-gray-800 w-full">
          <option value="">Select Status</option>
          <option value="released">Released</option>
          <option value="shelved">Shelved</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Awards</label>

          {newFilm.awards.map((award, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Award Title"
                value={award.title}
                onChange={(e) => {
                  const updatedAwards = [...newFilm.awards];
                  updatedAwards[index].title = e.target.value;
                  setNewFilm((prev) => ({ ...prev, awards: updatedAwards }));
                }}
                className="p-2 bg-gray-800 w-full"
              />
              <input
                type="text"
                placeholder="Award Details"
                value={award.details}
                onChange={(e) => {
                  const updatedAwards = [...newFilm.awards];
                  updatedAwards[index].details = e.target.value;
                  setNewFilm((prev) => ({ ...prev, awards: updatedAwards }));
                }}
                className="p-2 bg-gray-800 w-full"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setNewFilm((prev) => ({
                ...prev,
                awards: [...prev.awards, { title: '', details: '' }],
              }))
            }
            className="mt-2 text-sm mr-3 underline text-blue-400 hover:text-blue-200"
          >
            + Add Award
          </button>
        </div>


        <div>
          <label className="block mb-2 text-sm text-gray-400">Production Notes (Markdown)</label>
          <div className="bg-gray-800 p-2 rounded">
            <MDEditor
              value={newFilm.notes}
              onChange={(val) => setNewFilm((prev) => ({ ...prev, notes: val || '' }))}
              height={300}
            />
          </div>
        </div>

        <button onClick={handleAdd} className="bg-green-600 px-6 py-3 font-bold mt-6">
          Add Film
        </button>
      </div>
    </div>
  );
}
