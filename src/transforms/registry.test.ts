import { describe, it, expect } from 'vitest';
import { TransformRegistry } from './registry.js';
import { createDefaultRegistry } from './default-registry.js';
import type { IOutputTransform } from './types.js';

function makeMockTransform(id: string): IOutputTransform {
  return {
    id,
    version: '1.0.0',
    capabilities: {
      requiresTrace: false,
      posAware: false,
      deterministic: true,
      safeToStack: true,
    },
    validateParams: () => ({ valid: true, errors: [] }),
    apply: (input) => ({ tokens: input.tokens }),
  };
}

describe('TransformRegistry', () => {
  it('should register and retrieve a transform', () => {
    const registry = new TransformRegistry();
    const transform = makeMockTransform('test');
    registry.register(transform);
    expect(registry.get('test')).toBe(transform);
  });

  it('should return null for unknown transform', () => {
    const registry = new TransformRegistry();
    expect(registry.get('nonexistent')).toBeNull();
  });

  it('should list all registered transforms', () => {
    const registry = new TransformRegistry();
    registry.register(makeMockTransform('a'));
    registry.register(makeMockTransform('b'));
    expect(registry.list()).toHaveLength(2);
  });

  it('should overwrite on re-register', () => {
    const registry = new TransformRegistry();
    const t1 = makeMockTransform('test');
    const t2 = makeMockTransform('test');
    registry.register(t1);
    registry.register(t2);
    expect(registry.get('test')).toBe(t2);
    expect(registry.list()).toHaveLength(1);
  });

  it('should check if transform exists', () => {
    const registry = new TransformRegistry();
    registry.register(makeMockTransform('exists'));
    expect(registry.has('exists')).toBe(true);
    expect(registry.has('missing')).toBe(false);
  });
});

describe('Default Registry', () => {
  it('should contain all 10 V1 transforms', () => {
    const registry = createDefaultRegistry();
    const expectedIds = [
      'pigLatin', 'ubbiDubbi', 'leet', 'uwu', 'pirate',
      'redact', 'emoji', 'mockCase', 'reverseWords', 'bizJargon',
    ];
    for (const id of expectedIds) {
      expect(registry.has(id), `Missing transform: ${id}`).toBe(true);
    }
    expect(registry.list()).toHaveLength(10);
  });
});
