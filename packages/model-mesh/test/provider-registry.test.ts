import { createOpenAI } from '@ai-sdk/openai';
import { describe, expect, it } from 'vitest';
import { createApeiroProviderRegistry } from '../src/provider-registry.js';

describe('createApeiroProviderRegistry', () => {
  it('normalizes AI SDK providers behind one provider:model identifier', () => {
    const registry = createApeiroProviderRegistry({
      openai: createOpenAI({ apiKey: 'test-only-not-a-live-key' }),
    });

    expect(() => registry.languageModel('openai:gpt-5.6')).not.toThrow();
  });
});
