import { describe, it, expect } from 'vitest';
import { SeedableRng } from './seedable-rng.js';

describe('SeedableRng', () => {
  describe('determinism', () => {
    it('produces same sequence for same seed', () => {
      const rng1 = new SeedableRng(12345);
      const rng2 = new SeedableRng(12345);

      const seq1 = Array.from({ length: 10 }, () => rng1.float());
      const seq2 = Array.from({ length: 10 }, () => rng2.float());

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = new SeedableRng(12345);
      const rng2 = new SeedableRng(54321);

      const seq1 = Array.from({ length: 10 }, () => rng1.float());
      const seq2 = Array.from({ length: 10 }, () => rng2.float());

      expect(seq1).not.toEqual(seq2);
    });

    it('can be re-seeded', () => {
      const rng = new SeedableRng(12345);
      const first = rng.float();

      rng.seed(12345);
      const afterReseed = rng.float();

      expect(first).toBe(afterReseed);
    });
  });

  describe('float', () => {
    it('returns values in [0, 1)', () => {
      const rng = new SeedableRng(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.float();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('int', () => {
    it('returns values in [min, max]', () => {
      const rng = new SeedableRng(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.int(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    it('handles swapped min/max', () => {
      const rng = new SeedableRng(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.int(10, 5);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('pick', () => {
    it('picks from list', () => {
      const rng = new SeedableRng(12345);
      const list = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 100; i++) {
        const value = rng.pick(list);
        expect(list).toContain(value);
      }
    });

    it('throws on empty list', () => {
      const rng = new SeedableRng(12345);
      expect(() => rng.pick([])).toThrow();
    });
  });

  describe('weightedPick', () => {
    it('picks based on weights', () => {
      const rng = new SeedableRng(12345);
      const items = [
        { item: 'a', weight: 90 },
        { item: 'b', weight: 10 },
      ];

      const counts: Record<string, number> = { a: 0, b: 0 };
      for (let i = 0; i < 1000; i++) {
        const value = rng.weightedPick(items);
        counts[value]!++;
      }

      // 'a' should be picked much more often (roughly 90%)
      expect(counts['a']).toBeGreaterThan(counts['b']! * 5);
    });

    it('ignores zero weights', () => {
      const rng = new SeedableRng(12345);
      const items = [
        { item: 'a', weight: 1 },
        { item: 'b', weight: 0 },
      ];

      for (let i = 0; i < 100; i++) {
        const value = rng.weightedPick(items);
        expect(value).toBe('a');
      }
    });

    it('throws on empty list', () => {
      const rng = new SeedableRng(12345);
      expect(() => rng.weightedPick([])).toThrow();
    });

    it('throws when all weights are zero', () => {
      const rng = new SeedableRng(12345);
      expect(() => rng.weightedPick([
        { item: 'a', weight: 0 },
        { item: 'b', weight: 0 },
      ])).toThrow();
    });
  });

  describe('shuffle', () => {
    it('returns array of same length', () => {
      const rng = new SeedableRng(12345);
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(original);

      expect(shuffled.length).toBe(original.length);
    });

    it('contains same elements', () => {
      const rng = new SeedableRng(12345);
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(original);

      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('does not modify original', () => {
      const rng = new SeedableRng(12345);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      rng.shuffle(original);

      expect(original).toEqual(copy);
    });

    it('is deterministic', () => {
      const rng1 = new SeedableRng(12345);
      const rng2 = new SeedableRng(12345);
      const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(rng1.shuffle(list)).toEqual(rng2.shuffle(list));
    });
  });

  describe('chance', () => {
    it('returns true/false based on probability', () => {
      const rng = new SeedableRng(12345);

      let trueCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (rng.chance(0.5)) trueCount++;
      }

      // Should be roughly 50% true
      expect(trueCount).toBeGreaterThan(400);
      expect(trueCount).toBeLessThan(600);
    });

    it('handles edge cases', () => {
      const rng = new SeedableRng(12345);

      // 0 probability should always be false
      let falseCount = 0;
      for (let i = 0; i < 100; i++) {
        if (!rng.chance(0)) falseCount++;
      }
      expect(falseCount).toBe(100);

      // 1 probability should always be true
      let trueCount = 0;
      for (let i = 0; i < 100; i++) {
        if (rng.chance(1)) trueCount++;
      }
      expect(trueCount).toBe(100);
    });
  });
});
