/**
 * Output Transform Tokenizer & Renderer
 * Single-pass O(n) tokenizer that preserves exact whitespace and punctuation.
 * Re-rendering via render() is lossless.
 */

import type { Token, TokenType } from './types.js';

/** Punctuation characters recognized as their own tokens */
const PUNCTUATION_CHARS = new Set([
  '.', ',', ';', ':', '!', '?', "'", '"',
  '(', ')', '[', ']', '{', '}',
  '\u2026', // …
  '\u2014', // —
  '-',
]);

/** Check if a character is a letter (ASCII A-Z, a-z) */
function isLetter(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

/** Check if a character is a digit */
function isDigit(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 48 && c <= 57;
}

/** Check if a character is whitespace */
function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

/**
 * Tokenize a string into Token[] in a single pass.
 *
 * Token types:
 * - word: sequences of ASCII letters, may include internal apostrophes (e.g., "don't")
 * - number: digits with optional decimals/percent (e.g., "12", "3.14", "60%")
 * - punct: individual punctuation characters
 * - whitespace: sequences of whitespace characters
 * - symbol: anything else
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const ch = input[i]!;

    // Whitespace token
    if (isWhitespace(ch)) {
      const start = i;
      while (i < len && isWhitespace(input[i]!)) {
        i++;
      }
      tokens.push({ type: 'whitespace', value: input.slice(start, i) });
      continue;
    }

    // Word token: starts with letter
    if (isLetter(ch)) {
      const start = i;
      i++;
      while (i < len) {
        const c = input[i]!;
        if (isLetter(c)) {
          i++;
        } else if (c === "'" && i + 1 < len && isLetter(input[i + 1]!)) {
          // Internal apostrophe (e.g., "don't", "manager's")
          i += 2; // skip apostrophe + next letter
        } else {
          break;
        }
      }
      tokens.push({ type: 'word', value: input.slice(start, i) });
      continue;
    }

    // Number token: starts with digit
    if (isDigit(ch)) {
      const start = i;
      i++;
      while (i < len && isDigit(input[i]!)) {
        i++;
      }
      // Optional decimal
      if (i < len && input[i] === '.' && i + 1 < len && isDigit(input[i + 1]!)) {
        i++; // skip '.'
        while (i < len && isDigit(input[i]!)) {
          i++;
        }
      }
      // Optional percent
      if (i < len && input[i] === '%') {
        i++;
      }
      tokens.push({ type: 'number', value: input.slice(start, i) });
      continue;
    }

    // Punctuation token
    if (PUNCTUATION_CHARS.has(ch)) {
      // Handle multi-char ellipsis "..."
      if (ch === '.' && i + 2 < len && input[i + 1] === '.' && input[i + 2] === '.') {
        tokens.push({ type: 'punct', value: '...' });
        i += 3;
      } else {
        tokens.push({ type: 'punct', value: ch });
        i++;
      }
      continue;
    }

    // Symbol token: anything else, one character at a time
    tokens.push({ type: 'symbol', value: ch });
    i++;
  }

  return tokens;
}

/**
 * Render tokens back to a string. Lossless: render(tokenize(s)) === s
 */
export function render(tokens: Token[]): string {
  let result = '';
  for (const token of tokens) {
    result += token.value;
  }
  return result;
}

/**
 * Get the type classification of a single character (utility).
 */
export function classifyChar(ch: string): TokenType {
  if (isWhitespace(ch)) return 'whitespace';
  if (isLetter(ch)) return 'word';
  if (isDigit(ch)) return 'number';
  if (PUNCTUATION_CHARS.has(ch)) return 'punct';
  return 'symbol';
}
