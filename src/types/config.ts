/**
 * Generator Configuration Types
 * Based on TDD Section 12 - GeneratorConfig
 */

import type { OutputTransformsConfig } from '../transforms/types.js';

/** Sentence type weights */
export interface SentenceTypeWeights {
  /** Simple declarative sentence (NP VP) */
  simpleDeclarative: number;
  /** Compound sentence (clause CONJ clause) */
  compound: number;
  /** Sentence with leading adverbial */
  introAdverbial: number;
  /** Sentence with subordinate clause */
  subordinate: number;
  /** Sentence starting with interjection */
  interjection: number;
  /** Question form */
  question: number;
}

/** Generator configuration */
export interface GeneratorConfig {
  /** Weights for sentence type selection */
  sentenceTypeWeights: SentenceTypeWeights;

  /** Minimum words per sentence */
  minWordsPerSentence: number;
  /** Maximum words per sentence */
  maxWordsPerSentence: number;
  /** Target average sentence length */
  avgSentenceLength: number;

  /** Minimum sentences per paragraph */
  minSentencesPerParagraph: number;
  /** Maximum sentences per paragraph */
  maxSentencesPerParagraph: number;

  /** Rate of interjection sentences (0-1) */
  interjectionRate: number;
  /** Rate of subordinate clauses (0-1) */
  subordinateClauseRate: number;
  /** Rate of relative clauses (0-1) */
  relativeClauseRate: number;
  /** Rate of question sentences (0-1) */
  questionRate: number;
  /** Rate of compound sentences (0-1) */
  compoundRate: number;

  /** Maximum prepositional phrase chains */
  maxPPChain: number;
  /** Maximum adjectives before a noun */
  maxAdjectivesPerNoun: number;
  /** Maximum adverbs per verb phrase */
  maxAdverbsPerVerb: number;

  /** Maximum attempts to generate a valid sentence */
  maxSentenceAttempts: number;
  /** Maximum attempts to generate a valid phrase */
  maxPhraseAttempts: number;

  /** Enable tracing for debugging */
  enableTrace: boolean;
  /** Throw error on constraint failure vs best-effort */
  strictMode: boolean;

  /** Default determiners */
  determiners: string[];
  /** Subject pronouns */
  subjectPronouns: string[];
  /** Object pronouns */
  objectPronouns: string[];
  /** Possessive determiners */
  possessiveDeterminers: string[];
  /** Modal verbs */
  modals: string[];
  /** Subordinating conjunctions */
  subordinators: string[];
  /** Relative pronouns */
  relatives: string[];
  /** Coordinating conjunctions */
  coordinators: string[];
  /** Transition words/phrases */
  transitions: string[];
  /** Common interjections */
  interjections: string[];

  /** Output transforms configuration */
  outputTransforms?: OutputTransformsConfig;
}

/** Default configuration */
export const DEFAULT_CONFIG: GeneratorConfig = {
  sentenceTypeWeights: {
    simpleDeclarative: 45,
    compound: 15,
    introAdverbial: 12,
    subordinate: 15,
    interjection: 3,
    question: 10,
  },

  minWordsPerSentence: 5,
  maxWordsPerSentence: 25,
  avgSentenceLength: 12,

  minSentencesPerParagraph: 2,
  maxSentencesPerParagraph: 7,

  interjectionRate: 0.03,
  subordinateClauseRate: 0.15,
  relativeClauseRate: 0.10,
  questionRate: 0.10,
  compoundRate: 0.15,

  maxPPChain: 2,
  maxAdjectivesPerNoun: 2,
  maxAdverbsPerVerb: 1,

  maxSentenceAttempts: 25,
  maxPhraseAttempts: 10,

  enableTrace: false,
  strictMode: false,

  determiners: ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'some', 'any', 'no', 'every', 'each', 'all', 'both', 'few', 'many', 'several'],

  subjectPronouns: ['I', 'you', 'he', 'she', 'it', 'we', 'they'],
  objectPronouns: ['me', 'you', 'him', 'her', 'it', 'us', 'them'],
  possessiveDeterminers: ['my', 'your', 'his', 'her', 'its', 'our', 'their'],

  modals: ['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'],

  subordinators: ['after', 'although', 'as', 'because', 'before', 'if', 'once', 'since', 'than', 'that', 'though', 'unless', 'until', 'when', 'whenever', 'where', 'wherever', 'while'],

  relatives: ['who', 'whom', 'whose', 'which', 'that'],

  coordinators: ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'],

  transitions: ['however', 'therefore', 'moreover', 'furthermore', 'meanwhile', 'consequently', 'nevertheless', 'otherwise', 'accordingly', 'indeed', 'certainly', 'naturally', 'fortunately', 'unfortunately', 'surprisingly', 'generally', 'specifically', 'particularly'],

  interjections: ['oh', 'ah', 'well', 'wow', 'hey', 'alas', 'indeed', 'certainly', 'surely', 'naturally'],
};

/** Merge user config with defaults */
export function mergeConfig(userConfig?: Partial<GeneratorConfig>): GeneratorConfig {
  if (!userConfig) return { ...DEFAULT_CONFIG };

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    sentenceTypeWeights: {
      ...DEFAULT_CONFIG.sentenceTypeWeights,
      ...userConfig.sentenceTypeWeights,
    },
    determiners: userConfig.determiners ?? DEFAULT_CONFIG.determiners,
    subjectPronouns: userConfig.subjectPronouns ?? DEFAULT_CONFIG.subjectPronouns,
    objectPronouns: userConfig.objectPronouns ?? DEFAULT_CONFIG.objectPronouns,
    possessiveDeterminers: userConfig.possessiveDeterminers ?? DEFAULT_CONFIG.possessiveDeterminers,
    modals: userConfig.modals ?? DEFAULT_CONFIG.modals,
    subordinators: userConfig.subordinators ?? DEFAULT_CONFIG.subordinators,
    relatives: userConfig.relatives ?? DEFAULT_CONFIG.relatives,
    coordinators: userConfig.coordinators ?? DEFAULT_CONFIG.coordinators,
    transitions: userConfig.transitions ?? DEFAULT_CONFIG.transitions,
    interjections: userConfig.interjections ?? DEFAULT_CONFIG.interjections,
  };
}
