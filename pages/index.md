---
title: Home
layout: home
nav_order: 1
---

# Marlarky

**Generate syntactically plausible English nonsense, steered by lexicons.**
{: .fs-6 .fw-300 }

Marlarky is a faker-like library and CLI that produces grammatically correct English text that sounds meaningful but isn't. Perfect for placeholder text, testing, creative writing prompts, procedural content generation, and corporate buzzword bingo.
{: .fs-5 .fw-300 }

[Get Started](getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/wonder/marlarky){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Features

- **Syntactically correct** -- Proper grammar, subject-verb agreement, punctuation
- **Lexicon-driven** -- Guide output with custom vocabularies and style presets
- **Deterministic** -- Seedable RNG for reproducible output
- **Configurable** -- Control sentence types, lengths, complexity
- **Output transforms** -- Pipe text through built-in transforms (Pig Latin, leet speak, pirate, and more)
- **Traceable** -- Debug mode shows exactly how text was generated
- **Full CLI** -- Generate text, apply transforms, and validate lexicons from the command line
- **Zero dependencies** -- Works standalone or with @faker-js/faker

## Quick taste

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

generator.setSeed(42);
console.log(generator.sentence());
// "Generally, the change called."
```

```bash
marlarky sentence --seed 42
# "Generally, the change called."
```

## Explore the docs

| Section | What you'll find |
|---------|-----------------|
| [Getting Started](getting-started) | Installation, first generator, CLI quick start |
| [CLI Reference](cli/) | All commands, options, and examples |
| [API Reference](api/) | TextGenerator class, options, types, morphology utilities |
| [Lexicons](lexicons/) | Custom vocabularies, schema reference, archetypes |
| [Output Transforms](transforms/) | 10 built-in transforms, chaining, custom transforms |
| [Guides](guides/) | Sentence types, determinism, tracing, faker integration |
| [Configuration](configuration) | GeneratorConfig defaults and tuning |
