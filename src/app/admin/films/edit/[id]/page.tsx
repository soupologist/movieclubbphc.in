'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FilmForm, { FilmFormData } from '@/components/admin/FilmForm';

export default function EditFilmPage() {
  const { id } = useParams();
  const router = useRouter();
  const [film, setFilm] = useState<FilmFormData | null>(null);

  useEffect(() => {
    const fetchFilm = async () => {
      const res = await fetch(`/api/films/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFilm({
          ...data,
          generalCredits: data.generalCredits?.join(', ') || '',
          btsPhotos: data.btsPhotos?.join(', ') || '',
        });
      }
    };
    fetchFilm();
  }, [id]);

  const handleUpdate = async (updated: FilmFormData) => {
    const filmToSend = {
      ...updated,
      generalCredits: updated.generalCredits.split(',').map((s) => s.trim()),
      btsPhotos: updated.btsPhotos.split(',').map((s) => s.trim()),
    };

    const res = await fetch(`/api/films/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filmToSend),
    });

    if (res.ok) {
      alert('✅ Film updated!');
      router.push('/admin/films');
    } else alert('❌ Error updating film');
  };

  if (!film) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
      <FilmForm film={film} onSubmit={handleUpdate} isEditing />
    </div>
  );
}
