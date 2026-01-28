/**
 * TextGenerator - Public API
 * Main entry point for text generation
 */

import type {
  GeneratorInitOptions,
  SentenceOptions,
  ParagraphOptions,
  TextBlockOptions,
  GeneratedText,
  GenerationTrace,
  SentenceTrace,
  ParagraphTrace,
  TokenTrace,
} from '../types/api.js';
import type { Lexicon, Constraint, Invariant } from '../types/lexicon.js';
import type { GenerationContext } from '../types/context.js';
import type { GeneratorConfig } from '../types/config.js';
import type { IFakerAdapter } from '../interfaces/faker-adapter.js';
import type { IRng } from '../interfaces/rng.js';
import type {
  OutputTransformsConfig,
  LexiconOutputTransforms,
  ArchetypeOutputTransforms,
} from '../transforms/types.js';

import { SeedableRng } from '../rng/index.js';
import { LexiconStore } from '../lexicon/index.js';
import { WordProvider } from '../providers/index.js';
import { PhraseBuilders, SentenceTemplates } from '../grammar/index.js';
import type { SentenceResult, SentenceType } from '../grammar/index.js';
import { RuleEngine } from '../rules/index.js';
import { createContext, clearSentenceState, clearParagraphState } from '../types/context.js';
import { mergeConfig } from '../types/config.js';
import { formatParagraph, formatTextBlock } from '../morphology/index.js';
import { TransformRegistry } from '../transforms/registry.js';
import { createDefaultRegistry } from '../transforms/default-registry.js';
import { executePipeline } from '../transforms/pipeline.js';
import { mergeOutputTransformsConfig } from '../transforms/config-merge.js';
import type { PipelineResult } from '../transforms/pipeline.js';

export class TextGenerator {
  private config: GeneratorConfig;
  private rng: IRng;
  private lexiconStore: LexiconStore;
  private wordProvider: WordProvider;
  private phraseBuilders: PhraseBuilders;
  private sentenceTemplates: SentenceTemplates;
  private ruleEngine: RuleEngine;
  private fakerAdapter: IFakerAdapter;
  private enableTrace: boolean;
  private currentArchetype: string = 'default';
  private currentSeed: number;
  private transformRegistry: TransformRegistry;
  private currentLexicon?: Lexicon;

  constructor(options: GeneratorInitOptions) {
    this.fakerAdapter = options.fakerAdapter;
    this.config = mergeConfig(options.config);
    this.enableTrace = options.enableTrace ?? this.config.enableTrace;

    // Initialize RNG
    this.rng = options.rng ?? new SeedableRng();
    this.currentSeed = Date.now();
    this.rng.seed(this.currentSeed);

    // Initialize lexicon store
    this.lexiconStore = new LexiconStore(this.rng, options.lexicon);
    this.currentLexicon = options.lexicon;

    // Initialize word provider
    this.wordProvider = new WordProvider(this.lexiconStore, this.fakerAdapter, this.rng);

    // Initialize grammar components
    this.phraseBuilders = new PhraseBuilders(this.wordProvider, this.rng, this.config);
    this.sentenceTemplates = new SentenceTemplates(this.phraseBuilders, this.rng, this.config);

    // Initialize rule engine
    this.ruleEngine = new RuleEngine(this.config);

    // Initialize transform registry with V1 defaults
    this.transformRegistry = createDefaultRegistry();

    // Set archetype if lexicon has one
    if (options.lexicon) {
      const archetypes = Object.keys(options.lexicon.archetypes ?? {});
      if (archetypes.length > 0) {
        this.currentArchetype = archetypes[0]!;
      }
    }
  }

  /**
   * Set the random seed for deterministic output
   */
  setSeed(seed: number): void {
    this.currentSeed = seed;
    this.rng.seed(seed);
  }

  /**
   * Set or replace the lexicon
   */
  setLexicon(lexicon: Lexicon): void {
    this.lexiconStore.setLexicon(lexicon);
    this.currentLexicon = lexicon;
  }

  /**
   * Set the active archetype
   */
  setArchetype(name: string): void {
    this.currentArchetype = name;
  }

  /**
   * Get the transform registry (for registering custom transforms)
   */
  getTransformRegistry(): TransformRegistry {
    return this.transformRegistry;
  }

  /**
   * Generate a single sentence
   */
  sentence(opts?: SentenceOptions): string | GeneratedText {
    const ctx = this.createGenerationContext(opts?.hints);

    // Apply sentence type override if provided
    const sentenceType = opts?.type;

    // Generate with retry logic
    const result = this.generateSentenceWithRetry(ctx, sentenceType);

    // Apply output transforms
    const perCallOverride = opts ? {
      outputTransforms: opts.outputTransforms,
      mergeMode: opts.mergeMode,
    } : undefined;
    const pipelineResult = this.applyOutputTransforms(result.text, perCallOverride);

    const finalText = pipelineResult.text;

    if (this.enableTrace) {
      const trace = this.createSingleSentenceTrace(result, ctx);
      trace.outputTokens = pipelineResult.outputTokens;
      trace.transformEvents = pipelineResult.transformEvents;
      return {
        text: finalText,
        trace,
        meta: {
          ...this.getMeta(),
          transformsApplied: pipelineResult.transformsApplied.length > 0
            ? pipelineResult.transformsApplied : undefined,
        },
      };
    }

    return finalText;
  }

  /**
   * Generate a paragraph
   */
  paragraph(opts?: ParagraphOptions): string | GeneratedText {
    const ctx = this.createGenerationContext(opts?.hints);

    const minSentences = opts?.minSentences ?? opts?.sentences ?? this.config.minSentencesPerParagraph;
    const maxSentences = opts?.maxSentences ?? opts?.sentences ?? this.config.maxSentencesPerParagraph;
    const numSentences = opts?.sentences ?? this.rng.int(minSentences, maxSentences);

    const sentences: SentenceResult[] = [];
    const sentenceTraces: SentenceTrace[] = [];

    for (let i = 0; i < numSentences; i++) {
      ctx.sentenceIndex = i;
      clearSentenceState(ctx);

      const result = this.generateSentenceWithRetry(ctx);
      sentences.push(result);

      if (this.enableTrace) {
        sentenceTraces.push(this.createSentenceTrace(result, ctx));
      }
    }

    const rawText = formatParagraph(sentences.map(s => s.text));

    // Apply output transforms
    const perCallOverride = opts ? {
      outputTransforms: opts.outputTransforms,
      mergeMode: opts.mergeMode,
    } : undefined;
    const pipelineResult = this.applyOutputTransforms(rawText, perCallOverride);

    const finalText = pipelineResult.text;

    if (this.enableTrace) {
      const trace: GenerationTrace = {
        paragraphs: [{ sentences: sentenceTraces }],
        correlationsApplied: this.getAppliedCorrelations(ctx),
        invariantsChecked: this.checkInvariants(finalText),
        outputTokens: pipelineResult.outputTokens,
        transformEvents: pipelineResult.transformEvents,
      };
      return {
        text: finalText,
        trace,
        meta: {
          ...this.getMeta(),
          transformsApplied: pipelineResult.transformsApplied.length > 0
            ? pipelineResult.transformsApplied : undefined,
        },
      };
    }

    return finalText;
  }

  /**
   * Generate a text block (multiple paragraphs)
   */
  textBlock(opts?: TextBlockOptions): string | GeneratedText {
    const minParagraphs = opts?.minParagraphs ?? opts?.paragraphs ?? 1;
    const maxParagraphs = opts?.maxParagraphs ?? opts?.paragraphs ?? 3;
    const numParagraphs = opts?.paragraphs ?? this.rng.int(minParagraphs, maxParagraphs);

    const paragraphs: string[] = [];
    const paragraphTraces: ParagraphTrace[] = [];

    for (let i = 0; i < numParagraphs; i++) {
      const ctx = this.createGenerationContext(opts?.hints);
      ctx.paragraphIndex = i;

      const minSentences = this.config.minSentencesPerParagraph;
      const maxSentences = this.config.maxSentencesPerParagraph;
      const numSentences = this.rng.int(minSentences, maxSentences);

      const sentences: SentenceResult[] = [];
      const sentenceTraces: SentenceTrace[] = [];

      for (let j = 0; j < numSentences; j++) {
        ctx.sentenceIndex = j;
        clearSentenceState(ctx);

        const result = this.generateSentenceWithRetry(ctx);
        sentences.push(result);

        if (this.enableTrace) {
          sentenceTraces.push(this.createSentenceTrace(result, ctx));
        }
      }

      paragraphs.push(formatParagraph(sentences.map(s => s.text)));

      if (this.enableTrace) {
        paragraphTraces.push({ sentences: sentenceTraces });
      }

      clearParagraphState(ctx);
    }

    const rawText = formatTextBlock(paragraphs);

    // Apply output transforms
    const perCallOverride = opts ? {
      outputTransforms: opts.outputTransforms,
      mergeMode: opts.mergeMode,
    } : undefined;
    const pipelineResult = this.applyOutputTransforms(rawText, perCallOverride);

    const finalText = pipelineResult.text;

    if (this.enableTrace) {
      const ctx = this.createGenerationContext(opts?.hints);
      const trace: GenerationTrace = {
        paragraphs: paragraphTraces,
        correlationsApplied: this.getAppliedCorrelations(ctx),
        invariantsChecked: this.checkInvariants(finalText),
        outputTokens: pipelineResult.outputTokens,
        transformEvents: pipelineResult.transformEvents,
      };
      return {
        text: finalText,
        trace,
        meta: {
          ...this.getMeta(),
          transformsApplied: pipelineResult.transformsApplied.length > 0
            ? pipelineResult.transformsApplied : undefined,
        },
      };
    }

    return finalText;
  }

  /**
   * Apply output transforms to generated text.
   * Merges config from: base config → lexicon defaults → archetype → per-call overrides.
   */
  private applyOutputTransforms(
    text: string,
    perCallOverride?: { outputTransforms?: Partial<OutputTransformsConfig>; mergeMode?: 'replace' | 'append' },
  ): PipelineResult {
    // Get lexicon-level defaults
    const lexiconDefaults: LexiconOutputTransforms | undefined = this.currentLexicon?.outputTransforms;

    // Get archetype-level transforms
    let archetypeTransforms: ArchetypeOutputTransforms | undefined;
    if (this.currentLexicon?.archetypes?.[this.currentArchetype]) {
      archetypeTransforms = this.currentLexicon.archetypes[this.currentArchetype]!.outputTransforms;
    }

    // Merge all sources
    const finalConfig = mergeOutputTransformsConfig(
      this.config.outputTransforms,
      lexiconDefaults,
      archetypeTransforms,
      perCallOverride ? {
        outputTransforms: perCallOverride.outputTransforms,
        mergeMode: perCallOverride.mergeMode,
      } : undefined,
    );

    // Execute pipeline
    return executePipeline(
      text,
      finalConfig,
      this.transformRegistry,
      this.currentSeed,
      this.enableTrace,
    );
  }

  /**
   * Create a generation context
   */
  private createGenerationContext(hints?: string[]): GenerationContext {
    const ctx = createContext(this.currentSeed, this.currentArchetype);

    // Add hints as active tags
    if (hints) {
      for (const hint of hints) {
        ctx.activeTags.add(hint);
      }
    }

    // Add archetype tags
    const archetype = this.lexiconStore.getArchetype(this.currentArchetype);
    if (archetype?.tags) {
      for (const tag of archetype.tags) {
        ctx.activeTags.add(tag);
      }
    }

    // Merge constraints and invariants
    ctx.constraints = this.getActiveConstraints();
    ctx.invariants = this.getActiveInvariants();

    return ctx;
  }

  /**
   * Generate a sentence with retry logic
   */
  private generateSentenceWithRetry(ctx: GenerationContext, type?: SentenceType): SentenceResult {
    let attempts = 0;
    let lastResult: SentenceResult | undefined;
    let lastError: Error | undefined;

    while (attempts < this.config.maxSentenceAttempts) {
      attempts++;
      ctx.retryCount = attempts - 1;

      try {
        const result = this.sentenceTemplates.buildSentence(ctx, type);

        // Validate
        const validation = this.ruleEngine.validate(
          ctx.constraints,
          ctx.invariants,
          ctx,
          result.text,
          result.tokens,
          'sentence'
        );

        if (validation.valid) {
          return result;
        }

        lastResult = result;

        // If only soft constraints failed, use this result
        if (validation.hardConstraintsFailed.length === 0 && validation.invariantsFailed.length === 0) {
          return result;
        }

        // Apply degradation strategy on subsequent attempts
        if (attempts > 5) {
          // Simplify: reduce complexity for next attempt
          this.config.maxPPChain = Math.max(0, this.config.maxPPChain - 1);
        }

        if (attempts > 10) {
          // Force simple declarative
          type = 'simpleDeclarative';
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    // Return best effort or throw
    if (lastResult) {
      return lastResult;
    }

    if (this.config.strictMode) {
      throw lastError ?? new Error('Failed to generate valid sentence');
    }

    // Fallback: generate simplest possible sentence
    return this.sentenceTemplates.buildSimpleDeclarative(ctx);
  }

  /**
   * Get active constraints (from lexicon + defaults)
   */
  private getActiveConstraints(): Constraint[] {
    const defaults = this.ruleEngine.getDefaultConstraints();

    if (!this.lexiconStore.isLoaded()) {
      return defaults;
    }

    const meta = this.lexiconStore.getMeta();
    if (!meta) return defaults;

    // Would need to access lexicon.constraints
    // For now, return defaults
    return defaults;
  }

  /**
   * Get active invariants (from lexicon + defaults)
   */
  private getActiveInvariants(): Invariant[] {
    const defaults = this.ruleEngine.getDefaultInvariants();

    if (!this.lexiconStore.isLoaded()) {
      return defaults;
    }

    // Would need to access lexicon.invariants
    // For now, return defaults
    return defaults;
  }

  /**
   * Get generation metadata
   */
  private getMeta() {
    const lexiconMeta = this.lexiconStore.getMeta();
    return {
      archetype: this.currentArchetype,
      seed: this.currentSeed,
      lexiconVersion: lexiconMeta?.version,
      lexiconId: lexiconMeta?.id,
    };
  }

  /**
   * Create a trace for a single sentence result
   */
  private createSingleSentenceTrace(result: SentenceResult, ctx: GenerationContext): GenerationTrace {
    return {
      paragraphs: [
        {
          sentences: [this.createSentenceTrace(result, ctx)],
        },
      ],
      correlationsApplied: this.getAppliedCorrelations(ctx),
      invariantsChecked: this.checkInvariants(result.text),
    };
  }

  /**
   * Create a sentence trace
   */
  private createSentenceTrace(result: SentenceResult, ctx: GenerationContext): SentenceTrace {
    const tokenTraces: TokenTrace[] = result.tokens.map(token => {
      // Find if this token came from lexicon or faker
      const events = ctx.history.events.filter(
        e => e.type === 'term' && (e.item as { value?: string }).value === token
      );
      const event = events[events.length - 1];

      return {
        value: token,
        source: event?.termSetId ?? 'default',
        pos: event?.type === 'term' ? (event.item as { pos?: string }).pos : undefined,
      };
    });

    const validation = this.ruleEngine.validate(
      ctx.constraints,
      ctx.invariants,
      ctx,
      result.text,
      result.tokens,
      'sentence'
    );

    return {
      text: result.text,
      template: result.type,
      tokens: tokenTraces,
      constraintsEvaluated: validation.constraintResults.map(r => ({
        id: r.id,
        passed: r.passed,
      })),
      retryCount: ctx.retryCount,
    };
  }

  /**
   * Get list of correlations that were applied
   */
  private getAppliedCorrelations(ctx: GenerationContext): string[] {
    // Would need to track this during generation
    // For now, return the biases that were set
    return Array.from(ctx.biases.keys());
  }

  /**
   * Check invariants on final text
   */
  private checkInvariants(text: string): Array<{ id: string; passed: boolean }> {
    const invariants = this.ruleEngine.getDefaultInvariants();
    return invariants.map(inv => {
      const result = this.ruleEngine.evaluateInvariant(inv, text);
      return { id: result.id, passed: result.passed };
    });
  }
}
