---
title: Chaining & Configuration
layout: default
parent: Output Transforms
nav_order: 2
---

# Chaining & Configuration

Advanced configuration for the output transform pipeline.

## Pipeline ordering

Transforms execute sequentially. The output tokens of one transform become the input to the next. Each transform gets its own seeded RNG fork, so results are deterministic regardless of pipeline length.

Every transform has a `preferredOrder` value (lower = earlier). View these with:

```bash
marlarky list transforms
```

### Auto-ordering

Set `autoOrder: true` in the config to sort the pipeline by preferred order automatically:

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

Without `autoOrder`, transforms execute in the order you specify.

### CLI ordering

From the CLI, transforms execute in the order given:

```bash
# pirate runs first, then mockCase
marlarky sentence --seed 42 --transform pirate,mockCase

# Same with repeated flags
marlarky sentence --seed 42 -x pirate -x mockCase
```

## Transform protection

The protection system prevents transforms from modifying certain tokens. This ensures things like acronyms, numbers, and URLs survive transformations intact.

### Protection rules

| Rule | Default | Description |
|------|---------|-------------|
| `keepAcronyms` | `true` | ALL-CAPS words are skipped |
| `keepNumbers` | `true` | Number tokens are skipped |
| `keepCodeTokens` | `true` | Code-like tokens (camelCase, etc.) are skipped |
| `keepUrlsEmails` | `true` | URL and email tokens are skipped |
| `minWordLength` | `2` | Words shorter than this are skipped |
| `customProtectedRegex` | `[]` | Additional regex patterns to protect |

### Overriding protection

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'leet' }],
    protection: {
      keepAcronyms: true,
      keepNumbers: true,
      minWordLength: 3,       // skip 1-2 letter words
      customProtectedRegex: [
        '/^Dr\\.$/i',         // protect "Dr."
      ],
    },
  },
});
```

## Config merge order

Transform configuration can come from multiple sources. They merge in this order (later overrides earlier):

1. **Base config** -- from `GeneratorConfig.outputTransforms`
2. **Lexicon defaults** -- from `lexicon.outputTransforms.defaults`
3. **Archetype transforms** -- from `lexicon.archetypes[name].outputTransforms.pipeline`
4. **Per-call overrides** -- from `opts.outputTransforms`

### Merge modes

The `mergeMode` option on generation methods controls how per-call pipelines combine with the base:

| Mode | Behavior |
|------|----------|
| `'replace'` | Per-call pipeline replaces the base pipeline entirely |
| `'append'` | Per-call pipeline steps are appended after the base pipeline |

```typescript
// Replace the base pipeline
generator.sentence({
  outputTransforms: { enabled: true, pipeline: [{ id: 'leet' }] },
  mergeMode: 'replace',
});

// Append to the base pipeline
generator.sentence({
  outputTransforms: { enabled: true, pipeline: [{ id: 'uwu' }] },
  mergeMode: 'append',
});
```

## Transform system exports

For building custom pipelines or integrations, Marlarky exports the full transform infrastructure:

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

  // Config utilities
  mergeOutputTransformsConfig,
  mergeProtectionConfig,
  DEFAULT_PROTECTION_CONFIG,
  DEFAULT_OUTPUT_TRANSFORMS_CONFIG,

  // Individual transforms
  V1_TRANSFORMS,         // Array of all V1 transforms
} from 'marlarky';
```

See [Custom Transforms](custom-transforms) for how to build and register your own transforms.
