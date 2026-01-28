---
title: validate
layout: default
parent: CLI Reference
nav_order: 4
---

# validate command

Validate a lexicon JSON file against the expected schema.

```bash
marlarky validate <file.json> [options]
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--json` | | Output validation result as JSON |
| `--help` | `-h` | Show help |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Valid lexicon (may have warnings) |
| `1` | Invalid lexicon or file error |

## Examples

### Human-readable output

```bash
marlarky validate ./my-lexicon.json
```

Output:

```
Lexicon is valid.
Warnings:
  - termSets.noun.tech: No terms have weights assigned
```

### JSON output

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

## See also

- [Lexicons > Validation](../lexicons/validation) for validating lexicons programmatically
- [Lexicons > Schema Reference](../lexicons/schema-reference) for the full lexicon schema
