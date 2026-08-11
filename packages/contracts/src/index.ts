import { z } from 'zod';

export const RiskClassSchema = z.enum(['R0', 'R1', 'R2', 'R3']);
export type RiskClass = z.infer<typeof RiskClassSchema>;

export const ObjectiveContractSchema = z.object({
  tenantId: z.uuid(),
  operatorId: z.uuid(),
  objective: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  hardConstraints: z.array(z.string().min(1)),
  preferences: z.array(z.string().min(1)),
  budget: z.object({
    maxUsd: z.number().positive(),
    maxSeconds: z.number().int().positive(),
  }),
  riskPolicy: z.object({
    maxAutomaticRisk: RiskClassSchema,
  }),
});

export type ObjectiveContract = z.infer<typeof ObjectiveContractSchema>;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface NullInitSnapshot {
  id: string;
  runId: string;
  worldStateHash: string;
  capabilityHash: string;
  causalRootHash: string;
  createdAt: string;
}

export interface ActionIntent {
  id: string;
  capabilityId: string;
  arguments: Record<string, JsonValue>;
  risk: RiskClass;
  idempotencyKey: string;
  preconditions: string[];
  contentHash: string;
}

export interface EvidenceRecord {
  id: string;
  kind: string;
  passed: boolean;
  summary: string;
}

export interface TimelineDelta {
  paths: Record<string, JsonValue>;
}

export type TimelineStatus = 'created' | 'running' | 'verified' | 'rejected' | 'committed';

export interface ResourceUsage {
  usd: number;
  elapsedMs: number;
}

export interface Timeline {
  id: string;
  runId: string;
  parentId: string | null;
  strategy: string;
  status: TimelineStatus;
  actions: ActionIntent[];
  evidence: EvidenceRecord[];
  delta: TimelineDelta;
  resourceUsage: ResourceUsage;
}

export interface StrategyProposal {
  strategy: string;
}

export interface InvariantResult {
  id: string;
  hard: boolean;
  passed: boolean;
  summary: string;
}

export interface VerifiedTimeline extends Timeline {
  invariants: InvariantResult[];
  score: number;
}

export interface SovereignDecision {
  kind: 'select' | 'merge' | 'fork_again' | 'reject';
  timelineIds: string[];
  requiresReverification: boolean;
  reason: string;
}

export interface ApprovalRecord {
  id: string;
  actionId: string;
  actionContentHash: string;
  status: 'approved' | 'rejected';
  freshAuthorizationAt: number;
}

export type AuthorizationResult =
  | { allowed: true }
  | { allowed: false; reason: 'approval_required' | 'approval_mismatch' | 'fresh_authorization_required' };

export interface CommitEffect {
  summary: string;
  externalId?: string;
}

export interface RealityCommitRecord {
  id: string;
  actionId: string;
  idempotencyKey: string;
  effect: CommitEffect;
  committedAt: string;
}

export type CausalEventType =
  | 'run_started'
  | 'timeline_created'
  | 'timeline_verified'
  | 'sovereign_decision'
  | 'approval_requested'
  | 'reality_committed'
  | 'run_failed';

export interface NewCausalEvent {
  tenantId: string;
  runId: string;
  type: CausalEventType;
  payload: Record<string, JsonValue>;
}

export interface CausalEvent extends NewCausalEvent {
  id: string;
  sequence: number;
  createdAt: string;
}
