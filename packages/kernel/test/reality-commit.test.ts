import { describe, expect, it } from 'vitest';
import { RealityCommitService } from '../src/reality-commit.js';
import { RiskGate } from '../src/risk-gate.js';
import {
  MemoryCommitStore,
  RecordingCommitTarget,
  approvedFor,
  makeAction,
} from './commit-fixtures.js';

describe('RealityCommitService', () => {
  it('blocks R2 without approval and applies an approved action once', async () => {
    const target = new RecordingCommitTarget();
    const service = new RealityCommitService(new MemoryCommitStore(), target, new RiskGate());
    const action = makeAction('R2');

    await expect(service.commit(action)).rejects.toThrow('approval_required');
    const approval = approvedFor(action);
    const first = await service.commit(action, approval);
    const second = await service.commit(action, approval);

    expect(target.applyCount).toBe(1);
    expect(second.id).toBe(first.id);
  });

  it('requires fresh authorization for R3', async () => {
    const service = new RealityCommitService(
      new MemoryCommitStore(),
      new RecordingCommitTarget(),
      new RiskGate(),
    );
    const action = makeAction('R3');
    const stale = approvedFor(action, Date.now() - 301_000);

    await expect(service.commit(action, stale)).rejects.toThrow('fresh_authorization_required');
  });

  it('rejects an approval whose content hash does not match the action', async () => {
    const service = new RealityCommitService(
      new MemoryCommitStore(),
      new RecordingCommitTarget(),
      new RiskGate(),
    );
    const action = makeAction('R2');
    const approval = { ...approvedFor(action), actionContentHash: 'sha256:different' };

    await expect(service.commit(action, approval)).rejects.toThrow('approval_mismatch');
  });
});
