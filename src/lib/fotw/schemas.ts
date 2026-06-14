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
  /** Denormalized count of watchedBy entries. Kept in sync by watch/unwatch routes. */
  watchedCount: number;
  createdAt: Date;
  lockedAt: Date | null;
  timerPaused: boolean;
  timerDuration: number;
  /** ISO 639-1 original language code returned by TMDB (e.g. "en", "fr", "hi") */
  language: string;
  /** Release year as a 4-digit integer, e.g. 2023 */
  year: number;
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
    // Denormalized count kept in sync by watch/unwatch routes. Avoids scanning
    // the watchedBy array on every archive/bootstrap read.
    watchedCount: { type: Number, default: 0 },
    lockedAt: { type: Date, default: null },
    timerPaused: { type: Boolean, default: false },
    timerDuration: { type: Number, default: 604800000 },
    language: { type: String, default: '' },
    year: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// lockedAt used for archive query ( lockedAt: { $ne: null } )
FOTWFilmSchema.index({ lockedAt: 1 });
// dateSuggested used for season-window filtering and archive sort
FOTWFilmSchema.index({ dateSuggested: -1 });
// chosenByEmail used in leaderboard chooser lookups
FOTWFilmSchema.index({ chosenByEmail: 1 });
// watchedBy.userEmail used in user profile fetching
FOTWFilmSchema.index({ 'watchedBy.userEmail': 1 });


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
FOTWLikeSchema.index({ filmId: 1 });
// Index for fetching user likes sorted by createdAt
FOTWLikeSchema.index({ userEmail: 1, createdAt: -1 });


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

FOTWRatingSchema.index({ filmId: 1, userEmail: 1 }, { unique: true });
// Index for fetching user ratings sorted by createdAt
FOTWRatingSchema.index({ userEmail: 1, createdAt: -1 });


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
  seasonWatchedCount: number;
  excludeFromLeaderboard?: boolean;
  timesSuggested: number;
  filmSuggested?: string;
  whenSuggested?: Date | null;
  currentStreak: number;
  longestStreak: number;
  lastWatchedWeek?: Date;
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
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastWatchedWeek: { type: Date },
  },
  { timestamps: true }
);

FOTWUserSchema.index({ seasonWatchedCount: -1 });
// Leaderboard all-time sort and members list sort
FOTWUserSchema.index({ watchedCount: -1, createdAt: 1 });


// --- FOTWSeason ---
// Seasons are admin-defined named date ranges used as a filtering lens over
// existing FOTWFilm data. A film belongs to a season when:
//   film.dateSuggested >= season.startDate && film.dateSuggested <= season.endDate
// This join is always computed at query time — no field is written back to FOTWFilm.
// There is also always an implicit "All Time" view which applies no date filter.
export interface IFOTWSeason extends Document {
  /** Admin-chosen display name, e.g. "Season 1" or "Monsoon 2024" */
  name: string;
  /** Inclusive start of the season window */
  startDate: Date;
  /** Inclusive end of the season window. null if the season is currently ongoing */
  endDate: Date | null;
  /** true if this is the current live season */
  isActive: boolean;
  /** Letterboxd list URL for this season */
  letterboxdUrl?: string;
  /** Email of the admin who created the season */
  createdBy: string;
  createdAt: Date;
}

const FOTWSeasonSchema: Schema<IFOTWSeason> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
    letterboxdUrl: { type: String, default: '' },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Speed up "find the active season" and date-range lookups
FOTWSeasonSchema.index({ isActive: 1 });
FOTWSeasonSchema.index({ startDate: 1, endDate: 1 });

// --- FOTWSiteConfig ---
// Singleton document for site-wide FOTW configuration.
// Use FOTWSiteConfig.findOneAndUpdate({}, updates, { upsert: true }) to mutate.
export interface IFOTWSiteConfig extends Document {
  /** Letterboxd list URL shown when "All Time" is selected */
  letterboxdAllTimeUrl: string;
  updatedBy?: string;
  updatedAt: Date;
}

const FOTWSiteConfigSchema: Schema<IFOTWSiteConfig> = new Schema({
  letterboxdAllTimeUrl: { type: String, default: '' },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

// --- FOTWReview ---
// One review per (userEmail, filmId) pair. isPrivate=true means only the author can see it.
export interface IFOTWReview extends Document {
  userEmail: string;
  filmId: mongoose.Types.ObjectId;
  body: string;
  isPrivate: boolean;
  hasSpoiler: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FOTWReviewSchema: Schema<IFOTWReview> = new Schema(
  {
    userEmail: { type: String, required: true },
    filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm', required: true },
    body: { type: String, required: true, maxlength: 1000 },
    isPrivate: { type: Boolean, default: false },
    hasSpoiler: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per film
FOTWReviewSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });
FOTWReviewSchema.index({ filmId: 1, isPrivate: 1 });
// Index for fetching user reviews sorted by createdAt
FOTWReviewSchema.index({ userEmail: 1, isPrivate: 1, createdAt: -1 });

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
export const FOTWSiteConfig =
  (mongoose.models.FOTWSiteConfig as Model<IFOTWSiteConfig>) ||
  mongoose.model<IFOTWSiteConfig>('FOTWSiteConfig', FOTWSiteConfigSchema);
export const FOTWReview =
  (mongoose.models.FOTWReview as Model<IFOTWReview>) ||
  mongoose.model<IFOTWReview>('FOTWReview', FOTWReviewSchema);

