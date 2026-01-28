import { describe, it, expect } from 'vitest';
import { pluralize, singularize, isPlural } from './pluralize.js';

describe('Pluralization', () => {
  describe('pluralize', () => {
    it('handles regular plurals (add s)', () => {
      expect(pluralize('cat')).toBe('cats');
      expect(pluralize('dog')).toBe('dogs');
      expect(pluralize('house')).toBe('houses');
    });

    it('handles words ending in s, x, z, ch, sh (add es)', () => {
      expect(pluralize('bus')).toBe('buses');
      expect(pluralize('box')).toBe('boxes');
      expect(pluralize('buzz')).toBe('buzzes');
      expect(pluralize('church')).toBe('churches');
      expect(pluralize('dish')).toBe('dishes');
    });

    it('handles words ending in consonant + y (change to ies)', () => {
      expect(pluralize('baby')).toBe('babies');
      expect(pluralize('city')).toBe('cities');
      expect(pluralize('story')).toBe('stories');
    });

    it('handles words ending in vowel + y (add s)', () => {
      expect(pluralize('boy')).toBe('boys');
      expect(pluralize('day')).toBe('days');
      expect(pluralize('key')).toBe('keys');
    });

    it('handles irregular plurals', () => {
      expect(pluralize('person')).toBe('people');
      expect(pluralize('man')).toBe('men');
      expect(pluralize('woman')).toBe('women');
      expect(pluralize('child')).toBe('children');
      expect(pluralize('foot')).toBe('feet');
      expect(pluralize('tooth')).toBe('teeth');
      expect(pluralize('mouse')).toBe('mice');
    });

    it('handles words that are the same singular and plural', () => {
      expect(pluralize('sheep')).toBe('sheep');
      expect(pluralize('fish')).toBe('fish');
      expect(pluralize('deer')).toBe('deer');
    });

    it('handles Latin/Greek plurals', () => {
      expect(pluralize('analysis')).toBe('analyses');
      expect(pluralize('criterion')).toBe('criteria');
      expect(pluralize('phenomenon')).toBe('phenomena');
      expect(pluralize('thesis')).toBe('theses');
    });

    it('preserves capitalization', () => {
      expect(pluralize('Person')).toBe('People');
      expect(pluralize('MOUSE')).toBe('MICE');
    });
  });

  describe('singularize', () => {
    it('handles regular singulars', () => {
      expect(singularize('cats')).toBe('cat');
      expect(singularize('dogs')).toBe('dog');
    });

    it('handles ies -> y', () => {
      expect(singularize('babies')).toBe('baby');
      expect(singularize('cities')).toBe('city');
    });

    it('handles irregular singulars', () => {
      expect(singularize('people')).toBe('person');
      expect(singularize('men')).toBe('man');
      expect(singularize('women')).toBe('woman');
      expect(singularize('children')).toBe('child');
    });
  });

  describe('isPlural', () => {
    it('identifies known plurals', () => {
      expect(isPlural('people')).toBe(true);
      expect(isPlural('men')).toBe(true);
      expect(isPlural('children')).toBe(true);
    });

    it('identifies known singulars', () => {
      expect(isPlural('person')).toBe(false);
      expect(isPlural('man')).toBe(false);
      expect(isPlural('child')).toBe(false);
    });

    it('uses heuristic for unknown words', () => {
      expect(isPlural('cats')).toBe(true);
      expect(isPlural('dogs')).toBe(true);
      expect(isPlural('cat')).toBe(false);
    });
  });
});
