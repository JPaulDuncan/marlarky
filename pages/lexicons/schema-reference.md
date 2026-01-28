---
title: Schema Reference
layout: default
parent: Lexicons
nav_order: 1
---

# Lexicon Schema Reference

Complete reference for the lexicon JSON schema.

## Root structure

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

Only `id` and `language` are required. All other fields are optional.

---

## Term sets

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

### Supported POS values

`noun`, `verb`, `adj`, `adv`, `prep`, `conj`, `intj`, `det`

### Term features

Each term can carry `features` for morphology and constraint evaluation:

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

Available features:

| Feature | Type | Description |
|---------|------|-------------|
| `countable` | `boolean` | Whether the noun is countable |
| `number` | `'singular' \| 'plural' \| 'both'` | Grammatical number |
| `person` | `1 \| 2 \| 3` | Grammatical person |
| `transitive` | `boolean` | Whether the verb is transitive |
| `irregular.plural` | `string` | Irregular plural form |
| `irregular.pastTense` | `string` | Irregular past tense |
| `irregular.pastParticiple` | `string` | Irregular past participle |
| `irregular.presentParticiple` | `string` | Irregular present participle |
| `irregular.thirdPerson` | `string` | Irregular third person singular |

---

## Patterns

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

### Pattern types

`sentence`, `nounPhrase`, `verbPhrase`, `prepPhrase`, `adjPhrase`, `advPhrase`, `clause`

### Pattern fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Pattern type (see above) |
| `slots` | `string[]` | Structural slots defining the template |
| `constraints` | `string[]` | Constraint IDs to apply |
| `weight` | `number` | Selection weight (default 1) |
| `tags` | `string[]` | Tags for categorization |

---

## Distributions

Named weight tables that bias choices. Referenced by [archetypes](archetypes).

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

Each entry is a `{ key, weight }` pair. Weights are relative.

---

## Correlations

Conditional weight adjustments triggered by generation events. When a term from a specific set is chosen, other sets can be boosted or suppressed.

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

### Condition types

| Field | Description |
|-------|-------------|
| `chosenTermSet` | A term from this set was selected |
| `chosenTag` | A term with this tag was selected |
| `chosenValue` | A specific word was selected |
| `usedPattern` | A specific pattern was used |

### Boost targets

| Field | Description |
|-------|-------------|
| `termSet` | Term set ID to boost |
| `pattern` | Pattern ID to boost |
| `weightDelta` | Weight adjustment (positive to boost, negative to suppress) |

### Scopes

`token`, `phrase`, `sentence`, `paragraph`

---

## Constraints

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

### Constraint types

| Type | Description |
|------|-------------|
| `noRepeat` | No repeated values for the target |
| `maxCount` | Maximum occurrences (requires `value`) |
| `minCount` | Minimum occurrences (requires `value`) |
| `required` | Target must appear |
| `forbidden` | Target must not appear |
| `custom` | Custom function (requires `customFn`) |

### Levels

| Level | Behavior |
|-------|----------|
| `hard` | Causes retry on violation |
| `soft` | Produces warning, generation continues |

### Scopes

`token`, `phrase`, `clause`, `sentence`, `paragraph`, `text`

---

## Invariants

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

### Invariant types

| Type | Description |
|------|-------------|
| `capitalization` | First letter is capitalized |
| `punctuation` | Proper end punctuation |
| `whitespace` | No double spaces or trailing whitespace |
| `agreement` | Subject-verb agreement |
| `custom` | Custom function (requires `customFn`) |

---

## Relations

Graph connections between terms for co-occurrence modeling.

```json
{
  "relations": [
    { "from": "strategy", "type": "hasPart", "to": "initiative", "weight": 3 },
    { "from": "meeting", "type": "produces", "to": "deliverable", "weight": 2 },
    { "from": "synergy", "type": "enables", "to": "leverage", "weight": 2 }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `from` | `string` | Source term |
| `type` | `string` | Relation type (any string) |
| `to` | `string` | Target term |
| `weight` | `number` | Relation weight for sampling (optional) |

---

## Lexicon-level transforms

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

See [Output Transforms > Chaining & Configuration](../transforms/chaining-and-config) for full merge details.
