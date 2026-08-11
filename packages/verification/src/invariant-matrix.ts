import type { InvariantResult, Timeline, VerifiedTimeline } from '@apeiro/contracts';

export interface InvariantValidator {
  verify(timeline: Timeline): Promise<InvariantResult>;
}

export class InvariantMatrix {
  constructor(private readonly validators: InvariantValidator[]) {}

  async evaluate(timeline: Timeline): Promise<VerifiedTimeline> {
    const invariants: InvariantResult[] = [];

    for (const validator of this.validators) {
      const result = await validator.verify(timeline);
      invariants.push(result);
      if (result.hard && !result.passed) {
        return { ...timeline, status: 'rejected', invariants, score: 0 };
      }
    }

    const passed = invariants.filter(result => result.passed).length;
    const score = invariants.length === 0 ? 0 : passed / invariants.length;
    return { ...timeline, status: 'verified', invariants, score };
  }
}

