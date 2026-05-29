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
