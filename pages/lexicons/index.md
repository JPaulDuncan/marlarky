---
title: Lexicons
layout: default
nav_order: 5
has_children: true
---

# Lexicons

A lexicon is a JSON file that steers text generation toward specific vocabularies and styles. Without a lexicon, Marlarky uses a general-purpose English vocabulary. With one, you control exactly which words appear and how they're weighted.

## Why use a lexicon?

- **Domain-specific text** -- Generate corporate, medical, legal, or technical nonsense
- **Style control** -- Adjust sentence type distributions and complexity per domain
- **Weighted vocabulary** -- Favor certain words over others
- **Correlated choices** -- When a business noun is picked, boost business verbs
- **Quality constraints** -- Prevent word repetition, limit phrase complexity

## Minimal example

A lexicon needs only an `id`, `language`, and at least one `termSet`:

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

## Loading a lexicon in code

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

## Loading a lexicon from the CLI

```bash
marlarky paragraph --lexicon ./startup.json --archetype startup
```

## What's in a lexicon?

A lexicon can contain any of these sections (all optional except `id` and `language`):

| Section | Purpose |
|---------|---------|
| [`termSets`](schema-reference#term-sets) | Named pools of words grouped by part of speech |
| [`patterns`](schema-reference#patterns) | Syntactic templates for phrases/sentences |
| [`distributions`](schema-reference#distributions) | Named weight tables that bias choices |
| [`correlations`](schema-reference#correlations) | Conditional boosts triggered by word choices |
| [`constraints`](schema-reference#constraints) | Hard/soft rules restricting generation |
| [`invariants`](schema-reference#invariants) | Conditions that must always hold true |
| [`archetypes`](archetypes) | Style presets combining tags, distributions, overrides |
| [`relations`](schema-reference#relations) | Graph connections between terms |
| [`outputTransforms`](schema-reference#lexicon-level-transforms) | Default transform pipelines |

See the [Schema Reference](schema-reference) for full documentation of each section.
