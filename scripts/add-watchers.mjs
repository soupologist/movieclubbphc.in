import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dns from 'dns';
import https from 'https';
import readline from 'readline';

// Monkey-patch dns.resolveSrv (callback & promise versions) to fallback to HTTPS DNS (DoH) if local SRV UDP query fails
function dohResolveSrv(hostname) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=SRV`,
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.Answer && data.Answer.length > 0) {
              const records = data.Answer.map((ans) => {
                const parts = ans.data.split(' ');
                return {
                  priority: parseInt(parts[0], 10) || 0,
                  weight: parseInt(parts[1], 10) || 0,
                  port: parseInt(parts[2], 10) || 27017,
                  name: parts[3].replace(/\.$/, ''),
                };
              });
              return resolve(records);
            }
          } catch (e) {}
          reject(new Error(`Failed to resolve SRV via DoH for ${hostname}`));
        });
      }
    );
    req.on('error', (e) => reject(e));
  });
}

const originalCallbackResolveSrv = dns.resolveSrv;
dns.resolveSrv = function (hostname, callback) {
  originalCallbackResolveSrv.call(dns, hostname, (err, addresses) => {
    if (err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
      dohResolveSrv(hostname)
        .then((records) => callback(null, records))
        .catch(() => callback(err));
    } else {
      callback(err, addresses);
    }
  });
};

if (dns.promises && dns.promises.resolveSrv) {
  const originalPromiseResolveSrv = dns.promises.resolveSrv;
  dns.promises.resolveSrv = async function (hostname) {
    try {
      return await originalPromiseResolveSrv.call(dns.promises, hostname);
    } catch (err) {
      if (err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
        return await dohResolveSrv(hostname);
      }
      throw err;
    }
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = resolve(__dirname, '../.env');
if (!existsSync(envPath)) {
  throw new Error(`.env file not found at ${envPath}`);
}

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

const { Schema, model, models } = mongoose;

// Define schemas matching src/lib/fotw/schemas.ts
const FOTWFilmSchema = new Schema(
  {
    title: { type: String, required: true },
    watchedBy: {
      type: [
        {
          userEmail: { type: String, required: true },
          watchedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    watchedCount: { type: Number, default: 0 },
  },
  { collection: 'fotwfilms' }
);

const FOTWUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    username: { type: String },
    watchedCount: { type: Number, default: 0 },
    seasonWatchedCount: { type: Number, default: 0 },
  },
  { collection: 'fotwusers' }
);

const FOTWRatingSchema = new Schema(
  {
    userEmail: { type: String, required: true },
    filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm', required: true },
    rating: { type: Number, required: true },
  },
  { timestamps: true, collection: 'fotwratings' }
);

const FOTWLikeSchema = new Schema(
  {
    userEmail: { type: String, required: true },
    filmId: { type: Schema.Types.ObjectId, ref: 'FOTWFilm', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'fotwlikes' }
);

const FOTWFilm = models.FOTWFilm || model('FOTWFilm', FOTWFilmSchema);
const FOTWUser = models.FOTWUser || model('FOTWUser', FOTWUserSchema);
const FOTWRating = models.FOTWRating || model('FOTWRating', FOTWRatingSchema);
const FOTWLike = models.FOTWLike || model('FOTWLike', FOTWLikeSchema);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--user' || arg === '-u') parsed.user = args[++i];
    else if (arg === '--movie' || arg === '-m') parsed.movie = args[++i];
    else if (arg === '--rating' || arg === '-r') parsed.rating = parseFloat(args[++i]);
    else if (arg === '--like' || arg === '-l') parsed.like = true;
    else if (arg === '--no-like') parsed.like = false;
  }
  return parsed;
}

async function prompt(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function run() {
  const cliArgs = parseCliArgs();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('🎬 Film of the Week - Add Watch Entry 🎬\n');

  // 1. Get User input
  let userInput = cliArgs.user;
  while (!userInput || !userInput.trim()) {
    userInput = await prompt(rl, '👤 Enter user (name, username, or email): ');
  }

  // 2. Get Movie input
  let movieInput = cliArgs.movie;
  while (!movieInput || !movieInput.trim()) {
    movieInput = await prompt(rl, '🍿 Enter movie title: ');
  }

  // 3. Get Rating input
  let ratingVal = cliArgs.rating;
  if (ratingVal === undefined) {
    const rawRating = await prompt(rl, '⭐ Enter rating (0.5 to 5.0, or press Enter to skip): ');
    if (rawRating.trim()) {
      const parsed = parseFloat(rawRating.trim());
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 5.0) {
        ratingVal = parsed;
      } else {
        console.warn('⚠️ Invalid rating value entered. Rating will be skipped.');
      }
    }
  }

  // 4. Get Like input
  let likeVal = cliArgs.like;
  if (likeVal === undefined) {
    const rawLike = await prompt(rl, '❤️ Like this film? (y/n, default n): ');
    const cleaned = rawLike.trim().toLowerCase();
    likeVal = ['y', 'yes', 'true', '1'].includes(cleaned);
  }

  console.log('\n🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  // Search User
  const userRegex = new RegExp(escapeRegex(userInput.trim()), 'i');
  const matchingUsers = await FOTWUser.find({
    $or: [{ username: userRegex }, { email: userRegex }, { name: userRegex }],
  });

  if (matchingUsers.length === 0) {
    console.error(`❌ No user found matching "${userInput.trim()}"`);
    rl.close();
    await mongoose.disconnect();
    return;
  }

  let selectedUser = matchingUsers[0];
  if (matchingUsers.length > 1) {
    console.log(`\nFound ${matchingUsers.length} matching users:`);
    matchingUsers.forEach((u, idx) => {
      console.log(`  [${idx + 1}] ${u.name} (@${u.username || 'N/A'}) - ${u.email}`);
    });
    const choice = await prompt(rl, `Select user [1-${matchingUsers.length}] (default 1): `);
    const selectedIdx = parseInt(choice.trim(), 10) - 1;
    if (selectedIdx >= 0 && selectedIdx < matchingUsers.length) {
      selectedUser = matchingUsers[selectedIdx];
    }
  }

  console.log(
    `\n👤 Selected User: "${selectedUser.name}" (@${selectedUser.username || 'N/A'}, ${selectedUser.email})`
  );

  // Search Film
  const filmRegex = new RegExp(escapeRegex(movieInput.trim()), 'i');
  const matchingFilms = await FOTWFilm.find({ title: filmRegex });

  if (matchingFilms.length === 0) {
    console.error(`❌ No film found matching "${movieInput.trim()}"`);
    rl.close();
    await mongoose.disconnect();
    return;
  }

  let selectedFilm = matchingFilms[0];
  if (matchingFilms.length > 1) {
    console.log(`\nFound ${matchingFilms.length} matching films:`);
    matchingFilms.forEach((f, idx) => {
      console.log(`  [${idx + 1}] ${f.title}`);
    });
    const choice = await prompt(rl, `Select film [1-${matchingFilms.length}] (default 1): `);
    const selectedIdx = parseInt(choice.trim(), 10) - 1;
    if (selectedIdx >= 0 && selectedIdx < matchingFilms.length) {
      selectedFilm = matchingFilms[selectedIdx];
    }
  }

  console.log(`🎬 Selected Film: "${selectedFilm.title}" (ID: ${selectedFilm._id})`);

  // Summary & Confirmation
  console.log('\n--- Summary ---');
  console.log(`User:   ${selectedUser.name} (${selectedUser.email})`);
  console.log(`Film:   ${selectedFilm.title}`);
  console.log(
    `Rating: ${ratingVal !== undefined && ratingVal !== null ? `${ratingVal} stars` : 'None'}`
  );
  console.log(`Like:   ${likeVal ? 'Yes ' : 'No'}`);

  if (cliArgs.user && cliArgs.movie) {
    // Non-interactive CLI flag mode
  } else {
    const confirm = await prompt(rl, '\nProceed with updating the database? (Y/n): ');
    if (confirm.trim().toLowerCase() === 'n') {
      console.log('Cancelled. No changes made.');
      rl.close();
      await mongoose.disconnect();
      return;
    }
  }

  const now = new Date();

  // 1. WatchedBy update
  const alreadyWatched = selectedFilm.watchedBy.some(
    (w) => w.userEmail.toLowerCase() === selectedUser.email.toLowerCase()
  );

  if (alreadyWatched) {
    console.log(
      `ℹ️ User ${selectedUser.email} has already marked "${selectedFilm.title}" as watched.`
    );
  } else {
    console.log(`➕ Adding ${selectedUser.email} to watchedBy array...`);
    selectedFilm.watchedBy.push({
      userEmail: selectedUser.email,
      watchedAt: now,
    });
    selectedFilm.watchedCount = selectedFilm.watchedBy.length;
    await selectedFilm.save();

    console.log(`📈 Incrementing watch counts for ${selectedUser.email}...`);
    selectedUser.watchedCount = (selectedUser.watchedCount || 0) + 1;
    selectedUser.seasonWatchedCount = (selectedUser.seasonWatchedCount || 0) + 1;
    await selectedUser.save();
  }

  // 2. Rating update
  if (ratingVal !== undefined && ratingVal !== null) {
    const ratingQuery = { userEmail: selectedUser.email, filmId: selectedFilm._id };
    const ratingDoc = await FOTWRating.findOneAndUpdate(
      ratingQuery,
      { $set: { rating: ratingVal } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`⭐ Rating updated/created: ${ratingDoc.rating} stars`);
  }

  // 3. Like update
  if (likeVal) {
    const likeQuery = { userEmail: selectedUser.email, filmId: selectedFilm._id };
    await FOTWLike.findOneAndUpdate(
      likeQuery,
      { $setOnInsert: { userEmail: selectedUser.email, filmId: selectedFilm._id, createdAt: now } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`❤️ Like registered on "${selectedFilm.title}"`);
  }

  console.log('\n🎉 Database updated successfully!');
  rl.close();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Error during script execution:', err);
  mongoose.disconnect();
  process.exit(1);
});
