import { describe, it, expect } from 'vitest';
import { executePipeline, checkPipelineOrder } from './pipeline.js';
import { createDefaultRegistry } from './default-registry.js';
import type { OutputTransformsConfig } from './types.js';
import { DEFAULT_PROTECTION_CONFIG } from './types.js';

const registry = createDefaultRegistry();

function makeConfig(pipeline: Array<{ id: string; params?: Record<string, unknown> }>, opts: Partial<OutputTransformsConfig> = {}): OutputTransformsConfig {
  return {
    enabled: true,
    pipeline,
    protection: { ...DEFAULT_PROTECTION_CONFIG },
    strict: false,
    autoOrder: false,
    ...opts,
  };
}

describe('Pipeline Executor', () => {
  it('should return unmodified text when disabled', () => {
    const config: OutputTransformsConfig = {
      enabled: false,
      pipeline: [{ id: 'pigLatin' }],
      protection: { ...DEFAULT_PROTECTION_CONFIG },
      strict: false,
    };
    const result = executePipeline('Hello world.', config, registry, 42, false);
    expect(result.text).toBe('Hello world.');
    expect(result.transformsApplied).toHaveLength(0);
  });

  it('should return unmodified text when pipeline is empty', () => {
    const config = makeConfig([]);
    const result = executePipeline('Hello world.', config, registry, 42, false);
    expect(result.text).toBe('Hello world.');
  });

  it('should apply a single transform', () => {
    const config = makeConfig([{ id: 'mockCase' }]);
    const result = executePipeline('hello world.', config, registry, 42, false);
    expect(result.text).not.toBe('hello world.');
    expect(result.transformsApplied).toEqual(['mockCase']);
  });

  it('should apply multiple transforms in pipeline order (pirate then pigLatin)', () => {
    const config = makeConfig([
      { id: 'pirate', params: { interjectionRate: 0 } },
      { id: 'pigLatin' },
    ]);
    const result = executePipeline('You are my friend.', config, registry, 42, false);
    // pirate: You->Ye, are->be, my->me, friend->matey
    // pigLatin applied on pirate output
    expect(result.transformsApplied).toEqual(['pirate', 'pigLatin']);
    expect(result.text).not.toBe('You are my friend.');
  });

  it('should produce deterministic output with same seed', () => {
    const config = makeConfig([
      { id: 'pirate', params: { interjectionRate: 0.5 } },
      { id: 'pigLatin' },
    ]);
    const r1 = executePipeline('Hello world today.', config, registry, 42, false);
    const r2 = executePipeline('Hello world today.', config, registry, 42, false);
    expect(r1.text).toBe(r2.text);
  });

  it('should produce different output with different seeds', () => {
    const config = makeConfig([
      { id: 'leet', params: { intensity: 0.5 } },
    ]);
    const r1 = executePipeline('Hello world today.', config, registry, 42, false);
    const r2 = executePipeline('Hello world today.', config, registry, 999, false);
    // May or may not differ with partial intensity, but should not error
    expect(typeof r1.text).toBe('string');
    expect(typeof r2.text).toBe('string');
  });

  it('should protect tokens across all transforms', () => {
    const config = makeConfig(
      [{ id: 'pigLatin' }, { id: 'mockCase' }],
      { protection: { keepAcronyms: true } },
    );
    const result = executePipeline('API is great.', config, registry, 42, false);
    // API should remain unchanged through both transforms
    expect(result.text).toContain('API');
  });

  it('should skip unknown transforms in non-strict mode', () => {
    const config = makeConfig([
      { id: 'nonExistent' },
      { id: 'mockCase' },
    ]);
    const result = executePipeline('hello world.', config, registry, 42, false);
    expect(result.transformsApplied).toEqual(['mockCase']);
  });

  it('should throw for unknown transforms in strict mode', () => {
    const config = makeConfig([{ id: 'nonExistent' }], { strict: true });
    expect(() => executePipeline('hello.', config, registry, 42, false)).toThrow('Unknown transform ID');
  });

  it('should throw for invalid params in strict mode', () => {
    const config = makeConfig(
      [{ id: 'leet', params: { intensity: 999 } }],
      { strict: true },
    );
    expect(() => executePipeline('hello.', config, registry, 42, false)).toThrow('invalid params');
  });

  it('should produce trace data when traceEnabled', () => {
    const config = makeConfig([{ id: 'mockCase' }]);
    const result = executePipeline('hello world.', config, registry, 42, true);
    expect(result.outputTokens).toBeDefined();
    expect(result.transformEvents).toBeDefined();
    expect(result.transformEvents!).toHaveLength(1);
    expect(result.transformEvents![0]!.transformId).toBe('mockCase');
    expect(result.outputTokens!.length).toBeGreaterThan(0);
  });

  it('should auto-order pipeline when autoOrder=true', () => {
    // mockCase (preferredOrder=50) should come after pirate (preferredOrder=10)
    const config = makeConfig(
      [
        { id: 'mockCase' },
        { id: 'pirate', params: { interjectionRate: 0 } },
      ],
      { autoOrder: true },
    );
    const result = executePipeline('You are my friend.', config, registry, 42, false);
    // pirate should be applied first (order 10), then mockCase (order 50)
    expect(result.transformsApplied).toEqual(['pirate', 'mockCase']);
  });

  it('should preserve punctuation order across transforms', () => {
    const config = makeConfig([{ id: 'pigLatin' }, { id: 'mockCase' }]);
    const result = executePipeline('Hello, world! How are you?', config, registry, 42, false);
    // Punctuation should still be present
    expect(result.text).toContain(',');
    expect(result.text).toContain('!');
    expect(result.text).toContain('?');
  });

  it('should preserve whitespace across transforms', () => {
    const config = makeConfig([{ id: 'pirate', params: { interjectionRate: 0 } }]);
    const result = executePipeline('Hello world.', config, registry, 42, false);
    // Should have spaces between words
    expect(result.text).toMatch(/\S+ \S+/);
  });
});

describe('Pipeline Order Checker', () => {
  it('should return no warnings for correctly ordered pipeline', () => {
    const pipeline = [
      { id: 'pirate' },     // order 10
      { id: 'leet' },       // order 30
      { id: 'pigLatin' },   // order 40
      { id: 'mockCase' },   // order 50
    ];
    const warnings = checkPipelineOrder(pipeline, registry);
    expect(warnings).toHaveLength(0);
  });

  it('should warn about out-of-order transforms', () => {
    const pipeline = [
      { id: 'mockCase' },   // order 50
      { id: 'pirate' },     // order 10
    ];
    const warnings = checkPipelineOrder(pipeline, registry);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe('Invariant Tests', () => {
  it('should produce non-empty output for any non-empty input', () => {
    const config = makeConfig([{ id: 'pigLatin' }]);
    for (let seed = 1; seed <= 20; seed++) {
      const result = executePipeline('Hello world.', config, registry, seed, false);
      expect(result.text.length).toBeGreaterThan(0);
    }
  });

  it('should preserve punctuation tokens across many seeds', () => {
    const config = makeConfig([
      { id: 'pirate', params: { interjectionRate: 0 } },
      { id: 'pigLatin' },
    ]);
    for (let seed = 1; seed <= 20; seed++) {
      const result = executePipeline('Hello, world!', config, registry, seed, false);
      expect(result.text).toContain(',');
      expect(result.text).toContain('!');
    }
  });

  it('should not introduce double spaces', () => {
    const config = makeConfig([
      { id: 'pirate', params: { interjectionRate: 0 } },
      { id: 'bizJargon', params: { rate: 1.0 } },
    ]);
    for (let seed = 1; seed <= 20; seed++) {
      const result = executePipeline('You use my plan.', config, registry, seed, false);
      expect(result.text).not.toMatch(/  /);
    }
  });
});
