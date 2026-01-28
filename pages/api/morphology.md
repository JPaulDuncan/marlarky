---
title: Morphology Utilities
layout: default
parent: API Reference
nav_order: 3
---

# Morphology Utilities

Marlarky exports standalone English morphology functions. All functions work independently -- they don't require a generator instance.

## Articles

```typescript
import { useAn, getIndefiniteArticle, withIndefiniteArticle } from 'marlarky';

useAn('apple');                 // true
useAn('banana');                // false

getIndefiniteArticle('hour');   // "an"
getIndefiniteArticle('user');   // "a"

withIndefiniteArticle('apple'); // "an apple"
withIndefiniteArticle('user');  // "a user"
```

| Function | Description |
|----------|-------------|
| `useAn(word)` | Returns `true` if the word should use "an" |
| `getIndefiniteArticle(word)` | Returns `"a"` or `"an"` |
| `withIndefiniteArticle(word)` | Returns the word prefixed with the correct article |

## Pluralization

```typescript
import { pluralize, singularize, isPlural } from 'marlarky';

pluralize('strategy');     // "strategies"
pluralize('child');        // "children"
pluralize('analysis');     // "analyses"

singularize('stakeholders'); // "stakeholder"
singularize('children');     // "child"

isPlural('synergies');     // true
isPlural('synergy');       // false
```

| Function | Description |
|----------|-------------|
| `pluralize(word)` | Returns the plural form |
| `singularize(word)` | Returns the singular form |
| `isPlural(word)` | Returns `true` if the word appears to be plural |

Handles irregular plurals (child/children, analysis/analyses, person/people) and standard English rules (-s, -es, -ies, etc.).

## Conjugation

```typescript
import {
  getPastTense,
  getPastParticiple,
  getPresentParticiple,
  getThirdPersonSingular,
  conjugateBe,
  conjugateHave,
  conjugateDo,
  conjugate,
} from 'marlarky';

getPastTense('leverage');       // "leveraged"
getPastTense('go');             // "went"

getPastParticiple('take');      // "taken"

getPresentParticiple('run');    // "running"
getPresentParticiple('make');   // "making"

getThirdPersonSingular('do');   // "does"
getThirdPersonSingular('go');   // "goes"
```

| Function | Description |
|----------|-------------|
| `getPastTense(verb)` | Returns past tense form |
| `getPastParticiple(verb)` | Returns past participle form |
| `getPresentParticiple(verb)` | Returns present participle (-ing form) |
| `getThirdPersonSingular(verb)` | Returns third person singular form |
| `conjugateBe(tense, number, person)` | Conjugates "be" (am/is/are/was/were) |
| `conjugateHave(tense, number, person)` | Conjugates "have" (have/has/had) |
| `conjugateDo(tense, number, person)` | Conjugates "do" (do/does/did) |
| `conjugate(verb, tense, number, person)` | General conjugation function |

Handles irregular verbs (go/went/gone, take/took/taken, be/was/been, etc.) and standard English rules (-ed, -ing, doubling consonants, dropping silent -e).

### conjugateBe examples

```typescript
conjugateBe('present', 'singular', 1); // "am"
conjugateBe('present', 'singular', 3); // "is"
conjugateBe('present', 'plural', 3);   // "are"
conjugateBe('past', 'singular', 3);    // "was"
conjugateBe('past', 'plural', 3);      // "were"
```

## Normalization

```typescript
import {
  capitalize,
  capitalizeSentences,
  ensureEndPunctuation,
  normalizeWhitespace,
  formatSentence,
  formatParagraph,
  formatTextBlock,
} from 'marlarky';

capitalize('hello');              // "Hello"
ensureEndPunctuation('hello');    // "hello."
normalizeWhitespace('a  b   c'); // "a b c"
```

| Function | Description |
|----------|-------------|
| `capitalize(text)` | Capitalizes the first letter |
| `capitalizeSentences(text)` | Capitalizes the first letter of each sentence |
| `ensureEndPunctuation(text)` | Adds a period if no end punctuation exists |
| `normalizeWhitespace(text)` | Collapses multiple spaces to single spaces |
| `formatSentence(text)` | Applies capitalize + end punctuation + whitespace |
| `formatParagraph(text)` | Formats all sentences in a paragraph |
| `formatTextBlock(text)` | Formats all paragraphs in a text block |
