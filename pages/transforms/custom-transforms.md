---
title: Custom Transforms
layout: default
parent: Output Transforms
nav_order: 3
---

# Custom Transforms

Build your own output transforms by implementing the `IOutputTransform` interface and registering them with the transform registry.

## IOutputTransform interface

```typescript
interface IOutputTransform {
  id: string;
  version: string;
  capabilities: TransformCapabilities;
  validateParams(params: unknown): ValidationResult;
  apply(input: TransformInput): TransformOutput;
}
```

### TransformCapabilities

```typescript
interface TransformCapabilities {
  requiresTrace: boolean;    // Does this transform need trace data?
  posAware: boolean;         // Does it use part-of-speech info?
  deterministic: boolean;    // Same input = same output?
  safeToStack: boolean;      // Can it run after other transforms?
  preferredOrder: number;    // Pipeline ordering hint (lower = earlier)
}
```

### TransformInput

```typescript
interface TransformInput {
  tokens: Token[];           // The token stream to transform
  rng: IRng;                 // Seeded RNG for deterministic randomness
  params?: unknown;          // Optional per-step parameters
  trace?: GenerationTrace;   // Trace data (if requiresTrace is true)
}
```

### TransformOutput

```typescript
interface TransformOutput {
  tokens: Token[];           // The transformed token stream
}
```

### Token

```typescript
interface Token {
  value: string;             // The text content
  type: TokenType;           // 'word' | 'punctuation' | 'whitespace'
  meta?: {
    protected?: boolean;     // If true, transforms should skip this token
    pos?: string;            // Part of speech (if available)
    [key: string]: unknown;  // Additional metadata
  };
}
```

## Complete example

Here's a custom transform that converts all unprotected words to uppercase:

```typescript
import {
  TransformRegistry,
  createDefaultRegistry,
  SimpleFakerAdapter,
  TextGenerator,
} from 'marlarky';
import type {
  IOutputTransform,
  TransformInput,
  TransformOutput,
  ValidationResult,
} from 'marlarky';

const shoutTransform: IOutputTransform = {
  id: 'shout',
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
      // Only transform unprotected words
      if (token.type === 'word' && !token.meta?.protected) {
        return { ...token, value: token.value.toUpperCase() };
      }
      return token;
    });
    return { tokens };
  },
};
```

## Registering a custom transform

Access the transform registry from a generator instance and register your transform:

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

// Register the custom transform
generator.getTransformRegistry().register(shoutTransform);

// Use it
const result = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'shout' }],
  },
});
```

## TransformRegistry API

| Method | Description |
|--------|-------------|
| `register(transform)` | Register a new transform |
| `has(id)` | Check if a transform is registered |
| `get(id)` | Get a transform by ID |
| `list()` | List all registered transform IDs |

### Using createDefaultRegistry

For standalone use (outside a generator), create a pre-loaded registry:

```typescript
import { createDefaultRegistry } from 'marlarky';

const registry = createDefaultRegistry();
registry.register(shoutTransform);

// All 11 transforms now available (10 built-in + shout)
console.log(registry.list());
```

## Tips for custom transforms

- **Check `token.meta?.protected`** -- Always skip protected tokens unless your transform specifically needs to modify them.

- **Use the provided RNG** -- If your transform involves randomness, use `input.rng` instead of `Math.random()` to ensure deterministic output.

- **Set `deterministic: true`** only if the same input always produces the same output (which it will if you use the provided RNG).

- **Set `safeToStack: false`** if your transform's output might confuse other transforms (e.g., if it inserts special characters that look like punctuation).

- **Choose `preferredOrder` carefully** -- Lower values run earlier. Character-level transforms (leet, mockCase) should typically run after word-level transforms (pirate, bizJargon).

- **Use `posAware: true`** and `requiresTrace: true` if your transform needs linguistic context, but be aware this couples it to the tracing system.
