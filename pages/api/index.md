---
title: API Reference
layout: default
nav_order: 4
has_children: true
---

# API Reference

Marlarky exports everything you need from the main package entry point:

```typescript
import {
  // Core
  TextGenerator,

  // Adapters
  SimpleFakerAdapter,
  FakerJsAdapter,

  // Lexicon utilities
  loadLexiconFromString,
  loadLexiconFromObject,
  tryLoadLexicon,
  validateLexicon,
  LexiconStore,

  // RNG
  SeedableRng,

  // Morphology
  pluralize,
  singularize,
  getPastTense,
  getPresentParticiple,
  getThirdPersonSingular,
  getIndefiniteArticle,

  // Transform system
  TransformRegistry,
  createDefaultRegistry,
  tokenize,
  render,
  executePipeline,
} from 'marlarky';
```

## Summary

| Export | Description |
|--------|-------------|
| [`TextGenerator`](text-generator) | Core class for generating text |
| `SimpleFakerAdapter` | Built-in word provider (zero dependencies) |
| `FakerJsAdapter` | Adapter for @faker-js/faker (more word variety) |
| `loadLexiconFromString` | Parse a JSON string into a Lexicon |
| `loadLexiconFromObject` | Validate and cast an object to a Lexicon |
| `tryLoadLexicon` | Parse with error handling (returns null on failure) |
| `validateLexicon` | Validate a lexicon and get errors/warnings |
| `LexiconStore` | Query and sample from a loaded lexicon |
| `SeedableRng` | Deterministic random number generator |
| [Morphology utilities](morphology) | Standalone English morphology functions |
| [Transform system](../transforms/) | Tokenizer, pipeline, registry, and 10 built-in transforms |

See the child pages for full details on each area.
