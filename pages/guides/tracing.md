---
title: Tracing
layout: default
parent: Guides
nav_order: 3
---

# Tracing

Tracing reveals how text was generated: which sentence templates were selected, where each word came from, which constraints were evaluated, and how transforms modified the output.

## Enabling tracing in code

Set `enableTrace: true` in the constructor. When enabled, generation methods return a `GeneratedText` object instead of a plain string.

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
```

## Inspecting the trace

### Sentence-level trace

```typescript
const sentenceTrace = result.trace.paragraphs[0].sentences[0];

console.log(sentenceTrace.template);
// "simpleDeclarative" | "compound" | "introAdverbial" | etc.

console.log(sentenceTrace.tokens);
// [{ value: "The", source: "default" }, { value: "robust", source: "adj.business", pos: "adj" }, ...]

console.log(sentenceTrace.retryCount);
// Number of generation retries needed
```

### Constraint results

```typescript
console.log(sentenceTrace.constraintsEvaluated);
// [{ id: "c.minWords", passed: true }, { id: "c.maxWords", passed: true }]
```

### Invariant results

```typescript
console.log(result.trace.invariantsChecked);
// [{ id: "inv.capitalized", passed: true }, { id: "inv.endsWithPunct", passed: true }]
```

### Transform traces

When transforms are active, the trace includes token-level and event-level data:

```typescript
console.log(result.trace.outputTokens);
// Per-token original vs. transformed values

console.log(result.trace.transformEvents);
// Per-step statistics

console.log(result.meta.transformsApplied);
// ["pigLatin", "leet"]
```

## Tracing from the CLI

### --trace flag

Sends trace JSON to stderr while text goes to stdout. This lets you pipe text output while still capturing trace data.

```bash
# Text on stdout, trace on stderr
marlarky sentence --seed 42 --trace

# Capture trace to a file
marlarky sentence --seed 42 --trace 2> trace.json
```

### --json flag

Outputs the entire `GeneratedText` object (text + trace + meta) as JSON on stdout.

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

## Trace structure reference

| Field | Description |
|-------|-------------|
| `trace.paragraphs` | Array of paragraph traces |
| `trace.paragraphs[].sentences` | Array of sentence traces per paragraph |
| `trace.paragraphs[].sentences[].text` | The sentence text |
| `trace.paragraphs[].sentences[].template` | Sentence type used |
| `trace.paragraphs[].sentences[].tokens` | Token sources (lexicon term set or "default") |
| `trace.paragraphs[].sentences[].constraintsEvaluated` | Constraint pass/fail results |
| `trace.paragraphs[].sentences[].retryCount` | How many retries were needed |
| `trace.correlationsApplied` | Correlations triggered during generation |
| `trace.invariantsChecked` | Invariant pass/fail results |
| `trace.outputTokens` | Per-token original vs. transformed values (when transforms active) |
| `trace.transformEvents` | Per-step transform statistics (when transforms active) |
| `meta.archetype` | Active archetype name |
| `meta.seed` | Seed used for generation |
| `meta.lexiconId` | Lexicon ID (if loaded) |
| `meta.lexiconVersion` | Lexicon version (if loaded) |
| `meta.transformsApplied` | IDs of transforms that ran (when transforms active) |

## Token trace fields

Each token in `trace.paragraphs[].sentences[].tokens` has:

| Field | Description |
|-------|-------------|
| `value` | The word or punctuation text |
| `source` | Where it came from: a term set ID (e.g. `"noun.business"`) or `"default"` |
| `pos` | Part of speech, if applicable |
| `correlationsApplied` | Any correlations triggered by this token |
| `retryCount` | How many retries were needed for this token |
