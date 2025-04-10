import mongoose, { Document, Schema, Model } from 'mongoose';

interface Credit {
  title: string;
  names: string[];
}

interface Award {
  title: string;
  details: string;
}

export interface IFilm extends Document {
  id: string;
  title: string;
  generalCredits: string[];
  credits: Credit[];
  date: string;
  poster: string;
  description: string;
  background?: string;
  backgroundImage?: string;
  embed?: string;
  awards: Award[];
  notes?: string;
  btsPhotos: string[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FilmSchema: Schema<IFilm> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, default: '' },
    generalCredits: { type: [String], default: [] },
    credits: {
      type: [
        {
          title: { type: String, default: '' },
          names: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    date: { type: String, default: '' },
    poster: { type: String, default: '' },
    description: { type: String, default: '' },
    background: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    embed: { type: String, default: '' },
    awards: {
      type: [
        {
          title: { type: String, default: '' },
          details: { type: String, default: '' },
        },
      ],
      default: [],
    },
    notes: { type: String, default: '' },
    btsPhotos: { type: [String], default: [] },
    status: { type: String, default: 'released' },
  },
  { timestamps: true }
);

const Film: Model<IFilm> =
  mongoose.models?.Film || mongoose.model<IFilm>('Film', FilmSchema);

export default Film;
