import type {
  SovereignDecision,
  TimelineDelta,
  VerifiedTimeline,
} from '@apeiro/contracts';

export function detectDeltaConflicts(a: TimelineDelta, b: TimelineDelta): string[] {
  return Object.keys(a.paths).filter(path => path in b.paths && a.paths[path] !== b.paths[path]);
}

export class SovereignArchitect {
  async decide(
    candidates: VerifiedTimeline[],
    budgetRemainingUsd: number,
  ): Promise<SovereignDecision> {
    const valid = candidates.filter(candidate =>
      candidate.invariants.every(invariant => !invariant.hard || invariant.passed),
    );

    if (valid.length === 0) {
      return budgetRemainingUsd >= 1
        ? {
            kind: 'fork_again',
            timelineIds: [],
            requiresReverification: false,
            reason: 'all candidate timelines violated a hard invariant',
          }
        : {
            kind: 'reject',
            timelineIds: [],
            requiresReverification: false,
            reason: 'all candidate timelines failed and the remaining budget is exhausted',
          };
    }

    const ranked = valid.toSorted((left, right) => right.score - left.score);
    const first = ranked[0];
    if (!first) throw new Error('sovereign_no_candidate');
    const second = ranked[1];

    if (
      second &&
      first.score - second.score <= 0.05 &&
      detectDeltaConflicts(first.delta, second.delta).length === 0
    ) {
      return {
        kind: 'merge',
        timelineIds: [first.id, second.id],
        requiresReverification: true,
        reason: 'top verified timelines are complementary and non-conflicting',
      };
    }

    return {
      kind: 'select',
      timelineIds: [first.id],
      requiresReverification: false,
      reason: 'highest scoring timeline passed all hard invariants',
    };
  }
}

