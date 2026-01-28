---
title: sentence
layout: default
parent: CLI Reference
nav_order: 1
---

# sentence command

Generate one or more sentences.

```bash
marlarky sentence [options]
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--type <type>` | | Sentence type (see below) |
| `--hints <tags>` | | Comma-separated hint tags |
| `--min-words <n>` | | Minimum word count per sentence |
| `--max-words <n>` | | Maximum word count per sentence |
| `--seed <n>` | `-s` | RNG seed for deterministic output |
| `--lexicon <path>` | `-l` | Path to a lexicon JSON file |
| `--archetype <name>` | `-a` | Archetype to activate |
| `--transform <id>` | `-x` | Output transform (repeatable, comma-separated) |
| `--trace` | `-t` | Output JSON trace to stderr |
| `--json` | `-j` | Output full result as JSON to stdout |
| `--count <n>` | `-n` | Number of sentences (default: 1) |

## Sentence types

Valid values for `--type`:

| Type | Description |
|------|-------------|
| `simpleDeclarative` | Subject + verb + optional object |
| `compound` | Two clauses joined by a conjunction |
| `introAdverbial` | Transition word/phrase + main clause |
| `subordinate` | Dependent clause + main clause |
| `interjection` | Interjection + main clause |
| `question` | Yes/no or WH-question |

See [Guides > Sentence Types](../guides/sentence-types) for detailed explanations of each.

## Examples

### Basic generation

```bash
# Random sentence
marlarky sentence

# Multiple sentences
marlarky sentence --count 5
```

### Specific sentence type

```bash
marlarky sentence --type question
marlarky sentence --type compound
marlarky sentence --type subordinate
```

### Deterministic output

```bash
# Same seed = same sentence every time
marlarky sentence --seed 42
```

### Word count control

```bash
# Short sentences
marlarky sentence --min-words 5 --max-words 8

# Longer sentences
marlarky sentence --count 10 --min-words 10 --max-words 20
```

### With a lexicon

```bash
marlarky sentence --lexicon ./corp.json --archetype corporate
marlarky sentence --lexicon ./corp.json --archetype corporate --hints domain:business
```

### With transforms

```bash
# Pig Latin
marlarky sentence --seed 42 --transform pigLatin
# "Enerallygay, ethay angechay alledcay."

# Leet speak
marlarky sentence --seed 42 --transform leet

# Chain multiple transforms
marlarky sentence --seed 42 --transform leet,uwu

# Repeated flags
marlarky sentence --seed 42 -x pirate -x mockCase
```

### JSON output

```bash
marlarky sentence --seed 42 --json
```

```json
{
  "text": "Generally, the change called.",
  "trace": { "..." : "..." },
  "meta": {
    "archetype": "default",
    "seed": 42
  }
}
```
