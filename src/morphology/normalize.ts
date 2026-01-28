/**
 * Text Normalization Utilities
 * Handles whitespace, punctuation, and capitalization
 */

/**
 * Normalize whitespace in text
 * - Removes multiple consecutive spaces
 * - Trims leading/trailing whitespace
 * - Normalizes space around punctuation
 */
export function normalizeWhitespace(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove space before punctuation
    .replace(/\s+([.,!?;:)])/g, '$1')
    // Remove space after opening parenthesis
    .replace(/\(\s+/g, '(')
    // Ensure single space after punctuation (except at end)
    .replace(/([.,!?;:])(?=[^\s])/g, '$1 ')
    // Trim
    .trim();
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text[0]!.toUpperCase() + text.slice(1);
}

/**
 * Capitalize the first letter of each sentence
 */
export function capitalizeSentences(text: string): string {
  // Split on sentence-ending punctuation
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => {
    return prefix + letter.toUpperCase();
  });
}

/**
 * Ensure text ends with appropriate punctuation
 */
export function ensureEndPunctuation(text: string, defaultPunct: string = '.'): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return trimmed;

  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar && ['.', '!', '?', ';', ':'].includes(lastChar)) {
    return trimmed;
  }

  return trimmed + defaultPunct;
}

/**
 * Check if text is properly capitalized (starts with capital)
 */
export function isCapitalized(text: string): boolean {
  if (!text) return true; // Empty is valid
  const firstLetter = text.match(/[a-zA-Z]/);
  if (!firstLetter) return true; // No letters is valid
  return firstLetter[0] === firstLetter[0]!.toUpperCase();
}

/**
 * Check if text ends with punctuation
 */
export function endsWithPunctuation(text: string): boolean {
  if (!text) return true; // Empty is valid
  const lastChar = text.trimEnd()[text.trimEnd().length - 1];
  return lastChar !== undefined && ['.', '!', '?', ';', ':', ','].includes(lastChar);
}

/**
 * Check if text has no double spaces
 */
export function hasNoDoubleSpaces(text: string): boolean {
  return !/\s{2,}/.test(text);
}

/**
 * Join tokens into a sentence with proper spacing
 */
export function joinTokens(tokens: string[]): string {
  if (tokens.length === 0) return '';

  let result = tokens[0] ?? '';

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]!;

    // No space before punctuation
    if (/^[.,!?;:)]/.test(token)) {
      result += token;
    }
    // No space after opening parenthesis
    else if (result.endsWith('(')) {
      result += token;
    }
    // Normal case: add space
    else {
      result += ' ' + token;
    }
  }

  return result;
}

/**
 * Format a sentence (capitalize + punctuate + normalize)
 */
export function formatSentence(text: string, punctuation: string = '.'): string {
  let result = normalizeWhitespace(text);
  result = capitalize(result);
  result = ensureEndPunctuation(result, punctuation);
  return result;
}

/**
 * Format a paragraph (multiple sentences)
 */
export function formatParagraph(sentences: string[]): string {
  return sentences
    .map(s => formatSentence(s))
    .join(' ');
}

/**
 * Format a text block (multiple paragraphs)
 */
export function formatTextBlock(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}
