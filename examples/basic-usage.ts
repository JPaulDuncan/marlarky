/**
 * Example A: Basic Usage (No Lexicon)
 * Demonstrates text generation using only the built-in word lists
 */

import { TextGenerator, SimpleFakerAdapter } from '../src';

// Create a generator with just the simple faker adapter
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

// Set a seed for reproducible output
generator.setSeed(42);

console.log('=== Basic Text Generation (No Lexicon) ===\n');

// Generate a single sentence
console.log('Single sentence:');
console.log(generator.sentence());
console.log();

// Generate different sentence types
console.log('Different sentence types:');
console.log('Simple declarative:', generator.sentence({ type: 'simpleDeclarative' }));
console.log('Question:', generator.sentence({ type: 'question' }));
console.log('Compound:', generator.sentence({ type: 'compound' }));
console.log('With intro adverbial:', generator.sentence({ type: 'introAdverbial' }));
console.log();

// Generate a paragraph
console.log('Paragraph (5 sentences):');
console.log(generator.paragraph({ sentences: 5 }));
console.log();

// Generate multiple paragraphs
console.log('Text block (2 paragraphs):');
console.log(generator.textBlock({ paragraphs: 2 }));
console.log();

// Demonstrate determinism
console.log('=== Determinism Test ===\n');
generator.setSeed(12345);
const text1 = generator.sentence();
generator.setSeed(12345);
const text2 = generator.sentence();
console.log('Same seed produces same output:', text1 === text2);
console.log('Output:', text1);
