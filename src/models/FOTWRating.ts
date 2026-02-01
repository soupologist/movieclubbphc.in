import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWRating extends Document {
  userEmail: string;
  filmId: mongoose.Types.ObjectId;
  rating: number;
}

const FOTWRatingSchema: Schema<IFOTWRating> = new Schema(
  {
    userEmail: { type: String, required: true },
    filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm', required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
  },
  { timestamps: true }
);

// Compound unique index to prevent multiple ratings per user per film
FOTWRatingSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });

export default mongoose.models.FOTWRating ||
  mongoose.model<IFOTWRating>('FOTWRating', FOTWRatingSchema);
