import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWFilm extends Document {
  title: string;
  posterUrl: string;
  driveLink: string;
  addedBy: string; // email of admin
  createdAt: Date;
  active: boolean; // Is this the current film?
}

const FOTWFilmSchema: Schema<IFOTWFilm> = new Schema(
  {
    title: { type: String, required: true },
    posterUrl: { type: String, required: true }, // URL to image
    driveLink: { type: String, required: true },
    addedBy: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.FOTWFilm || mongoose.model<IFOTWFilm>('FOTWFilm', FOTWFilmSchema);
