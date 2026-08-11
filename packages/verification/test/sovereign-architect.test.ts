import { describe, expect, it } from 'vitest';
import { SovereignArchitect, detectDeltaConflicts } from '../src/sovereign-architect.js';
import { makeVerifiedTimeline } from './fixtures.js';

describe('SovereignArchitect', () => {
  it('never selects a branch with a hard invariant failure', async () => {
    const architect = new SovereignArchitect();
    const failing = makeVerifiedTimeline('alpha', 0.99, [{ hard: true, passed: false }]);
    const valid = makeVerifiedTimeline('beta', 0.72, [{ hard: true, passed: true }]);

    const decision = await architect.decide([failing, valid], 10);

    expect(decision.kind).toBe('select');
    expect(decision.timelineIds).toEqual(['beta']);
  });

  it('forks again when all branches fail and budget remains', async () => {
    const architect = new SovereignArchitect();
    const failing = makeVerifiedTimeline('alpha', 0.99, [{ hard: true, passed: false }]);

    expect((await architect.decide([failing], 2)).kind).toBe('fork_again');
    expect((await architect.decide([failing], 0.5)).kind).toBe('reject');
  });

  it('requires re-verification when two near-equal valid branches can merge without conflicts', async () => {
    const architect = new SovereignArchitect();
    const alpha = makeVerifiedTimeline('alpha', 0.9, [{ hard: true, passed: true }], { '/a': 'one' });
    const beta = makeVerifiedTimeline('beta', 0.88, [{ hard: true, passed: true }], { '/b': 'two' });

    const decision = await architect.decide([alpha, beta], 10);

    expect(decision.kind).toBe('merge');
    expect(decision.requiresReverification).toBe(true);
    expect(detectDeltaConflicts(alpha.delta, beta.delta)).toEqual([]);
  });

  it('detects conflicting branch deltas', () => {
    const alpha = makeVerifiedTimeline('alpha', 0.9, [{ hard: true, passed: true }], { '/shared': 'one' });
    const beta = makeVerifiedTimeline('beta', 0.88, [{ hard: true, passed: true }], { '/shared': 'two' });

    expect(detectDeltaConflicts(alpha.delta, beta.delta)).toEqual(['/shared']);
  });
});
