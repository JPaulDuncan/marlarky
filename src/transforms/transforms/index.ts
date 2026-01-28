/**
 * V1 Transform Pack - All built-in transforms
 */

export { pigLatinTransform } from './pig-latin.js';
export { ubbiDubbiTransform } from './ubbi-dubbi.js';
export { leetTransform } from './leet.js';
export { uwuTransform } from './uwu.js';
export { pirateTransform } from './pirate.js';
export { redactTransform } from './redact.js';
export { emojiTransform } from './emoji.js';
export { mockCaseTransform } from './mock-case.js';
export { reverseWordsTransform } from './reverse-words.js';
export { bizJargonTransform } from './biz-jargon.js';

import { pigLatinTransform } from './pig-latin.js';
import { ubbiDubbiTransform } from './ubbi-dubbi.js';
import { leetTransform } from './leet.js';
import { uwuTransform } from './uwu.js';
import { pirateTransform } from './pirate.js';
import { redactTransform } from './redact.js';
import { emojiTransform } from './emoji.js';
import { mockCaseTransform } from './mock-case.js';
import { reverseWordsTransform } from './reverse-words.js';
import { bizJargonTransform } from './biz-jargon.js';
import type { IOutputTransform } from '../types.js';

/** All V1 built-in transforms */
export const V1_TRANSFORMS: IOutputTransform[] = [
  pigLatinTransform,
  ubbiDubbiTransform,
  leetTransform,
  uwuTransform,
  pirateTransform,
  redactTransform,
  emojiTransform,
  mockCaseTransform,
  reverseWordsTransform,
  bizJargonTransform,
];
