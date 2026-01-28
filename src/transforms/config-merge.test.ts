import { describe, it, expect } from 'vitest';
import { mergeOutputTransformsConfig, mergeProtectionConfig } from './config-merge.js';

describe('Config Merge', () => {
  it('should return defaults when no args provided', () => {
    const result = mergeOutputTransformsConfig();
    expect(result.enabled).toBe(false);
    expect(result.pipeline).toEqual([]);
    expect(result.strict).toBe(false);
  });

  it('should apply base config', () => {
    const result = mergeOutputTransformsConfig({
      enabled: true,
      pipeline: [{ id: 'pigLatin' }],
    });
    expect(result.enabled).toBe(true);
    expect(result.pipeline).toEqual([{ id: 'pigLatin' }]);
  });

  it('should apply lexicon defaults when no base pipeline', () => {
    const result = mergeOutputTransformsConfig(
      undefined,
      { defaults: [{ id: 'pirate' }] },
    );
    expect(result.pipeline).toEqual([{ id: 'pirate' }]);
  });

  it('should not override base pipeline with lexicon defaults', () => {
    const result = mergeOutputTransformsConfig(
      { pipeline: [{ id: 'pigLatin' }] },
      { defaults: [{ id: 'pirate' }] },
    );
    expect(result.pipeline).toEqual([{ id: 'pigLatin' }]);
  });

  it('should replace pipeline with archetype transforms', () => {
    const result = mergeOutputTransformsConfig(
      { pipeline: [{ id: 'pigLatin' }] },
      undefined,
      { pipeline: [{ id: 'leet' }, { id: 'mockCase' }] },
    );
    expect(result.pipeline).toEqual([{ id: 'leet' }, { id: 'mockCase' }]);
    expect(result.enabled).toBe(true);
  });

  it('should apply per-call override in replace mode', () => {
    const result = mergeOutputTransformsConfig(
      { enabled: true, pipeline: [{ id: 'pigLatin' }] },
      undefined,
      undefined,
      {
        outputTransforms: {
          pipeline: [{ id: 'mockCase' }],
        },
        mergeMode: 'replace',
      },
    );
    expect(result.pipeline).toEqual([{ id: 'mockCase' }]);
  });

  it('should apply per-call override in append mode', () => {
    const result = mergeOutputTransformsConfig(
      { enabled: true, pipeline: [{ id: 'pigLatin' }] },
      undefined,
      undefined,
      {
        outputTransforms: {
          pipeline: [{ id: 'mockCase' }],
        },
        mergeMode: 'append',
      },
    );
    expect(result.pipeline).toEqual([{ id: 'pigLatin' }, { id: 'mockCase' }]);
  });

  it('should merge protection config from all sources', () => {
    const result = mergeOutputTransformsConfig(
      { protection: { keepAcronyms: false } },
      undefined,
      undefined,
      {
        outputTransforms: {
          protection: { minWordLength: 5 },
        },
      },
    );
    expect(result.protection.keepAcronyms).toBe(false);
    expect(result.protection.minWordLength).toBe(5);
  });

  it('should override strict mode per-call', () => {
    const result = mergeOutputTransformsConfig(
      { strict: false },
      undefined,
      undefined,
      {
        outputTransforms: { strict: true },
      },
    );
    expect(result.strict).toBe(true);
  });

  it('should enable transforms when archetype has pipeline', () => {
    const result = mergeOutputTransformsConfig(
      undefined,
      undefined,
      { pipeline: [{ id: 'pirate' }] },
    );
    expect(result.enabled).toBe(true);
  });

  it('should default mergeMode to replace', () => {
    const result = mergeOutputTransformsConfig(
      { pipeline: [{ id: 'pigLatin' }] },
      undefined,
      undefined,
      {
        outputTransforms: { pipeline: [{ id: 'mockCase' }] },
      },
    );
    expect(result.pipeline).toEqual([{ id: 'mockCase' }]);
  });
});

describe('Protection Config Merge', () => {
  it('should return defaults with no args', () => {
    const result = mergeProtectionConfig();
    expect(result.keepAcronyms).toBe(true);
    expect(result.keepNumbers).toBe(true);
  });

  it('should override specific fields', () => {
    const result = mergeProtectionConfig({ keepAcronyms: false }, { minWordLength: 5 });
    expect(result.keepAcronyms).toBe(false);
    expect(result.minWordLength).toBe(5);
  });

  it('should skip undefined configs', () => {
    const result = mergeProtectionConfig(undefined, { keepAcronyms: false }, undefined);
    expect(result.keepAcronyms).toBe(false);
  });
});
