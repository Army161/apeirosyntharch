import type { ProviderCandidate } from '../src/router.js';

export const providers: ProviderCandidate[] = [
  {
    providerId: 'frontier',
    modelId: 'frontier-reasoner',
    capabilities: ['reasoning'],
    qualityScore: 0.95,
    estimatedUsd: 0.8,
    latencyMs: 800,
  },
  {
    providerId: 'efficient',
    modelId: 'efficient-reasoner',
    capabilities: ['reasoning'],
    qualityScore: 0.82,
    estimatedUsd: 0.2,
    latencyMs: 250,
  },
];

