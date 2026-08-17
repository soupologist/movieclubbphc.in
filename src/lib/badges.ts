/**
 * Badges System for Film of the Week (FOTW)
 * Single file containing badge definitions, data structures, and evaluation logic.
 * Symbols/emojis are used as fallback, with image URLs for graphics assets.
 */

export interface BadgeDefinition {
  id: string;
  name: string;
  symbol: string; // Symbol/emoji for fallback
  imageUrl?: string; // Image URL for unlocked state
  lockedImageUrl?: string; // Image URL for locked state
  description: string;
  category: 'watch' | 'review' | 'season' | 'recommendation' | 'community';
}

export interface BadgeProgress {
  current: number;
  target: number;
}

export interface UserBadgeResult extends BadgeDefinition {
  earned: boolean;
  progress?: BadgeProgress;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  zh: 'Chinese',
  cn: 'Chinese',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  kn: 'Kannada',
  pa: 'Punjabi',
  pt: 'Portuguese',
  da: 'Danish',
  sv: 'Swedish',
  no: 'Norwegian',
  pl: 'Polish',
};

export function formatLanguageName(lang: string): string {
  if (!lang) return '';
  const code = lang.toLowerCase().trim();
  if (LANGUAGE_NAMES[code]) return LANGUAGE_NAMES[code];
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

// ISO Country Codes & Language Codes for Region-based Badges (Reserved for future badges)
/*
const AFRICAN_COUNTRY_CODES = new Set([
  'AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ',
  'EG', 'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS',
  'LY', 'MA', 'MG', 'ML', 'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SC',
  'SD', 'SL', 'SN', 'SO', 'SS', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'ZA',
  'ZM', 'ZW'
]);

const AFRICAN_LANGUAGE_CODES = new Set([
  'af', 'am', 'bm', 'ee', 'ff', 'ha', 'ig', 'ki', 'lg', 'ln', 'lu', 'mg', 'ny',
  'om', 'rn', 'rw', 'sn', 'so', 'st', 'sw', 'ti', 'ts', 'tw', 'wo', 'xh', 'yo', 'zu'
]);

const SOUTH_AMERICAN_COUNTRY_CODES = new Set([
  'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'
]);
*/

/** Full list of predefined active badges on the platform */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // 1. Watched Movies Badges (1 / 7 / 11 / 18)
  {
    id: 'watched-1',
    name: 'Pilot',
    symbol: '🎬',
    imageUrl: '/images/badges_final/karri.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/karri grey.png',
    description: 'Watched a Film of The Week',
    category: 'watch',
  },
  {
    id: 'watched-7',
    name: 'Se7en',
    symbol: '👁️',
    imageUrl: '/images/badges_final/Bronze Eye.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Bronze Eye Gray.png',
    description: 'Watched 7 FoTWs',
    category: 'watch',
  },
  {
    id: 'watched-11',
    name: "Ocean's Eleven",
    symbol: '🎲',
    imageUrl: '/images/badges_final/Silver Eye.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Silver Eye Grey.png',
    description: 'Watched 11 FoTWs',
    category: 'watch',
  },
  {
    id: 'watched-18',
    name: 'The Eighteenth',
    symbol: '🏆',
    imageUrl: '/images/badges_final/GoldenEye.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/GoldenEye Gray.png',
    description: 'Watched 18 FoTWs',
    category: 'watch',
  },

  // 2. Reviews Badges (5 / 9 / 13)
  {
    id: 'reviews-5',
    name: 'The Film Critic',
    symbol: '✍️',
    imageUrl: '/images/badges_final/Bronze Pen.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/BronzePen Gray.png',
    description: 'Penned 5 reviews on the FoTW website',
    category: 'review',
  },
  {
    id: 'reviews-9',
    name: 'Revolution 9',
    symbol: '🖊️',
    imageUrl: '/images/badges_final/Silver Pen.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/SilverPen Gray.png',
    description: 'Penned 9 reviews on the FoTW website',
    category: 'review',
  },
  {
    id: 'reviews-13',
    name: '13 Reasons Why',
    symbol: '📜',
    imageUrl: '/images/badges_final/Gold Pen.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/GoldPen Gray.png',
    description: 'Penned 13 reviews on the FoTW website',
    category: 'review',
  },

  // 3. Seasonal Badges
  {
    id: 'polyglot-season',
    name: 'The Tower of Babel',
    symbol: '🦉',
    imageUrl: '/images/badges_final/Duolingo.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Duo Gray.png',
    description: 'Watched films in all languages that appeared this season',
    category: 'season',
  },
  {
    id: 'polyglot-pioneer-season',
    name: '.srt',
    symbol: '🗿',
    imageUrl: '/images/badges_final/Rosetta.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Rose Gray.png',
    description: 'Picked a film in a language new to the ongoing season',
    category: 'season',
  },
  {
    id: 'season-completionist',
    name: 'Big Brother Is Always Watching',
    symbol: '💯',
    imageUrl: '/images/badges_final/big bro.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/BigBro Gray.png',
    description: 'Watched all films of the ongoing season',
    category: 'season',
  },

  // 4. Community Badges
  {
    id: 'bug-hunter',
    name: 'Eye of the Tiger',
    symbol: '🕵️‍♂️',
    imageUrl: '/images/badges_final/Sheep.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Sheep gray.png',
    description: 'Spotted and alerted the team of a bug on the website',
    category: 'community',
  },

  // 5. Recommendation / Chooser Badges
  {
    id: 'crowd-pleaser',
    name: 'Cult Following',
    symbol: '🦸‍♂️',
    imageUrl: '/images/badges_final/home.png',
    lockedImageUrl: '/images/badges_final/GRAYED OUT/Home gray.png',
    description: '20 people watched a film picked by you',
    category: 'recommendation',
  },

  /* --- Reserved / Future Badges (Commented out for later activation) ---
  {
    id: 'streak-3',
    name: 'On a Roll',
    symbol: '🔥',
    description: 'Watch streak of 3 films',
    category: 'watch',
  },
  {
    id: 'streak-15',
    name: 'Unstoppable',
    symbol: '⚡',
    description: 'Watch streak of 15 films',
    category: 'watch',
  },
  {
    id: 'silent-film',
    name: 'The Mute Button',
    symbol: '🔇',
    description: 'Picked a silent film',
    category: 'recommendation',
  },
  {
    id: 'african-film',
    name: 'Madagascar',
    symbol: '🌍',
    description: 'Picked an African film',
    category: 'recommendation',
  },
  {
    id: 'south-american-film',
    name: 'Cidade de Deus',
    symbol: '🏔️',
    description: 'Picked a South American film',
    category: 'recommendation',
  },
  {
    id: 'high-rating',
    name: 'Crowd Favorite',
    symbol: '⭐',
    description: 'Picked a film which garnered an average rating of 4.2 or more',
    category: 'recommendation',
  },
  {
    id: 'queen',
    name: 'Queen',
    symbol: '👑',
    description: 'Picked a film by a female filmmaker',
    category: 'recommendation',
  },
  */
];

export interface ComputeBadgesInput {
  userEmail: string;
  userName?: string;
  userUsername?: string;
  spottedBug?: boolean;
  watchedCount?: number;
  longestStreak?: number;
  currentStreak?: number;
  userWatches?: Array<{
    filmId: string;
    dateSuggested?: Date | string | null;
    language?: string;
  }>;
  userReviews?: Array<{
    filmId: string;
    body?: string;
  }>;
  allFilms?: Array<{
    _id: string;
    title?: string;
    chosenBy?: string;
    chosenByEmail?: string;
    addedBy?: string;
    language?: string;
    dateSuggested?: Date | string | null;
    createdAt?: Date | string;
    watchedCount?: number;
    watchedBy?: Array<{ userEmail: string }>;
    year?: number;
    isSilent?: boolean;
    isAfrican?: boolean;
    isSouthAmerican?: boolean;
    isFemaleDirector?: boolean;
    directorGender?: number | string;
    originCountry?: string | string[];
    averageRating?: number;
  }>;
  allRatings?: Array<{
    filmId: string | any;
    rating: number;
  }>;
  activeSeason?: {
    _id: string;
    startDate: Date | string;
    endDate: Date | string | null;
  } | null;
}

export function isFilmSuggestedByUser(
  film: { chosenBy?: string; chosenByEmail?: string },
  userEmail: string,
  userName?: string,
  userUsername?: string
): boolean {
  const emailLower = (userEmail || '').toLowerCase().trim();
  const nameLower = (userName || '').toLowerCase().trim();
  const usernameLower = (userUsername || '').toLowerCase().trim();

  const identifiers = new Set([emailLower, nameLower, usernameLower].filter(Boolean));

  const chosenByEmail = (film.chosenByEmail || '').toLowerCase().trim();
  const chosenBy = (film.chosenBy || '').toLowerCase().trim();

  if (chosenByEmail && identifiers.has(chosenByEmail)) return true;
  if (chosenBy && identifiers.has(chosenBy)) return true;

  return false;
}

/**
 * Computes all badge statuses (earned & progress) for a given user based on system data.
 */
export function computeUserBadges(input: ComputeBadgesInput): UserBadgeResult[] {
  const userEmail = (input.userEmail || '').toLowerCase();
  // Prefer live userWatches count over potentially-stale watchedCount DB field
  const effectiveWatchedCount = Math.max(input.watchedCount ?? 0, input.userWatches?.length ?? 0);
  const uniqueReviewedFilmIds = new Set<string>();
  for (const r of input.userReviews || []) {
    if (r.filmId && (r.body === undefined || r.body.trim().length > 0)) {
      uniqueReviewedFilmIds.add(r.filmId.toString());
    }
  }
  const effectiveReviewCount = uniqueReviewedFilmIds.size;

  // Active Season Processing
  let seasonFilms: Array<any> = [];
  let userSeasonWatches: Array<any> = [];
  let seasonLanguages = new Set<string>();
  let userSeasonLanguages = new Set<string>();
  const seasonPioneerMatches: Array<{ filmTitle: string; language: string }> = [];

  if (input.activeSeason && input.allFilms && input.allFilms.length > 0) {
    const start = new Date(input.activeSeason.startDate).getTime();
    const end = input.activeSeason.endDate
      ? new Date(input.activeSeason.endDate).getTime()
      : Date.now();

    seasonFilms = input.allFilms.filter((f) => {
      // Only count films with a real dateSuggested — createdAt is unreliable for season membership
      if (!f.dateSuggested) return false;
      const d = new Date(f.dateSuggested).getTime();
      return d >= start && d <= end;
    });

    const userWatchedFilmIds = new Set((input.userWatches || []).map((w) => w.filmId.toString()));
    userSeasonWatches = seasonFilms.filter((f) => userWatchedFilmIds.has(f._id.toString()));

    seasonFilms.forEach((f) => {
      const lang = (f.language || '').toLowerCase().trim();
      // Tower of Babel: track all languages (including English) — user must watch every language
      if (lang) seasonLanguages.add(lang);
    });

    userSeasonWatches.forEach((f) => {
      const lang = (f.language || '').toLowerCase().trim();
      if (lang) userSeasonLanguages.add(lang);
    });

    // Language Pioneer in active season (first film in active season with a new language)
    const sortedSeasonFilms = [...seasonFilms].sort(
      (a, b) =>
        new Date(a.dateSuggested || a.createdAt || 0).getTime() -
        new Date(b.dateSuggested || b.createdAt || 0).getTime()
    );

    const seenSeasonLanguages = new Set<string>();
    for (const film of sortedSeasonFilms) {
      const langRaw = (film.language || '').trim();
      const langLower = langRaw.toLowerCase();

      // Skip blank and English (English is default language, not foreign/new language pioneer)
      if (!langLower || langLower === 'english' || langLower === 'en') continue;

      if (!seenSeasonLanguages.has(langLower)) {
        seenSeasonLanguages.add(langLower);
        if (isFilmSuggestedByUser(film, userEmail, input.userName, input.userUsername)) {
          seasonPioneerMatches.push({
            filmTitle: film.title || 'Untitled',
            language: formatLanguageName(langRaw),
          });
        }
      }
    }
  }

  // Evaluate Chooser / Recommendation Special Badges across all films
  let recommended20WatcherFilm = false;

  for (const film of input.allFilms || []) {
    if (!isFilmSuggestedByUser(film, userEmail, input.userName, input.userUsername)) {
      continue;
    }

    // 1. Crowd Pleaser (Homelander?) — 20+ people watched a film the user picked
    // Use watchedBy array length as the live source; fall back to watchedCount if stored
    const watchers =
      (film.watchedBy?.length ?? 0) > 0 ? film.watchedBy!.length : (film.watchedCount ?? 0);
    if (watchers >= 20) {
      recommended20WatcherFilm = true;
    }
  }

  // Evaluate each badge definition
  return BADGE_DEFINITIONS.map((badge) => {
    let earned = false;
    let progress: BadgeProgress | undefined;

    switch (badge.id) {
      case 'watched-1':
        earned = effectiveWatchedCount >= 1;
        progress = { current: Math.min(effectiveWatchedCount, 1), target: 1 };
        break;

      case 'watched-7':
        earned = effectiveWatchedCount >= 7;
        progress = { current: Math.min(effectiveWatchedCount, 7), target: 7 };
        break;

      case 'watched-11':
        earned = effectiveWatchedCount >= 11;
        progress = { current: Math.min(effectiveWatchedCount, 11), target: 11 };
        break;

      case 'watched-18':
        earned = effectiveWatchedCount >= 18;
        progress = { current: Math.min(effectiveWatchedCount, 18), target: 18 };
        break;

      case 'reviews-5':
        earned = effectiveReviewCount >= 5;
        progress = { current: Math.min(effectiveReviewCount, 5), target: 5 };
        break;

      case 'reviews-9':
        earned = effectiveReviewCount >= 9;
        progress = { current: Math.min(effectiveReviewCount, 9), target: 9 };
        break;

      case 'reviews-13':
        earned = effectiveReviewCount >= 13;
        progress = { current: Math.min(effectiveReviewCount, 13), target: 13 };
        break;

      case 'polyglot-season':
        earned =
          seasonLanguages.size > 0 &&
          userSeasonLanguages.size === seasonLanguages.size &&
          Array.from(seasonLanguages).every((lang) => userSeasonLanguages.has(lang));
        progress = { current: userSeasonLanguages.size, target: Math.max(seasonLanguages.size, 1) };
        break;

      case 'polyglot-pioneer-season':
        earned = seasonPioneerMatches.length > 0;
        break;

      case 'season-completionist':
        earned = seasonFilms.length > 0 && userSeasonWatches.length === seasonFilms.length;
        progress = { current: userSeasonWatches.length, target: Math.max(seasonFilms.length, 1) };
        break;

      case 'bug-hunter':
        earned = Boolean(input.spottedBug);
        break;

      case 'crowd-pleaser':
        earned = recommended20WatcherFilm;
        break;
    }

    let customDescription: string | undefined;
    if (badge.id === 'polyglot-pioneer-season' && earned && seasonPioneerMatches.length > 0) {
      const details = seasonPioneerMatches
        .map((m) => `${m.language} with "${m.filmTitle}"`)
        .join(', ');
      customDescription = `Pioneered ${details}`;
    }

    const activeImageUrl = earned ? badge.imageUrl : badge.lockedImageUrl || badge.imageUrl;

    return {
      ...badge,
      imageUrl: activeImageUrl,
      description: customDescription || badge.description,
      earned,
      progress,
    };
  });
}
