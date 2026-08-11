import { describe, expect, it } from 'vitest';
import { ObjectiveContractSchema } from '@apeiro/contracts';
import { createNullInit } from '../src/null-init.js';
import { TimelineSynthesizer, chooseFanout, type TimelineStrategySource } from '../src/timeline-synthesizer.js';

describe('chooseFanout', () => {
  it('defaults to three and never exceeds the 2–8 contract', () => {
    expect(chooseFanout(0.5, 10)).toBe(3);
    expect(chooseFanout(0.95, 100)).toBe(8);
    expect(chooseFanout(0.1, 0.5)).toBe(2);
  });
});

describe('createNullInit', () => {
  it('captures immutable baseline hashes for the run', () => {
    const runId = crypto.randomUUID();
    const snapshot = createNullInit(runId, 'sha256:world', 'sha256:capabilities');

    expect(snapshot.runId).toBe(runId);
    expect(snapshot.worldStateHash).toBe('sha256:world');
    expect(snapshot.capabilityHash).toBe('sha256:capabilities');
    expect(snapshot.causalRootHash).toMatch(/^sha256:/);
  });
});

describe('TimelineSynthesizer', () => {
  it('turns independent strategy proposals into branch-local timelines', async () => {
    const contract = ObjectiveContractSchema.parse({
      tenantId: crypto.randomUUID(),
      operatorId: crypto.randomUUID(),
      objective: 'Choose a verified path',
      acceptanceCriteria: ['one timeline passes all hard invariants'],
      hardConstraints: ['do not mutate production during evaluation'],
      preferences: [],
      budget: { maxUsd: 25, maxSeconds: 900 },
      riskPolicy: { maxAutomaticRisk: 'R1' },
    });
    const baseline = createNullInit(crypto.randomUUID(), 'sha256:world', 'sha256:capabilities');
    const source: TimelineStrategySource = {
      propose: async (_contract, _baseline, count) =>
        Array.from({ length: count }, (_, index) => ({ strategy: `strategy-${index + 1}` })),
    };
    const synthesizer = new TimelineSynthesizer(source);

    const timelines = await synthesizer.synthesize(contract, baseline, 0.72, 12);

    expect(timelines).toHaveLength(5);
    expect(new Set(timelines.map(timeline => timeline.id)).size).toBe(5);
    expect(timelines.every(timeline => timeline.actions.length === 0)).toBe(true);
  });
});
