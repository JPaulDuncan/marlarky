/**
 * Example C: Generation with Tracing
 * Demonstrates the tracing/metadata output feature
 */

import { TextGenerator, SimpleFakerAdapter, GeneratedText } from '../src';

// Create generator with tracing enabled
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  enableTrace: true,
});

generator.setSeed(42);

console.log('=== Text Generation with Tracing ===\n');

// Generate a sentence with trace
const result = generator.sentence() as GeneratedText;

console.log('Generated text:', result.text);
console.log();

console.log('Metadata:');
console.log('  Archetype:', result.meta.archetype);
console.log('  Seed:', result.meta.seed);
if (result.meta.lexiconId) {
  console.log('  Lexicon ID:', result.meta.lexiconId);
  console.log('  Lexicon Version:', result.meta.lexiconVersion);
}
console.log();

if (result.trace) {
  console.log('Trace:');
  const sentence = result.trace.paragraphs[0]?.sentences[0];
  if (sentence) {
    console.log('  Template:', sentence.template);
    console.log('  Retry count:', sentence.retryCount);
    console.log('  Token count:', sentence.tokens.length);
    console.log();

    console.log('  Tokens:');
    for (const token of sentence.tokens.slice(0, 10)) {
      console.log(`    "${token.value}" - source: ${token.source}${token.pos ? `, pos: ${token.pos}` : ''}`);
    }
    if (sentence.tokens.length > 10) {
      console.log(`    ... and ${sentence.tokens.length - 10} more tokens`);
    }
    console.log();

    console.log('  Constraints evaluated:');
    for (const c of sentence.constraintsEvaluated) {
      console.log(`    ${c.id}: ${c.passed ? 'PASS' : 'FAIL'}`);
    }
  }

  console.log();
  console.log('  Invariants checked:');
  for (const inv of result.trace.invariantsChecked) {
    console.log(`    ${inv.id}: ${inv.passed ? 'PASS' : 'FAIL'}`);
  }

  if (result.trace.correlationsApplied.length > 0) {
    console.log();
    console.log('  Correlations applied:', result.trace.correlationsApplied);
  }
}

// Generate a paragraph with trace
console.log('\n\n=== Paragraph with Tracing ===\n');

const paragraphResult = generator.paragraph({ sentences: 3 }) as GeneratedText;

console.log('Generated text:');
console.log(paragraphResult.text);
console.log();

if (paragraphResult.trace) {
  const sentences = paragraphResult.trace.paragraphs[0]?.sentences || [];
  console.log(`Trace: ${sentences.length} sentences`);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i]!;
    console.log(`  Sentence ${i + 1}: template=${s.template}, tokens=${s.tokens.length}, retries=${s.retryCount}`);
  }
}
