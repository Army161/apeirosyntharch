import { randomUUID } from 'node:crypto';
import type {
  ActionIntent,
  ApprovalRecord,
  CommitEffect,
  RealityCommitRecord,
} from '@apeiro/contracts';
import { RiskGate } from './risk-gate.js';

export interface CommitStore {
  has(idempotencyKey: string): Promise<boolean>;
  get(idempotencyKey: string): Promise<RealityCommitRecord | null>;
  save(record: RealityCommitRecord): Promise<void>;
}

export interface CommitTarget {
  apply(action: ActionIntent): Promise<CommitEffect>;
  compensate(action: ActionIntent): Promise<void>;
}

export class RealityCommitService {
  constructor(
    private readonly store: CommitStore,
    private readonly target: CommitTarget,
    private readonly riskGate: RiskGate,
  ) {}

  async commit(action: ActionIntent, approval?: ApprovalRecord): Promise<RealityCommitRecord> {
    const authorization = this.riskGate.authorize(action, approval);
    if (!authorization.allowed) throw new Error(authorization.reason);

    if (await this.store.has(action.idempotencyKey)) {
      const existing = await this.store.get(action.idempotencyKey);
      if (!existing) throw new Error('commit_store_inconsistent');
      return existing;
    }

    const effect = await this.target.apply(action);
    const record: RealityCommitRecord = {
      id: randomUUID(),
      actionId: action.id,
      idempotencyKey: action.idempotencyKey,
      effect,
      committedAt: new Date().toISOString(),
    };
    await this.store.save(record);
    return record;
  }
}

