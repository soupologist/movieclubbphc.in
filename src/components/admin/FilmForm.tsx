'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { X } from 'lucide-react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Award {
  title: string;
  details: string;
}

export interface FilmFormData {
  id: string;
  title: string;
  date: string;
  poster: string;
  background: string;
  backgroundImage: string;
  embed: string;
  description: string;
  generalCredits: string;
  notes: string;
  btsPhotos: string;
  status: string;
  awards: Award[];
  tags: string[];
}

interface FilmFormProps {
  film: FilmFormData;
  onSubmit: (film: FilmFormData) => Promise<void>;
  isEditing?: boolean;
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">Tags</label>
      <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-md">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center bg-gray-700 rounded-full px-3 py-1 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-2 text-gray-400 hover:text-red-400"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder="Add tag and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="bg-gray-800 outline-none text-sm placeholder-gray-500 flex-grow min-w-[120px]"
        />
      </div>
    </div>
  );
}

export default function FilmForm({ film, onSubmit, isEditing }: FilmFormProps) {
  const [form, setForm] = useState<FilmFormData>(film);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <div className="border border-gray-700 p-6 rounded-lg space-y-4">
      <h2 className="text-2xl font-semibold mb-4">{isEditing ? 'Edit Film' : 'Add New Film'}</h2>

      <input
        name="id"
        value={form.id}
        onChange={handleChange}
        placeholder="ID (e.g. the-film-id)"
        className="p-2 bg-gray-800 w-full"
        disabled={isEditing}
      />
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="date"
        value={form.date}
        onChange={handleChange}
        placeholder="Date (YYYY-MM-DD)"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="poster"
        value={form.poster}
        onChange={handleChange}
        placeholder="Poster URL"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="background"
        value={form.background}
        onChange={handleChange}
        placeholder="Background Video/Image URL"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="backgroundImage"
        value={form.backgroundImage}
        onChange={handleChange}
        placeholder="Optional Background Image URL"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="embed"
        value={form.embed}
        onChange={handleChange}
        placeholder="Embed URL"
        className="p-2 bg-gray-800 w-full"
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="p-2 bg-gray-800 w-full"
      />
      <input
        name="generalCredits"
        value={form.generalCredits}
        onChange={handleChange}
        placeholder="General Credits (comma-separated)"
        className="p-2 bg-gray-800 w-full"
      />
      <textarea
        name="btsPhotos"
        value={form.btsPhotos}
        onChange={handleChange}
        placeholder="Behind-the-scenes photo URLs (comma-separated)"
        className="p-2 bg-gray-800 w-full"
      />

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="p-2 bg-gray-800 w-full"
      >
        <option value="">Select Status</option>
        <option value="released">Released</option>
        <option value="shelved">Shelved</option>
      </select>

      <TagInput
        tags={form.tags || []}
        onChange={(newTags) => setForm((prev) => ({ ...prev, tags: newTags }))}
      />

      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Awards</label>
        {form.awards.map((award, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Award Title"
              value={award.title}
              onChange={(e) => {
                const updated = [...form.awards];
                updated[index].title = e.target.value;
                setForm((prev) => ({ ...prev, awards: updated }));
              }}
              className="p-2 bg-gray-800 w-full"
            />
            <input
              type="text"
              placeholder="Award Details"
              value={award.details}
              onChange={(e) => {
                const updated = [...form.awards];
                updated[index].details = e.target.value;
                setForm((prev) => ({ ...prev, awards: updated }));
              }}
              className="p-2 bg-gray-800 w-full"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setForm((prev) => ({
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
            value={form.notes}
            onChange={(val) => setForm((prev) => ({ ...prev, notes: val || '' }))}
            height={300}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className={`${isEditing ? 'bg-blue-700' : 'bg-green-600'} px-6 py-3 font-bold mt-6`}
      >
        {isEditing ? 'Save Changes' : 'Add Film'}
      </button>
    </div>
  );
}
