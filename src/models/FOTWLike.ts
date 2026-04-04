import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWLike extends Document {
  userEmail: string;
  filmId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FOTWLikeSchema = new Schema<IFOTWLike>({
  userEmail: { type: String, required: true },
  filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm', required: true },
  createdAt: { type: Date, default: Date.now },
});

FOTWLikeSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });

export default mongoose.models.FOTWLike || mongoose.model<IFOTWLike>('FOTWLike', FOTWLikeSchema);
