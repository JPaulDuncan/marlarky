---
title: Archetypes
layout: default
parent: Lexicons
nav_order: 2
---

# Archetypes

Archetypes are style presets defined within a lexicon. They combine tag activation, distribution overrides, and config adjustments into a named profile you can switch between at runtime.

## Structure

```json
{
  "archetypes": {
    "corporate": {
      "tags": ["register:formal", "domain:business"],
      "distributions": {
        "sentenceTypes": "sentenceTypes.corporate",
        "termSetBias": "termSetBias.domain:business"
      },
      "overrides": {
        "interjectionRate": 0.02,
        "subordinateClauseRate": 0.12,
        "questionRate": 0.01
      }
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `tags` | `string[]` | Tags to activate when this archetype is used |
| `distributions` | `Record<string, string>` | Named references to [distribution](schema-reference#distributions) tables |
| `overrides` | `Record<string, number>` | Config field overrides |
| `outputTransforms` | `ArchetypeOutputTransforms` | Transform pipeline overrides |

## How archetypes work

When you activate an archetype:

1. **Tags are activated** -- The archetype's tags bias word selection toward matching term sets. A tag like `"domain:business"` causes term sets tagged with `"domain:business"` to be preferred.

2. **Distributions are applied** -- Named distribution tables override the default sentence type weights and term set biases.

3. **Config overrides merge** -- Numeric config fields like rates and limits are adjusted.

4. **Transform pipelines change** -- If the archetype defines `outputTransforms`, those override the lexicon defaults.

## Activating an archetype

### In code

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  lexicon,
});

generator.setArchetype('corporate');
console.log(generator.paragraph());
```

### From the CLI

```bash
marlarky paragraph --lexicon ./corp.json --archetype corporate
```

## Override-able config fields

These fields can be overridden by an archetype's `overrides`:

| Field | Description |
|-------|-------------|
| `interjectionRate` | Rate of interjection sentences (0-1) |
| `subordinateClauseRate` | Rate of subordinate clauses (0-1) |
| `relativeClauseRate` | Rate of relative clauses (0-1) |
| `questionRate` | Rate of question sentences (0-1) |
| `compoundRate` | Rate of compound sentences (0-1) |
| `maxPPChain` | Max prepositional phrase chains |
| `avgSentenceLength` | Target average sentence length |

## Full example: corporate archetype

This example from the included corporate lexicon shows all the pieces working together:

```json
{
  "id": "lexicon.corporate.min",
  "language": "en",
  "termSets": {
    "noun.business": {
      "pos": "noun",
      "tags": ["domain:business", "register:formal"],
      "terms": [
        { "value": "strategy", "weight": 5 },
        { "value": "initiative", "weight": 4 },
        { "value": "stakeholder", "weight": 4 },
        { "value": "synergy", "weight": 3 }
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
  },
  "distributions": {
    "sentenceTypes.corporate": [
      { "key": "simpleDeclarative", "weight": 50 },
      { "key": "compound", "weight": 20 },
      { "key": "introAdverbial", "weight": 15 },
      { "key": "subordinate", "weight": 12 },
      { "key": "interjection", "weight": 2 },
      { "key": "question", "weight": 1 }
    ]
  },
  "archetypes": {
    "corporate": {
      "tags": ["register:formal", "domain:business"],
      "distributions": {
        "sentenceTypes": "sentenceTypes.corporate"
      },
      "overrides": {
        "interjectionRate": 0.02,
        "subordinateClauseRate": 0.12,
        "questionRate": 0.01
      }
    }
  }
}
```

The `corporate` archetype:
- Activates `register:formal` and `domain:business` tags, biasing word selection toward business term sets
- Uses the `sentenceTypes.corporate` distribution, which heavily favors declarative sentences (50%) and rarely asks questions (1%)
- Lowers interjection and question rates while slightly reducing subordinate clause frequency

## Per-archetype transforms

Archetypes can define their own transform pipelines that override the lexicon defaults:

```json
{
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

The merge order is: base config -> lexicon defaults -> archetype transforms -> per-call overrides. See [Output Transforms > Chaining & Configuration](../transforms/chaining-and-config) for details.
