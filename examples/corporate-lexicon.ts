/**
 * Example B: Lexicon-Steered Corporate Text
 * Demonstrates text generation using a corporate lexicon
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TextGenerator, SimpleFakerAdapter, loadLexiconFromString } from '../src';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the corporate lexicon
const lexiconPath = join(__dirname, 'lexicons', 'corporate-min.json');
const lexiconJson = readFileSync(lexiconPath, 'utf-8');
const lexicon = loadLexiconFromString(lexiconJson);

console.log('=== Lexicon-Steered Corporate Text ===\n');
console.log(`Loaded lexicon: ${lexicon.id} v${lexicon.version}\n`);

// Create generator with lexicon
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

// Set archetype to "corporate"
generator.setArchetype('corporate');
generator.setSeed(42);

// Generate corporate sentences
console.log('Corporate sentences:');
for (let i = 0; i < 5; i++) {
  console.log(`${i + 1}. ${generator.sentence()}`);
}
console.log();

// Generate a corporate paragraph
console.log('Corporate paragraph:');
console.log(generator.paragraph({ sentences: 4 }));
console.log();

// Generate corporate text block
console.log('Corporate text block (3 paragraphs):');
console.log(generator.textBlock({ paragraphs: 3 }));
console.log();

// Compare with non-lexicon output
console.log('=== Comparison: With vs Without Lexicon ===\n');

const withLexicon = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});
withLexicon.setArchetype('corporate');
withLexicon.setSeed(100);

const withoutLexicon = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});
withoutLexicon.setSeed(100);

console.log('With corporate lexicon:');
for (let i = 0; i < 3; i++) {
  console.log(`  ${withLexicon.sentence()}`);
}

console.log('\nWithout lexicon (same seed):');
for (let i = 0; i < 3; i++) {
  console.log(`  ${withoutLexicon.sentence()}`);
}
