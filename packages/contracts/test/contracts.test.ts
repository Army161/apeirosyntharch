import { describe, expect, it } from 'vitest';
import { ObjectiveContractSchema } from '../src/index.js';

describe('ObjectiveContractSchema', () => {
  it('rejects an objective without measurable acceptance criteria', () => {
    const result = ObjectiveContractSchema.safeParse({
      tenantId: crypto.randomUUID(),
      operatorId: crypto.randomUUID(),
      objective: 'Improve this repository',
      acceptanceCriteria: [],
      hardConstraints: [],
      preferences: [],
      budget: { maxUsd: 5, maxSeconds: 900 },
      riskPolicy: { maxAutomaticRisk: 'R1' },
    });

    expect(result.success).toBe(false);
  });
});
