import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWUser extends Document {
  email: string;
  name: string;
  image?: string;
  watchedCount: number;
  timesSuggested: number;
  filmSuggested?: string;
  whenSuggested?: Date | null;
}

const FOTWUserSchema: Schema<IFOTWUser> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    watchedCount: { type: Number, default: 0 },
    timesSuggested: { type: Number, default: 0 },
    filmSuggested: { type: String, default: '' },
    whenSuggested: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.FOTWUser || mongoose.model<IFOTWUser>('FOTWUser', FOTWUserSchema);
