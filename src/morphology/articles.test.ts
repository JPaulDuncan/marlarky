import { describe, it, expect } from 'vitest';
import { useAn, getIndefiniteArticle, withIndefiniteArticle } from './articles.js';

describe('Articles', () => {
  describe('useAn', () => {
    it('returns true for words starting with vowel sounds', () => {
      expect(useAn('apple')).toBe(true);
      expect(useAn('elephant')).toBe(true);
      expect(useAn('igloo')).toBe(true);
      expect(useAn('orange')).toBe(true);
      expect(useAn('umbrella')).toBe(true);
    });

    it('returns false for words starting with consonant sounds', () => {
      expect(useAn('banana')).toBe(false);
      expect(useAn('car')).toBe(false);
      expect(useAn('dog')).toBe(false);
      expect(useAn('table')).toBe(false);
      expect(useAn('zebra')).toBe(false);
    });

    it('handles "hour" exception (silent h)', () => {
      expect(useAn('hour')).toBe(true);
      expect(useAn('hourly')).toBe(true);
      expect(useAn('honest')).toBe(true);
      expect(useAn('honor')).toBe(true);
    });

    it('handles "university" exception (yoo sound)', () => {
      expect(useAn('university')).toBe(false);
      expect(useAn('uniform')).toBe(false);
      expect(useAn('unique')).toBe(false);
      expect(useAn('user')).toBe(false);
    });

    it('handles "one" exception', () => {
      expect(useAn('one')).toBe(false);
      expect(useAn('once')).toBe(false);
    });

    it('handles empty string', () => {
      expect(useAn('')).toBe(false);
    });
  });

  describe('getIndefiniteArticle', () => {
    it('returns "a" or "an" correctly', () => {
      expect(getIndefiniteArticle('apple')).toBe('an');
      expect(getIndefiniteArticle('banana')).toBe('a');
      expect(getIndefiniteArticle('hour')).toBe('an');
      expect(getIndefiniteArticle('university')).toBe('a');
    });
  });

  describe('withIndefiniteArticle', () => {
    it('prepends the correct article', () => {
      expect(withIndefiniteArticle('apple')).toBe('an apple');
      expect(withIndefiniteArticle('banana')).toBe('a banana');
      expect(withIndefiniteArticle('hour')).toBe('an hour');
      expect(withIndefiniteArticle('university')).toBe('a university');
    });
  });
});
