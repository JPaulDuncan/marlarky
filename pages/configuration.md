---
title: Configuration
layout: default
nav_order: 8
---

# Configuration

Fine-tune generation behavior by passing a partial `GeneratorConfig` to the constructor. All fields are optional -- defaults are shown below.

## GeneratorConfig

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

### Field reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `minWordsPerSentence` | `number` | `5` | Minimum words per sentence |
| `maxWordsPerSentence` | `number` | `25` | Maximum words per sentence |
| `avgSentenceLength` | `number` | `12` | Target average sentence length |
| `minSentencesPerParagraph` | `number` | `2` | Minimum sentences per paragraph |
| `maxSentencesPerParagraph` | `number` | `7` | Maximum sentences per paragraph |
| `interjectionRate` | `number` | `0.03` | Rate of interjection sentences (0-1) |
| `subordinateClauseRate` | `number` | `0.15` | Rate of subordinate clauses (0-1) |
| `relativeClauseRate` | `number` | `0.10` | Rate of relative clauses (0-1) |
| `questionRate` | `number` | `0.10` | Rate of question sentences (0-1) |
| `compoundRate` | `number` | `0.15` | Rate of compound sentences (0-1) |
| `maxPPChain` | `number` | `2` | Max prepositional phrase chains |
| `maxAdjectivesPerNoun` | `number` | `2` | Max adjectives before a noun |
| `maxAdverbsPerVerb` | `number` | `1` | Max adverbs per verb phrase |
| `maxSentenceAttempts` | `number` | `25` | Max retries for a valid sentence |
| `maxPhraseAttempts` | `number` | `10` | Max retries for a valid phrase |
| `enableTrace` | `boolean` | `false` | Enable generation tracing |
| `strictMode` | `boolean` | `false` | Throw on constraint failure vs best-effort |

## Sentence type weights

Control the probability distribution of sentence types. Weights are relative -- they don't need to sum to 100.

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

| Type | Default Weight | Description |
|------|---------------|-------------|
| `simpleDeclarative` | `45` | Subject + verb + optional object |
| `compound` | `15` | Two clauses joined by a conjunction |
| `introAdverbial` | `12` | Transition word/phrase + main clause |
| `subordinate` | `15` | Dependent clause + main clause |
| `interjection` | `3` | Interjection + main clause |
| `question` | `10` | Yes/no or WH-question |

See [Guides > Sentence Types](guides/sentence-types) for detailed explanations of each type.

## Word lists

The config also includes built-in word lists used during generation:

| Field | Description |
|-------|-------------|
| `determiners` | Articles and determiners (the, a, an, this, some, ...) |
| `subjectPronouns` | I, you, he, she, it, we, they |
| `objectPronouns` | me, you, him, her, it, us, them |
| `possessiveDeterminers` | my, your, his, her, its, our, their |
| `modals` | can, could, may, might, must, shall, should, will, would |
| `subordinators` | after, although, because, before, if, since, unless, when, while, ... |
| `relatives` | who, whom, whose, which, that |
| `coordinators` | and, but, or, nor, for, yet, so |
| `transitions` | however, therefore, moreover, furthermore, meanwhile, ... |
| `interjections` | oh, ah, well, wow, hey, alas, indeed, ... |

You can override any of these arrays in the config to customize the vocabulary used for structural words.

## Archetype overrides

When a [lexicon archetype](lexicons/archetypes) is active, its `overrides` field merges into the config. This lets lexicons adjust generation behavior per style preset:

```json
{
  "archetypes": {
    "corporate": {
      "overrides": {
        "interjectionRate": 0.02,
        "subordinateClauseRate": 0.12,
        "questionRate": 0.01
      }
    }
  }
}
```

Override-able fields: `interjectionRate`, `subordinateClauseRate`, `relativeClauseRate`, `questionRate`, `compoundRate`, `maxPPChain`, `avgSentenceLength`.
