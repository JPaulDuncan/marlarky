/**
 * Noun Pluralization
 * Handles regular and common irregular plural forms
 */

// Irregular plurals map
const IRREGULAR_PLURALS: Record<string, string> = {
  // People
  'person': 'people',
  'man': 'men',
  'woman': 'women',
  'child': 'children',
  'foot': 'feet',
  'tooth': 'teeth',
  'goose': 'geese',
  'mouse': 'mice',
  'louse': 'lice',
  'ox': 'oxen',

  // Animals
  'fish': 'fish',
  'sheep': 'sheep',
  'deer': 'deer',
  'moose': 'moose',
  'swine': 'swine',
  'buffalo': 'buffalo',
  'shrimp': 'shrimp',
  'trout': 'trout',
  'salmon': 'salmon',

  // Latin/Greek origins
  'analysis': 'analyses',
  'basis': 'bases',
  'crisis': 'crises',
  'diagnosis': 'diagnoses',
  'hypothesis': 'hypotheses',
  'oasis': 'oases',
  'parenthesis': 'parentheses',
  'synopsis': 'synopses',
  'thesis': 'theses',

  'criterion': 'criteria',
  'phenomenon': 'phenomena',
  'datum': 'data',
  'medium': 'media',
  'memorandum': 'memoranda',
  'curriculum': 'curricula',
  'symposium': 'symposia',

  'appendix': 'appendices',
  'index': 'indices',
  'matrix': 'matrices',
  'vertex': 'vertices',
  'vortex': 'vortices',

  'focus': 'foci',
  'fungus': 'fungi',
  'cactus': 'cacti',
  'nucleus': 'nuclei',
  'radius': 'radii',
  'stimulus': 'stimuli',
  'syllabus': 'syllabi',
  'alumnus': 'alumni',

  // Others
  'aircraft': 'aircraft',
  'series': 'series',
  'species': 'species',
  'corps': 'corps',
  'means': 'means',
  'news': 'news',
  'offspring': 'offspring',
  'staff': 'staff',

  'life': 'lives',
  'wife': 'wives',
  'knife': 'knives',
  'leaf': 'leaves',
  'half': 'halves',
  'self': 'selves',
  'shelf': 'shelves',
  'calf': 'calves',
  'loaf': 'loaves',
  'wolf': 'wolves',
  'thief': 'thieves',
};

// Create reverse mapping for singularization
const IRREGULAR_SINGULARS: Record<string, string> = {};
for (const [singular, plural] of Object.entries(IRREGULAR_PLURALS)) {
  IRREGULAR_SINGULARS[plural] = singular;
}

/**
 * Convert a noun to its plural form
 */
export function pluralize(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();

  // Check irregular plurals
  if (IRREGULAR_PLURALS[lower]) {
    // Preserve original casing
    if (word === word.toUpperCase()) {
      return IRREGULAR_PLURALS[lower]!.toUpperCase();
    }
    if (word[0] === word[0]!.toUpperCase()) {
      return IRREGULAR_PLURALS[lower]![0]!.toUpperCase() + IRREGULAR_PLURALS[lower]!.slice(1);
    }
    return IRREGULAR_PLURALS[lower]!;
  }

  // Regular rules
  const lastChar = lower[lower.length - 1];
  const lastTwo = lower.slice(-2);

  // Words ending in s, x, z, ch, sh -> add es
  if (['s', 'x', 'z'].includes(lastChar!) || ['ch', 'sh'].includes(lastTwo)) {
    return word + 'es';
  }

  // Words ending in consonant + y -> change y to ies
  if (lastChar === 'y' && !['a', 'e', 'i', 'o', 'u'].includes(lower[lower.length - 2] ?? '')) {
    return word.slice(0, -1) + 'ies';
  }

  // Words ending in f or fe -> change to ves (handled by irregulars mostly)
  // Some regular: roof -> roofs, chief -> chiefs, etc.

  // Words ending in o
  if (lastChar === 'o') {
    // Common ones that add es
    const oWords = ['hero', 'potato', 'tomato', 'echo', 'torpedo', 'veto'];
    if (oWords.includes(lower)) {
      return word + 'es';
    }
    // Most add just s
    return word + 's';
  }

  // Default: add s
  return word + 's';
}

/**
 * Convert a plural noun to its singular form
 */
export function singularize(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();

  // Check irregular singulars
  if (IRREGULAR_SINGULARS[lower]) {
    // Preserve original casing
    if (word === word.toUpperCase()) {
      return IRREGULAR_SINGULARS[lower]!.toUpperCase();
    }
    if (word[0] === word[0]!.toUpperCase()) {
      return IRREGULAR_SINGULARS[lower]![0]!.toUpperCase() + IRREGULAR_SINGULARS[lower]!.slice(1);
    }
    return IRREGULAR_SINGULARS[lower]!;
  }

  // Regular rules (reverse of pluralize)

  // Words ending in ies -> y
  if (lower.endsWith('ies') && lower.length > 4) {
    return word.slice(0, -3) + 'y';
  }

  // Words ending in es
  if (lower.endsWith('es')) {
    const base = word.slice(0, -2);
    const baseLower = lower.slice(0, -2);

    // Check if it should be just removing 'es'
    if (baseLower.endsWith('ch') || baseLower.endsWith('sh') ||
        baseLower.endsWith('x') || baseLower.endsWith('z') ||
        baseLower.endsWith('s') || baseLower.endsWith('o')) {
      return base;
    }

    // Otherwise might just be 's'
    return word.slice(0, -1);
  }

  // Words ending in s -> remove s
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return word.slice(0, -1);
  }

  return word;
}

/**
 * Check if a word is likely plural
 */
export function isPlural(word: string): boolean {
  const lower = word.toLowerCase();

  // Check if it's a known plural
  if (IRREGULAR_SINGULARS[lower]) {
    return true;
  }

  // Check if it's a known singular (not plural)
  if (IRREGULAR_PLURALS[lower] && IRREGULAR_PLURALS[lower] !== lower) {
    return false;
  }

  // Heuristic: ends in 's' but not 'ss'
  return lower.endsWith('s') && !lower.endsWith('ss');
}
