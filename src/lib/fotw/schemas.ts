import mongoose, { Document, Schema, Model } from 'mongoose';

// --- FOTWFilm ---
export interface IFOTWFilm extends Document {
  title: string;
  posterUrl: string;
  tmdbUrl: string;
  addedBy: string;
  chosenBy: string;
  chosenByEmail: string;
  dateSuggested: Date | null;
  watchedBy: { userEmail: string; watchedAt: Date }[];
  createdAt: Date;
  lockedAt: Date | null;
  timerPaused: boolean;
  timerDuration: number;
}

const FOTWFilmSchema: Schema<IFOTWFilm> = new Schema(
  {
    title: { type: String, required: true },
    posterUrl: { type: String, required: true },
    tmdbUrl: { type: String, default: '' },
    addedBy: { type: String, required: true },
    chosenBy: { type: String, default: '' },
    chosenByEmail: { type: String, default: '' },
    dateSuggested: { type: Date, default: null },
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

// --- FOTWLike ---
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

// --- FOTWRating ---
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

FOTWRatingSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });

// --- FOTWRules ---
export interface IFOTWRules extends Document {
  content: string;
  updatedBy?: string;
  updatedAt: Date;
}

const FOTWRulesSchema: Schema<IFOTWRules> = new Schema({
  content: { type: String, required: true },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

// --- FOTWUser ---
export interface IFOTWUser extends Document {
  email: string;
  name: string;
  username?: string;
  hasCompletedOnboarding: boolean;
  lastUsernameChange?: Date;
  image?: string;
  watchedCount: number;
  seasonWatchedCount?: number;
  excludeFromLeaderboard?: boolean;
  timesSuggested: number;
  filmSuggested?: string;
  whenSuggested?: Date | null;
}

const FOTWUserSchema: Schema<IFOTWUser> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    username: { type: String, unique: true, sparse: true, trim: true },
    hasCompletedOnboarding: { type: Boolean, default: false },
    lastUsernameChange: { type: Date },
    image: { type: String },
    watchedCount: { type: Number, default: 0 },
    seasonWatchedCount: { type: Number, default: 0 },
    excludeFromLeaderboard: { type: Boolean, default: false },
    timesSuggested: { type: Number, default: 0 },
    filmSuggested: { type: String, default: '' },
    whenSuggested: { type: Date, default: null },
  },
  { timestamps: true }
);

// --- FOTWSeason (Stub) ---
export interface IFOTWSeason extends Document {
  name: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

const FOTWSeasonSchema: Schema<IFOTWSeason> = new Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// --- Export Models ---
export const FOTWFilm =
  (mongoose.models.FOTWFilm as Model<IFOTWFilm>) ||
  mongoose.model<IFOTWFilm>('FOTWFilm', FOTWFilmSchema);
export const FOTWLike =
  (mongoose.models.FOTWLike as Model<IFOTWLike>) ||
  mongoose.model<IFOTWLike>('FOTWLike', FOTWLikeSchema);
export const FOTWRating =
  (mongoose.models.FOTWRating as Model<IFOTWRating>) ||
  mongoose.model<IFOTWRating>('FOTWRating', FOTWRatingSchema);
export const FOTWRules =
  (mongoose.models.FOTWRules as Model<IFOTWRules>) ||
  mongoose.model<IFOTWRules>('FOTWRules', FOTWRulesSchema);
export const FOTWUser =
  (mongoose.models.FOTWUser as Model<IFOTWUser>) ||
  mongoose.model<IFOTWUser>('FOTWUser', FOTWUserSchema);
export const FOTWSeason =
  (mongoose.models.FOTWSeason as Model<IFOTWSeason>) ||
  mongoose.model<IFOTWSeason>('FOTWSeason', FOTWSeasonSchema);
