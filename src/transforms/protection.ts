/**
 * Protection Rules
 * Evaluates tokens and marks them as protected based on ProtectionConfig.
 * Protection is computed once before the pipeline runs and carried through token meta.
 */

import type { Token, ProtectionConfig } from './types.js';
import { DEFAULT_PROTECTION_CONFIG } from './types.js';

/** Acronym pattern: 2+ uppercase letters */
const ACRONYM_REGEX = /^[A-Z]{2,}$/;

/** URL-like pattern: contains :// or starts with www. */
function isUrlLike(value: string): boolean {
  return value.includes('://') || value.startsWith('www.');
}

/** Email-like pattern: contains @ */
function isEmailLike(value: string): boolean {
  return value.includes('@');
}

/** Code-like heuristics */
function isCodeLike(value: string): boolean {
  // Contains underscore or backslash
  if (value.includes('_') || value.includes('\\')) return true;
  // Contains / that looks like a path (not just a single slash)
  if (value.includes('/') && value.length > 1) return true;
  // Multiple dot-separated segments (e.g., "file.txt", "a.b.c")
  const dotParts = value.split('.');
  if (dotParts.length > 1 && dotParts.every(p => p.length > 0)) return true;
  // Mixed letters+digits (e.g., "v2", "H2O")
  const hasLetters = /[a-zA-Z]/.test(value);
  const hasDigits = /[0-9]/.test(value);
  if (hasLetters && hasDigits) return true;
  return false;
}

/**
 * Apply protection rules to all tokens.
 * This mutates the token meta in place for efficiency.
 */
export function applyProtection(tokens: Token[], config: ProtectionConfig): void {
  const cfg = { ...DEFAULT_PROTECTION_CONFIG, ...config };
  const customRegexes = cfg.customProtectedRegex.map(r => new RegExp(r));

  for (const token of tokens) {
    // Only word and symbol tokens can be protected
    // Number tokens are separately handled
    const protections: string[] = [];

    if (token.type === 'number' && cfg.keepNumbers) {
      protections.push('number');
    }

    if (token.type === 'word') {
      // Acronym check
      if (cfg.keepAcronyms && ACRONYM_REGEX.test(token.value)) {
        protections.push('acronym');
      }

      // URL/email check
      if (cfg.keepUrlsEmails && (isUrlLike(token.value) || isEmailLike(token.value))) {
        protections.push('urlLike');
      }

      // Code-like check
      if (cfg.keepCodeTokens && isCodeLike(token.value)) {
        protections.push('codeLike');
      }

      // Short word check
      if (cfg.minWordLength > 0 && token.value.length < cfg.minWordLength) {
        protections.push('shortWord');
      }

      // Custom regex
      for (let idx = 0; idx < customRegexes.length; idx++) {
        if (customRegexes[idx]!.test(token.value)) {
          protections.push(`customRegex[${idx}]`);
        }
      }
    }

    // Symbol tokens: check URL/email/code
    if (token.type === 'symbol') {
      if (cfg.keepUrlsEmails && (isUrlLike(token.value) || isEmailLike(token.value))) {
        protections.push('urlLike');
      }
      if (cfg.keepCodeTokens && isCodeLike(token.value)) {
        protections.push('codeLike');
      }
    }

    if (protections.length > 0) {
      if (!token.meta) token.meta = {};
      token.meta.protected = true;
      token.meta.protectionsApplied = protections;
    }
  }
}

/**
 * Check if a token is protected.
 */
export function isProtected(token: Token): boolean {
  return token.meta?.protected === true;
}
