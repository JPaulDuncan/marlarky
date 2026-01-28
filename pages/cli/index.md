---
title: CLI Reference
layout: default
nav_order: 3
has_children: true
---

# CLI Reference

The `marlarky` CLI is available after installation. If installed locally, use `npx marlarky` or `npm run cli -- <args>`.

```bash
marlarky <command> [options]
```

## Commands

| Command | Description |
|---------|-------------|
| [`sentence`](sentence) | Generate one or more sentences |
| [`paragraph`](paragraph) | Generate one or more paragraphs |
| [`text`](text) | Generate a text block (multiple paragraphs) |
| [`validate`](validate) | Validate a lexicon JSON file |
| [`list`](list) | List available transforms or sentence types |

## Global options

These options work with `sentence`, `paragraph`, and `text`:

| Option | Short | Description |
|--------|-------|-------------|
| `--seed <n>` | `-s` | RNG seed for deterministic output |
| `--lexicon <path>` | `-l` | Path to a lexicon JSON file |
| `--archetype <name>` | `-a` | Archetype to activate from the lexicon |
| `--transform <id>` | `-x` | Apply an output transform (repeatable, comma-separated) |
| `--trace` | `-t` | Output JSON trace to stderr |
| `--json` | `-j` | Output full result as JSON to stdout |
| `--count <n>` | `-n` | Number of items to generate (default: 1) |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
