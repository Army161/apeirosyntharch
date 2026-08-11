import { describe, expect, it } from 'vitest';
import { ModelRouter } from '../src/router.js';
import { providers } from './fixtures.js';

describe('ModelRouter', () => {
  it('selects the highest quality-per-cost eligible model without leaking provider types', () => {
    const router = new ModelRouter();

    const choice = router.select({ capability: 'reasoning', maxUsd: 1 }, providers);

    expect(choice).toEqual({ providerId: 'efficient', modelId: 'efficient-reasoner' });
  });

  it('fails when no provider satisfies the capability and budget', () => {
    const router = new ModelRouter();

    expect(() => router.select({ capability: 'vision', maxUsd: 0.01 }, providers)).toThrow(
      'no_eligible_model',
    );
  });
});

