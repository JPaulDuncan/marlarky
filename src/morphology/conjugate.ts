/**
 * Verb Conjugation
 * Handles regular and common irregular verb conjugations
 */

import type { PhraseFeatures } from '../types/context.js';

export type Tense = 'present' | 'past' | 'future';
export type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';

export interface ConjugationOptions {
  tense: Tense;
  aspect: Aspect;
  subject: PhraseFeatures;
  negative?: boolean;
}

// Irregular verb forms: [base, pastTense, pastParticiple, presentParticiple, thirdPersonSingular]
const IRREGULAR_VERBS: Record<string, [string, string, string, string, string]> = {
  'be': ['be', 'was/were', 'been', 'being', 'is'],
  'have': ['have', 'had', 'had', 'having', 'has'],
  'do': ['do', 'did', 'done', 'doing', 'does'],
  'go': ['go', 'went', 'gone', 'going', 'goes'],
  'say': ['say', 'said', 'said', 'saying', 'says'],
  'get': ['get', 'got', 'gotten', 'getting', 'gets'],
  'make': ['make', 'made', 'made', 'making', 'makes'],
  'know': ['know', 'knew', 'known', 'knowing', 'knows'],
  'think': ['think', 'thought', 'thought', 'thinking', 'thinks'],
  'take': ['take', 'took', 'taken', 'taking', 'takes'],
  'see': ['see', 'saw', 'seen', 'seeing', 'sees'],
  'come': ['come', 'came', 'come', 'coming', 'comes'],
  'want': ['want', 'wanted', 'wanted', 'wanting', 'wants'],
  'use': ['use', 'used', 'used', 'using', 'uses'],
  'find': ['find', 'found', 'found', 'finding', 'finds'],
  'give': ['give', 'gave', 'given', 'giving', 'gives'],
  'tell': ['tell', 'told', 'told', 'telling', 'tells'],
  'work': ['work', 'worked', 'worked', 'working', 'works'],
  'call': ['call', 'called', 'called', 'calling', 'calls'],
  'try': ['try', 'tried', 'tried', 'trying', 'tries'],
  'ask': ['ask', 'asked', 'asked', 'asking', 'asks'],
  'need': ['need', 'needed', 'needed', 'needing', 'needs'],
  'feel': ['feel', 'felt', 'felt', 'feeling', 'feels'],
  'become': ['become', 'became', 'become', 'becoming', 'becomes'],
  'leave': ['leave', 'left', 'left', 'leaving', 'leaves'],
  'put': ['put', 'put', 'put', 'putting', 'puts'],
  'mean': ['mean', 'meant', 'meant', 'meaning', 'means'],
  'keep': ['keep', 'kept', 'kept', 'keeping', 'keeps'],
  'let': ['let', 'let', 'let', 'letting', 'lets'],
  'begin': ['begin', 'began', 'begun', 'beginning', 'begins'],
  'seem': ['seem', 'seemed', 'seemed', 'seeming', 'seems'],
  'help': ['help', 'helped', 'helped', 'helping', 'helps'],
  'show': ['show', 'showed', 'shown', 'showing', 'shows'],
  'hear': ['hear', 'heard', 'heard', 'hearing', 'hears'],
  'play': ['play', 'played', 'played', 'playing', 'plays'],
  'run': ['run', 'ran', 'run', 'running', 'runs'],
  'move': ['move', 'moved', 'moved', 'moving', 'moves'],
  'live': ['live', 'lived', 'lived', 'living', 'lives'],
  'believe': ['believe', 'believed', 'believed', 'believing', 'believes'],
  'hold': ['hold', 'held', 'held', 'holding', 'holds'],
  'bring': ['bring', 'brought', 'brought', 'bringing', 'brings'],
  'happen': ['happen', 'happened', 'happened', 'happening', 'happens'],
  'write': ['write', 'wrote', 'written', 'writing', 'writes'],
  'provide': ['provide', 'provided', 'provided', 'providing', 'provides'],
  'sit': ['sit', 'sat', 'sat', 'sitting', 'sits'],
  'stand': ['stand', 'stood', 'stood', 'standing', 'stands'],
  'lose': ['lose', 'lost', 'lost', 'losing', 'loses'],
  'pay': ['pay', 'paid', 'paid', 'paying', 'pays'],
  'meet': ['meet', 'met', 'met', 'meeting', 'meets'],
  'include': ['include', 'included', 'included', 'including', 'includes'],
  'continue': ['continue', 'continued', 'continued', 'continuing', 'continues'],
  'set': ['set', 'set', 'set', 'setting', 'sets'],
  'learn': ['learn', 'learned', 'learned', 'learning', 'learns'],
  'change': ['change', 'changed', 'changed', 'changing', 'changes'],
  'lead': ['lead', 'led', 'led', 'leading', 'leads'],
  'understand': ['understand', 'understood', 'understood', 'understanding', 'understands'],
  'watch': ['watch', 'watched', 'watched', 'watching', 'watches'],
  'follow': ['follow', 'followed', 'followed', 'following', 'follows'],
  'stop': ['stop', 'stopped', 'stopped', 'stopping', 'stops'],
  'create': ['create', 'created', 'created', 'creating', 'creates'],
  'speak': ['speak', 'spoke', 'spoken', 'speaking', 'speaks'],
  'read': ['read', 'read', 'read', 'reading', 'reads'],
  'spend': ['spend', 'spent', 'spent', 'spending', 'spends'],
  'grow': ['grow', 'grew', 'grown', 'growing', 'grows'],
  'open': ['open', 'opened', 'opened', 'opening', 'opens'],
  'walk': ['walk', 'walked', 'walked', 'walking', 'walks'],
  'win': ['win', 'won', 'won', 'winning', 'wins'],
  'offer': ['offer', 'offered', 'offered', 'offering', 'offers'],
  'remember': ['remember', 'remembered', 'remembered', 'remembering', 'remembers'],
  'consider': ['consider', 'considered', 'considered', 'considering', 'considers'],
  'appear': ['appear', 'appeared', 'appeared', 'appearing', 'appears'],
  'buy': ['buy', 'bought', 'bought', 'buying', 'buys'],
  'wait': ['wait', 'waited', 'waited', 'waiting', 'waits'],
  'serve': ['serve', 'served', 'served', 'serving', 'serves'],
  'die': ['die', 'died', 'died', 'dying', 'dies'],
  'send': ['send', 'sent', 'sent', 'sending', 'sends'],
  'build': ['build', 'built', 'built', 'building', 'builds'],
  'stay': ['stay', 'stayed', 'stayed', 'staying', 'stays'],
  'fall': ['fall', 'fell', 'fallen', 'falling', 'falls'],
  'cut': ['cut', 'cut', 'cut', 'cutting', 'cuts'],
  'reach': ['reach', 'reached', 'reached', 'reaching', 'reaches'],
  'kill': ['kill', 'killed', 'killed', 'killing', 'kills'],
  'remain': ['remain', 'remained', 'remained', 'remaining', 'remains'],
  'suggest': ['suggest', 'suggested', 'suggested', 'suggesting', 'suggests'],
  'raise': ['raise', 'raised', 'raised', 'raising', 'raises'],
  'pass': ['pass', 'passed', 'passed', 'passing', 'passes'],
  'sell': ['sell', 'sold', 'sold', 'selling', 'sells'],
  'require': ['require', 'required', 'required', 'requiring', 'requires'],
  'report': ['report', 'reported', 'reported', 'reporting', 'reports'],
  'decide': ['decide', 'decided', 'decided', 'deciding', 'decides'],
  'pull': ['pull', 'pulled', 'pulled', 'pulling', 'pulls'],
  'break': ['break', 'broke', 'broken', 'breaking', 'breaks'],
  'catch': ['catch', 'caught', 'caught', 'catching', 'catches'],
  'drive': ['drive', 'drove', 'driven', 'driving', 'drives'],
  'eat': ['eat', 'ate', 'eaten', 'eating', 'eats'],
  'fly': ['fly', 'flew', 'flown', 'flying', 'flies'],
  'forget': ['forget', 'forgot', 'forgotten', 'forgetting', 'forgets'],
  'hit': ['hit', 'hit', 'hit', 'hitting', 'hits'],
  'hurt': ['hurt', 'hurt', 'hurt', 'hurting', 'hurts'],
  'lay': ['lay', 'laid', 'laid', 'laying', 'lays'],
  'lie': ['lie', 'lay', 'lain', 'lying', 'lies'],
  'ride': ['ride', 'rode', 'ridden', 'riding', 'rides'],
  'ring': ['ring', 'rang', 'rung', 'ringing', 'rings'],
  'rise': ['rise', 'rose', 'risen', 'rising', 'rises'],
  'seek': ['seek', 'sought', 'sought', 'seeking', 'seeks'],
  'shake': ['shake', 'shook', 'shaken', 'shaking', 'shakes'],
  'shine': ['shine', 'shone', 'shone', 'shining', 'shines'],
  'shoot': ['shoot', 'shot', 'shot', 'shooting', 'shoots'],
  'shut': ['shut', 'shut', 'shut', 'shutting', 'shuts'],
  'sing': ['sing', 'sang', 'sung', 'singing', 'sings'],
  'sink': ['sink', 'sank', 'sunk', 'sinking', 'sinks'],
  'sleep': ['sleep', 'slept', 'slept', 'sleeping', 'sleeps'],
  'slide': ['slide', 'slid', 'slid', 'sliding', 'slides'],
  'steal': ['steal', 'stole', 'stolen', 'stealing', 'steals'],
  'stick': ['stick', 'stuck', 'stuck', 'sticking', 'sticks'],
  'strike': ['strike', 'struck', 'struck', 'striking', 'strikes'],
  'swim': ['swim', 'swam', 'swum', 'swimming', 'swims'],
  'swing': ['swing', 'swung', 'swung', 'swinging', 'swings'],
  'teach': ['teach', 'taught', 'taught', 'teaching', 'teaches'],
  'tear': ['tear', 'tore', 'torn', 'tearing', 'tears'],
  'throw': ['throw', 'threw', 'thrown', 'throwing', 'throws'],
  'wake': ['wake', 'woke', 'woken', 'waking', 'wakes'],
  'wear': ['wear', 'wore', 'worn', 'wearing', 'wears'],
};

/**
 * Get past tense of a verb
 */
export function getPastTense(verb: string): string {
  const lower = verb.toLowerCase();
  const irregular = IRREGULAR_VERBS[lower];

  if (irregular) {
    const past = irregular[1]!;
    // Handle was/were for 'be'
    if (past.includes('/')) {
      return past.split('/')[0]!; // Default to singular
    }
    return past;
  }

  // Regular verb rules
  if (lower.endsWith('e')) {
    return verb + 'd';
  }

  if (lower.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lower[lower.length - 2] ?? '')) {
    return verb.slice(0, -1) + 'ied';
  }

  // Double final consonant for CVC pattern
  if (shouldDoubleConsonant(lower)) {
    return verb + verb[verb.length - 1] + 'ed';
  }

  return verb + 'ed';
}

/**
 * Get past participle of a verb
 */
export function getPastParticiple(verb: string): string {
  const lower = verb.toLowerCase();
  const irregular = IRREGULAR_VERBS[lower];

  if (irregular) {
    return irregular[2]!;
  }

  // Regular verbs: same as past tense
  return getPastTense(verb);
}

/**
 * Get present participle (gerund) of a verb
 */
export function getPresentParticiple(verb: string): string {
  const lower = verb.toLowerCase();
  const irregular = IRREGULAR_VERBS[lower];

  if (irregular) {
    return irregular[3]!;
  }

  // Regular verb rules
  if (lower.endsWith('ie')) {
    return verb.slice(0, -2) + 'ying';
  }

  if (lower.endsWith('e') && !lower.endsWith('ee')) {
    return verb.slice(0, -1) + 'ing';
  }

  // Double final consonant for CVC pattern
  if (shouldDoubleConsonant(lower)) {
    return verb + verb[verb.length - 1] + 'ing';
  }

  return verb + 'ing';
}

/**
 * Get third person singular present tense
 */
export function getThirdPersonSingular(verb: string): string {
  const lower = verb.toLowerCase();
  const irregular = IRREGULAR_VERBS[lower];

  if (irregular) {
    return irregular[4]!;
  }

  // Regular verb rules
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') ||
      lower.endsWith('ch') || lower.endsWith('sh') || lower.endsWith('o')) {
    return verb + 'es';
  }

  if (lower.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lower[lower.length - 2] ?? '')) {
    return verb.slice(0, -1) + 'ies';
  }

  return verb + 's';
}

/**
 * Check if final consonant should be doubled
 */
function shouldDoubleConsonant(verb: string): boolean {
  if (verb.length < 2) return false;

  const vowels = 'aeiou';
  const last = verb[verb.length - 1]!;
  const secondLast = verb[verb.length - 2]!;

  // Must end in consonant
  if (vowels.includes(last)) return false;

  // Previous must be a single vowel
  if (!vowels.includes(secondLast)) return false;

  // Check for single vowel pattern (not double vowel)
  if (verb.length >= 3) {
    const thirdLast = verb[verb.length - 3]!;
    if (vowels.includes(thirdLast)) return false;
  }

  // Common exceptions that don't double
  const noDouble = ['w', 'x', 'y'];
  if (noDouble.includes(last)) return false;

  return true;
}

/**
 * Conjugate 'be' based on subject
 */
export function conjugateBe(subject: PhraseFeatures, tense: Tense): string {
  if (tense === 'past') {
    if (subject.number === 'singular' && subject.person !== 2) {
      return 'was';
    }
    return 'were';
  }

  if (tense === 'future') {
    return 'will be';
  }

  // Present
  if (subject.number === 'singular') {
    if (subject.person === 1) return 'am';
    if (subject.person === 3) return 'is';
  }
  return 'are';
}

/**
 * Conjugate 'have' based on subject
 */
export function conjugateHave(subject: PhraseFeatures, tense: Tense): string {
  if (tense === 'past') {
    return 'had';
  }

  if (tense === 'future') {
    return 'will have';
  }

  // Present
  if (subject.number === 'singular' && subject.person === 3) {
    return 'has';
  }
  return 'have';
}

/**
 * Conjugate 'do' based on subject
 */
export function conjugateDo(subject: PhraseFeatures, tense: Tense): string {
  if (tense === 'past') {
    return 'did';
  }

  if (tense === 'future') {
    return 'will do';
  }

  // Present
  if (subject.number === 'singular' && subject.person === 3) {
    return 'does';
  }
  return 'do';
}

/**
 * Full verb conjugation
 */
export function conjugate(verb: string, options: ConjugationOptions): string {
  const { tense, aspect, subject, negative = false } = options;
  const lower = verb.toLowerCase();

  // Handle 'be' specially
  if (lower === 'be') {
    return conjugateBe(subject, tense);
  }

  // Simple aspects
  if (aspect === 'simple') {
    if (tense === 'present') {
      if (subject.number === 'singular' && subject.person === 3) {
        return negative ? `does not ${verb}` : getThirdPersonSingular(verb);
      }
      return negative ? `do not ${verb}` : verb;
    }

    if (tense === 'past') {
      return negative ? `did not ${verb}` : getPastTense(verb);
    }

    if (tense === 'future') {
      return negative ? `will not ${verb}` : `will ${verb}`;
    }
  }

  // Progressive aspect
  if (aspect === 'progressive') {
    const participle = getPresentParticiple(verb);
    const beVerb = conjugateBe(subject, tense);
    return negative ? `${beVerb} not ${participle}` : `${beVerb} ${participle}`;
  }

  // Perfect aspect
  if (aspect === 'perfect') {
    const participle = getPastParticiple(verb);
    const haveVerb = conjugateHave(subject, tense);
    return negative ? `${haveVerb} not ${participle}` : `${haveVerb} ${participle}`;
  }

  // Perfect progressive
  if (aspect === 'perfectProgressive') {
    const participle = getPresentParticiple(verb);
    const haveVerb = conjugateHave(subject, tense);
    return negative ? `${haveVerb} not been ${participle}` : `${haveVerb} been ${participle}`;
  }

  return verb;
}
