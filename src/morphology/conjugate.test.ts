import { describe, it, expect } from 'vitest';
import {
  getPastTense,
  getPastParticiple,
  getPresentParticiple,
  getThirdPersonSingular,
  conjugateBe,
  conjugateHave,
  conjugate,
} from './conjugate.js';

describe('Conjugation', () => {
  describe('getPastTense', () => {
    it('handles regular verbs', () => {
      expect(getPastTense('walk')).toBe('walked');
      expect(getPastTense('talk')).toBe('talked');
      expect(getPastTense('play')).toBe('played');
    });

    it('handles verbs ending in e', () => {
      expect(getPastTense('like')).toBe('liked');
      expect(getPastTense('love')).toBe('loved');
      expect(getPastTense('use')).toBe('used');
    });

    it('handles verbs ending in consonant + y', () => {
      expect(getPastTense('try')).toBe('tried');
      expect(getPastTense('cry')).toBe('cried');
    });

    it('handles irregular verbs', () => {
      expect(getPastTense('go')).toBe('went');
      expect(getPastTense('see')).toBe('saw');
      expect(getPastTense('take')).toBe('took');
      // 'be' returns 'was' (the first part of was/were) since getPastTense doesn't know the subject
      expect(getPastTense('be')).toBe('was');
      expect(getPastTense('have')).toBe('had');
    });
  });

  describe('getPastParticiple', () => {
    it('handles regular verbs', () => {
      expect(getPastParticiple('walk')).toBe('walked');
      expect(getPastParticiple('talk')).toBe('talked');
    });

    it('handles irregular verbs', () => {
      expect(getPastParticiple('go')).toBe('gone');
      expect(getPastParticiple('see')).toBe('seen');
      expect(getPastParticiple('take')).toBe('taken');
      expect(getPastParticiple('be')).toBe('been');
      expect(getPastParticiple('write')).toBe('written');
    });
  });

  describe('getPresentParticiple', () => {
    it('handles regular verbs', () => {
      expect(getPresentParticiple('walk')).toBe('walking');
      expect(getPresentParticiple('talk')).toBe('talking');
      expect(getPresentParticiple('play')).toBe('playing');
    });

    it('handles verbs ending in e', () => {
      expect(getPresentParticiple('like')).toBe('liking');
      expect(getPresentParticiple('make')).toBe('making');
    });

    it('handles verbs ending in ie', () => {
      expect(getPresentParticiple('die')).toBe('dying');
      expect(getPresentParticiple('lie')).toBe('lying');
    });

    it('handles irregular verbs', () => {
      expect(getPresentParticiple('be')).toBe('being');
      expect(getPresentParticiple('have')).toBe('having');
    });
  });

  describe('getThirdPersonSingular', () => {
    it('handles regular verbs', () => {
      expect(getThirdPersonSingular('walk')).toBe('walks');
      expect(getThirdPersonSingular('talk')).toBe('talks');
      expect(getThirdPersonSingular('play')).toBe('plays');
    });

    it('handles verbs ending in s, x, z, ch, sh, o', () => {
      expect(getThirdPersonSingular('pass')).toBe('passes');
      expect(getThirdPersonSingular('fix')).toBe('fixes');
      expect(getThirdPersonSingular('buzz')).toBe('buzzes');
      expect(getThirdPersonSingular('watch')).toBe('watches');
      expect(getThirdPersonSingular('push')).toBe('pushes');
      expect(getThirdPersonSingular('go')).toBe('goes');
    });

    it('handles verbs ending in consonant + y', () => {
      expect(getThirdPersonSingular('try')).toBe('tries');
      expect(getThirdPersonSingular('fly')).toBe('flies');
    });

    it('handles irregular verbs', () => {
      expect(getThirdPersonSingular('be')).toBe('is');
      expect(getThirdPersonSingular('have')).toBe('has');
      expect(getThirdPersonSingular('do')).toBe('does');
    });
  });

  describe('conjugateBe', () => {
    it('conjugates present tense correctly', () => {
      expect(conjugateBe({ number: 'singular', person: 1 }, 'present')).toBe('am');
      expect(conjugateBe({ number: 'singular', person: 2 }, 'present')).toBe('are');
      expect(conjugateBe({ number: 'singular', person: 3 }, 'present')).toBe('is');
      expect(conjugateBe({ number: 'plural', person: 1 }, 'present')).toBe('are');
      expect(conjugateBe({ number: 'plural', person: 3 }, 'present')).toBe('are');
    });

    it('conjugates past tense correctly', () => {
      expect(conjugateBe({ number: 'singular', person: 1 }, 'past')).toBe('was');
      expect(conjugateBe({ number: 'singular', person: 2 }, 'past')).toBe('were');
      expect(conjugateBe({ number: 'singular', person: 3 }, 'past')).toBe('was');
      expect(conjugateBe({ number: 'plural', person: 1 }, 'past')).toBe('were');
    });

    it('conjugates future tense correctly', () => {
      expect(conjugateBe({ number: 'singular', person: 1 }, 'future')).toBe('will be');
      expect(conjugateBe({ number: 'plural', person: 3 }, 'future')).toBe('will be');
    });
  });

  describe('conjugateHave', () => {
    it('conjugates present tense correctly', () => {
      expect(conjugateHave({ number: 'singular', person: 1 }, 'present')).toBe('have');
      expect(conjugateHave({ number: 'singular', person: 3 }, 'present')).toBe('has');
      expect(conjugateHave({ number: 'plural', person: 1 }, 'present')).toBe('have');
    });

    it('conjugates past tense correctly', () => {
      expect(conjugateHave({ number: 'singular', person: 1 }, 'past')).toBe('had');
      expect(conjugateHave({ number: 'singular', person: 3 }, 'past')).toBe('had');
    });
  });

  describe('conjugate', () => {
    it('handles simple present', () => {
      expect(conjugate('walk', {
        tense: 'present',
        aspect: 'simple',
        subject: { number: 'singular', person: 3 },
      })).toBe('walks');

      expect(conjugate('walk', {
        tense: 'present',
        aspect: 'simple',
        subject: { number: 'plural', person: 3 },
      })).toBe('walk');
    });

    it('handles simple past', () => {
      expect(conjugate('walk', {
        tense: 'past',
        aspect: 'simple',
        subject: { number: 'singular', person: 3 },
      })).toBe('walked');
    });

    it('handles progressive', () => {
      expect(conjugate('walk', {
        tense: 'present',
        aspect: 'progressive',
        subject: { number: 'singular', person: 3 },
      })).toBe('is walking');

      expect(conjugate('walk', {
        tense: 'past',
        aspect: 'progressive',
        subject: { number: 'singular', person: 3 },
      })).toBe('was walking');
    });

    it('handles perfect', () => {
      expect(conjugate('walk', {
        tense: 'present',
        aspect: 'perfect',
        subject: { number: 'singular', person: 3 },
      })).toBe('has walked');

      expect(conjugate('go', {
        tense: 'present',
        aspect: 'perfect',
        subject: { number: 'singular', person: 3 },
      })).toBe('has gone');
    });

    it('handles negative forms', () => {
      expect(conjugate('walk', {
        tense: 'present',
        aspect: 'simple',
        subject: { number: 'singular', person: 3 },
        negative: true,
      })).toBe('does not walk');
    });
  });
});
