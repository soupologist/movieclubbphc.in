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

  // Clean extra spaces
  let words = name.trim().split(/[\s]+/);

  // Filter out initials (e.g. "J", "J.", "U.", "A")
  // Only keep words that have length > 1 after stripping punctuation
  const meaningfulWords = words.filter((w) => {
    const clean = w.replace(/[^a-zA-Z0-9]/g, '');
    return clean.length > 1;
  });

  // If filtering removes everything, just use the original words
  if (meaningfulWords.length > 0) {
    words = meaningfulWords;
  }

  // Pick the first meaningful word if we just want a short display name?
  // The user says "show thomas", meaning they might want the first meaningful word or all of them.
  // We'll join them. "j thomas" -> "Thomas". "Thomas Smith" -> "Thomas Smith".
  const cleanedName = words.join(' ');
  return toTitleCase(cleanedName);
}
