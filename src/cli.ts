#!/usr/bin/env node

/**
 * marlarky CLI
 * Command-line interface for the marlarky text generator
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TextGenerator,
  SimpleFakerAdapter,
  loadLexiconFromString,
  validateLexicon,
  createDefaultRegistry,
} from './index.js';

import type { GeneratedText, SentenceOptions, ParagraphOptions, TextBlockOptions } from './types/api.js';
import type { Lexicon } from './types/lexicon.js';
import type { SentenceType } from './grammar/index.js';
import type { OutputTransformsConfig, TransformStep } from './transforms/types.js';

// ---------- Node 18 ESM __dirname polyfill ----------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------- Version ----------

function getVersion(): string {
  try {
    const pkgPath = resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

// ---------- Help text ----------

const MAIN_HELP = `
marlarky - Generate syntactically plausible English text

Usage:
  marlarky <command> [options]

Commands:
  sentence    Generate one or more sentences
  paragraph   Generate one or more paragraphs
  text        Generate a text block (multiple paragraphs)
  validate    Validate a lexicon JSON file
  list        List available transforms or sentence types

Global Options:
  -s, --seed <n>          RNG seed for deterministic output
  -l, --lexicon <path>    Path to a lexicon JSON file
  -a, --archetype <name>  Archetype to activate from the lexicon
  -x, --transform <id>    Apply an output transform (repeatable, comma-separated)
  -t, --trace             Output JSON trace to stderr
  -j, --json              Output full result as JSON to stdout
  -n, --count <n>         Number of units to generate (default: 1)
  -h, --help              Show help
  -v, --version           Show version

Examples:
  marlarky sentence
  marlarky sentence --seed 42 --type question
  marlarky paragraph --sentences 5 --lexicon ./corp.json
  marlarky text --paragraphs 3 --archetype corporate
  marlarky sentence --transform pigLatin
  marlarky sentence --transform leet,uwu --json
  marlarky validate ./my-lexicon.json
  marlarky list transforms
`.trimStart();

const SENTENCE_HELP = `
marlarky sentence - Generate one or more sentences

Usage:
  marlarky sentence [options]

Options:
  --type <type>           Sentence type: simpleDeclarative, compound,
                          introAdverbial, subordinate, interjection, question
  --hints <tags>          Comma-separated hint tags (e.g. domain:tech,register:formal)
  --min-words <n>         Minimum word count per sentence
  --max-words <n>         Maximum word count per sentence
  -x, --transform <id>   Apply an output transform (repeatable, comma-separated)
  -s, --seed <n>          RNG seed for deterministic output
  -l, --lexicon <path>    Path to a lexicon JSON file
  -a, --archetype <name>  Archetype to activate from the lexicon
  -t, --trace             Output JSON trace to stderr
  -j, --json              Output full result as JSON to stdout
  -n, --count <n>         Number of sentences to generate (default: 1)
  -h, --help              Show this help

Examples:
  marlarky sentence
  marlarky sentence --seed 42 --type question
  marlarky sentence --count 5 --lexicon ./corp.json --archetype corporate
  marlarky sentence --transform pigLatin --seed 42
  marlarky sentence --min-words 10 --max-words 20
`.trimStart();

const PARAGRAPH_HELP = `
marlarky paragraph - Generate one or more paragraphs

Usage:
  marlarky paragraph [options]

Options:
  --sentences <n>         Exact number of sentences per paragraph
  --min-sentences <n>     Minimum sentences per paragraph
  --max-sentences <n>     Maximum sentences per paragraph
  --hints <tags>          Comma-separated hint tags
  -x, --transform <id>   Apply an output transform (repeatable, comma-separated)
  -s, --seed <n>          RNG seed for deterministic output
  -l, --lexicon <path>    Path to a lexicon JSON file
  -a, --archetype <name>  Archetype to activate from the lexicon
  -t, --trace             Output JSON trace to stderr
  -j, --json              Output full result as JSON to stdout
  -n, --count <n>         Number of paragraphs to generate (default: 1)
  -h, --help              Show this help

Examples:
  marlarky paragraph --sentences 5 --seed 42
  marlarky paragraph --count 3 --lexicon ./corp.json
  marlarky paragraph --transform pirate
`.trimStart();

const TEXT_HELP = `
marlarky text - Generate a text block (multiple paragraphs)

Usage:
  marlarky text [options]

Options:
  --paragraphs <n>        Exact number of paragraphs
  --min-paragraphs <n>    Minimum paragraphs
  --max-paragraphs <n>    Maximum paragraphs
  --hints <tags>          Comma-separated hint tags
  -x, --transform <id>   Apply an output transform (repeatable, comma-separated)
  -s, --seed <n>          RNG seed for deterministic output
  -l, --lexicon <path>    Path to a lexicon JSON file
  -a, --archetype <name>  Archetype to activate from the lexicon
  -t, --trace             Output JSON trace to stderr
  -j, --json              Output full result as JSON to stdout
  -n, --count <n>         Number of text blocks to generate (default: 1)
  -h, --help              Show this help

Examples:
  marlarky text --paragraphs 3 --seed 42
  marlarky text --lexicon ./corp.json --archetype corporate
  marlarky text --transform bizJargon
`.trimStart();

const VALIDATE_HELP = `
marlarky validate - Validate a lexicon JSON file

Usage:
  marlarky validate <file.json> [options]

Options:
  --json                  Output validation result as JSON
  -h, --help              Show this help

Examples:
  marlarky validate ./my-lexicon.json
  marlarky validate ./my-lexicon.json --json
`.trimStart();

const LIST_HELP = `
marlarky list - List available transforms or sentence types

Usage:
  marlarky list <category>

Categories:
  transforms              List all registered output transforms
  types                   List all sentence types

Options:
  --json                  Output as JSON
  -h, --help              Show this help

Examples:
  marlarky list transforms
  marlarky list types
  marlarky list transforms --json
`.trimStart();

// ---------- Constants ----------

const GLOBAL_OPTIONS = {
  seed:      { type: 'string' as const,  short: 's' },
  lexicon:   { type: 'string' as const,  short: 'l' },
  archetype: { type: 'string' as const,  short: 'a' },
  transform: { type: 'string' as const,  short: 'x', multiple: true as const },
  trace:     { type: 'boolean' as const, short: 't', default: false },
  json:      { type: 'boolean' as const, short: 'j', default: false },
  count:     { type: 'string' as const,  short: 'n' },
  help:      { type: 'boolean' as const, short: 'h', default: false },
};

const VALID_SENTENCE_TYPES: SentenceType[] = [
  'simpleDeclarative',
  'compound',
  'introAdverbial',
  'subordinate',
  'interjection',
  'question',
];

// ---------- Utilities ----------

function die(message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function parsePositiveInt(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    die(`Expected a positive integer, got "${String(value)}"`);
  }
  return n;
}

function parseHints(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse --transform flags into a TransformStep pipeline and OutputTransformsConfig override.
 * Accepts repeatable --transform flags and/or comma-separated IDs.
 * Returns undefined if no transforms specified.
 */
function parseTransformOverride(values: Record<string, unknown>): Partial<OutputTransformsConfig> | undefined {
  const raw = values['transform'];
  if (!raw) return undefined;

  // raw may be a single string or string[] depending on parseArgs multiple flag
  const entries: string[] = Array.isArray(raw)
    ? (raw as string[]).flatMap(v => v.split(','))
    : String(raw).split(',');

  const ids = entries.map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return undefined;

  // Validate that all IDs exist in the default registry
  const registry = createDefaultRegistry();
  for (const id of ids) {
    if (!registry.has(id)) {
      const available = registry.list().map(t => t.id).join(', ');
      die(`Unknown transform "${id}". Available: ${available}`);
    }
  }

  const pipeline: TransformStep[] = ids.map(id => ({ id }));

  return {
    enabled: true,
    pipeline,
  };
}

// ---------- Generator factory ----------

function createGenerator(values: Record<string, unknown>): TextGenerator {
  let lexicon: Lexicon | undefined;

  if (values['lexicon']) {
    const lexiconPath = resolve(String(values['lexicon']));
    try {
      const json = readFileSync(lexiconPath, 'utf-8');
      lexicon = loadLexiconFromString(json);
    } catch (err) {
      die(`Loading lexicon: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const generator = new TextGenerator({
    fakerAdapter: new SimpleFakerAdapter(),
    lexicon,
    enableTrace: !!values['trace'] || !!values['json'],
  });

  if (values['seed'] !== undefined) {
    const seed = Number(values['seed']);
    if (Number.isNaN(seed)) {
      die(`--seed must be a number, got "${String(values['seed'])}"`);
    }
    generator.setSeed(seed);
  }

  if (values['archetype']) {
    generator.setArchetype(String(values['archetype']));
  }

  return generator;
}

// ---------- Output ----------

function emitResult(result: string | GeneratedText, trace: boolean, jsonOutput: boolean): void {
  if (typeof result === 'string') {
    if (jsonOutput) {
      process.stdout.write(JSON.stringify({ text: result }, null, 2) + '\n');
    } else {
      process.stdout.write(result + '\n');
    }
  } else {
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    } else {
      process.stdout.write(result.text + '\n');
    }
    if (trace && !jsonOutput && result.trace) {
      const traceOutput = {
        trace: result.trace,
        meta: result.meta,
      };
      process.stderr.write(JSON.stringify(traceOutput, null, 2) + '\n');
    }
  }
}

// ---------- Subcommand handlers ----------

function handleSentence(): void {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      ...GLOBAL_OPTIONS,
      type:        { type: 'string' },
      hints:       { type: 'string' },
      'min-words': { type: 'string' },
      'max-words': { type: 'string' },
    },
    strict: true,
  });

  if (values['help']) {
    process.stdout.write(SENTENCE_HELP);
    process.exit(0);
  }

  if (values['type'] && !VALID_SENTENCE_TYPES.includes(values['type'] as SentenceType)) {
    die(`Invalid sentence type "${String(values['type'])}". Valid types: ${VALID_SENTENCE_TYPES.join(', ')}`);
  }

  const generator = createGenerator(values);
  const count = parsePositiveInt(values['count'], 1);
  const transformOverride = parseTransformOverride(values);

  const opts: SentenceOptions = {};
  if (values['type']) opts.type = values['type'] as SentenceType;
  opts.hints = parseHints(values['hints']);
  if (values['min-words'] !== undefined) opts.minWords = parsePositiveInt(values['min-words'], 1);
  if (values['max-words'] !== undefined) opts.maxWords = parsePositiveInt(values['max-words'], 1);
  if (transformOverride) opts.outputTransforms = transformOverride;

  const jsonOutput = !!values['json'];

  for (let i = 0; i < count; i++) {
    const result = generator.sentence(opts);
    emitResult(result, !!values['trace'], jsonOutput);
  }
}

function handleParagraph(): void {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      ...GLOBAL_OPTIONS,
      sentences:        { type: 'string' },
      'min-sentences':  { type: 'string' },
      'max-sentences':  { type: 'string' },
      hints:            { type: 'string' },
    },
    strict: true,
  });

  if (values['help']) {
    process.stdout.write(PARAGRAPH_HELP);
    process.exit(0);
  }

  const generator = createGenerator(values);
  const count = parsePositiveInt(values['count'], 1);
  const transformOverride = parseTransformOverride(values);

  const opts: ParagraphOptions = {};
  if (values['sentences'] !== undefined) opts.sentences = parsePositiveInt(values['sentences'], 1);
  if (values['min-sentences'] !== undefined) opts.minSentences = parsePositiveInt(values['min-sentences'], 1);
  if (values['max-sentences'] !== undefined) opts.maxSentences = parsePositiveInt(values['max-sentences'], 1);
  opts.hints = parseHints(values['hints']);
  if (transformOverride) opts.outputTransforms = transformOverride;

  const jsonOutput = !!values['json'];

  for (let i = 0; i < count; i++) {
    const result = generator.paragraph(opts);
    emitResult(result, !!values['trace'], jsonOutput);
  }
}

function handleText(): void {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      ...GLOBAL_OPTIONS,
      paragraphs:        { type: 'string' },
      'min-paragraphs':  { type: 'string' },
      'max-paragraphs':  { type: 'string' },
      hints:             { type: 'string' },
    },
    strict: true,
  });

  if (values['help']) {
    process.stdout.write(TEXT_HELP);
    process.exit(0);
  }

  const generator = createGenerator(values);
  const count = parsePositiveInt(values['count'], 1);
  const transformOverride = parseTransformOverride(values);

  const opts: TextBlockOptions = {};
  if (values['paragraphs'] !== undefined) opts.paragraphs = parsePositiveInt(values['paragraphs'], 1);
  if (values['min-paragraphs'] !== undefined) opts.minParagraphs = parsePositiveInt(values['min-paragraphs'], 1);
  if (values['max-paragraphs'] !== undefined) opts.maxParagraphs = parsePositiveInt(values['max-paragraphs'], 1);
  opts.hints = parseHints(values['hints']);
  if (transformOverride) opts.outputTransforms = transformOverride;

  const jsonOutput = !!values['json'];

  for (let i = 0; i < count; i++) {
    const result = generator.textBlock(opts);
    emitResult(result, !!values['trace'], jsonOutput);
  }
}

function handleValidate(): void {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(3),
    options: {
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values['help']) {
    process.stdout.write(VALIDATE_HELP);
    process.exit(0);
  }

  const filePath = positionals[0];
  if (!filePath) {
    die('No file path provided.\nUsage: marlarky validate <file.json> [--json]');
  }

  const resolvedPath = resolve(filePath);
  let content: string;
  try {
    content = readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    die(`Reading file: ${err instanceof Error ? err.message : String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const msg = `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
    if (values['json']) {
      process.stdout.write(JSON.stringify({
        valid: false,
        errors: [{ path: '', message: msg, severity: 'error' }],
        warnings: [],
      }, null, 2) + '\n');
    } else {
      process.stderr.write(msg + '\n');
    }
    process.exit(1);
  }

  const result = validateLexicon(parsed);

  if (values['json']) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(result.valid ? 0 : 1);
  }

  if (result.valid && result.warnings.length === 0) {
    process.stdout.write(`Valid lexicon: ${resolvedPath}\n`);
    process.exit(0);
  }

  if (result.valid) {
    process.stdout.write(`Valid lexicon with warnings: ${resolvedPath}\n\n`);
  } else {
    process.stderr.write(`Invalid lexicon: ${resolvedPath}\n\n`);
  }

  if (result.errors.length > 0) {
    process.stderr.write('Errors:\n');
    for (const err of result.errors) {
      process.stderr.write(`  ${err.path}: ${err.message}\n`);
    }
  }

  if (result.warnings.length > 0) {
    const stream = result.valid ? process.stdout : process.stderr;
    stream.write('\nWarnings:\n');
    for (const warn of result.warnings) {
      stream.write(`  ${warn.path}: ${warn.message}\n`);
    }
  }

  process.exit(result.valid ? 0 : 1);
}

function handleList(): void {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(3),
    options: {
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values['help']) {
    process.stdout.write(LIST_HELP);
    process.exit(0);
  }

  const category = positionals[0];

  if (!category) {
    die('No category specified.\nUsage: marlarky list <transforms|types>');
  }

  switch (category) {
    case 'transforms': {
      const registry = createDefaultRegistry();
      const transforms = registry.list();

      if (values['json']) {
        const data = transforms.map(t => ({
          id: t.id,
          version: t.version,
          deterministic: t.capabilities.deterministic,
          safeToStack: t.capabilities.safeToStack,
          preferredOrder: t.capabilities.preferredOrder ?? null,
        }));
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
      } else {
        process.stdout.write('Available transforms:\n\n');
        for (const t of transforms) {
          const order = t.capabilities.preferredOrder !== undefined
            ? ` (order: ${t.capabilities.preferredOrder})`
            : '';
          process.stdout.write(`  ${t.id} v${t.version}${order}\n`);
        }
        process.stdout.write(`\n${transforms.length} transforms registered.\n`);
      }
      break;
    }

    case 'types': {
      if (values['json']) {
        process.stdout.write(JSON.stringify(VALID_SENTENCE_TYPES, null, 2) + '\n');
      } else {
        process.stdout.write('Available sentence types:\n\n');
        for (const t of VALID_SENTENCE_TYPES) {
          process.stdout.write(`  ${t}\n`);
        }
      }
      break;
    }

    default:
      die(`Unknown list category "${category}". Valid: transforms, types`);
  }
}

// ---------- Main dispatch ----------

function main(): void {
  const { values: topValues, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help:    { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  if (topValues['version']) {
    process.stdout.write(getVersion() + '\n');
    process.exit(0);
  }

  const command = positionals[0];

  if (topValues['help'] && !command) {
    process.stdout.write(MAIN_HELP);
    process.exit(0);
  }

  if (!command) {
    process.stderr.write('Error: No command specified.\n\n');
    process.stderr.write(MAIN_HELP);
    process.exit(1);
  }

  switch (command) {
    case 'sentence':
      return handleSentence();
    case 'paragraph':
      return handleParagraph();
    case 'text':
      return handleText();
    case 'validate':
      return handleValidate();
    case 'list':
      return handleList();
    default:
      process.stderr.write(`Error: Unknown command "${command}".\n\n`);
      process.stderr.write(MAIN_HELP);
      process.exit(1);
  }
}

// ---------- Entry point ----------

try {
  main();
} catch (err) {
  process.stderr.write(
    `Error: ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exit(1);
}
