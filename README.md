# Marlarky

**Generate syntactically plausible English nonsense, steered by lexicons.**

Marlarky is a faker-like library and CLI that produces grammatically correct English text that sounds meaningful but isn't. Perfect for:

- Placeholder text generation (like Lorem Ipsum, but in English)
- Testing and mocking
- Creative writing prompts
- Procedural content generation
- Corporate buzzword bingo

## Features

- **Syntactically correct** -- Proper grammar, subject-verb agreement, punctuation
- **Lexicon-driven** -- Guide output with custom vocabularies and style presets
- **Deterministic** -- Seedable RNG for reproducible output
- **Configurable** -- Control sentence types, lengths, complexity
- **Output transforms** -- Pipe text through built-in transforms (Pig Latin, leet speak, pirate, and more)
- **Traceable** -- Debug mode shows exactly how text was generated
- **Full CLI** -- Generate text, apply transforms, and validate lexicons from the command line
- **Zero dependencies** -- Works standalone or with @faker-js/faker

## Installation

```bash
npm install marlarky
```

## Source Code & Issues
**Source**: https://github.com/JPaulDuncan/malarky
**Issues**: https://github.com/JPaulDuncan/malarky/issues
**Additional Usage**: https://jpaulduncan.github.io/malarky/usage.md
**License**: MIT

## Quick Start

### TypeScript / JavaScript

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

generator.setSeed(42);

console.log(generator.sentence());
// "Generally, the change called."

console.log(generator.paragraph({ sentences: 3 }));
// Three sentences of plausible nonsense

console.log(generator.textBlock({ paragraphs: 2 }));
// Two paragraphs of corporate-sounding marlarky
```

### Command Line

```bash
# Generate a sentence
marlarky sentence

# Generate a deterministic question
marlarky sentence --seed 42 --type question

# Generate a paragraph with a corporate lexicon
marlarky paragraph --sentences 5 --lexicon ./corp.json --archetype corporate

# Apply Pig Latin transform and output as JSON
marlarky sentence --seed 42 --transform pigLatin --json
```

## CLI

After installing globally (`npm install -g marlarky`) or locally, the `marlarky` command is available.

### Commands

| Command      | Description                                     |
| ------------ | ----------------------------------------------- |
| `sentence`   | Generate one or more sentences                  |
| `paragraph`  | Generate one or more paragraphs                 |
| `text`       | Generate a text block (multiple paragraphs)     |
| `validate`   | Validate a lexicon JSON file                    |
| `list`       | List available transforms or sentence types     |

### Global Options

These options work with `sentence`, `paragraph`, and `text`:

| Option                     | Short | Description                                              |
| -------------------------- | ----- | -------------------------------------------------------- |
| `--seed <n>`               | `-s`  | RNG seed for deterministic output                        |
| `--lexicon <path>`         | `-l`  | Path to a lexicon JSON file                              |
| `--archetype <name>`       | `-a`  | Archetype to activate from the lexicon                   |
| `--transform <id>`         | `-x`  | Apply an output transform (repeatable, comma-separated)  |
| `--trace`                  | `-t`  | Output JSON trace to stderr                              |
| `--json`                   | `-j`  | Output full result as JSON to stdout                     |
| `--count <n>`              | `-n`  | Number of items to generate (default: 1)                 |
| `--help`                   | `-h`  | Show help                                                |
| `--version`                | `-v`  | Show version                                             |

### Generating Sentences

```bash
# Random sentence
marlarky sentence

# Specific type
marlarky sentence --type question
marlarky sentence --type compound
marlarky sentence --type subordinate

# Control word count
marlarky sentence --min-words 10 --max-words 20

# Multiple sentences
marlarky sentence --count 5

# With hints (activate lexicon tags)
marlarky sentence --hints domain:tech,register:formal
```

### Generating Paragraphs

```bash
# Random paragraph
marlarky paragraph

# Control sentence count
marlarky paragraph --sentences 5
marlarky paragraph --min-sentences 3 --max-sentences 8

# Multiple paragraphs
marlarky paragraph --count 3
```

### Generating Text Blocks

```bash
# Random text block
marlarky text

# Control paragraph count
marlarky text --paragraphs 4
marlarky text --min-paragraphs 2 --max-paragraphs 6
```

### Applying Transforms

Use `--transform` (or `-x`) to pipe generated text through built-in transforms:

```bash
# Pig Latin
marlarky sentence --seed 42 --transform pigLatin
# "Enerallygay, ethay angechay alledcay."

# Leet speak
marlarky sentence --seed 42 --transform leet

# Chain multiple transforms (comma-separated)
marlarky sentence --seed 42 --transform leet,uwu

# Or use repeated flags
marlarky sentence --seed 42 -x pirate -x mockCase
```

Run `marlarky list transforms` to see all available transforms.

### JSON Output

Use `--json` (or `-j`) to get structured output including metadata and trace:

```bash
marlarky sentence --seed 42 --json
```

```json
{
  "text": "Generally, the change called.",
  "trace": { "..." : "..." },
  "meta": {
    "archetype": "default",
    "seed": 42
  }
}
```

### Validating Lexicons

```bash
# Human-readable output
marlarky validate ./my-lexicon.json

# Machine-readable JSON output
marlarky validate ./my-lexicon.json --json
```

### Listing Available Features

```bash
# List all output transforms
marlarky list transforms

# List all sentence types
marlarky list types

# Output as JSON
marlarky list transforms --json
```

## Output Transforms

Marlarky includes 10 built-in output transforms that modify generated text at the token level. All transforms are deterministic (same seed = same output) and safe to chain.

| Transform       | Description                               |
| --------------- | ----------------------------------------- |
| `pigLatin`      | Classic Pig Latin                         |
| `ubbiDubbi`     | Ubbi Dubbi language game                  |
| `leet`          | Leetspeak character substitution          |
| `uwu`           | Cute speak (w-substitution, suffixes)     |
| `pirate`        | Pirate speak                              |
| `redact`        | Redact/mask words                         |
| `emoji`         | Add emoji replacements                    |
| `mockCase`      | rAnDoM cAsE aLtErNaTiOn                  |
| `reverseWords`  | Reverse word order                        |
| `bizJargon`     | Business jargon patterns                  |

### Using Transforms in Code

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'pigLatin' }],
  },
});
```

Transforms can also be configured at the lexicon level or per-archetype in your lexicon JSON. See the [usage guide](https://jpaulduncan.github.io/malarky/usage.md) for details.

## Sentence Types

Marlarky generates six sentence structures:

```typescript
// Simple declarative: "The system processes data."
generator.sentence({ type: 'simpleDeclarative' });

// Question: "Does the team deliver results?"
generator.sentence({ type: 'question' });

// Compound: "The strategy evolved, and the metrics improved."
generator.sentence({ type: 'compound' });

// Subordinate clause: "Because the pipeline scales, the throughput increases."
generator.sentence({ type: 'subordinate' });

// Intro adverbial: "Furthermore, the initiative drives innovation."
generator.sentence({ type: 'introAdverbial' });

// Interjection: "Indeed, the team delivered results."
generator.sentence({ type: 'interjection' });
```

## Deterministic Output

Same seed produces the same text every time:

```typescript
generator.setSeed(12345);
const a = generator.sentence();

generator.setSeed(12345);
const b = generator.sentence();

console.log(a === b); // true
```

From the CLI:

```bash
marlarky sentence --seed 12345
marlarky sentence --seed 12345
# Both print the same sentence
```

## Custom Lexicons

Create domain-specific marlarky with JSON lexicon files:

```json
{
  "id": "lexicon.startup",
  "language": "en",
  "termSets": {
    "noun.startup": {
      "pos": "noun",
      "tags": ["domain:startup"],
      "terms": [
        { "value": "disruptor", "weight": 5 },
        { "value": "unicorn", "weight": 3 },
        { "value": "pivot", "weight": 4 },
        { "value": "runway", "weight": 2 }
      ]
    },
    "verb.startup": {
      "pos": "verb",
      "tags": ["domain:startup"],
      "terms": [
        { "value": "disrupt", "weight": 5 },
        { "value": "scale", "weight": 4 },
        { "value": "pivot", "weight": 3 },
        { "value": "iterate", "weight": 3 }
      ]
    }
  },
  "archetypes": {
    "startup": {
      "tags": ["domain:startup"]
    }
  }
}
```

Load it in code:

```typescript
import { TextGenerator, SimpleFakerAdapter, loadLexiconFromString } from 'marlarky';
import { readFileSync } from 'fs';

const lexicon = loadLexiconFromString(readFileSync('./startup.json', 'utf-8'));

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

generator.setArchetype('startup');
console.log(generator.paragraph());
```

Or from the CLI:

```bash
marlarky paragraph --lexicon ./startup.json --archetype startup
```

See the [usage guide](usage.md#lexicon-schema) for the full lexicon schema reference.

## Morphology Utilities

Marlarky exports standalone English morphology functions:

```typescript
import {
  pluralize,
  singularize,
  getPastTense,
  getPresentParticiple,
  getThirdPersonSingular,
  getIndefiniteArticle,
} from 'marlarky';

pluralize('synergy');        // "synergies"
pluralize('child');          // "children"
singularize('stakeholders'); // "stakeholder"
getPastTense('leverage');    // "leveraged"
getPastTense('go');          // "went"
getPresentParticiple('run'); // "running"
getThirdPersonSingular('do'); // "does"
getIndefiniteArticle('hour'); // "an"
getIndefiniteArticle('user'); // "a"
```

## With @faker-js/faker

For more word variety, use the optional faker-js adapter:

```typescript
import { TextGenerator, FakerJsAdapter } from 'marlarky';
import { faker } from '@faker-js/faker';

const generator = new TextGenerator({
  fakerAdapter: new FakerJsAdapter(faker),
});
```

`@faker-js/faker` is an optional peer dependency -- Marlarky works without it using the built-in `SimpleFakerAdapter`.

## Configuration

Fine-tune generation behavior:

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  config: {
    minWordsPerSentence: 10,
    maxWordsPerSentence: 25,
    minSentencesPerParagraph: 3,
    maxSentencesPerParagraph: 6,
    questionRate: 0.05,
    compoundRate: 0.20,
    subordinateClauseRate: 0.15,
    maxPPChain: 2,
    maxAdjectivesPerNoun: 2,
  },
});
```

See the [usage guide](usage.md#configuration) for all configuration options.

## Tracing

Enable trace mode to see how text was generated:

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  enableTrace: true,
});

const result = generator.sentence();

console.log(result.text);
// "The robust system efficiently processes data."

console.log(result.trace.paragraphs[0].sentences[0].template);
// "simpleDeclarative"

console.log(result.trace.paragraphs[0].sentences[0].tokens);
// [{ value: "The", source: "default" }, { value: "robust", source: "adj.business" }, ...]
```

From the CLI, use `--trace` to send trace data to stderr, or `--json` to include it in structured stdout output.

## Examples

```bash
# Run the basic usage example
npm run example:basic

# Run the corporate lexicon example
npm run example:corporate
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint
```

## API Summary

For the complete API reference including all types, interfaces, and configuration options, see the [usage guide](usage.md).

| Method / Function             | Description                              |
| ----------------------------- | ---------------------------------------- |
| `new TextGenerator(opts)`     | Create a generator instance              |
| `generator.sentence(opts?)`   | Generate one sentence                    |
| `generator.paragraph(opts?)`  | Generate a paragraph (2-7 sentences)     |
| `generator.textBlock(opts?)`  | Generate multiple paragraphs             |
| `generator.setSeed(n)`        | Set RNG seed for reproducibility         |
| `generator.setLexicon(lex)`   | Load or replace a lexicon at runtime     |
| `generator.setArchetype(name)`| Activate a style preset                  |
| `validateLexicon(obj)`        | Validate a lexicon object                |
| `loadLexiconFromString(json)` | Parse a lexicon JSON string              |

## License

MIT

---

_"Leveraging synergistic paradigms to facilitate robust deliverables across the ecosystem."_
-- marlarky
