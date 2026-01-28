---
title: Sentence Types
layout: default
parent: Guides
nav_order: 1
---

# Sentence Types

Marlarky generates six sentence structures. You can request a specific type or let the generator pick one based on weighted probabilities.

## simpleDeclarative

**Structure:** Subject + Verb + optional Object

The most common sentence type. A noun phrase followed by a verb phrase, optionally with a direct object.

```typescript
generator.sentence({ type: 'simpleDeclarative' });
// "The system processes data."
// "The robust strategy drives innovation."
```

```bash
marlarky sentence --type simpleDeclarative
```

## question

**Structure:** Do-support or WH-question

Generates yes/no questions using do-support ("Does the team deliver?") or WH-questions ("What does the system require?").

```typescript
generator.sentence({ type: 'question' });
// "Does the team deliver results?"
// "What does the pipeline require?"
```

```bash
marlarky sentence --type question
```

## compound

**Structure:** Clause + coordinating conjunction + Clause

Two independent clauses joined by a coordinating conjunction (and, but, or, yet, so).

```typescript
generator.sentence({ type: 'compound' });
// "The strategy evolved, and the metrics improved."
// "The team delivered results, but the pipeline stalled."
```

```bash
marlarky sentence --type compound
```

## subordinate

**Structure:** Dependent clause + Main clause (or Main clause + Dependent clause)

A subordinating conjunction (because, although, if, when, while, etc.) introduces a dependent clause that pairs with a main clause.

```typescript
generator.sentence({ type: 'subordinate' });
// "Because the pipeline scales, the throughput increases."
// "Although the metrics improved, the strategy remained unchanged."
```

```bash
marlarky sentence --type subordinate
```

## introAdverbial

**Structure:** Transition word/phrase + comma + Main clause

An adverbial transition (however, therefore, furthermore, generally, etc.) introduces the sentence.

```typescript
generator.sentence({ type: 'introAdverbial' });
// "Furthermore, the initiative drives innovation."
// "Generally, the change called."
```

```bash
marlarky sentence --type introAdverbial
```

## interjection

**Structure:** Interjection + comma + Main clause

An interjection (indeed, certainly, naturally, oh, well, etc.) opens the sentence.

```typescript
generator.sentence({ type: 'interjection' });
// "Indeed, the team delivered results."
// "Certainly, the strategy requires adjustment."
```

```bash
marlarky sentence --type interjection
```

## Controlling type distribution

By default, the generator picks sentence types based on these weights:

| Type | Default Weight |
|------|---------------|
| `simpleDeclarative` | 45 |
| `compound` | 15 |
| `introAdverbial` | 12 |
| `subordinate` | 15 |
| `interjection` | 3 |
| `question` | 10 |

Weights are relative -- they don't need to sum to 100. Override them in the [configuration](../configuration):

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  config: {
    sentenceTypeWeights: {
      simpleDeclarative: 60,  // Even more declarative
      compound: 20,
      introAdverbial: 5,
      subordinate: 10,
      interjection: 0,        // Never generate interjections
      question: 5,
    },
  },
});
```

### Rate configs

In addition to weights, several rate configs affect how often certain structures appear:

| Config | Default | Description |
|--------|---------|-------------|
| `questionRate` | `0.10` | Probability of generating a question |
| `compoundRate` | `0.15` | Probability of generating a compound sentence |
| `subordinateClauseRate` | `0.15` | Probability of adding a subordinate clause |
| `interjectionRate` | `0.03` | Probability of generating an interjection |
| `relativeClauseRate` | `0.10` | Probability of adding a relative clause |

### Archetype overrides

[Archetypes](../lexicons/archetypes) can override these rates per style preset. For example, the corporate archetype lowers `questionRate` to 0.01 and `interjectionRate` to 0.02, producing more formal, declarative text.
