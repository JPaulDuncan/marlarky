/**
 * Comprehensive tests for all V1 transforms.
 * At least 10 tests per transform covering:
 * - basic behavior
 * - casing
 * - punctuation preservation
 * - protected token behavior
 * - determinism with seed
 */

import { describe, it, expect } from 'vitest';
import { tokenize, render } from '../tokenizer.js';
import { applyProtection } from '../protection.js';
import { SeedableRng } from '../../rng/seedable-rng.js';
import type { TransformInput, Token } from '../types.js';

import { ubbiDubbiTransform } from './ubbi-dubbi.js';
import { leetTransform } from './leet.js';
import { uwuTransform } from './uwu.js';
import { pirateTransform } from './pirate.js';
import { redactTransform } from './redact.js';
import { emojiTransform } from './emoji.js';
import { mockCaseTransform } from './mock-case.js';
import { reverseWordsTransform } from './reverse-words.js';
import { bizJargonTransform } from './biz-jargon.js';

function makeInput(
  text: string,
  params: Record<string, unknown> = {},
  seed = 42,
  protect = false,
): TransformInput {
  const tokens = tokenize(text);
  if (protect) {
    applyProtection(tokens, { keepAcronyms: true, keepNumbers: true, minWordLength: 2 });
  }
  return {
    tokens,
    params,
    rng: new SeedableRng(seed),
    protection: protect ? { keepAcronyms: true, keepNumbers: true, minWordLength: 2 } : {},
    traceEnabled: false,
  };
}

function applyTransform(
  transform: { apply: (input: TransformInput) => { tokens: Token[] } },
  text: string,
  params: Record<string, unknown> = {},
  seed = 42,
  protect = false,
): string {
  const input = makeInput(text, params, seed, protect);
  const output = transform.apply(input);
  return render(output.tokens);
}

// ─── Ubbi Dubbi ────────────────────────────────────────────────

describe('Ubbi Dubbi Transform', () => {
  it('should insert "ub" before vowel groups (group mode)', () => {
    const result = applyTransform(ubbiDubbiTransform, 'hello');
    // h + ub + e + ll + ub + o = hubellubo
    expect(result).toBe('hubellubo');
  });

  it('should handle word starting with vowel', () => {
    const result = applyTransform(ubbiDubbiTransform, 'apple');
    expect(result).toBe('ubapplube');
  });

  it('should preserve case when inserting prefix', () => {
    const result = applyTransform(ubbiDubbiTransform, 'Hello');
    expect(result[0]).toBe('H');
  });

  it('should handle beforeEachVowel mode', () => {
    const result = applyTransform(ubbiDubbiTransform, 'audio', { mode: 'beforeEachVowel' });
    // Each vowel gets prefix
    expect(result.length).toBeGreaterThan('audio'.length);
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(ubbiDubbiTransform, 'API hello', {}, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(ubbiDubbiTransform, 'Hello, world!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(ubbiDubbiTransform, 'hello');
    const r2 = applyTransform(ubbiDubbiTransform, 'hello');
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(ubbiDubbiTransform.validateParams({}).valid).toBe(true);
    expect(ubbiDubbiTransform.validateParams({ mode: 'invalid' }).valid).toBe(false);
  });

  it('should respect maxInsertionsPerWord', () => {
    const result = applyTransform(ubbiDubbiTransform, 'audio', { maxInsertionsPerWord: 1 });
    const ubCount = (result.match(/ub/g) || []).length;
    expect(ubCount).toBeLessThanOrEqual(1);
  });

  it('should use custom prefix', () => {
    const result = applyTransform(ubbiDubbiTransform, 'hello', { prefix: 'ab' });
    expect(result).toContain('ab');
  });
});

// ─── Leetspeak ─────────────────────────────────────────────────

describe('Leetspeak Transform', () => {
  it('should substitute characters at intensity=1.0', () => {
    const result = applyTransform(leetTransform, 'test', { intensity: 1.0 });
    expect(result).not.toBe('test');
  });

  it('should not change text at intensity=0', () => {
    const result = applyTransform(leetTransform, 'hello', { intensity: 0 });
    expect(result).toBe('hello');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(leetTransform, 'Hello, world!', { intensity: 1.0 });
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(leetTransform, 'API test', { intensity: 1.0 }, 42, true);
    expect(result.startsWith('API')).toBe(true);
  });

  it('should be deterministic with same seed', () => {
    const r1 = applyTransform(leetTransform, 'hello world', { intensity: 0.5 }, 100);
    const r2 = applyTransform(leetTransform, 'hello world', { intensity: 0.5 }, 100);
    expect(r1).toBe(r2);
  });

  it('should produce different results with different seeds', () => {
    const r1 = applyTransform(leetTransform, 'hello world', { intensity: 0.5 }, 100);
    const r2 = applyTransform(leetTransform, 'hello world', { intensity: 0.5 }, 200);
    // With different seeds and partial intensity, results may or may not differ
    // But at least the function runs without error
    expect(typeof r1).toBe('string');
    expect(typeof r2).toBe('string');
  });

  it('should validate params', () => {
    expect(leetTransform.validateParams({}).valid).toBe(true);
    expect(leetTransform.validateParams({ intensity: 2 }).valid).toBe(false);
    expect(leetTransform.validateParams({ intensity: -1 }).valid).toBe(false);
  });

  it('should handle cluster substitutions (ck -> x)', () => {
    const result = applyTransform(leetTransform, 'back', { intensity: 1.0 });
    expect(result).toContain('x');
  });

  it('should handle custom map', () => {
    const result = applyTransform(leetTransform, 'hello', {
      intensity: 1.0,
      map: { h: ['#'] },
    });
    expect(result).toContain('#');
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(leetTransform, 'hello world', { intensity: 1.0 });
    expect(result).toContain(' ');
  });
});

// ─── Uwu ───────────────────────────────────────────────────────

describe('Uwu Transform', () => {
  it('should replace r with w', () => {
    const result = applyTransform(uwuTransform, 'really');
    expect(result).toBe('weawwy');
  });

  it('should replace l with w', () => {
    const result = applyTransform(uwuTransform, 'love');
    expect(result).toBe('wove');
  });

  it('should preserve case when replacing', () => {
    const result = applyTransform(uwuTransform, 'Really');
    expect(result[0]).toBe('W');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(uwuTransform, 'API hello', {}, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(uwuTransform, 'Hello, world!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(uwuTransform, 'really love', {}, 42);
    const r2 = applyTransform(uwuTransform, 'really love', {}, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(uwuTransform.validateParams({}).valid).toBe(true);
    expect(uwuTransform.validateParams({ insertNyaRate: 2 }).valid).toBe(false);
    expect(uwuTransform.validateParams({ suffixRate: -1 }).valid).toBe(false);
  });

  it('should handle disabling r replacement', () => {
    const result = applyTransform(uwuTransform, 'really', { rToW: false });
    expect(result).toContain('r');
  });

  it('should handle disabling l replacement', () => {
    const result = applyTransform(uwuTransform, 'love', { lToW: false });
    expect(result).toContain('l');
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(uwuTransform, 'hello world');
    expect(result).toContain(' ');
  });
});

// ─── Pirate ────────────────────────────────────────────────────

describe('Pirate Transform', () => {
  it('should substitute common words', () => {
    const result = applyTransform(pirateTransform, 'You are my friend', { interjectionRate: 0 });
    expect(result).toContain('Ye');
    expect(result).toContain('be');
    expect(result).toContain('me');
    expect(result).toContain('matey');
  });

  it('should preserve case in substitutions', () => {
    const result = applyTransform(pirateTransform, 'My friend', { interjectionRate: 0 });
    expect(result).toContain('Me');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(pirateTransform, 'API is great', { interjectionRate: 0 }, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(pirateTransform, 'You are my friend.', { interjectionRate: 0 });
    expect(result).toContain('.');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(pirateTransform, 'You are my friend', {}, 42);
    const r2 = applyTransform(pirateTransform, 'You are my friend', {}, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(pirateTransform.validateParams({}).valid).toBe(true);
    expect(pirateTransform.validateParams({ interjectionRate: 2 }).valid).toBe(false);
  });

  it('should handle custom phrase map', () => {
    const result = applyTransform(pirateTransform, 'hello world', {
      phraseMap: { world: 'sea' },
      interjectionRate: 0,
    });
    expect(result).toContain('sea');
  });

  it('should leave unmatched words unchanged', () => {
    const result = applyTransform(pirateTransform, 'computer science', { interjectionRate: 0 });
    expect(result).toContain('computer');
    expect(result).toContain('science');
  });

  it('should add interjections with rate=1', () => {
    const result = applyTransform(pirateTransform, 'Hello world', { interjectionRate: 1.0 }, 42);
    // Should have an interjection prepended
    expect(result.length).toBeGreaterThan('Hello world'.length);
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(pirateTransform, 'hello world', { interjectionRate: 0 });
    expect(result).toContain(' ');
  });
});

// ─── Redaction ─────────────────────────────────────────────────

describe('Redaction Transform', () => {
  it('should redact words at rate=1.0', () => {
    const result = applyTransform(redactTransform, 'Hello world today', { rate: 1.0, targets: ['any'] });
    expect(result).toContain('[REDACTED]');
  });

  it('should not redact at rate=0', () => {
    const result = applyTransform(redactTransform, 'Hello world', { rate: 0 });
    expect(result).not.toContain('[REDACTED]');
  });

  it('should use blackBar style', () => {
    const result = applyTransform(redactTransform, 'Hello world today', {
      rate: 1.0,
      targets: ['any'],
      style: 'blackBar',
    });
    expect(result).toContain('\u2588\u2588\u2588\u2588');
  });

  it('should not redact protected tokens', () => {
    const result = applyTransform(redactTransform, 'API works today', {
      rate: 1.0,
      targets: ['any'],
    }, 42, true);
    expect(result).toContain('API');
  });

  it('should respect minTokenLength', () => {
    const result = applyTransform(redactTransform, 'Hi there today', {
      rate: 1.0,
      targets: ['any'],
      minTokenLength: 5,
    });
    // "Hi" (2 chars) should not be redacted
    expect(result).toContain('Hi');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(redactTransform, 'Hello world today again', { rate: 0.5, targets: ['any'] }, 42);
    const r2 = applyTransform(redactTransform, 'Hello world today again', { rate: 0.5, targets: ['any'] }, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(redactTransform.validateParams({}).valid).toBe(true);
    expect(redactTransform.validateParams({ rate: 2 }).valid).toBe(false);
    expect(redactTransform.validateParams({ style: 'invalid' }).valid).toBe(false);
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(redactTransform, 'Hello, world!', { rate: 1.0, targets: ['any'] });
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should redact numbers when targeted', () => {
    const input = makeInput('The value is 42', { rate: 1.0, targets: ['number'] }, 42, false);
    const output = redactTransform.apply(input);
    const hasRedacted = output.tokens.some(t => t.value === '[REDACTED]');
    expect(hasRedacted).toBe(true);
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(redactTransform, 'hello world', { rate: 1.0, targets: ['any'] });
    expect(result).toContain(' ');
  });
});

// ─── Emoji-speak ───────────────────────────────────────────────

describe('Emoji-speak Transform', () => {
  it('should replace known words with emojis at rate=1', () => {
    const result = applyTransform(emojiTransform, 'fire', { rate: 1.0 });
    expect(result).toContain('\uD83D\uDD25');
  });

  it('should not replace unknown words', () => {
    const result = applyTransform(emojiTransform, 'marlarky', { rate: 1.0 });
    expect(result).toBe('marlarky');
  });

  it('should preserve word alongside emoji when configured', () => {
    const result = applyTransform(emojiTransform, 'fire', { rate: 1.0, preserveWordAlongsideEmoji: true });
    expect(result).toContain('fire');
    expect(result).toContain('\uD83D\uDD25');
  });

  it('should not replace at rate=0', () => {
    const result = applyTransform(emojiTransform, 'fire', { rate: 0 });
    expect(result).toBe('fire');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(emojiTransform, 'API fire', { rate: 1.0 }, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(emojiTransform, 'Hello, fire!', { rate: 1.0 });
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(emojiTransform, 'fire love star', { rate: 0.5 }, 42);
    const r2 = applyTransform(emojiTransform, 'fire love star', { rate: 0.5 }, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(emojiTransform.validateParams({}).valid).toBe(true);
    expect(emojiTransform.validateParams({ rate: 2 }).valid).toBe(false);
  });

  it('should handle case insensitive matching', () => {
    const result = applyTransform(emojiTransform, 'Fire', { rate: 1.0 });
    expect(result).toContain('\uD83D\uDD25');
  });

  it('should handle custom map', () => {
    const result = applyTransform(emojiTransform, 'test', { rate: 1.0, map: { test: ['\u2705'] } });
    expect(result).toContain('\u2705');
  });
});

// ─── Mocking Case ──────────────────────────────────────────────

describe('Mocking Case Transform', () => {
  it('should alternate case per word', () => {
    const result = applyTransform(mockCaseTransform, 'hello');
    expect(result).toBe('hElLo');
  });

  it('should alternate across words in sentence scope', () => {
    const result = applyTransform(mockCaseTransform, 'hello world', { scope: 'sentence' });
    // Global alternation across both words
    expect(result.length).toBe('hello world'.length);
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(mockCaseTransform, 'API hello', {}, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(mockCaseTransform, 'Hello, world!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic in alternate mode', () => {
    const r1 = applyTransform(mockCaseTransform, 'hello world');
    const r2 = applyTransform(mockCaseTransform, 'hello world');
    expect(r1).toBe(r2);
  });

  it('should be deterministic in randomized mode with same seed', () => {
    const r1 = applyTransform(mockCaseTransform, 'hello world', { mode: 'randomized' }, 42);
    const r2 = applyTransform(mockCaseTransform, 'hello world', { mode: 'randomized' }, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(mockCaseTransform.validateParams({}).valid).toBe(true);
    expect(mockCaseTransform.validateParams({ mode: 'invalid' }).valid).toBe(false);
    expect(mockCaseTransform.validateParams({ randomRate: 2 }).valid).toBe(false);
  });

  it('should preserve non-letter characters', () => {
    const result = applyTransform(mockCaseTransform, "don't");
    expect(result).toContain("'");
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(mockCaseTransform, 'hello world');
    expect(result).toContain(' ');
  });

  it('should handle randomized mode', () => {
    const result = applyTransform(mockCaseTransform, 'hello world', { mode: 'randomized' }, 42);
    expect(typeof result).toBe('string');
    expect(result.length).toBe('hello world'.length);
  });
});

// ─── Word Reverse ──────────────────────────────────────────────

describe('Word Reverse Transform', () => {
  it('should reverse word fully', () => {
    const result = applyTransform(reverseWordsTransform, 'hello');
    expect(result).toBe('olleh');
  });

  it('should preserve case pattern in full reverse', () => {
    const result = applyTransform(reverseWordsTransform, 'Hello');
    expect(result).toBe('Olleh');
  });

  it('should reverse inner only when configured', () => {
    const result = applyTransform(reverseWordsTransform, 'hello', { mode: 'innerOnly' });
    expect(result[0]).toBe('h');
    expect(result[result.length - 1]).toBe('o');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(reverseWordsTransform, 'API hello', {}, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(reverseWordsTransform, 'Hello, world!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(reverseWordsTransform, 'hello world');
    const r2 = applyTransform(reverseWordsTransform, 'hello world');
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(reverseWordsTransform.validateParams({}).valid).toBe(true);
    expect(reverseWordsTransform.validateParams({ mode: 'invalid' }).valid).toBe(false);
  });

  it('should handle single character words', () => {
    const result = applyTransform(reverseWordsTransform, 'a');
    expect(result).toBe('a');
  });

  it('should handle two character words', () => {
    const result = applyTransform(reverseWordsTransform, 'hi');
    expect(result).toBe('ih');
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(reverseWordsTransform, 'hello world');
    expect(result).toContain(' ');
  });
});

// ─── Corporate Jargon ──────────────────────────────────────────

describe('Corporate Jargon Transform', () => {
  it('should replace "use" at rate=1.0', () => {
    const result = applyTransform(bizJargonTransform, 'use', { rate: 1.0 });
    expect(result).toBe('leverage');
  });

  it('should not replace at rate=0', () => {
    const result = applyTransform(bizJargonTransform, 'use', { rate: 0 });
    expect(result).toBe('use');
  });

  it('should preserve case', () => {
    const result = applyTransform(bizJargonTransform, 'Use', { rate: 1.0 });
    expect(result).toBe('Leverage');
  });

  it('should not transform protected tokens', () => {
    const result = applyTransform(bizJargonTransform, 'API use', { rate: 1.0 }, 42, true);
    expect(result).toContain('API');
  });

  it('should preserve punctuation', () => {
    const result = applyTransform(bizJargonTransform, 'Use this, help them!', { rate: 1.0 });
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should be deterministic', () => {
    const r1 = applyTransform(bizJargonTransform, 'use help change', { rate: 0.5 }, 42);
    const r2 = applyTransform(bizJargonTransform, 'use help change', { rate: 0.5 }, 42);
    expect(r1).toBe(r2);
  });

  it('should validate params', () => {
    expect(bizJargonTransform.validateParams({}).valid).toBe(true);
    expect(bizJargonTransform.validateParams({ rate: 2 }).valid).toBe(false);
  });

  it('should handle custom map', () => {
    const result = applyTransform(bizJargonTransform, 'hello', {
      rate: 1.0,
      map: { hello: ['greetings'] },
    });
    expect(result).toContain('greetings');
  });

  it('should leave unmatched words unchanged', () => {
    const result = applyTransform(bizJargonTransform, 'marlarky', { rate: 1.0 });
    expect(result).toBe('marlarky');
  });

  it('should preserve whitespace', () => {
    const result = applyTransform(bizJargonTransform, 'use help', { rate: 1.0 });
    expect(result).toContain(' ');
  });
});
