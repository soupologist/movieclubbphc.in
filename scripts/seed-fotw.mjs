/**
 * FOTW Mock Data Seed Script
 * ─────────────────────────────────────────────────────────────────────
 * Creates ~25 films and ~55 users with realistic ratings, watches,
 * and likes. All seeded data is tagged with `_seeded: true` on the
 * FOTWUser documents so you can identify and wipe them easily.
 *
 * USAGE
 *   node scripts/seed-fotw.mjs
 *
 * CLEANUP (delete everything this script inserted)
 *   node scripts/seed-fotw.mjs --cleanup
 *
 * The script only touches FOTW* collections. It never touches anything
 * outside those four collections.
 * ─────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (no dotenv dep required) ───────────────────────
const envPath = resolve(__dirname, '../.env');
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);
const MONGO_URI = envVars['MONGODB_URI'];
if (!MONGO_URI) throw new Error('MONGODB_URI not found in .env');

// ── Inline schemas (no TS, no imports from src/) ──────────────────────
const { Schema, model, models, Types } = mongoose;

const FOTWFilmSchema = new Schema(
  {
    title: String,
    posterUrl: String,
    driveLink: String,
    addedBy: String,
    chosenBy: { type: String, default: '' },
    watchedBy: {
      type: [{ userEmail: String, watchedAt: { type: Date, default: Date.now } }],
      default: [],
    },
    _seeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FOTWUserSchema = new Schema(
  {
    email: { type: String, unique: true },
    name: String,
    image: String,
    watchedCount: { type: Number, default: 0 },
    _seeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FOTWRatingSchema = new Schema(
  {
    userEmail: String,
    filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm' },
    rating: Number,
    _seeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);
FOTWRatingSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });

const FOTWLikeSchema = new Schema({
  userEmail: String,
  filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm' },
  createdAt: { type: Date, default: Date.now },
  _seeded: { type: Boolean, default: false },
});
FOTWLikeSchema.index({ userEmail: 1, filmId: 1 }, { unique: true });

const FOTWFilm   = models.FOTWFilm   || model('FOTWFilm',   FOTWFilmSchema);
const FOTWUser   = models.FOTWUser   || model('FOTWUser',   FOTWUserSchema);
const FOTWRating = models.FOTWRating || model('FOTWRating', FOTWRatingSchema);
const FOTWLike   = models.FOTWLike   || model('FOTWLike',   FOTWLikeSchema);

// ── Seed data ─────────────────────────────────────────────────────────

const FILMS = [
  // (title, TMDB poster path — these are public CDN URLs)
  ['Mulholland Drive',        'https://image.tmdb.org/t/p/w500/nUW6oBmV5BE1fXRpPJFxGDLODGr.jpg'],
  ['2001: A Space Odyssey',   'https://image.tmdb.org/t/p/w500/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg'],
  ['Parasite',                'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'],
  ['Spirited Away',           'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'],
  ['The Godfather',           'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLeleqKeiVng.jpg'],
  ['Stalker',                 'https://image.tmdb.org/t/p/w500/gwl4R6QNb6GbHpOEKaHj9TlX9kC.jpg'],
  ['In the Mood for Love',    'https://image.tmdb.org/t/p/w500/bmPbmwsKbdj6vGFXbMzXBTkSnlm.jpg'],
  ['Blade Runner 2049',       'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg'],
  ['Yi Yi',                   'https://image.tmdb.org/t/p/w500/fkHBfivnMSHLx9WMBXQ3yXnz31B.jpg'],
  ['Jeanne Dielman',          'https://image.tmdb.org/t/p/w500/2KKjmGxfPqJuFWdT7tJSAEFChB5.jpg'],
  ['Synecdoche, New York',    'https://image.tmdb.org/t/p/w500/2aMGiZlbf2lCY4Dg9ojxWkGGLtD.jpg'],
  ['The Tree of Life',        'https://image.tmdb.org/t/p/w500/bHEMHlGNnHa6uBPq3Xeh2UThzw9.jpg'],
  ['Certified Copy',          'https://image.tmdb.org/t/p/w500/fmfkqhAvNXbcnFqyToXMDYoFrGH.jpg'],
  ['Her',                     'https://image.tmdb.org/t/p/w500/lEIaL12hSkqqe83zVvF98FcXTSg.jpg'],
  ['Moonlight',               'https://image.tmdb.org/t/p/w500/4911T5FbJ9eAlnFMqWAhihuEFdG.jpg'],
  ['The Master',              'https://image.tmdb.org/t/p/w500/anmol4UnLpKgTiSe8V9J5F0TZpM.jpg'],
  ['Memoria',                 'https://image.tmdb.org/t/p/w500/r4J4oeyQRNqFRa0qLW4qx4hfXCA.jpg'],
  ['Burning',                 'https://image.tmdb.org/t/p/w500/l72qAhWCwJXa8U7V0IKVKM3OwS.jpg'],
  ['Portrait of a Lady on Fire','https://image.tmdb.org/t/p/w500/3xFBLHfhJQEFP8VEJCr5GwOLR6a.jpg'],
  ['Aftersun',                'https://image.tmdb.org/t/p/w500/2Za1WqTB5DpELzqpEqaXaAZEcyD.jpg'],
  ['Tár',                     'https://image.tmdb.org/t/p/w500/oO7nUuEKmz4dMKnuT7mxPdAUqWC.jpg'],
  ['Drive My Car',            'https://image.tmdb.org/t/p/w500/5gPBd9FKQO6HwTpaMgRv5kANbv0.jpg'],
  ['The Souvenir',            'https://image.tmdb.org/t/p/w500/9oI7nFdE4pCfCYYa8gLHdAJMl2T.jpg'],
  ['Annihilation',            'https://image.tmdb.org/t/p/w500/like9yfcBmX0yqFMXMBpUHrWOOR.jpg'],
  ['Hereditary',              'https://image.tmdb.org/t/p/w500/p9gKEPmLi21hPEuACmXU4HsVUKm.jpg'],
];

const MEMBERS = [
  ['Arjun Sharma',      'arjun@bits-hyd.ac.in'],
  ['Priya Nair',        'priya@bits-hyd.ac.in'],
  ['Rohan Mehta',       'rohan@bits-hyd.ac.in'],
  ['Sneha Reddy',       'sneha@bits-hyd.ac.in'],
  ['Vikram Iyer',       'vikram@bits-hyd.ac.in'],
  ['Ananya Singh',      'ananya@bits-hyd.ac.in'],
  ['Karthik Rao',       'karthik@bits-hyd.ac.in'],
  ['Meera Pillai',      'meera@bits-hyd.ac.in'],
  ['Aditya Kumar',      'aditya@bits-hyd.ac.in'],
  ['Pooja Verma',       'pooja@bits-hyd.ac.in'],
  ['Siddharth Das',     'siddharth@bits-hyd.ac.in'],
  ['Divya Krishnan',    'divya@bits-hyd.ac.in'],
  ['Rahul Gupta',       'rahul@bits-hyd.ac.in'],
  ['Neha Joshi',        'neha@bits-hyd.ac.in'],
  ['Abhishek Patel',    'abhishek@bits-hyd.ac.in'],
  ['Lakshmi Subramaniam','lakshmi@bits-hyd.ac.in'],
  ['Tanay Bose',        'tanay@bits-hyd.ac.in'],
  ['Shreya Agarwal',    'shreya@bits-hyd.ac.in'],
  ['Nikhil Menon',      'nikhil@bits-hyd.ac.in'],
  ['Isha Chatterjee',   'isha@bits-hyd.ac.in'],
  ['Dhruv Malhotra',    'dhruv@bits-hyd.ac.in'],
  ['Ritika Saxena',     'ritika@bits-hyd.ac.in'],
  ['Arun Balaji',       'arun@bits-hyd.ac.in'],
  ['Kavya Nambiar',     'kavya@bits-hyd.ac.in'],
  ['Parth Desai',       'parth@bits-hyd.ac.in'],
  ['Swati Bhatt',       'swati@bits-hyd.ac.in'],
  ['Gaurav Thakur',     'gaurav@bits-hyd.ac.in'],
  ['Riya Shetty',       'riya@bits-hyd.ac.in'],
  ['Manav Oberoi',      'manav@bits-hyd.ac.in'],
  ['Preethi Chandrasekar','preethi@bits-hyd.ac.in'],
  ['Aarav Shah',        'aarav@bits-hyd.ac.in'],
  ['Tanya Khanna',      'tanya@bits-hyd.ac.in'],
  ['Varun Kapoor',      'varun@bits-hyd.ac.in'],
  ['Ishita Roy',        'ishita@bits-hyd.ac.in'],
  ['Kabir Bhattacharya','kabir@bits-hyd.ac.in'],
  ['Zara Mirza',        'zara@bits-hyd.ac.in'],
  ['Harsh Vardhan',     'harsh@bits-hyd.ac.in'],
  ['Sakshi Yadav',      'sakshi@bits-hyd.ac.in'],
  ['Aniket Kulkarni',   'aniket@bits-hyd.ac.in'],
  ['Nanditha Prasad',   'nanditha@bits-hyd.ac.in'],
  ['Devansh Tripathi',  'devansh@bits-hyd.ac.in'],
  ['Shalini Mishra',    'shalini@bits-hyd.ac.in'],
  ['Roopesh Nair',      'roopesh@bits-hyd.ac.in'],
  ['Amrita Balu',       'amrita@bits-hyd.ac.in'],
  ['Krunal Pandya',     'krunal@bits-hyd.ac.in'],
  ['Vaishnavi Iyer',    'vaishnavi@bits-hyd.ac.in'],
  ['Tarun Ghosh',       'tarun@bits-hyd.ac.in'],
  ['Leela Suresh',      'leela@bits-hyd.ac.in'],
  ['Mihir Jain',        'mihir@bits-hyd.ac.in'],
  ['Parveen Akhtar',    'parveen@bits-hyd.ac.in'],
  ['Chandana Mohan',    'chandana@bits-hyd.ac.in'],
  ['Suraj Venkataraman','suraj@bits-hyd.ac.in'],
  ['Ankita Bose',       'ankita@bits-hyd.ac.in'],
  ['Yash Singhania',    'yash@bits-hyd.ac.in'],
  ['Bharati Kesavan',   'bharati@bits-hyd.ac.in'],
  ['Omkar Patil',       'omkar@bits-hyd.ac.in'],
];

// ── Helpers ───────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) { return shuffle(arr).slice(0, n); }

/** Realistic half-star rating biased towards 3-4.5 */
function randRating() {
  const options = [2, 2.5, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4, 4.5, 4.5, 5, 5, 1.5, 1, 0.5];
  return pick(options);
}

/** Random date between `start` and now */
function randDate(start = new Date('2024-08-01')) {
  return new Date(start.getTime() + Math.random() * (Date.now() - start.getTime()));
}

// ── Main ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // ── 1. Insert users ───────────────────────────────────────────────
  console.log(`👤 Upserting ${MEMBERS.length} users...`);
  const userDocs = await Promise.all(
    MEMBERS.map(([name, email]) =>
      FOTWUser.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, name, image: null, watchedCount: 0, _seeded: true } },
        { upsert: true, new: true }
      )
    )
  );
  console.log(`   ✓ ${userDocs.length} users ready\n`);

  // ── 2. Insert films ───────────────────────────────────────────────
  const DRIVE_STUB = 'https://drive.google.com/file/d/seed-placeholder/view';
  const ADMIN_EMAIL = 'admin@bits-hyd.ac.in';

  const filmDates = [];
  let cur = new Date('2024-08-05');
  for (let i = 0; i < FILMS.length; i++) {
    filmDates.push(new Date(cur));
    cur = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000); // +1 week
  }

  console.log(`🎬 Inserting ${FILMS.length} films...`);
  const filmDocs = [];
  for (let i = 0; i < FILMS.length; i++) {
    const [title, posterUrl] = FILMS[i];
    const chosenBy = MEMBERS[i % MEMBERS.length][0]; // cycle through members

    // Pick random watchers: 60-100% of club attended
    const watcherCount = Math.floor(MEMBERS.length * (0.6 + Math.random() * 0.4));
    const watchers = sample(MEMBERS, watcherCount);
    const watchedBy = watchers.map(([, email]) => ({
      userEmail: email,
      watchedAt: new Date(filmDates[i].getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000),
    }));

    const existing = await FOTWFilm.findOne({ title, _seeded: true });
    let filmDoc;
    if (existing) {
      filmDoc = existing;
    } else {
      filmDoc = await FOTWFilm.create({
        title,
        posterUrl,
        driveLink: DRIVE_STUB,
        addedBy: ADMIN_EMAIL,
        chosenBy,
        watchedBy,
        _seeded: true,
        createdAt: filmDates[i],
        updatedAt: filmDates[i],
      });
    }
    filmDocs.push({ doc: filmDoc, watchers });
    process.stdout.write(`   [${String(i + 1).padStart(2)}/${FILMS.length}] ${title}\n`);
  }
  console.log('   ✓ Films done\n');

  // ── 3. Insert ratings ─────────────────────────────────────────────
  console.log('⭐ Inserting ratings...');
  let ratingCount = 0;
  for (const { doc: film, watchers } of filmDocs) {
    // ~80% of watchers also rate
    const raters = sample(watchers, Math.floor(watchers.length * 0.8));
    for (const [, email] of raters) {
      const rating = randRating();
      try {
        await FOTWRating.findOneAndUpdate(
          { userEmail: email, filmId: film._id },
          { $setOnInsert: { userEmail: email, filmId: film._id, rating, _seeded: true } },
          { upsert: true }
        );
        ratingCount++;
      } catch (_) { /* duplicate — skip */ }
    }
  }
  console.log(`   ✓ ${ratingCount} ratings\n`);

  // ── 4. Insert likes ───────────────────────────────────────────────
  console.log('❤️  Inserting likes...');
  let likeCount = 0;
  for (const { doc: film, watchers } of filmDocs) {
    // ~40% of watchers like the film
    const likers = sample(watchers, Math.floor(watchers.length * 0.4));
    for (const [, email] of likers) {
      try {
        await FOTWLike.findOneAndUpdate(
          { userEmail: email, filmId: film._id },
          { $setOnInsert: { userEmail: email, filmId: film._id, _seeded: true, createdAt: randDate(new Date(film.createdAt)) } },
          { upsert: true }
        );
        likeCount++;
      } catch (_) { /* duplicate — skip */ }
    }
  }
  console.log(`   ✓ ${likeCount} likes\n`);

  // ── 5. Recompute watchedCount for each user ───────────────────────
  console.log('📊 Recomputing watchedCount per user...');
  for (const [, email] of MEMBERS) {
    const count = await FOTWFilm.countDocuments({ 'watchedBy.userEmail': email });
    await FOTWUser.updateOne({ email }, { $set: { watchedCount: count } });
  }
  console.log('   ✓ watchedCount synced\n');

  console.log('🎉 Seed complete!');
  console.log(`   Films:   ${filmDocs.length}`);
  console.log(`   Users:   ${MEMBERS.length}`);
  console.log(`   Ratings: ${ratingCount}`);
  console.log(`   Likes:   ${likeCount}`);
  console.log('\nTo clean up, run:  node scripts/seed-fotw.mjs --cleanup');

  await mongoose.disconnect();
}

// ── Cleanup ───────────────────────────────────────────────────────────

async function cleanup() {
  console.log('🔌 Connecting...');
  await mongoose.connect(MONGO_URI);

  const [films, users, ratings, likes] = await Promise.all([
    FOTWFilm.deleteMany({ _seeded: true }),
    FOTWUser.deleteMany({ _seeded: true }),
    FOTWRating.deleteMany({ _seeded: true }),
    FOTWLike.deleteMany({ _seeded: true }),
  ]);

  console.log('🗑️  Cleaned up:');
  console.log(`   Films:   ${films.deletedCount}`);
  console.log(`   Users:   ${users.deletedCount}`);
  console.log(`   Ratings: ${ratings.deletedCount}`);
  console.log(`   Likes:   ${likes.deletedCount}`);

  await mongoose.disconnect();
}

// ── Entry point ───────────────────────────────────────────────────────

const isCleanup = process.argv.includes('--cleanup');
(isCleanup ? cleanup() : seed()).catch((err) => {
  console.error(err);
  process.exit(1);
});
