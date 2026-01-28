# Marlarky Usage Guide

Comprehensive reference for the Marlarky text generation library and CLI.

## Table of Contents

- [Installation](#installation)
- [Library Usage](#library-usage)
  - [Basic Usage](#basic-usage)
  - [With a Lexicon](#with-a-lexicon)
  - [With @faker-js/faker](#with-fakerjsfaker)
  - [Sentence Types](#sentence-types)
  - [Deterministic Output](#deterministic-output)
  - [Domain-Specific Hints](#domain-specific-hints)
- [CLI Usage](#cli-usage)
  - [sentence Command](#sentence-command)
  - [paragraph Command](#paragraph-command)
  - [text Command](#text-command)
  - [validate Command](#validate-command)
  - [list Command](#list-command)
- [Output Transforms](#output-transforms)
  - [Available Transforms](#available-transforms)
  - [Using Transforms in Code](#using-transforms-in-code)
  - [Using Transforms from the CLI](#using-transforms-from-the-cli)
  - [Chaining Transforms](#chaining-transforms)
  - [Transform Protection](#transform-protection)
  - [Custom Transforms](#custom-transforms)
- [Tracing](#tracing)
  - [Tracing in Code](#tracing-in-code)
  - [Tracing from the CLI](#tracing-from-the-cli)
  - [Trace Structure](#trace-structure)
- [Lexicon Schema](#lexicon-schema)
  - [Root Structure](#root-structure)
  - [Term Sets](#term-sets)
  - [Patterns](#patterns)
  - [Distributions](#distributions)
  - [Correlations](#correlations)
  - [Constraints](#constraints)
  - [Invariants](#invariants)
  - [Archetypes](#archetypes)
  - [Relations](#relations)
  - [Lexicon-Level Transforms](#lexicon-level-transforms)
  - [Validation](#validation)
- [Configuration](#configuration)
  - [GeneratorConfig](#generatorconfig)
  - [Sentence Type Weights](#sentence-type-weights)
- [API Reference](#api-reference)
  - [TextGenerator](#textgenerator)
  - [GeneratorInitOptions](#generatorinitoptions)
  - [SentenceOptions](#sentenceoptions)
  - [ParagraphOptions](#paragraphoptions)
  - [TextBlockOptions](#textblockoptions)
  - [GeneratedText](#generatedtext)
  - [Lexicon Utilities](#lexicon-utilities)
  - [Morphology Utilities](#morphology-utilities)
  - [Transform System Exports](#transform-system-exports)
- [Examples](#examples)
- [Development](#development)

---

## Installation

```bash
npm install marlarky
```

Or from source:

```bash
git clone <repo>
cd marlarky
npm install
npm run build
```

---

## Library Usage

### Basic Usage

The simplest setup requires only a faker adapter. The built-in `SimpleFakerAdapter` provides a fixed set of English words with no external dependencies.

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

generator.setSeed(42);

// Generate a single sentence
console.log(generator.sentence());
// "Generally, the change called."

// Generate a paragraph (2-7 sentences by default)
console.log(generator.paragraph({ sentences: 3 }));

// Generate multiple paragraphs
console.log(generator.textBlock({ paragraphs: 2 }));
```

### With a Lexicon

Lexicons steer generation toward specific vocabularies and styles.

```typescript
import { TextGenerator, SimpleFakerAdapter, loadLexiconFromString } from 'marlarky';
import { readFileSync } from 'fs';

const lexiconJson = readFileSync('corporate-lexicon.json', 'utf-8');
const lexicon = loadLexiconFromString(lexiconJson);

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

// Activate a style preset
generator.setArchetype('corporate');

console.log(generator.paragraph());
// Corporate-style text with business terminology
```

### With @faker-js/faker

For more word variety, swap in the `FakerJsAdapter`. This wraps the popular `@faker-js/faker` library, which is an optional peer dependency.

```typescript
import { TextGenerator, FakerJsAdapter } from 'marlarky';
import { faker } from '@faker-js/faker';

const generator = new TextGenerator({
  fakerAdapter: new FakerJsAdapter(faker),
});

console.log(generator.sentence());
```

### Sentence Types

Marlarky generates six sentence structures. You can request a specific type or let the generator pick one based on weighted probabilities.

```typescript
// Simple declarative: subject + verb + optional object
generator.sentence({ type: 'simpleDeclarative' });
// "The system processes data."

// Question: yes/no or WH-question
generator.sentence({ type: 'question' });
// "Does the team deliver results?"

// Compound: two clauses joined by a coordinating conjunction
generator.sentence({ type: 'compound' });
// "The strategy evolved, and the metrics improved."

// Subordinate: dependent clause + main clause
generator.sentence({ type: 'subordinate' });
// "Because the pipeline scales, the throughput increases."

// Intro adverbial: transition word/phrase + main clause
generator.sentence({ type: 'introAdverbial' });
// "Furthermore, the initiative drives innovation."

// Interjection: interjection + main clause
generator.sentence({ type: 'interjection' });
// "Indeed, the team delivered results."
```

### Deterministic Output

Setting a seed makes all output reproducible. The same seed with the same configuration always produces identical text.

```typescript
generator.setSeed(12345);
const text1 = generator.sentence();

generator.setSeed(12345);
const text2 = generator.sentence();

console.log(text1 === text2); // true
```

### Domain-Specific Hints

Hints activate specific tags in the lexicon at generation time, biasing word selection toward matching term sets.

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon: myLexicon,
});

// Activate specific domain tags
const techText = generator.paragraph({ hints: ['domain:tech'] });
const businessText = generator.paragraph({ hints: ['domain:business', 'register:formal'] });
```

---

## CLI Usage

The `marlarky` CLI is available after installation. If installed locally, use `npx marlarky` or `npm run cli -- <args>`.

```bash
marlarky <command> [options]
```

### sentence Command

Generate one or more sentences.

```
marlarky sentence [options]
```

**Options:**

| Option                     | Short | Description                                              |
| -------------------------- | ----- | -------------------------------------------------------- |
| `--type <type>`            |       | Sentence type (see below)                                |
| `--hints <tags>`           |       | Comma-separated hint tags                                |
| `--min-words <n>`          |       | Minimum word count per sentence                          |
| `--max-words <n>`          |       | Maximum word count per sentence                          |
| `--seed <n>`               | `-s`  | RNG seed for deterministic output                        |
| `--lexicon <path>`         | `-l`  | Path to a lexicon JSON file                              |
| `--archetype <name>`       | `-a`  | Archetype to activate                                    |
| `--transform <id>`         | `-x`  | Output transform (repeatable, comma-separated)           |
| `--trace`                  | `-t`  | Output JSON trace to stderr                              |
| `--json`                   | `-j`  | Output full result as JSON to stdout                     |
| `--count <n>`              | `-n`  | Number of sentences (default: 1)                         |

**Valid sentence types:** `simpleDeclarative`, `compound`, `introAdverbial`, `subordinate`, `interjection`, `question`

**Examples:**

```bash
marlarky sentence
marlarky sentence --seed 42 --type question
marlarky sentence --count 10 --min-words 8 --max-words 15
marlarky sentence --lexicon ./corp.json --archetype corporate --hints domain:business
marlarky sentence --transform pigLatin --seed 42
```

### paragraph Command

Generate one or more paragraphs.

```
marlarky paragraph [options]
```

**Options:**

| Option                     | Short | Description                                              |
| -------------------------- | ----- | -------------------------------------------------------- |
| `--sentences <n>`          |       | Exact number of sentences per paragraph                  |
| `--min-sentences <n>`      |       | Minimum sentences per paragraph                          |
| `--max-sentences <n>`      |       | Maximum sentences per paragraph                          |
| `--hints <tags>`           |       | Comma-separated hint tags                                |
| `--seed <n>`               | `-s`  | RNG seed for deterministic output                        |
| `--lexicon <path>`         | `-l`  | Path to a lexicon JSON file                              |
| `--archetype <name>`       | `-a`  | Archetype to activate                                    |
| `--transform <id>`         | `-x`  | Output transform (repeatable, comma-separated)           |
| `--trace`                  | `-t`  | Output JSON trace to stderr                              |
| `--json`                   | `-j`  | Output full result as JSON to stdout                     |
| `--count <n>`              | `-n`  | Number of paragraphs (default: 1)                        |

**Examples:**

```bash
marlarky paragraph --sentences 5 --seed 42
marlarky paragraph --count 3 --lexicon ./corp.json
marlarky paragraph --min-sentences 3 --max-sentences 8
marlarky paragraph --transform pirate --json
```

### text Command

Generate a text block (multiple paragraphs).

```
marlarky text [options]
```

**Options:**

| Option                     | Short | Description                                              |
| -------------------------- | ----- | -------------------------------------------------------- |
| `--paragraphs <n>`         |       | Exact number of paragraphs                               |
| `--min-paragraphs <n>`     |       | Minimum paragraphs                                       |
| `--max-paragraphs <n>`     |       | Maximum paragraphs                                       |
| `--hints <tags>`           |       | Comma-separated hint tags                                |
| `--seed <n>`               | `-s`  | RNG seed for deterministic output                        |
| `--lexicon <path>`         | `-l`  | Path to a lexicon JSON file                              |
| `--archetype <name>`       | `-a`  | Archetype to activate                                    |
| `--transform <id>`         | `-x`  | Output transform (repeatable, comma-separated)           |
| `--trace`                  | `-t`  | Output JSON trace to stderr                              |
| `--json`                   | `-j`  | Output full result as JSON to stdout                     |
| `--count <n>`              | `-n`  | Number of text blocks (default: 1)                       |

**Examples:**

```bash
marlarky text --paragraphs 3 --seed 42
marlarky text --lexicon ./corp.json --archetype corporate
marlarky text --transform bizJargon --json
```

### validate Command

Validate a lexicon JSON file against the expected schema.

```
marlarky validate <file.json> [options]
```

**Options:**

| Option      | Short | Description                          |
| ----------- | ----- | ------------------------------------ |
| `--json`    |       | Output validation result as JSON     |
| `--help`    | `-h`  | Show help                            |

**Examples:**

```bash
marlarky validate ./my-lexicon.json
marlarky validate ./my-lexicon.json --json
```

**Exit codes:**
- `0` -- Valid lexicon (may have warnings)
- `1` -- Invalid lexicon or file error

### list Command

List available transforms or sentence types.

```
marlarky list <category> [options]
```

**Categories:**

| Category       | Description                              |
| -------------- | ---------------------------------------- |
| `transforms`   | List all registered output transforms    |
| `types`        | List all sentence types                  |

**Options:**

| Option      | Short | Description                          |
| ----------- | ----- | ------------------------------------ |
| `--json`    |       | Output as JSON                       |
| `--help`    | `-h`  | Show help                            |

**Examples:**

```bash
marlarky list transforms
marlarky list types
marlarky list transforms --json
```

---

## Output Transforms

The output transform system modifies generated text after sentence construction. Text is tokenized, protected tokens are marked, and then each transform in the pipeline processes the token stream in order.

### Available Transforms

| ID              | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `pigLatin`      | Classic Pig Latin: consonant clusters move to end + "ay"                 |
| `ubbiDubbi`     | Ubbi Dubbi language game: inserts "ub" before each vowel sound           |
| `leet`          | Leetspeak: substitutes characters (a->4, e->3, o->0, etc.)              |
| `uwu`           | Cute speak: r/l -> w substitution, nya insertion, cute suffixes          |
| `pirate`        | Pirate speak: word and phrase substitutions                              |
| `redact`        | Redaction: masks words with bracketed blocks                             |
| `emoji`         | Emoji: replaces words with emoji equivalents                             |
| `mockCase`      | Mock case: rAnDoM CaSe aLtErNaTiOn                                      |
| `reverseWords`  | Reverse: reverses word order within sentences                            |
| `bizJargon`     | Business jargon: applies business-speak patterns                         |

### Using Transforms in Code

Pass an `outputTransforms` config to any generation method:

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [
      { id: 'pigLatin' },
    ],
  },
});
```

Chain multiple transforms:

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [
      { id: 'leet' },
      { id: 'uwu' },
    ],
  },
});
```

### Using Transforms from the CLI

Use `--transform` (short: `-x`) with any generation command:

```bash
# Single transform
marlarky sentence --transform pigLatin --seed 42

# Multiple transforms (comma-separated)
marlarky sentence --transform leet,uwu --seed 42

# Multiple transforms (repeated flags)
marlarky sentence -x pirate -x mockCase --seed 42
```

Transforms execute in the order specified. Invalid transform IDs produce an error listing all available IDs.

### Chaining Transforms

Transforms execute sequentially. The output tokens of one transform become the input to the next. Each transform gets its own seeded RNG fork, so results are deterministic regardless of pipeline length.

Pipeline ordering matters. Each transform has a `preferredOrder` value (lower = earlier). You can view these with:

```bash
marlarky list transforms
```

When using the programmatic API, set `autoOrder: true` in the config to sort by preferred order automatically:

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [
      { id: 'mockCase' },   // preferredOrder: 50
      { id: 'pirate' },     // preferredOrder: 10
    ],
    autoOrder: true,  // reorders to: pirate, mockCase
  },
});
```

### Transform Protection

The protection system prevents transforms from modifying certain tokens:

| Protection Rule     | Default | Description                                    |
| ------------------- | ------- | ---------------------------------------------- |
| `keepAcronyms`      | `true`  | ALL-CAPS words are skipped                     |
| `keepNumbers`       | `true`  | Number tokens are skipped                      |
| `keepCodeTokens`    | `true`  | Code-like tokens (camelCase, etc.) are skipped |
| `keepUrlsEmails`    | `true`  | URL and email tokens are skipped               |
| `minWordLength`     | `2`     | Words shorter than this are skipped            |
| `customProtectedRegex` | `[]` | Additional regex patterns to protect           |

Override protection in code:

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'leet' }],
    protection: {
      keepAcronyms: true,
      keepNumbers: true,
      minWordLength: 3,  // skip 1-2 letter words
    },
  },
});
```

### Custom Transforms

Implement the `IOutputTransform` interface and register it:

```typescript
import {
  TransformRegistry,
  createDefaultRegistry,
} from 'marlarky';
import type { IOutputTransform, TransformInput, TransformOutput, ValidationResult } from 'marlarky';

const myTransform: IOutputTransform = {
  id: 'myTransform',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 50,
  },
  validateParams(params: unknown): ValidationResult {
    return { valid: true, errors: [] };
  },
  apply(input: TransformInput): TransformOutput {
    const tokens = input.tokens.map(token => {
      if (token.type === 'word' && !token.meta?.protected) {
        return { ...token, value: token.value.toUpperCase() };
      }
      return token;
    });
    return { tokens };
  },
};

// Register it
const generator = new TextGenerator({ fakerAdapter: new SimpleFakerAdapter() });
generator.getTransformRegistry().register(myTransform);
```

---

## Tracing

Tracing reveals how text was generated: which sentence templates were selected, where each word came from, which constraints were evaluated, and how transforms modified the output.

### Tracing in Code

Enable tracing in the constructor. When enabled, generation methods return a `GeneratedText` object instead of a plain string.

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  enableTrace: true,
});

const result = generator.sentence();

// result is now a GeneratedText object
console.log(result.text);           // The generated text
console.log(result.meta.seed);      // Seed used
console.log(result.meta.archetype); // Active archetype

// Sentence-level trace
const sentenceTrace = result.trace.paragraphs[0].sentences[0];
console.log(sentenceTrace.template);  // e.g. "simpleDeclarative"
console.log(sentenceTrace.tokens);    // Array of { value, source, pos? }
console.log(sentenceTrace.retryCount); // Number of generation retries

// Constraint results
console.log(sentenceTrace.constraintsEvaluated);
// [{ id: "c.minWords", passed: true }, ...]

// Invariant results
console.log(result.trace.invariantsChecked);
// [{ id: "inv.capitalized", passed: true }, ...]

// Transform traces (when transforms are active)
console.log(result.trace.outputTokens);    // original vs transformed values
console.log(result.trace.transformEvents); // per-step statistics
console.log(result.meta.transformsApplied); // ["pigLatin", "leet"]
```

### Tracing from the CLI

**`--trace` flag:** Sends trace JSON to stderr while text goes to stdout. This lets you pipe text output while still capturing trace data.

```bash
# Text on stdout, trace on stderr
marlarky sentence --seed 42 --trace

# Capture trace to a file
marlarky sentence --seed 42 --trace 2> trace.json
```

**`--json` flag:** Outputs the entire `GeneratedText` object (text + trace + meta) as JSON on stdout.

```bash
marlarky sentence --seed 42 --json
```

```json
{
  "text": "Generally, the change called.",
  "trace": {
    "paragraphs": [{
      "sentences": [{
        "text": "Generally, the change called.",
        "template": "introAdverbial",
        "tokens": [
          { "value": "generally", "source": "default" },
          { "value": ",", "source": "default" },
          { "value": "the", "source": "default" },
          { "value": "change", "source": "default", "pos": "noun" },
          { "value": "called", "source": "default" }
        ],
        "constraintsEvaluated": [
          { "id": "c.minWords", "passed": true },
          { "id": "c.maxWords", "passed": true }
        ],
        "retryCount": 0
      }]
    }],
    "correlationsApplied": [],
    "invariantsChecked": [
      { "id": "inv.capitalized", "passed": true },
      { "id": "inv.endsWithPunct", "passed": true },
      { "id": "inv.noDoubleSpaces", "passed": true }
    ]
  },
  "meta": {
    "archetype": "default",
    "seed": 42
  }
}
```

### Trace Structure

| Field                              | Description                                          |
| ---------------------------------- | ---------------------------------------------------- |
| `trace.paragraphs`                 | Array of paragraph traces                            |
| `trace.paragraphs[].sentences`     | Array of sentence traces per paragraph               |
| `trace.paragraphs[].sentences[].text` | The sentence text                                 |
| `trace.paragraphs[].sentences[].template` | Sentence type used                            |
| `trace.paragraphs[].sentences[].tokens` | Token sources (lexicon term set or "default")   |
| `trace.paragraphs[].sentences[].constraintsEvaluated` | Constraint pass/fail       |
| `trace.paragraphs[].sentences[].retryCount` | How many retries were needed             |
| `trace.correlationsApplied`        | Correlations triggered during generation             |
| `trace.invariantsChecked`          | Invariant pass/fail results                          |
| `trace.outputTokens`               | Per-token original vs. transformed values (when transforms active) |
| `trace.transformEvents`            | Per-step transform statistics (when transforms active)             |
| `meta.archetype`                   | Active archetype name                                |
| `meta.seed`                        | Seed used for generation                             |
| `meta.lexiconId`                   | Lexicon ID (if loaded)                               |
| `meta.lexiconVersion`              | Lexicon version (if loaded)                          |
| `meta.transformsApplied`           | IDs of transforms that ran (when transforms active)  |

---

## Lexicon Schema

A lexicon is a JSON file that steers text generation. All top-level fields except `id` and `language` are optional.

### Root Structure

```typescript
interface Lexicon {
  id: string;               // Unique identifier (required)
  version?: string;          // Version string
  language: string;          // Language code, e.g. "en" (required)
  termSets?: Record<string, TermSet>;
  patterns?: Record<string, Pattern>;
  distributions?: Record<string, DistributionEntry[]>;
  correlations?: Correlation[];
  constraints?: Constraint[];
  invariants?: Invariant[];
  archetypes?: Record<string, Archetype>;
  relations?: Relation[];
  outputTransforms?: LexiconOutputTransforms;
}
```

### Term Sets

Named pools of words grouped by part of speech. Each term has a value and optional weight (default 1). Higher weights increase selection probability.

```json
{
  "termSets": {
    "noun.business": {
      "pos": "noun",
      "tags": ["domain:business", "register:formal"],
      "terms": [
        { "value": "strategy", "weight": 5 },
        { "value": "stakeholder", "weight": 3 },
        { "value": "synergy", "weight": 2 }
      ]
    },
    "verb.business": {
      "pos": "verb",
      "tags": ["domain:business"],
      "terms": [
        { "value": "leverage", "weight": 4 },
        { "value": "optimize", "weight": 4 },
        { "value": "streamline", "weight": 3 }
      ]
    }
  }
}
```

**Supported POS values:** `noun`, `verb`, `adj`, `adv`, `prep`, `conj`, `intj`, `det`

Each term can also carry `features` for morphology and constraint evaluation:

```json
{
  "value": "child",
  "weight": 3,
  "features": {
    "countable": true,
    "number": "singular",
    "irregular": { "plural": "children" }
  }
}
```

### Patterns

Syntactic templates that define phrase or sentence structure. These supplement the built-in grammar engine.

```json
{
  "patterns": {
    "sentence.corporate": {
      "type": "sentence",
      "slots": ["NP", "VP", "PUNCT"],
      "tags": ["domain:business"],
      "weight": 2
    }
  }
}
```

**Pattern types:** `sentence`, `nounPhrase`, `verbPhrase`, `prepPhrase`, `adjPhrase`, `advPhrase`, `clause`

### Distributions

Named weight tables that bias choices. Referenced by archetypes.

```json
{
  "distributions": {
    "sentenceTypes.corporate": [
      { "key": "simpleDeclarative", "weight": 50 },
      { "key": "compound", "weight": 20 },
      { "key": "introAdverbial", "weight": 15 },
      { "key": "subordinate", "weight": 12 },
      { "key": "interjection", "weight": 2 },
      { "key": "question", "weight": 1 }
    ],
    "termSetBias.domain:business": [
      { "key": "noun.business", "weight": 10 },
      { "key": "verb.business", "weight": 8 }
    ]
  }
}
```

### Correlations

Conditional weight adjustments triggered by generation events. When a term from a specific term set is chosen, other term sets can be boosted or suppressed.

```json
{
  "correlations": [
    {
      "when": { "chosenTermSet": "noun.business" },
      "thenBoost": [
        { "termSet": "verb.business", "weightDelta": 5 },
        { "termSet": "adj.business", "weightDelta": 3 }
      ],
      "scope": "sentence"
    }
  ]
}
```

**Condition types:**
- `chosenTermSet` -- a term from this set was selected
- `chosenTag` -- a term with this tag was selected
- `chosenValue` -- a specific word was selected
- `usedPattern` -- a specific pattern was used

**Boost targets:** `termSet` or `pattern` with a `weightDelta` (positive to boost, negative to suppress).

**Scopes:** `token`, `phrase`, `sentence`, `paragraph`

### Constraints

Rules that restrict generation. Hard constraints cause retries; soft constraints produce warnings.

```json
{
  "constraints": [
    {
      "id": "c.noRepeatNoun",
      "level": "hard",
      "scope": "sentence",
      "type": "noRepeat",
      "target": "pos:noun"
    },
    {
      "id": "c.maxPP",
      "level": "hard",
      "scope": "phrase",
      "type": "maxCount",
      "target": "PP",
      "value": 2
    }
  ]
}
```

**Constraint types:** `noRepeat`, `maxCount`, `minCount`, `required`, `forbidden`, `custom`

**Levels:** `hard` (causes retry), `soft` (produces warning)

**Scopes:** `token`, `phrase`, `clause`, `sentence`, `paragraph`, `text`

### Invariants

Conditions that must always hold true. Checked after generation.

```json
{
  "invariants": [
    { "id": "inv.capitalized", "type": "capitalization", "scope": "sentence" },
    { "id": "inv.endsWithPunct", "type": "punctuation", "scope": "sentence" },
    { "id": "inv.noDoubleSpaces", "type": "whitespace", "scope": "text" }
  ]
}
```

**Invariant types:** `capitalization`, `punctuation`, `whitespace`, `agreement`, `custom`

### Archetypes

Style presets that combine tags, distributions, and config overrides. Activate an archetype with `generator.setArchetype('name')` or `--archetype name` from the CLI.

```json
{
  "archetypes": {
    "corporate": {
      "tags": ["register:formal", "domain:business"],
      "distributions": {
        "sentenceTypes": "sentenceTypes.corporate",
        "termSetBias": "termSetBias.domain:business"
      },
      "overrides": {
        "interjectionRate": 0.02,
        "subordinateClauseRate": 0.12,
        "questionRate": 0.01
      }
    }
  }
}
```

**Override-able config fields:** `interjectionRate`, `subordinateClauseRate`, `relativeClauseRate`, `questionRate`, `compoundRate`, `maxPPChain`, `avgSentenceLength`

### Relations

Graph connections between terms for co-occurrence modeling.

```json
{
  "relations": [
    { "from": "strategy", "type": "hasPart", "to": "initiative", "weight": 3 },
    { "from": "meeting", "type": "produces", "to": "deliverable", "weight": 2 }
  ]
}
```

### Lexicon-Level Transforms

Lexicons can specify default transforms and per-archetype transform pipelines:

```json
{
  "outputTransforms": {
    "defaults": [
      { "id": "bizJargon" }
    ]
  },
  "archetypes": {
    "pirate-corp": {
      "tags": ["domain:business"],
      "outputTransforms": {
        "pipeline": [
          { "id": "pirate" },
          { "id": "bizJargon" }
        ]
      }
    }
  }
}
```

Transform config merges in this order (later overrides earlier):
1. Base config (from `GeneratorConfig.outputTransforms`)
2. Lexicon defaults (from `lexicon.outputTransforms.defaults`)
3. Archetype transforms (from `lexicon.archetypes[name].outputTransforms.pipeline`)
4. Per-call overrides (from `opts.outputTransforms`)

### Validation

Validate a lexicon before use:

```typescript
import { validateLexicon } from 'marlarky';

const result = validateLexicon(lexiconObject);

if (!result.valid) {
  console.error('Errors:', result.errors);
  // [{ path: "termSets.noun.tech.terms[0]", message: "...", severity: "error" }]
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

From the CLI:

```bash
marlarky validate ./my-lexicon.json
marlarky validate ./my-lexicon.json --json
```

---

## Configuration

### GeneratorConfig

All fields are optional when passed to the constructor. Defaults are shown below.

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  config: {
    // Sentence length
    minWordsPerSentence: 5,
    maxWordsPerSentence: 25,
    avgSentenceLength: 12,

    // Paragraph length
    minSentencesPerParagraph: 2,
    maxSentencesPerParagraph: 7,

    // Sentence type rates (0-1)
    interjectionRate: 0.03,
    subordinateClauseRate: 0.15,
    relativeClauseRate: 0.10,
    questionRate: 0.10,
    compoundRate: 0.15,

    // Complexity limits
    maxPPChain: 2,             // Max prepositional phrase chains
    maxAdjectivesPerNoun: 2,   // Max adjectives before a noun
    maxAdverbsPerVerb: 1,      // Max adverbs per verb phrase

    // Retry limits
    maxSentenceAttempts: 25,   // Max retries for valid sentence
    maxPhraseAttempts: 10,     // Max retries for valid phrase

    // Behavior
    enableTrace: false,        // Enable generation tracing
    strictMode: false,         // Throw on constraint failure (vs best-effort)
  },
});
```

### Sentence Type Weights

Control the probability distribution of sentence types:

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  config: {
    sentenceTypeWeights: {
      simpleDeclarative: 45,  // Most common
      compound: 15,
      introAdverbial: 12,
      subordinate: 15,
      interjection: 3,        // Rare
      question: 10,
    },
  },
});
```

Weights are relative -- they don't need to sum to 100.

---

## API Reference

### TextGenerator

The main class for generating text.

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator(options: GeneratorInitOptions);
```

**Methods:**

| Method                      | Returns                   | Description                          |
| --------------------------- | ------------------------- | ------------------------------------ |
| `sentence(opts?)`           | `string \| GeneratedText` | Generate one sentence                |
| `paragraph(opts?)`          | `string \| GeneratedText` | Generate a paragraph                 |
| `textBlock(opts?)`          | `string \| GeneratedText` | Generate multiple paragraphs         |
| `setSeed(seed: number)`     | `void`                    | Set RNG seed                         |
| `setLexicon(lexicon)`       | `void`                    | Load or replace lexicon at runtime   |
| `setArchetype(name: string)`| `void`                    | Activate a style preset              |
| `getTransformRegistry()`    | `TransformRegistry`       | Access the transform registry        |

When `enableTrace` is `false` (default), generation methods return a plain `string`. When `true`, they return a `GeneratedText` object.

### GeneratorInitOptions

```typescript
interface GeneratorInitOptions {
  fakerAdapter: IFakerAdapter;          // Required: word generation fallback
  lexicon?: Lexicon;                     // Optional: lexicon for guided generation
  rng?: IRng;                            // Optional: custom RNG
  config?: Partial<GeneratorConfig>;     // Optional: override default config
  enableTrace?: boolean;                 // Optional: enable tracing (default: false)
}
```

### SentenceOptions

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

### ParagraphOptions

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

### TextBlockOptions

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

### GeneratedText

Returned by generation methods when tracing is enabled.

```typescript
interface GeneratedText {
  text: string;                          // The generated text
  trace?: GenerationTrace;               // Full trace (when tracing enabled)
  meta: GenerationMeta;                  // Generation metadata
}

interface GenerationMeta {
  archetype: string;                     // Active archetype
  seed: number;                          // Seed used
  lexiconVersion?: string;               // Lexicon version (if loaded)
  lexiconId?: string;                    // Lexicon ID (if loaded)
  transformsApplied?: string[];          // IDs of applied transforms
}
```

### Lexicon Utilities

```typescript
import {
  loadLexiconFromString,  // Parse JSON string -> Lexicon
  loadLexiconFromObject,  // Validate object -> Lexicon
  tryLoadLexicon,         // Parse with error handling -> Lexicon | null
  validateLexicon,        // Validate -> LexiconValidationResult
  LexiconStore,           // Query and sample from a loaded lexicon
} from 'marlarky';
```

### Morphology Utilities

All morphology functions are standalone -- they don't require a generator instance.

**Articles:**

```typescript
import { useAn, getIndefiniteArticle, withIndefiniteArticle } from 'marlarky';

useAn('apple');                 // true
useAn('banana');                // false
getIndefiniteArticle('hour');   // "an"
getIndefiniteArticle('user');   // "a"
withIndefiniteArticle('apple'); // "an apple"
```

**Pluralization:**

```typescript
import { pluralize, singularize, isPlural } from 'marlarky';

pluralize('strategy');     // "strategies"
pluralize('child');        // "children"
pluralize('analysis');     // "analyses"
singularize('stakeholders'); // "stakeholder"
isPlural('synergies');     // true
```

**Conjugation:**

```typescript
import {
  getPastTense,
  getPastParticiple,
  getPresentParticiple,
  getThirdPersonSingular,
  conjugateBe,
  conjugateHave,
  conjugateDo,
  conjugate,
} from 'marlarky';

getPastTense('leverage');       // "leveraged"
getPastTense('go');             // "went"
getPastParticiple('take');      // "taken"
getPresentParticiple('run');    // "running"
getThirdPersonSingular('do');   // "does"
conjugateBe('past', 'singular', 3); // "was"
```

**Normalization:**

```typescript
import {
  capitalize,
  capitalizeSentences,
  ensureEndPunctuation,
  normalizeWhitespace,
  formatSentence,
  formatParagraph,
  formatTextBlock,
} from 'marlarky';

capitalize('hello');              // "Hello"
ensureEndPunctuation('hello');    // "hello."
normalizeWhitespace('a  b   c'); // "a b c"
```

### Transform System Exports

For building custom transform pipelines or integrations:

```typescript
import {
  // Tokenizer
  tokenize,              // string -> Token[]
  render,                // Token[] -> string
  classifyChar,          // char -> TokenType

  // Protection
  applyProtection,       // Mark tokens as protected
  isProtected,           // Check if a token is protected

  // Registry
  TransformRegistry,     // Transform storage class
  createDefaultRegistry, // Pre-loaded with all V1 transforms

  // Pipeline
  executePipeline,       // Run transforms on tokenized text
  checkPipelineOrder,    // Warn about suboptimal ordering

  // Config
  mergeOutputTransformsConfig,
  mergeProtectionConfig,
  DEFAULT_PROTECTION_CONFIG,
  DEFAULT_OUTPUT_TRANSFORMS_CONFIG,

  // V1 Transforms (individual)
  pigLatinTransform,
  ubbiDubbiTransform,
  leetTransform,
  uwuTransform,
  pirateTransform,
  redactTransform,
  emojiTransform,
  mockCaseTransform,
  reverseWordsTransform,
  bizJargonTransform,
  V1_TRANSFORMS,         // Array of all V1 transforms
} from 'marlarky';
```

---

## Examples

### Running the Included Examples

```bash
# Basic text generation (no lexicon)
npm run example:basic

# Corporate lexicon with archetypes
npm run example:corporate
```

### Generating Corporate Marlarky

```typescript
import { TextGenerator, SimpleFakerAdapter, loadLexiconFromString } from 'marlarky';
import { readFileSync } from 'fs';

const lexicon = loadLexiconFromString(
  readFileSync('examples/lexicons/corporate-min.json', 'utf-8')
);

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

generator.setArchetype('corporate');
generator.setSeed(2024);

console.log(generator.paragraph());
```

Or from the CLI:

```bash
marlarky paragraph --lexicon examples/lexicons/corporate-min.json --archetype corporate --seed 2024
```

### Deterministic Testing

```typescript
const generator = new TextGenerator({ fakerAdapter: new SimpleFakerAdapter() });

generator.setSeed(42);
const baseline = generator.sentence();

// Later, in a test:
generator.setSeed(42);
expect(generator.sentence()).toBe(baseline);
```

### Piping Transforms

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  enableTrace: true,
});

generator.setSeed(42);

const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [
      { id: 'leet' },
      { id: 'uwu' },
    ],
  },
});

console.log(result.text);
// "Gen3wawwy, th3 ch4n9e caww3d."

console.log(result.meta.transformsApplied);
// ["leet", "uwu"]
```

---

## Development

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Run tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Lint
npm run lint

# Run the CLI from source
npm run cli -- sentence --seed 42
```

---

## License

MIT
