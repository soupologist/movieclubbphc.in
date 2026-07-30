/**
 * Badges System for Film of the Week (FOTW)
 * Single file containing badge definitions, data structures, and evaluation logic.
 * Symbols/emojis are used for testing, with image placeholders ready for future assets.
 */

export interface BadgeDefinition {
  id: string;
  name: string;
  symbol: string;        // Symbol/emoji for testing
  imageUrl?: string;     // Optional image URL for future graphics
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

// Karri is a club member who perpetually promises to watch a film each season but never does.

/** Full list of predefined badges on the platform */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // 1. Watched Movies Badges (5 / 10 / 15)
  {
    id: 'watched-5',
    name: 'Film Novice',
    symbol: '🎬',
    description: 'Watched at least 5 movies on Film of the Week',
    category: 'watch',
  },
  {
    id: 'watched-10',
    name: 'Film Enthusiast',
    symbol: '🍿',
    description: 'Watched at least 10 movies on Film of the Week',
    category: 'watch',
  },
  {
    id: 'watched-15',
    name: 'Film Buff',
    symbol: '📽️',
    description: 'Watched at least 15 movies on Film of the Week',
    category: 'watch',
  },

  // 2. Reviews Badges (5 / 10 / 15)
  {
    id: 'reviews-5',
    name: 'Budding Critic',
    symbol: '✍️',
    description: 'Wrote reviews for 5 movies',
    category: 'review',
  },
  {
    id: 'reviews-10',
    name: 'Passionate Reviewer',
    symbol: '📝',
    description: 'Wrote reviews for 10 movies',
    category: 'review',
  },
  {
    id: 'reviews-15',
    name: 'Master Critic',
    symbol: '📜',
    description: 'Wrote reviews for 15 movies',
    category: 'review',
  },

  // 3. Watched at least 1 movie in a season (made their debut, unlike Karri)
  {
    id: 'karri-debut-surpassed',
    name: "Unlike Karri",
    symbol: '🚀',
    description: 'Watched at least 1 movie in the active season — actually made your debut, unlike Karri',
    category: 'season',
  },

  // 4. Watched all movies in a season so far
  {
    id: 'season-completionist',
    name: 'Season Completionist',
    symbol: '💯',
    description: 'Watched all movies in the active season so far',
    category: 'season',
  },

  // 5. Covered all languages in a season so far
  {
    id: 'polyglot-season',
    name: 'Season Polyglot',
    symbol: '🌐',
    description: 'Watched films covering all languages featured in the active season so far',
    category: 'season',
  },

  // 6. Recommended a movie in a new language not covered so far (overall)
  {
    id: 'polyglot-pioneer',
    name: 'Language Pioneer',
    symbol: '🚩',
    description: 'Recommended a movie in a language never before featured on Film of the Week',
    category: 'recommendation',
  },

  // 7. Spotted a bug on the site
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    symbol: '🐛',
    description: 'Spotted and reported a bug on the site',
    category: 'community',
  },

  // 8. Recommended a movie watched by over 20 people
  {
    id: 'crowd-pleaser',
    name: 'Crowd Pleaser',
    symbol: '🔥',
    description: 'Recommended a movie watched by over 20 members',
    category: 'recommendation',
  },
];

export interface ComputeBadgesInput {
  userEmail: string;
  spottedBug?: boolean;
  watchedCount?: number;
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
    chosenByEmail?: string;
    addedBy?: string;
    language?: string;
    dateSuggested?: Date | string | null;
    createdAt?: Date | string;
    watchedCount?: number;
    watchedBy?: Array<{ userEmail: string }>;
  }>;
  activeSeason?: {
    _id: string;
    startDate: Date | string;
    endDate: Date | string | null;
  } | null;
}

/**
 * Computes all badge statuses (earned & progress) for a given user based on system data.
 */
export function computeUserBadges(input: ComputeBadgesInput): UserBadgeResult[] {
  const userEmail = (input.userEmail || '').toLowerCase();
  const effectiveWatchedCount = Math.max(input.watchedCount ?? 0, input.userWatches?.length ?? 0);
  const effectiveReviewCount = (input.userReviews || []).filter(
    (r) => r.body === undefined || r.body.trim().length > 0
  ).length;

  // Active Season Film & Language processing
  let seasonFilms: Array<any> = [];
  let userSeasonWatches: Array<any> = [];
  let seasonLanguages = new Set<string>();
  let userSeasonLanguages = new Set<string>();

  if (input.activeSeason && input.allFilms && input.allFilms.length > 0) {
    const start = new Date(input.activeSeason.startDate).getTime();
    const end = input.activeSeason.endDate
      ? new Date(input.activeSeason.endDate).getTime()
      : Date.now();

    seasonFilms = input.allFilms.filter((f) => {
      const d = new Date(f.dateSuggested || f.createdAt || 0).getTime();
      return d >= start && d <= end;
    });

    const userWatchedFilmIds = new Set((input.userWatches || []).map((w) => w.filmId.toString()));
    userSeasonWatches = seasonFilms.filter((f) => userWatchedFilmIds.has(f._id.toString()));

    seasonFilms.forEach((f) => {
      const lang = (f.language || '').toLowerCase().trim();
      if (lang) seasonLanguages.add(lang);
    });

    userSeasonWatches.forEach((f) => {
      const lang = (f.language || '').toLowerCase().trim();
      if (lang) userSeasonLanguages.add(lang);
    });
  }

  // Language Pioneer check (chronological order across all films)
  // - English and Hindi are excluded (common languages of the club, not considered "foreign")
  // - Only the FIRST person to suggest a film in a new foreign language earns this badge
  const EXCLUDED_PIONEER_LANGUAGES = new Set(['english', 'hindi']);

  const allFilmsSorted = [...(input.allFilms || [])].sort(
    (a, b) =>
      new Date(a.dateSuggested || a.createdAt || 0).getTime() -
      new Date(b.dateSuggested || b.createdAt || 0).getTime()
  );

  const seenLanguages = new Set<string>();
  const pioneerMatches: Array<{ filmTitle: string; language: string }> = [];

  for (const film of allFilmsSorted) {
    const langRaw = (film.language || '').trim();
    const langLower = langRaw.toLowerCase();

    // Skip blank, English, and Hindi
    if (!langLower || EXCLUDED_PIONEER_LANGUAGES.has(langLower)) continue;

    if (!seenLanguages.has(langLower)) {
      // First time this foreign language appears — only the recommender of THIS film earns it
      seenLanguages.add(langLower);
      const isRecommender =
        (film.chosenByEmail && film.chosenByEmail.toLowerCase() === userEmail) ||
        (film.addedBy && film.addedBy.toLowerCase() === userEmail);
      if (isRecommender) {
        pioneerMatches.push({
          filmTitle: film.title || 'Untitled',
          language: formatLanguageName(langRaw),
        });
      }
    }
    // Subsequent films in the same language → no badge for anyone
  }

  // Crowd Pleaser check (user recommended a film watched by > 20 people)
  const userRecommendedFilms = (input.allFilms || []).filter(
    (f) =>
      (f.chosenByEmail && f.chosenByEmail.toLowerCase() === userEmail) ||
      (f.addedBy && f.addedBy.toLowerCase() === userEmail)
  );

  const isCrowdPleaser = userRecommendedFilms.some(
    (f) => (f.watchedCount ?? f.watchedBy?.length ?? 0) > 20
  );

  // Evaluate each badge
  return BADGE_DEFINITIONS.map((badge) => {
    let earned = false;
    let progress: BadgeProgress | undefined;

    switch (badge.id) {
      case 'watched-5':
        earned = effectiveWatchedCount >= 5;
        progress = { current: Math.min(effectiveWatchedCount, 5), target: 5 };
        break;

      case 'watched-10':
        earned = effectiveWatchedCount >= 10;
        progress = { current: Math.min(effectiveWatchedCount, 10), target: 10 };
        break;

      case 'watched-15':
        earned = effectiveWatchedCount >= 15;
        progress = { current: Math.min(effectiveWatchedCount, 15), target: 15 };
        break;

      case 'reviews-5':
        earned = effectiveReviewCount >= 5;
        progress = { current: Math.min(effectiveReviewCount, 5), target: 5 };
        break;

      case 'reviews-10':
        earned = effectiveReviewCount >= 10;
        progress = { current: Math.min(effectiveReviewCount, 10), target: 10 };
        break;

      case 'reviews-15':
        earned = effectiveReviewCount >= 15;
        progress = { current: Math.min(effectiveReviewCount, 15), target: 15 };
        break;

      case 'karri-debut-surpassed':
        // Earned if the user has watched at least 1 film in the active season
        earned = userSeasonWatches.length >= 1;
        progress = { current: Math.min(userSeasonWatches.length, 1), target: 1 };
        break;

      case 'season-completionist':
        earned = seasonFilms.length > 0 && userSeasonWatches.length === seasonFilms.length;
        progress = { current: userSeasonWatches.length, target: Math.max(seasonFilms.length, 1) };
        break;

      case 'polyglot-season':
        earned =
          seasonLanguages.size > 0 &&
          userSeasonLanguages.size === seasonLanguages.size &&
          Array.from(seasonLanguages).every((lang) => userSeasonLanguages.has(lang));
        progress = { current: userSeasonLanguages.size, target: Math.max(seasonLanguages.size, 1) };
        break;

      case 'polyglot-pioneer':
        earned = pioneerMatches.length > 0;
        break;

      case 'bug-hunter':
        earned = Boolean(input.spottedBug);
        break;

      case 'crowd-pleaser':
        earned = isCrowdPleaser;
        break;
    }

    let customDescription: string | undefined;
    if (badge.id === 'polyglot-pioneer' && earned && pioneerMatches.length > 0) {
      const details = pioneerMatches
        .map((m) => `${m.language} with "${m.filmTitle}"`)
        .join(', ');
      customDescription = `Pioneered ${details}`;
    }

    return {
      ...badge,
      description: customDescription || badge.description,
      earned,
      progress,
    };
  });
}
