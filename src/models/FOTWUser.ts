import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWUser extends Document {
  email: string;
  name: string;
  image?: string;
  watchedCount: number;
  timesSuggested: number;
}

const FOTWUserSchema: Schema<IFOTWUser> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    watchedCount: { type: Number, default: 0 },
    timesSuggested: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.FOTWUser || mongoose.model<IFOTWUser>('FOTWUser', FOTWUserSchema);
