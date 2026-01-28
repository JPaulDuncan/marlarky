---
title: Options & Types
layout: default
parent: API Reference
nav_order: 2
---

# Options & Types

TypeScript interfaces for generation options and result types.

## SentenceOptions

Options passed to `generator.sentence()`.

```typescript
interface SentenceOptions {
  type?: 'simpleDeclarative' | 'compound' | 'introAdverbial'
       | 'subordinate' | 'interjection' | 'question';
  hints?: string[];                      // Tags to activate
  minWords?: number;                     // Minimum word count
  maxWords?: number;                     // Maximum word count
  outputTransforms?: Partial<OutputTransformsConfig>;  // Per-call transform config
  mergeMode?: 'replace' | 'append';      // How to merge with base pipeline
}
```

```typescript
// Examples
generator.sentence({ type: 'question' });
generator.sentence({ minWords: 10, maxWords: 20 });
generator.sentence({ hints: ['domain:tech'] });
generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'pigLatin' }],
  },
});
```

## ParagraphOptions

Options passed to `generator.paragraph()`.

```typescript
interface ParagraphOptions {
  sentences?: number;                    // Exact sentence count
  minSentences?: number;                 // Minimum (default: 2)
  maxSentences?: number;                 // Maximum (default: 7)
  hints?: string[];                      // Tags to activate
  outputTransforms?: Partial<OutputTransformsConfig>;
  mergeMode?: 'replace' | 'append';
}
```

```typescript
// Examples
generator.paragraph({ sentences: 5 });
generator.paragraph({ minSentences: 3, maxSentences: 8 });
```

## TextBlockOptions

Options passed to `generator.textBlock()`.

```typescript
interface TextBlockOptions {
  paragraphs?: number;                   // Exact paragraph count
  minParagraphs?: number;                // Minimum (default: 1)
  maxParagraphs?: number;                // Maximum (default: 3)
  hints?: string[];                      // Tags to activate
  outputTransforms?: Partial<OutputTransformsConfig>;
  mergeMode?: 'replace' | 'append';
}
```

```typescript
// Examples
generator.textBlock({ paragraphs: 4 });
generator.textBlock({ minParagraphs: 2, maxParagraphs: 6 });
```

## GeneratedText

Returned by generation methods when `enableTrace` is `true`.

```typescript
interface GeneratedText {
  text: string;                          // The generated text
  trace?: GenerationTrace;               // Full trace (when tracing enabled)
  meta: GenerationMeta;                  // Generation metadata
}
```

### GenerationMeta

```typescript
interface GenerationMeta {
  archetype: string;                     // Active archetype
  seed: number;                          // Seed used
  lexiconVersion?: string;               // Lexicon version (if loaded)
  lexiconId?: string;                    // Lexicon ID (if loaded)
  transformsApplied?: string[];          // IDs of applied transforms
}
```

See [Guides > Tracing](../guides/tracing) for the full `GenerationTrace` structure.

## Lexicon utilities

Functions for loading and validating lexicons. All are standalone -- they don't require a generator instance.

```typescript
import {
  loadLexiconFromString,  // Parse JSON string -> Lexicon
  loadLexiconFromObject,  // Validate object -> Lexicon
  tryLoadLexicon,         // Parse with error handling -> Lexicon | null
  validateLexicon,        // Validate -> LexiconValidationResult
  LexiconStore,           // Query and sample from a loaded lexicon
} from 'marlarky';
```

### loadLexiconFromString

Parse a JSON string into a `Lexicon` object. Throws if the JSON is invalid.

```typescript
import { readFileSync } from 'fs';
const json = readFileSync('./lexicon.json', 'utf-8');
const lexicon = loadLexiconFromString(json);
```

### loadLexiconFromObject

Validate and cast a plain object to a `Lexicon`. Throws if the object doesn't match the schema.

```typescript
const lexicon = loadLexiconFromObject(myObj);
```

### tryLoadLexicon

Like `loadLexiconFromString`, but returns `null` instead of throwing on error.

```typescript
const lexicon = tryLoadLexicon(json);
if (!lexicon) {
  console.error('Failed to load lexicon');
}
```

### validateLexicon

Returns a detailed validation result with errors and warnings.

```typescript
const result = validateLexicon(lexiconObject);
console.log(result.valid);     // boolean
console.log(result.errors);    // LexiconValidationError[]
console.log(result.warnings);  // LexiconValidationError[]
```

See [Lexicons > Validation](../lexicons/validation) for details.

### LexiconValidationResult

```typescript
interface LexiconValidationResult {
  valid: boolean;
  errors: LexiconValidationError[];
  warnings: LexiconValidationError[];
}

interface LexiconValidationError {
  path: string;         // e.g. "termSets.noun.tech.terms[0]"
  message: string;
  severity: 'error' | 'warning';
}
```
