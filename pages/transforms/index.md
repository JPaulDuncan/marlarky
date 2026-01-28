---
title: Output Transforms
layout: default
nav_order: 6
has_children: true
---

# Output Transforms

The output transform system modifies generated text after sentence construction. Text is tokenized into words, punctuation, and whitespace. Protected tokens (acronyms, numbers, URLs) are marked, then each transform in the pipeline processes the token stream in order.

## How it works

1. **Tokenize** -- The generated text is split into typed tokens (word, punctuation, whitespace)
2. **Protect** -- Certain tokens are marked as protected (acronyms, numbers, code tokens, URLs)
3. **Transform** -- Each transform in the pipeline processes the token stream sequentially
4. **Render** -- Tokens are joined back into a string

## Available transforms

| ID | Description |
|----|-------------|
| `pigLatin` | Classic Pig Latin: consonant clusters move to end + "ay" |
| `ubbiDubbi` | Ubbi Dubbi language game: inserts "ub" before each vowel sound |
| `leet` | Leetspeak: substitutes characters (a->4, e->3, o->0, etc.) |
| `uwu` | Cute speak: r/l -> w substitution, nya insertion, cute suffixes |
| `pirate` | Pirate speak: word and phrase substitutions |
| `redact` | Redaction: masks words with bracketed blocks |
| `emoji` | Emoji: replaces words with emoji equivalents |
| `mockCase` | Mock case: rAnDoM CaSe aLtErNaTiOn |
| `reverseWords` | Reverse: reverses word order within sentences |
| `bizJargon` | Business jargon: applies business-speak patterns |

See [Built-in Transforms](built-in-transforms) for detailed descriptions and examples.

## Quick example

### In code

```typescript
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'pigLatin' }],
  },
});
```

### From the CLI

```bash
marlarky sentence --seed 42 --transform pigLatin
# "Enerallygay, ethay angechay alledcay."
```

All transforms are deterministic (same seed = same output) and safe to chain. See [Chaining & Configuration](chaining-and-config) for pipeline ordering and protection rules.
