import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWFilm extends Document {
  title: string;
  posterUrl: string;
  tmdbUrl: string;
  addedBy: string; // email of admin who added it
  chosenBy: string; // name of the person who chose this film
  chosenByEmail: string; // email of the person who chose this film
  watchedBy: { userEmail: string; watchedAt: Date }[];
  createdAt: Date;
  lockedAt: Date | null;
  timerPaused: boolean;
  timerDuration: number;
}

const FOTWFilmSchema: Schema<IFOTWFilm> = new Schema(
  {
    title: { type: String, required: true },
    posterUrl: { type: String, required: true }, // URL to image
    tmdbUrl: { type: String, default: '' },
    addedBy: { type: String, required: true },
    chosenBy: { type: String, default: '' }, // Name of member who chose this week's film
    chosenByEmail: { type: String, default: '' }, // Email of member who chose this week's film
    watchedBy: {
      type: [
        {
          userEmail: { type: String, required: true },
          watchedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    lockedAt: { type: Date, default: null },
    timerPaused: { type: Boolean, default: false },
    timerDuration: { type: Number, default: 604800000 },
  },
  { timestamps: true }
);

export default mongoose.models.FOTWFilm || mongoose.model<IFOTWFilm>('FOTWFilm', FOTWFilmSchema);
