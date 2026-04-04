import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWComment extends Document {
  filmId: string;
  userName: string;
  userEmail: string;
  content: string;
  gifUrl?: string;
  parentId?: string; // For replies
  reactions: {
    emoji: string;
    userId: string;
    userName: string;
  }[];
  mentions: string[]; // Array of user emails mentioned
  createdAt: Date;
  updatedAt: Date;
}

const FOTWCommentSchema = new Schema<IFOTWComment>(
  {
    filmId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    content: { type: String, required: true },
    gifUrl: { type: String },
    parentId: { type: String }, // null for top-level comments
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
      },
    ],
    mentions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
FOTWCommentSchema.index({ filmId: 1, createdAt: -1 });
FOTWCommentSchema.index({ filmId: 1, parentId: 1 });

export default mongoose.models.FOTWComment ||
  mongoose.model<IFOTWComment>('FOTWComment', FOTWCommentSchema);
