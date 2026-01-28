import { describe, it, expect } from 'vitest';
import { TextGenerator } from './text-generator.js';
import { SimpleFakerAdapter } from '../adapters/index.js';
import { isCapitalized, endsWithPunctuation, hasNoDoubleSpaces } from '../morphology/index.js';

describe('TextGenerator', () => {
  const createGenerator = (seed = 12345) => {
    const generator = new TextGenerator({
      fakerAdapter: new SimpleFakerAdapter(),
    });
    generator.setSeed(seed);
    return generator;
  };

  describe('determinism', () => {
    it('produces same output for same seed', () => {
      const gen1 = createGenerator(12345);
      const gen2 = createGenerator(12345);

      const text1 = gen1.sentence() as string;
      const text2 = gen2.sentence() as string;

      expect(text1).toBe(text2);
    });

    it('produces different output for different seeds', () => {
      const gen1 = createGenerator(12345);
      const gen2 = createGenerator(54321);

      const text1 = gen1.sentence() as string;
      const text2 = gen2.sentence() as string;

      expect(text1).not.toBe(text2);
    });
  });

  describe('sentence', () => {
    it('generates a sentence', () => {
      const generator = createGenerator();
      const text = generator.sentence() as string;

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('sentence starts with capital letter', () => {
      const generator = createGenerator();

      for (let i = 0; i < 20; i++) {
        const text = generator.sentence() as string;
        expect(isCapitalized(text)).toBe(true);
      }
    });

    it('sentence ends with punctuation', () => {
      const generator = createGenerator();

      for (let i = 0; i < 20; i++) {
        const text = generator.sentence() as string;
        expect(endsWithPunctuation(text)).toBe(true);
      }
    });

    it('sentence has no double spaces', () => {
      const generator = createGenerator();

      for (let i = 0; i < 20; i++) {
        const text = generator.sentence() as string;
        expect(hasNoDoubleSpaces(text)).toBe(true);
      }
    });

    it('can generate specific sentence types', () => {
      const generator = createGenerator();

      const question = generator.sentence({ type: 'question' }) as string;
      expect(question.endsWith('?')).toBe(true);

      const declarative = generator.sentence({ type: 'simpleDeclarative' }) as string;
      expect(declarative.endsWith('.')).toBe(true);
    });
  });

  describe('paragraph', () => {
    it('generates a paragraph', () => {
      const generator = createGenerator();
      const text = generator.paragraph() as string;

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('paragraph contains multiple sentences', () => {
      const generator = createGenerator();
      const text = generator.paragraph({ sentences: 3 }) as string;

      // Count sentence-ending punctuation
      const sentenceCount = (text.match(/[.!?]/g) || []).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(3);
    });

    it('respects sentence count option', () => {
      const generator = createGenerator();
      const text = generator.paragraph({ sentences: 5 }) as string;

      const sentenceCount = (text.match(/[.!?]/g) || []).length;
      expect(sentenceCount).toBe(5);
    });
  });

  describe('textBlock', () => {
    it('generates multiple paragraphs', () => {
      const generator = createGenerator();
      const text = generator.textBlock({ paragraphs: 3 }) as string;

      // Paragraphs are separated by double newlines
      const paragraphCount = text.split('\n\n').length;
      expect(paragraphCount).toBe(3);
    });

    it('each paragraph is valid', () => {
      const generator = createGenerator();
      const text = generator.textBlock({ paragraphs: 2 }) as string;

      const paragraphs = text.split('\n\n');
      for (const paragraph of paragraphs) {
        expect(isCapitalized(paragraph)).toBe(true);
        expect(endsWithPunctuation(paragraph)).toBe(true);
        expect(hasNoDoubleSpaces(paragraph)).toBe(true);
      }
    });
  });

  describe('tracing', () => {
    it('returns trace when enabled', () => {
      const generator = new TextGenerator({
        fakerAdapter: new SimpleFakerAdapter(),
        enableTrace: true,
      });
      generator.setSeed(12345);

      const result = generator.sentence();

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('trace');
      expect(result).toHaveProperty('meta');
    });

    it('trace contains expected fields', () => {
      const generator = new TextGenerator({
        fakerAdapter: new SimpleFakerAdapter(),
        enableTrace: true,
      });
      generator.setSeed(12345);

      const result = generator.sentence() as {
        text: string;
        trace: {
          paragraphs: Array<{
            sentences: Array<{
              text: string;
              template: string;
              tokens: unknown[];
            }>;
          }>;
        };
        meta: { archetype: string; seed: number };
      };

      expect(result.trace.paragraphs).toHaveLength(1);
      expect(result.trace.paragraphs[0]!.sentences).toHaveLength(1);
      expect(result.trace.paragraphs[0]!.sentences[0]).toHaveProperty('template');
      expect(result.trace.paragraphs[0]!.sentences[0]).toHaveProperty('tokens');

      expect(result.meta.archetype).toBe('default');
      expect(result.meta.seed).toBe(12345);
    });
  });

  describe('invariants (property tests)', () => {
    it('all generated text passes invariants across many seeds', () => {
      for (let seed = 0; seed < 100; seed++) {
        const generator = createGenerator(seed);

        // Test sentence
        const sentence = generator.sentence() as string;
        expect(isCapitalized(sentence)).toBe(true);
        expect(endsWithPunctuation(sentence)).toBe(true);
        expect(hasNoDoubleSpaces(sentence)).toBe(true);

        // Test paragraph
        const paragraph = generator.paragraph() as string;
        expect(isCapitalized(paragraph)).toBe(true);
        expect(endsWithPunctuation(paragraph)).toBe(true);
        expect(hasNoDoubleSpaces(paragraph)).toBe(true);
      }
    });
  });
});
