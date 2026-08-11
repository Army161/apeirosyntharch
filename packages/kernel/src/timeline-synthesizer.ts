import { randomUUID } from 'node:crypto';
import type {
  NullInitSnapshot,
  ObjectiveContract,
  StrategyProposal,
  Timeline,
} from '@apeiro/contracts';

export function chooseFanout(uncertainty: number, remainingUsd: number): number {
  if (remainingUsd < 1) return 2;
  if (uncertainty >= 0.85 && remainingUsd >= 20) return 8;
  if (uncertainty >= 0.7 && remainingUsd >= 10) return 5;
  return 3;
}

export interface TimelineStrategySource {
  propose(
    contract: ObjectiveContract,
    baseline: NullInitSnapshot,
    count: number,
  ): Promise<StrategyProposal[]>;
}

export class TimelineSynthesizer {
  constructor(private readonly strategySource: TimelineStrategySource) {}

  async synthesize(
    contract: ObjectiveContract,
    baseline: NullInitSnapshot,
    uncertainty: number,
    remainingUsd: number,
  ): Promise<Timeline[]> {
    const count = chooseFanout(uncertainty, remainingUsd);
    const proposals = await this.strategySource.propose(contract, baseline, count);

    if (proposals.length !== count) {
      throw new Error(`strategy_count_mismatch:${proposals.length}:${count}`);
    }

    return proposals.map(proposal => ({
      id: randomUUID(),
      runId: baseline.runId,
      parentId: null,
      strategy: proposal.strategy,
      status: 'created',
      actions: [],
      evidence: [],
      delta: { paths: {} },
      resourceUsage: { usd: 0, elapsedMs: 0 },
    }));
  }
}

