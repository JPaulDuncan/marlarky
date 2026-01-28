---
title: Validation
layout: default
parent: Lexicons
nav_order: 3
---

# Lexicon Validation

Validate a lexicon before use to catch schema errors, missing references, and structural issues.

## Validating in code

```typescript
import { validateLexicon } from 'marlarky';

const result = validateLexicon(lexiconObject);

if (!result.valid) {
  console.error('Errors:');
  for (const err of result.errors) {
    console.error(`  ${err.path}: ${err.message}`);
  }
}

if (result.warnings.length > 0) {
  console.warn('Warnings:');
  for (const warn of result.warnings) {
    console.warn(`  ${warn.path}: ${warn.message}`);
  }
}
```

### LexiconValidationResult

```typescript
interface LexiconValidationResult {
  valid: boolean;
  errors: LexiconValidationError[];
  warnings: LexiconValidationError[];
}

interface LexiconValidationError {
  path: string;         // e.g. "termSets.noun.tech.terms[0]"
  message: string;
  severity: 'error' | 'warning';
}
```

A lexicon with errors is invalid (`valid: false`). A lexicon with only warnings is still valid.

## Validating from the CLI

Use the [`validate` command](../cli/validate):

```bash
# Human-readable output
marlarky validate ./my-lexicon.json

# Machine-readable JSON output
marlarky validate ./my-lexicon.json --json
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Valid lexicon (may have warnings) |
| `1` | Invalid lexicon or file error |

### Example output

```bash
marlarky validate ./my-lexicon.json --json
```

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "path": "termSets.noun.tech",
      "message": "No terms have weights assigned",
      "severity": "warning"
    }
  ]
}
```

## What gets validated

The validator checks:

- **Required fields** -- `id` and `language` must be present
- **Term set structure** -- Each term set needs a valid `pos` and non-empty `terms` array
- **Term values** -- Each term needs a non-empty `value` string
- **Weight values** -- Weights must be positive numbers
- **POS values** -- Must be one of: `noun`, `verb`, `adj`, `adv`, `prep`, `conj`, `intj`, `det`
- **Constraint references** -- Constraint IDs should be unique
- **Distribution keys** -- Referenced distributions should exist
- **Archetype references** -- Distribution names referenced by archetypes should exist
- **Pattern structure** -- Patterns need valid types and non-empty slots

## Loading with validation

The `loadLexiconFromString` function parses and validates in one step. For more control:

```typescript
import { loadLexiconFromString, tryLoadLexicon, validateLexicon } from 'marlarky';

// Throws on invalid JSON or schema errors
const lexicon = loadLexiconFromString(jsonString);

// Returns null instead of throwing
const lexicon = tryLoadLexicon(jsonString);

// Validate without loading -- get detailed errors/warnings
const result = validateLexicon(parsedObject);
```
