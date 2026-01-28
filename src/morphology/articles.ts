/**
 * Article Selection (a/an)
 * Handles the a/an selection based on the following word's initial sound
 */

// Words that start with a vowel letter but have a consonant sound
const CONSONANT_SOUND_WORDS = new Set([
  'one', 'once', 'ones',
  'uni', 'uniform', 'uniforms', 'union', 'unions', 'unique', 'unit', 'units', 'united', 'unity',
  'universal', 'universe', 'university', 'universities',
  'use', 'used', 'useful', 'useless', 'user', 'users', 'uses', 'using', 'usual', 'usually',
  'utensil', 'utensils', 'utility', 'utilities', 'utopia',
  'european', 'europeans', 'euphoria', 'euphemism',
  'ewe', 'ewes',
]);

// Words that start with a consonant letter but have a vowel sound
const VOWEL_SOUND_WORDS = new Set([
  'hour', 'hours', 'hourly',
  'heir', 'heirs', 'heiress', 'heirloom', 'heirlooms',
  'honest', 'honestly', 'honesty', 'honor', 'honors', 'honorable', 'honorary', 'honour', 'honours',
  'herb', 'herbs', 'herbal', // American English
]);

// Acronyms/initialisms starting with vowel sounds
const VOWEL_SOUND_LETTERS = new Set(['a', 'e', 'f', 'h', 'i', 'l', 'm', 'n', 'o', 'r', 's', 'x']);

/**
 * Determine if "an" should be used instead of "a"
 */
export function useAn(word: string): boolean {
  if (!word || word.length === 0) return false;

  const lower = word.toLowerCase();
  const first = lower[0]!;

  // Check explicit exceptions first
  if (CONSONANT_SOUND_WORDS.has(lower)) return false;
  if (VOWEL_SOUND_WORDS.has(lower)) return true;

  // Check for partial matches (prefixes)
  for (const exception of CONSONANT_SOUND_WORDS) {
    if (lower.startsWith(exception) && lower.length > exception.length) {
      const nextChar = lower[exception.length];
      // Check if it's still the same word (not a compound)
      if (nextChar && /[a-z]/.test(nextChar)) {
        return false;
      }
    }
  }

  // Check if it looks like an acronym (all caps, or starts with capital)
  if (word === word.toUpperCase() && word.length <= 5) {
    return VOWEL_SOUND_LETTERS.has(first);
  }

  // Basic vowel check
  return 'aeiou'.includes(first);
}

/**
 * Get the appropriate indefinite article for a word
 */
export function getIndefiniteArticle(word: string): 'a' | 'an' {
  return useAn(word) ? 'an' : 'a';
}

/**
 * Prepend the appropriate indefinite article to a word
 */
export function withIndefiniteArticle(word: string): string {
  return `${getIndefiniteArticle(word)} ${word}`;
}
