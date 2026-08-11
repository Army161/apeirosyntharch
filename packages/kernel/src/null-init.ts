import { createHash, randomUUID } from 'node:crypto';
import type { NullInitSnapshot } from '@apeiro/contracts';

export function createNullInit(
  runId: string,
  worldStateHash: string,
  capabilityHash: string,
): NullInitSnapshot {
  const causalRootHash = `sha256:${createHash('sha256')
    .update(`${runId}:${worldStateHash}:${capabilityHash}`)
    .digest('hex')}`;

  return {
    id: randomUUID(),
    runId,
    worldStateHash,
    capabilityHash,
    causalRootHash,
    createdAt: new Date().toISOString(),
  };
}

