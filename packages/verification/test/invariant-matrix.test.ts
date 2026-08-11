import { describe, expect, it } from 'vitest';
import type { InvariantResult, Timeline } from '@apeiro/contracts';
import { InvariantMatrix, type InvariantValidator } from '../src/invariant-matrix.js';

const timeline: Timeline = {
  id: 'alpha',
  runId: '00000000-0000-4000-8000-000000000001',
  parentId: null,
  strategy: 'alpha',
  status: 'created',
  actions: [],
  evidence: [],
  delta: { paths: {} },
  resourceUsage: { usd: 0.1, elapsedMs: 10 },
};

describe('InvariantMatrix', () => {
  it('stops evaluation and rejects the timeline on a hard failure', async () => {
    const calls: string[] = [];
    const hardFailure: InvariantValidator = {
      verify: async (): Promise<InvariantResult> => {
        calls.push('hard');
        return { id: 'hard', hard: true, passed: false, summary: 'constraint failed' };
      },
    };
    const laterValidator: InvariantValidator = {
      verify: async (): Promise<InvariantResult> => {
        calls.push('later');
        return { id: 'later', hard: false, passed: true, summary: 'passed' };
      },
    };
    const matrix = new InvariantMatrix([hardFailure, laterValidator]);

    const result = await matrix.evaluate(timeline);

    expect(result.status).toBe('rejected');
    expect(result.score).toBe(0);
    expect(calls).toEqual(['hard']);
  });

  it('marks a branch verified when every invariant passes', async () => {
    const passing: InvariantValidator = {
      verify: async (): Promise<InvariantResult> => ({
        id: 'acceptance',
        hard: true,
        passed: true,
        summary: 'acceptance criterion met',
      }),
    };
    const matrix = new InvariantMatrix([passing]);

    const result = await matrix.evaluate(timeline);

    expect(result.status).toBe('verified');
    expect(result.score).toBe(1);
  });
});
