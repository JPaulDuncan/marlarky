---
title: TextGenerator
layout: default
parent: API Reference
nav_order: 1
---

# TextGenerator

The main class for generating text.

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator(options);
```

## Constructor

```typescript
new TextGenerator(options: GeneratorInitOptions)
```

### GeneratorInitOptions

```typescript
interface GeneratorInitOptions {
  fakerAdapter: IFakerAdapter;          // Required: word generation fallback
  lexicon?: Lexicon;                     // Optional: lexicon for guided generation
  rng?: IRng;                            // Optional: custom RNG implementation
  config?: Partial<GeneratorConfig>;     // Optional: override default config
  enableTrace?: boolean;                 // Optional: enable tracing (default: false)
}
```

The only required field is `fakerAdapter`. The built-in `SimpleFakerAdapter` provides a fixed set of English words with no external dependencies. For more variety, use `FakerJsAdapter` with `@faker-js/faker` (see [Faker Integration](../guides/faker-integration)).

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `sentence(opts?)` | `string \| GeneratedText` | Generate one sentence |
| `paragraph(opts?)` | `string \| GeneratedText` | Generate a paragraph |
| `textBlock(opts?)` | `string \| GeneratedText` | Generate multiple paragraphs |
| `setSeed(seed: number)` | `void` | Set RNG seed for reproducibility |
| `setLexicon(lexicon: Lexicon)` | `void` | Load or replace lexicon at runtime |
| `setArchetype(name: string)` | `void` | Activate a style preset |
| `getTransformRegistry()` | `TransformRegistry` | Access the transform registry |

When `enableTrace` is `false` (default), generation methods return a plain `string`. When `true`, they return a [`GeneratedText`](options-types#generatedtext) object containing the text, trace data, and metadata.

## Usage examples

### Basic generation

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

generator.setSeed(42);

const sentence = generator.sentence();
// "Generally, the change called."

const paragraph = generator.paragraph({ sentences: 3 });
// Three sentences of plausible nonsense

const textBlock = generator.textBlock({ paragraphs: 2 });
// Two paragraphs of marlarky
```

### With a lexicon

```typescript
import { loadLexiconFromString } from 'marlarky';
import { readFileSync } from 'fs';

const lexicon = loadLexiconFromString(readFileSync('./corp.json', 'utf-8'));

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

generator.setArchetype('corporate');
console.log(generator.paragraph());
```

### With tracing enabled

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  enableTrace: true,
});

const result = generator.sentence();
// result is a GeneratedText object
console.log(result.text);
console.log(result.meta.archetype);
console.log(result.trace.paragraphs[0].sentences[0].template);
```

See [Guides > Tracing](../guides/tracing) for full trace documentation.

## Adapters

### SimpleFakerAdapter

The built-in adapter with no external dependencies. Uses a fixed vocabulary of common English words.

```typescript
import { SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});
```

### FakerJsAdapter

Wraps `@faker-js/faker` for greater word variety. Requires `@faker-js/faker` as an optional peer dependency.

```typescript
import { FakerJsAdapter } from 'marlarky';
import { faker } from '@faker-js/faker';

const generator = new TextGenerator({
  fakerAdapter: new FakerJsAdapter(faker),
});
```

See [Guides > Faker Integration](../guides/faker-integration) for details.
