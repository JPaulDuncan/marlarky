import { describe, it, expect } from 'vitest';
import { tokenize, render } from './tokenizer.js';

describe('Tokenizer', () => {
  describe('tokenize', () => {
    it('should tokenize a simple sentence', () => {
      const tokens = tokenize('Hello world.');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toEqual({ type: 'word', value: 'Hello' });
      expect(tokens[1]).toEqual({ type: 'whitespace', value: ' ' });
      expect(tokens[2]).toEqual({ type: 'word', value: 'world' });
      expect(tokens[3]).toEqual({ type: 'punct', value: '.' });
    });

    it('should handle words with internal apostrophes', () => {
      const tokens = tokenize("don't manager's");
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ type: 'word', value: "don't" });
      expect(tokens[1]).toEqual({ type: 'whitespace', value: ' ' });
      expect(tokens[2]).toEqual({ type: 'word', value: "manager's" });
    });

    it('should tokenize numbers with decimals and percent', () => {
      const tokens = tokenize('12 3.14 60%');
      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toEqual({ type: 'number', value: '12' });
      expect(tokens[2]).toEqual({ type: 'number', value: '3.14' });
      expect(tokens[4]).toEqual({ type: 'number', value: '60%' });
    });

    it('should tokenize punctuation as separate tokens', () => {
      const tokens = tokenize('Hello, world! "Yes."');
      const punctTokens = tokens.filter(t => t.type === 'punct');
      expect(punctTokens.map(t => t.value)).toEqual([',', '!', '"', '.', '"']);
    });

    it('should tokenize ellipsis as single token', () => {
      const tokens = tokenize('Wait...');
      expect(tokens[1]).toEqual({ type: 'punct', value: '...' });
    });

    it('should handle multiple whitespace types', () => {
      const tokens = tokenize("Hello\t\nworld");
      expect(tokens[1]).toEqual({ type: 'whitespace', value: '\t\n' });
    });

    it('should tokenize symbol characters', () => {
      const tokens = tokenize('@#$');
      expect(tokens.every(t => t.type === 'symbol')).toBe(true);
    });

    it('should handle empty string', () => {
      const tokens = tokenize('');
      expect(tokens).toHaveLength(0);
    });

    it('should handle multi-sentence text', () => {
      const tokens = tokenize('Hello world. How are you?');
      const words = tokens.filter(t => t.type === 'word');
      expect(words).toHaveLength(5);
    });

    it('should handle em dash correctly', () => {
      const tokens = tokenize('yes\u2014no');
      expect(tokens[1]).toEqual({ type: 'punct', value: '\u2014' });
    });
  });

  describe('render', () => {
    it('should be lossless: render(tokenize(s)) === s', () => {
      const inputs = [
        'Hello world.',
        "Don't stop! The manager's plan is 60% done.",
        'Wait... really?',
        'A, B, and C.',
        '  multiple  spaces  ',
        '@user #hashtag $100',
        '',
        'Hello\tworld\nnewline.',
        'Wow! "Yes," he said.',
      ];

      for (const input of inputs) {
        expect(render(tokenize(input))).toBe(input);
      }
    });

    it('should handle complex punctuation losslessly', () => {
      const input = 'She said, "Hello!" (and waved).';
      expect(render(tokenize(input))).toBe(input);
    });

    it('should preserve exact whitespace', () => {
      const input = 'Hello   world  ';
      expect(render(tokenize(input))).toBe(input);
    });
  });
});
