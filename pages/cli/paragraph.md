---
title: paragraph
layout: default
parent: CLI Reference
nav_order: 2
---

# paragraph command

Generate one or more paragraphs.

```bash
marlarky paragraph [options]
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--sentences <n>` | | Exact number of sentences per paragraph |
| `--min-sentences <n>` | | Minimum sentences per paragraph |
| `--max-sentences <n>` | | Maximum sentences per paragraph |
| `--hints <tags>` | | Comma-separated hint tags |
| `--seed <n>` | `-s` | RNG seed for deterministic output |
| `--lexicon <path>` | `-l` | Path to a lexicon JSON file |
| `--archetype <name>` | `-a` | Archetype to activate |
| `--transform <id>` | `-x` | Output transform (repeatable, comma-separated) |
| `--trace` | `-t` | Output JSON trace to stderr |
| `--json` | `-j` | Output full result as JSON to stdout |
| `--count <n>` | `-n` | Number of paragraphs (default: 1) |

## Examples

### Basic generation

```bash
# Random paragraph (2-7 sentences by default)
marlarky paragraph

# Exact sentence count
marlarky paragraph --sentences 5

# Sentence count range
marlarky paragraph --min-sentences 3 --max-sentences 8
```

### Multiple paragraphs

```bash
marlarky paragraph --count 3
```

### With a lexicon

```bash
marlarky paragraph --lexicon ./corp.json --archetype corporate --seed 42
```

### With transforms

```bash
marlarky paragraph --transform pirate --json
```
