export interface ModelRequirements {
  capability: string;
  maxUsd: number;
}

export interface ProviderCandidate {
  providerId: string;
  modelId: string;
  capabilities: string[];
  qualityScore: number;
  estimatedUsd: number;
  latencyMs: number;
}

export interface ProviderChoice {
  providerId: string;
  modelId: string;
}

export class ModelRouter {
  select(requirements: ModelRequirements, candidates: ProviderCandidate[]): ProviderChoice {
    const eligible = candidates.filter(
      candidate =>
        candidate.capabilities.includes(requirements.capability) &&
        candidate.estimatedUsd <= requirements.maxUsd,
    );

    if (eligible.length === 0) throw new Error('no_eligible_model');

    const ranked = eligible.toSorted(
      (left, right) =>
        right.qualityScore / Math.max(right.estimatedUsd, 0.000_001) -
        left.qualityScore / Math.max(left.estimatedUsd, 0.000_001),
    );
    const winner = ranked[0];
    if (!winner) throw new Error('no_eligible_model');
    return { providerId: winner.providerId, modelId: winner.modelId };
  }
}

