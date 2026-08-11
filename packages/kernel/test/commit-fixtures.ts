import { createHash, randomUUID } from 'node:crypto';
import type {
  ActionIntent,
  ApprovalRecord,
  CommitEffect,
  RealityCommitRecord,
  RiskClass,
} from '@apeiro/contracts';
import type { CommitStore, CommitTarget } from '../src/reality-commit.js';

export function makeAction(risk: RiskClass): ActionIntent {
  const id = randomUUID();
  const contentHash = `sha256:${createHash('sha256').update(`${id}:${risk}`).digest('hex')}`;
  return {
    id,
    capabilityId: 'test.capability',
    arguments: { value: 'verified' },
    risk,
    idempotencyKey: `commit:${id}`,
    preconditions: [],
    contentHash,
  };
}

export function approvedFor(action: ActionIntent, freshAuthorizationAt = Date.now()): ApprovalRecord {
  return {
    id: randomUUID(),
    actionId: action.id,
    actionContentHash: action.contentHash,
    status: 'approved',
    freshAuthorizationAt,
  };
}

export class MemoryCommitStore implements CommitStore {
  private readonly records = new Map<string, RealityCommitRecord>();

  async has(idempotencyKey: string): Promise<boolean> {
    return this.records.has(idempotencyKey);
  }

  async get(idempotencyKey: string): Promise<RealityCommitRecord | null> {
    return this.records.get(idempotencyKey) ?? null;
  }

  async save(record: RealityCommitRecord): Promise<void> {
    this.records.set(record.idempotencyKey, record);
  }
}

export class RecordingCommitTarget implements CommitTarget {
  applyCount = 0;

  async apply(): Promise<CommitEffect> {
    this.applyCount += 1;
    return { summary: 'applied' };
  }

  async compensate(): Promise<void> {
    return undefined;
  }
}

