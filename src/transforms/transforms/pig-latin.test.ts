import { describe, it, expect } from 'vitest';
import { pigLatinTransform } from './pig-latin.js';
import { tokenize } from '../tokenizer.js';
import { applyProtection } from '../protection.js';
import { SeedableRng } from '../../rng/seedable-rng.js';
import type { TransformInput } from '../types.js';

function apply(text: string, params: Record<string, unknown> = {}): string {
  const input: TransformInput = {
    tokens: tokenize(text),
    params,
    rng: new SeedableRng(42),
    protection: {},
    traceEnabled: false,
  };
  const output = pigLatinTransform.apply(input);
  return output.tokens.map(t => t.value).join('');
}

describe('Pig Latin Transform', () => {
  it('should transform vowel-starting words with "way" suffix', () => {
    expect(apply('apple')).toBe('appleway');
  });

  it('should move consonant cluster and add "ay"', () => {
    expect(apply('string')).toBe('ingstray');
  });

  it('should handle "qu" as a cluster', () => {
    expect(apply('quick')).toBe('ickquay');
  });

  it('should preserve capitalization', () => {
    expect(apply('Hello')).toBe('Ellohay');
  });

  it('should not transform protected tokens', () => {
    const tokens = tokenize('API is great');
    applyProtection(tokens, { keepAcronyms: true });
    const input: TransformInput = {
      tokens,
      params: {},
      rng: new SeedableRng(42),
      protection: { keepAcronyms: true },
      traceEnabled: false,
    };
    const output = pigLatinTransform.apply(input);
    const words = output.tokens.filter(t => t.type === 'word');
    expect(words[0]!.value).toBe('API'); // protected
    expect(words[1]!.value).toBe('isway'); // vowel start
    expect(words[2]!.value).toBe('eatgray'); // consonant start
  });

  it('should handle possessive splitting', () => {
    const result = apply("manager's");
    expect(result).toContain("'s");
  });

  it('should use "yay" suffix when configured', () => {
    expect(apply('apple', { suffixForVowelStart: 'yay' })).toBe('appleyay');
  });

  it('should preserve punctuation tokens', () => {
    const result = apply('Hello, world!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('should handle single letter words', () => {
    expect(apply('a')).toBe('away');
    expect(apply('I')).toBe('Iway');
  });

  it('should validate params correctly', () => {
    expect(pigLatinTransform.validateParams({})).toEqual({ valid: true, errors: [] });
    expect(pigLatinTransform.validateParams({ style: 'invalid' }).valid).toBe(false);
    expect(pigLatinTransform.validateParams({ treatYAsVowel: 'invalid' }).valid).toBe(false);
  });

  it('should report correct capabilities', () => {
    expect(pigLatinTransform.capabilities.deterministic).toBe(true);
    expect(pigLatinTransform.capabilities.safeToStack).toBe(true);
  });

  it('should be deterministic', () => {
    const result1 = apply('Hello world');
    const result2 = apply('Hello world');
    expect(result1).toBe(result2);
  });
});
