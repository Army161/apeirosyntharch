import type { InvariantResult, VerifiedTimeline } from '@apeiro/contracts';

export function makeVerifiedTimeline(
  id: string,
  score: number,
  invariants: Array<{ hard: boolean; passed: boolean }>,
  paths: Record<string, string> = {},
): VerifiedTimeline {
  const normalized: InvariantResult[] = invariants.map((invariant, index) => ({
    id: `${id}-invariant-${index}`,
    hard: invariant.hard,
    passed: invariant.passed,
    summary: invariant.passed ? 'passed' : 'failed',
  }));

  return {
    id,
    runId: '00000000-0000-4000-8000-000000000001',
    parentId: null,
    strategy: id,
    status: normalized.some(result => result.hard && !result.passed) ? 'rejected' : 'verified',
    actions: [],
    evidence: [],
    delta: { paths },
    resourceUsage: { usd: 0.1, elapsedMs: 10 },
    invariants: normalized,
    score,
  };
}

