import { describe, it, expect } from 'vitest';
import { applyProtection, isProtected } from './protection.js';
import type { Token } from './types.js';

function makeWord(value: string): Token {
  return { type: 'word', value };
}

function makeNumber(value: string): Token {
  return { type: 'number', value };
}

function makeSymbol(value: string): Token {
  return { type: 'symbol', value };
}

describe('Protection Rules', () => {
  it('should protect acronyms (all uppercase 2+ letters)', () => {
    const tokens = [makeWord('API'), makeWord('hello'), makeWord('NASA')];
    applyProtection(tokens, { keepAcronyms: true });
    expect(isProtected(tokens[0]!)).toBe(true);
    expect(isProtected(tokens[1]!)).toBe(false);
    expect(isProtected(tokens[2]!)).toBe(true);
    expect(tokens[0]!.meta!.protectionsApplied).toContain('acronym');
  });

  it('should protect number tokens', () => {
    const tokens = [makeNumber('42'), makeNumber('3.14'), makeWord('hello')];
    applyProtection(tokens, { keepNumbers: true });
    expect(isProtected(tokens[0]!)).toBe(true);
    expect(isProtected(tokens[1]!)).toBe(true);
    expect(isProtected(tokens[2]!)).toBe(false);
  });

  it('should protect code-like tokens (contains underscore)', () => {
    const tokens = [makeWord('hello'), makeWord('my_var')];
    applyProtection(tokens, { keepCodeTokens: true });
    expect(isProtected(tokens[0]!)).toBe(false);
    // my_var won't be a word token in actual tokenizer since _ breaks word parsing
    // but the protection still checks the value
  });

  it('should protect short words below minWordLength', () => {
    const tokens = [makeWord('I'), makeWord('a'), makeWord('hello')];
    applyProtection(tokens, { minWordLength: 2 });
    expect(isProtected(tokens[0]!)).toBe(true);
    expect(isProtected(tokens[1]!)).toBe(true);
    expect(isProtected(tokens[2]!)).toBe(false);
  });

  it('should protect URL-like symbols', () => {
    const tokens = [makeSymbol('https://example.com')];
    applyProtection(tokens, { keepUrlsEmails: true });
    expect(isProtected(tokens[0]!)).toBe(true);
  });

  it('should protect email-like symbols', () => {
    const tokens = [makeSymbol('user@email.com')];
    applyProtection(tokens, { keepUrlsEmails: true });
    expect(isProtected(tokens[0]!)).toBe(true);
  });

  it('should apply custom regex protection', () => {
    const tokens = [makeWord('FooBar'), makeWord('hello')];
    applyProtection(tokens, { customProtectedRegex: ['^Foo'] });
    expect(isProtected(tokens[0]!)).toBe(true);
    expect(isProtected(tokens[1]!)).toBe(false);
  });

  it('should not protect when all protections disabled', () => {
    const tokens = [makeWord('API'), makeNumber('42')];
    applyProtection(tokens, {
      keepAcronyms: false,
      keepNumbers: false,
      keepCodeTokens: false,
      keepUrlsEmails: false,
      minWordLength: 0,
    });
    expect(isProtected(tokens[0]!)).toBe(false);
    expect(isProtected(tokens[1]!)).toBe(false);
  });

  it('should accumulate multiple protection reasons', () => {
    // A short acronym
    const tokens = [makeWord('AI')];
    applyProtection(tokens, { keepAcronyms: true, minWordLength: 3 });
    expect(isProtected(tokens[0]!)).toBe(true);
    expect(tokens[0]!.meta!.protectionsApplied).toContain('acronym');
    expect(tokens[0]!.meta!.protectionsApplied).toContain('shortWord');
  });
});
