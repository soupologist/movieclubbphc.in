export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

export function formatDisplayName(name?: string, username?: string): string {
  if (username && username.trim().length > 0) {
    return username.trim();
  }

  if (!name) return 'Anonymous';

  let words = name.trim().split(/[\s]+/);

  const meaningfulWords = words.filter((w) => {
    const clean = w.replace(/[^a-zA-Z0-9]/g, '');
    return clean.length > 1;
  });

  // If filtering removes everything, just use the original words
  if (meaningfulWords.length > 0) {
    words = meaningfulWords;
  }

  const cleanedName = words.join(' ');
  return toTitleCase(cleanedName);
}

/**
 * Convert an ISO 639-1 language code to a human-readable name.
 *
 * Strategy:
 *   1. Curated lookup table — covers every code seen in the FOTW DB plus
 *      all major world languages. Also handles TMDB non-standard codes
 *      like "cn" (Cantonese).
 *   2. `Intl.DisplayNames` — built-in Node 12+ / browser API for any
 *      unlisted but valid BCP-47 code.
 *   3. Last resort — title-cases the raw code string.
 *
 * @example
 * normalizeLanguage('en')   // "English"
 * normalizeLanguage('hi')   // "Hindi"
 * normalizeLanguage('cn')   // "Cantonese"
 * normalizeLanguage('')     // "Unknown"
 * normalizeLanguage(null)   // "Unknown"
 */
const LANGUAGE_NAMES: Record<string, string> = {
  // ── Codes seen in the FOTW DB ────────────────────────────────────
  en: 'English',
  hi: 'Hindi',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
  fa: 'Persian',
  es: 'Spanish',
  bn: 'Bengali',
  cn: 'Cantonese', // TMDB uses 'cn' for Cantonese (non-standard BCP-47)
  ta: 'Tamil',
  // ── Other frequently seen TMDB codes ─────────────────────────────
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese (Mandarin)',
  ar: 'Arabic',
  tr: 'Turkish',
  pl: 'Polish',
  nl: 'Dutch',
  sv: 'Swedish',
  da: 'Danish',
  nb: 'Norwegian',
  fi: 'Finnish',
  he: 'Hebrew',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  vi: 'Vietnamese',
  uk: 'Ukrainian',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  el: 'Greek',
  no: 'Norwegian',
  sk: 'Slovak',
  hr: 'Croatian',
  bg: 'Bulgarian',
  sr: 'Serbian',
  ca: 'Catalan',
  ml: 'Malayalam',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
  si: 'Sinhala',
  ne: 'Nepali',
  sw: 'Swahili',
  af: 'Afrikaans',
  sq: 'Albanian',
  hy: 'Armenian',
  az: 'Azerbaijani',
  be: 'Belarusian',
  et: 'Estonian',
  ka: 'Georgian',
  kk: 'Kazakh',
  lv: 'Latvian',
  lt: 'Lithuanian',
  mk: 'Macedonian',
  mn: 'Mongolian',
  sl: 'Slovenian',
  tl: 'Filipino',
  uz: 'Uzbek',
  la: 'Latin',
  eo: 'Esperanto',
  xx: 'No Language',
};

export function normalizeLanguage(code: string | null | undefined): string {
  if (!code || code.trim() === '') return 'Unknown';

  const key = code.trim().toLowerCase();

  // 1. Curated lookup (handles non-standard codes like 'cn')
  if (LANGUAGE_NAMES[key]) return LANGUAGE_NAMES[key];

  // 2. Intl.DisplayNames — available in Node 12+ and all modern browsers
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'language' });
    const name = display.of(key);
    if (name && name !== key) return name;
  } catch {
    // Intl not available or code not recognised — fall through
  }

  // 3. Last resort: return the raw code, title-cased
  return toTitleCase(key);
}
