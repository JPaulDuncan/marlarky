/**
 * Lexicon Loader
 * Loads and parses lexicon JSON
 */

import type { Lexicon } from '../types/lexicon.js';
import { validateLexicon } from './validator.js';

/**
 * Load a lexicon from a JSON string
 * @throws Error if JSON is invalid or lexicon validation fails
 */
export function loadLexiconFromString(jsonString: string): Lexicon {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  const validation = validateLexicon(parsed);

  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid lexicon:\n${errorMessages}`);
  }

  return parsed as Lexicon;
}

/**
 * Load a lexicon from an object (e.g., already parsed JSON)
 * @throws Error if lexicon validation fails
 */
export function loadLexiconFromObject(obj: unknown): Lexicon {
  const validation = validateLexicon(obj);

  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid lexicon:\n${errorMessages}`);
  }

  return obj as Lexicon;
}

/**
 * Try to load a lexicon, returning validation result instead of throwing
 */
export function tryLoadLexicon(obj: unknown): { lexicon?: Lexicon; validation: ReturnType<typeof validateLexicon> } {
  const validation = validateLexicon(obj);

  if (validation.valid) {
    return { lexicon: obj as Lexicon, validation };
  }

  return { validation };
}
