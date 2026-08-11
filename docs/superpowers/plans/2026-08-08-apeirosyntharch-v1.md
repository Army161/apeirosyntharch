# Apeirosyntharch V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable universal causal-timeline agent V1 that accepts an objective, executes competing isolated futures, rejects invalid futures with evidence, risk-gates consequential actions, commits exactly one verified winner, survives workflow failure, and records a causal ledger.

**Architecture:** A TypeScript monorepo separates immutable contracts, the proprietary causal kernel, verification, model/capability meshes, persistence, Temporal durability, isolated runners, and the Next.js control plane. Temporal owns crash-safe workflow replay; PostgreSQL/Supabase owns tenant/application state; Apeirosyntharch owns timeline semantics, sovereign decisions, evidence, and RealityCommit authorization.

**Tech Stack:** Node 24.14.0, TypeScript 7.0.2, Next.js 16.3.0, AI SDK 7.0.58, Zod 4.4.3, Vitest 4.1.10, Temporal 1.22.0, MCP SDK 1.30.0, Supabase JS 2.112.2, Docker, OpenTelemetry API 1.9.1.

## Global Constraints

- Default fan-out: 3 timelines; adaptive range: 2–8.
- R0 read-only and R1 reversible sandbox/local actions may execute automatically.
- R2 external writes/deployments/messages require operator approval.
- R3 destructive, financial, security-sensitive, credential-sensitive, or legally consequential actions require approval plus fresh authorization.
- Hard-invariant failure disqualifies a timeline; the runtime never selects a “least bad” hard-failing branch.
- Models never receive raw long-lived production secrets by default.
- Generated capabilities receive no production credentials until certified and promoted.
- The causal kernel remains model-provider, cloud, IDE, and MCP-server independent.
- MCP integrations target the 2026-07-28 protocol generation using SDK 1.30.0.
- No private chain-of-thought is persisted; store structured evidence, tool outputs, scores, decisions, and concise rationales.

## File Structure

```text
apeirosyntharch/
  apps/
    web/                    Next.js operator/control plane
    worker/                 Temporal worker and activities
    runner/                 private Docker execution runner
  packages/
    contracts/              shared Zod schemas and domain types
    kernel/                 NullInit, timeline fan-out, risk, RealityCommit
    verification/           InvariantMatrix and SovereignArchitect
    model-mesh/             provider registry, routing, BYOK metadata
    capability-mesh/        MCP/native tools and CapabilityGenesis
    persistence/            Supabase repositories and causal ledger
    observability/          OpenTelemetry helpers
  supabase/migrations/      schema, constraints, indexes, RLS
  tests/e2e/                end-to-end causal-timeline proof
  docs/                     design, plan, operator/developer docs
```

---

### Task 1: Repository Foundation and Immutable Contracts

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/contracts.test.ts`

**Interfaces:**
- Produces: `ObjectiveContract`, `NullInitSnapshot`, `Timeline`, `ActionIntent`, `EvidenceRecord`, `RiskClass`, `InvariantResult`, `SovereignDecision`, `RealityCommitRecord`.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Write the contract test first**

```ts
import { describe, expect, it } from 'vitest';
import { ObjectiveContractSchema } from '../src/index';

describe('ObjectiveContractSchema', () => {
  it('rejects an objective without measurable acceptance criteria', () => {
    const result = ObjectiveContractSchema.safeParse({
      tenantId: crypto.randomUUID(),
      operatorId: crypto.randomUUID(),
      objective: 'Improve this repository',
      acceptanceCriteria: [],
      hardConstraints: [],
      preferences: [],
      budget: { maxUsd: 5, maxSeconds: 900 },
      riskPolicy: { maxAutomaticRisk: 'R1' },
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the contract test and verify it fails because the contract module does not exist**

Run: `npm test -- --run packages/contracts/test/contracts.test.ts`  
Expected: FAIL resolving `../src/index`.

- [ ] **Step 3: Implement the shared contracts**

`ObjectiveContractSchema` must use Zod UUIDs, `z.array(z.string().min(1)).min(1)` for acceptance criteria, positive budget limits, and `z.enum(['R0','R1','R2','R3'])` for risk classes. `Timeline` must include `id`, `runId`, `parentId`, `strategy`, `status`, `actions`, `evidence`, `delta`, and `resourceUsage`. `ActionIntent` must carry `capabilityId`, typed JSON arguments, risk class, idempotency key, and preconditions.

```ts
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
  budget: z.object({ maxUsd: z.number().positive(), maxSeconds: z.number().int().positive() }),
  riskPolicy: z.object({ maxAutomaticRisk: RiskClassSchema }),
});
export type ObjectiveContract = z.infer<typeof ObjectiveContractSchema>;

export interface ActionIntent {
  id: string;
  capabilityId: string;
  arguments: Record<string, unknown>;
  risk: RiskClass;
  idempotencyKey: string;
  preconditions: string[];
}

export interface EvidenceRecord { id: string; kind: string; passed: boolean; summary: string; }
export interface TimelineDelta { paths: Record<string, unknown>; }
export interface NullInitSnapshot { id: string; runId: string; worldStateHash: string; capabilityHash: string; causalRootHash: string; }
export interface InvariantResult { id: string; hard: boolean; passed: boolean; summary: string; }
export interface SovereignDecision {
  kind: 'select' | 'merge' | 'fork_again' | 'reject';
  timelineIds: string[];
  requiresReverification: boolean;
}
export interface ApprovalRecord {
  id: string;
  actionId: string;
  status: 'approved' | 'rejected';
  freshAuthorizationAt: number;
}
export type AuthorizationResult = { allowed: true } | { allowed: false; reason: string };
export interface CommitEffect { summary: string; externalId?: string; }
export interface RealityCommitRecord { id: string; actionId: string; idempotencyKey: string; effect: CommitEffect; }

export interface Timeline {
  id: string;
  runId: string;
  parentId: string | null;
  strategy: string;
  status: 'created' | 'running' | 'verified' | 'rejected' | 'committed';
  actions: ActionIntent[];
  evidence: EvidenceRecord[];
  delta: TimelineDelta;
  resourceUsage: { usd: number; elapsedMs: number };
}
```

- [ ] **Step 4: Run contract tests and type checking**

Run: `npm test -- --run packages/contracts/test/contracts.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit the foundation**

```bash
git add .gitignore package.json tsconfig.base.json vitest.config.ts packages/contracts
git commit -m "feat: define apeirosyntharch runtime contracts"
```

---

### Task 2: NullInit and Adaptive Timeline Synthesis

**Files:**
- Create: `packages/kernel/package.json`
- Create: `packages/kernel/src/null-init.ts`
- Create: `packages/kernel/src/timeline-synthesizer.ts`
- Create: `packages/kernel/src/index.ts`
- Create: `packages/kernel/test/timeline-synthesizer.test.ts`

**Interfaces:**
- Consumes: `ObjectiveContract`, `NullInitSnapshot`, `Timeline` from `@apeiro/contracts`.
- Produces: `createNullInit(runId: string, worldStateHash: string, capabilityHash: string): NullInitSnapshot`, `chooseFanout(uncertainty: number, remainingUsd: number): number`, `TimelineStrategySource.propose(contract: ObjectiveContract, baseline: NullInitSnapshot, count: number): Promise<StrategyProposal[]>`, `TimelineSynthesizer.synthesize(contract: ObjectiveContract, baseline: NullInitSnapshot, uncertainty: number, remainingUsd: number): Promise<Timeline[]>`.

- [ ] **Step 1: Write fan-out and baseline tests**

```ts
import { describe, expect, it } from 'vitest';
import { chooseFanout } from '../src/timeline-synthesizer';

describe('chooseFanout', () => {
  it('defaults to three and never exceeds the 2–8 contract', () => {
    expect(chooseFanout(0.5, 10)).toBe(3);
    expect(chooseFanout(0.95, 100)).toBe(8);
    expect(chooseFanout(0.1, 0.5)).toBe(2);
  });
});
```

- [ ] **Step 2: Verify the tests fail before implementation**

Run: `npm test -- --run packages/kernel/test/timeline-synthesizer.test.ts`  
Expected: FAIL because `chooseFanout` is not defined.

- [ ] **Step 3: Implement deterministic fan-out and strategy-source injection**

Use this V1 fan-out rule: remaining budget `< $1` → 2; uncertainty `>= 0.85` and remaining budget `>= $20` → 8; uncertainty `>= 0.7` and remaining budget `>= $10` → 5; otherwise → 3. The synthesizer receives a `TimelineStrategySource` port; model-specific generation does not live inside the kernel.

```ts
export function chooseFanout(uncertainty: number, remainingUsd: number): number {
  if (remainingUsd < 1) return 2;
  if (uncertainty >= 0.85 && remainingUsd >= 20) return 8;
  if (uncertainty >= 0.7 && remainingUsd >= 10) return 5;
  return 3;
}

export interface TimelineStrategySource {
  propose(contract: ObjectiveContract, baseline: NullInitSnapshot, count: number): Promise<StrategyProposal[]>;
}
```

- [ ] **Step 4: Verify tests and contract types**

Run: `npm test -- --run packages/kernel && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit timeline synthesis**

```bash
git add packages/kernel
git commit -m "feat: add nullinit and adaptive timeline synthesis"
```

---

### Task 3: InvariantMatrix and SovereignArchitect

**Files:**
- Create: `packages/verification/package.json`
- Create: `packages/verification/src/invariant-matrix.ts`
- Create: `packages/verification/src/sovereign-architect.ts`
- Create: `packages/verification/src/index.ts`
- Create: `packages/verification/test/fixtures.ts`
- Create: `packages/verification/test/invariant-matrix.test.ts`
- Create: `packages/verification/test/sovereign-architect.test.ts`

**Interfaces:**
- Consumes: `Timeline`, `InvariantResult`, `SovereignDecision`.
- Produces: `InvariantValidator.verify(timeline: Timeline): Promise<InvariantResult>`, `InvariantMatrix.evaluate(timeline: Timeline): Promise<VerifiedTimeline>`, `SovereignArchitect.decide(candidates: VerifiedTimeline[], budgetRemainingUsd: number): Promise<SovereignDecision>`, `detectDeltaConflicts(a: TimelineDelta, b: TimelineDelta): string[]`.
- Test fixture: `makeVerifiedTimeline(id: string, score: number, invariants: Array<{hard: boolean; passed: boolean}>): VerifiedTimeline`.

- [ ] **Step 1: Write hard-failure rejection test**

```ts
import { SovereignArchitect } from '../src/sovereign-architect';
import { makeVerifiedTimeline } from './fixtures';

it('never selects a branch with a hard invariant failure', async () => {
  const architect = new SovereignArchitect();
  const failing = makeVerifiedTimeline('alpha', 0.99, [{ hard: true, passed: false }]);
  const valid = makeVerifiedTimeline('beta', 0.72, [{ hard: true, passed: true }]);
  const decision = await architect.decide([failing, valid], 10);
  expect(decision.kind).toBe('select');
  expect(decision.timelineIds).toEqual(['beta']);
});
```

- [ ] **Step 2: Verify it fails before the selector exists**

Run: `npm test -- --run packages/verification/test`  
Expected: FAIL resolving the architect implementation.

- [ ] **Step 3: Implement verification ordering and sovereign decision rules**

Verification order is hard constraints → deterministic/schema checks → security → acceptance evidence → budget → qualitative evaluator. `decide` filters all hard-failing candidates before score comparison. If none remain it returns `fork_again` while budget permits or `reject` when budget is exhausted. Merge is allowed only when selected deltas have no path conflicts; every merge returns `requiresReverification: true`.

```ts
export class SovereignArchitect {
  async decide(candidates: VerifiedTimeline[], budgetRemainingUsd: number): Promise<SovereignDecision> {
    const valid = candidates.filter(candidate =>
      candidate.invariants.every(invariant => !invariant.hard || invariant.passed),
    );
    if (valid.length === 0) {
      return budgetRemainingUsd >= 1
        ? { kind: 'fork_again', timelineIds: [], requiresReverification: false }
        : { kind: 'reject', timelineIds: [], requiresReverification: false };
    }
    const ranked = valid.toSorted((a, b) => b.score - a.score);
    return { kind: 'select', timelineIds: [ranked[0].id], requiresReverification: false };
  }
}
```

- [ ] **Step 4: Add conflict and all-fail tests, then run suite**

Run: `npm test -- --run packages/verification && npm run typecheck`  
Expected: PASS with coverage for `select`, `merge`, `fork_again`, and `reject`.

- [ ] **Step 5: Commit verification**

```bash
git add packages/verification
git commit -m "feat: add invariant matrix and sovereign decisions"
```

---

### Task 4: RiskGate and Exactly-Once RealityCommit

**Files:**
- Create: `packages/kernel/src/risk-gate.ts`
- Create: `packages/kernel/src/reality-commit.ts`
- Create: `packages/kernel/test/commit-fixtures.ts`
- Create: `packages/kernel/test/reality-commit.test.ts`

**Interfaces:**
- Produces: `RiskGate.authorize(action: ActionIntent, approval?: ApprovalRecord): AuthorizationResult`.
- Produces: `RealityCommitService.commit(action: ActionIntent, approval?: ApprovalRecord): Promise<RealityCommitRecord>`.
- Consumes ports: `CommitStore.has(idempotencyKey: string): Promise<boolean>`, `CommitStore.get(idempotencyKey: string): Promise<RealityCommitRecord | null>`, `CommitStore.save(record: RealityCommitRecord): Promise<void>`, `CommitTarget.apply(action: ActionIntent): Promise<CommitEffect>`, `CommitTarget.compensate(action: ActionIntent): Promise<void>`.
- Test fixture exports `makeAction(risk: RiskClass): ActionIntent`, `approvedFor(actionId: string): ApprovalRecord`, `MemoryCommitStore`, and `RecordingCommitTarget`.

- [ ] **Step 1: Write approval and duplicate-delivery tests**

```ts
import { RealityCommitService } from '../src/reality-commit';
import { RiskGate } from '../src/risk-gate';
import { MemoryCommitStore, RecordingCommitTarget, approvedFor, makeAction } from './commit-fixtures';

const target = new RecordingCommitTarget();
const service = new RealityCommitService(new MemoryCommitStore(), target, new RiskGate());
const r2Action = makeAction('R2');

it('blocks R2 without approval and applies an approved action once', async () => {
  await expect(service.commit(r2Action, undefined)).rejects.toThrow('approval_required');
  const approval = approvedFor(r2Action.id);
  await service.commit(r2Action, approval);
  await service.commit(r2Action, approval);
  expect(target.apply).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Verify the test fails before implementation**

Run: `npm test -- --run packages/kernel/test/reality-commit.test.ts`  
Expected: FAIL because commit service is missing.

- [ ] **Step 3: Implement fail-closed risk authorization and commit idempotency**

R0/R1 are accepted automatically when allowed by the ObjectiveContract. R2 requires a matching approval for the action ID and content hash. R3 additionally requires a non-expired `freshAuthorizationAt` no older than five minutes. Check `CommitStore.has` before `CommitTarget.apply`, persist the result after apply, and return the existing record on redelivery.

```ts
export class RiskGate {
  authorize(action: ActionIntent, approval?: ApprovalRecord): AuthorizationResult {
    if (action.risk === 'R0' || action.risk === 'R1') return { allowed: true };
    if (!approval || approval.actionId !== action.id || approval.status !== 'approved') {
      return { allowed: false, reason: 'approval_required' };
    }
    if (action.risk === 'R3' && Date.now() - approval.freshAuthorizationAt > 300_000) {
      return { allowed: false, reason: 'fresh_authorization_required' };
    }
    return { allowed: true };
  }
}
```

- [ ] **Step 4: Run safety tests**

Run: `npm test -- --run packages/kernel && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit controlled autonomy**

```bash
git add packages/kernel
git commit -m "feat: enforce risk gates and idempotent reality commits"
```

---

### Task 5: Model Mesh, Capability Mesh, and CapabilityGenesis

**Files:**
- Create: `packages/model-mesh/package.json`
- Create: `packages/model-mesh/src/router.ts`
- Create: `packages/model-mesh/src/provider-registry.ts`
- Create: `packages/model-mesh/test/fixtures.ts`
- Create: `packages/model-mesh/test/router.test.ts`
- Create: `packages/capability-mesh/package.json`
- Create: `packages/capability-mesh/src/registry.ts`
- Create: `packages/capability-mesh/src/mcp-client.ts`
- Create: `packages/capability-mesh/src/capability-genesis.ts`
- Create: `packages/capability-mesh/test/fixtures.ts`
- Create: `packages/capability-mesh/test/capability-genesis.test.ts`

**Interfaces:**
- Produces: `ModelRouter.select(requirements: ModelRequirements, candidates: ProviderCandidate[]): ProviderChoice`.
- Produces: `CapabilityRegistry.resolve(intent: ActionIntent): CapabilityVersion | null`.
- Produces: `CapabilityGenesis.generate(intent: ActionIntent): Promise<GeneratedCapability>`.
- Produces: `CapabilityCertifier.certify(generated: GeneratedCapability, evidence: EvidenceRecord[]): CertifiedCapability`.
- Model-mesh fixture exports `providers: ProviderCandidate[]` with two deterministic test candidates using normalized capability/cost/latency metadata.
- Capability-mesh fixture exports `intent: ActionIntent` and `createTestGenesis(): CapabilityGenesis` backed by a deterministic test code generator that emits compilable TypeScript without secret values.

- [ ] **Step 1: Write provider-independence and no-credential genesis tests**

```ts
import { ModelRouter } from '../src/router';
import { providers } from './fixtures';
import { createTestGenesis, intent } from '../../capability-mesh/test/fixtures';

const router = new ModelRouter();

it('routes without provider-specific types leaking into the kernel', () => {
  const choice = router.select({ capability: 'reasoning', maxUsd: 1 }, providers);
  expect(choice.providerId).toEqual(expect.any(String));
  expect(choice.modelId).toEqual(expect.any(String));
});

it('creates an uncertified generated capability with no production secret values', async () => {
  const genesis = createTestGenesis();
  const generated = await genesis.generate(intent);
  expect(generated.status).toBe('generated');
  expect(JSON.stringify(generated)).not.toContain('productionSecretValue');
});
```

- [ ] **Step 2: Verify tests fail before mesh implementations exist**

Run: `npm test -- --run packages/model-mesh packages/capability-mesh`  
Expected: FAIL resolving the new modules.

- [ ] **Step 3: Implement normalized provider and capability registries**

Use AI SDK `createProviderRegistry` behind the model-mesh boundary. Register OpenAI, Anthropic, Google, xAI, OpenAI-compatible/Kimi adapters from operator-provided connection records. MCP connections use SDK 1.30.0 and the 2026-07-28 request/response generation. Tool manifests normalize schemas, read-only/mutation intent, idempotency, external reach, and Apeirosyntharch risk class.

```ts
export class ModelRouter {
  select(requirements: ModelRequirements, candidates: ProviderCandidate[]): ProviderChoice {
    const eligible = candidates.filter(candidate =>
      candidate.capabilities.includes(requirements.capability) && candidate.estimatedUsd <= requirements.maxUsd,
    );
    if (eligible.length === 0) throw new Error('no_eligible_model');
    const ranked = eligible.toSorted((a, b) =>
      (b.qualityScore / Math.max(b.estimatedUsd, 0.000001)) -
      (a.qualityScore / Math.max(a.estimatedUsd, 0.000001)),
    );
    return { providerId: ranked[0].providerId, modelId: ranked[0].modelId };
  }
}
```

- [ ] **Step 4: Implement CapabilityGenesis state machine**

Allowed states are `generated → compiled → sandbox_verified → security_verified → awaiting_approval → certified` with failure terminal `rejected`. State transitions require evidence IDs. Certification emits a versioned manifest and integrity hash; no generated capability can self-certify.

```ts
const transitions: Record<GeneratedCapabilityStatus, GeneratedCapabilityStatus[]> = {
  generated: ['compiled', 'rejected'],
  compiled: ['sandbox_verified', 'rejected'],
  sandbox_verified: ['security_verified', 'rejected'],
  security_verified: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['certified', 'rejected'],
  certified: [],
  rejected: [],
};

export function advanceCapability(
  capability: GeneratedCapability,
  next: GeneratedCapabilityStatus,
  evidenceIds: string[],
): GeneratedCapability {
  if (!transitions[capability.status].includes(next) || evidenceIds.length === 0) {
    throw new Error('invalid_capability_transition');
  }
  return { ...capability, status: next, evidenceIds: [...capability.evidenceIds, ...evidenceIds] };
}
```

- [ ] **Step 5: Run mesh tests and type checking**

Run: `npm test -- --run packages/model-mesh packages/capability-mesh && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit intelligence/capability fabrics**

```bash
git add packages/model-mesh packages/capability-mesh
git commit -m "feat: add model mesh and capability genesis"
```

---

### Task 6: Supabase Persistence, Tenant Isolation, and CausalLedger

**Files:**
- Create: `supabase/migrations/202608080001_apeirosyntharch_core.sql`
- Create: `packages/persistence/package.json`
- Create: `packages/persistence/src/repositories.ts`
- Create: `packages/persistence/src/causal-ledger.ts`
- Create: `packages/persistence/test/fixtures.ts`
- Create: `packages/persistence/test/causal-ledger.test.ts`

**Interfaces:**
- Produces repositories for objectives, runs, checkpoints, timelines, actions, evidence, invariant results, decisions, approvals, commits, capabilities, capability versions, provider connections, and causal events.
- Produces: `CausalLedger.append(event: NewCausalEvent): Promise<CausalEvent>` and `CausalLedger.list(runId: string): Promise<CausalEvent[]>`.
- Test fixture exports `createTestLedger(): Promise<CausalLedger>` and `event(type: CausalEventType): NewCausalEvent` using the local Supabase test database and one isolated test tenant/run.

- [ ] **Step 1: Write append-only ledger tests**

```ts
import { createTestLedger, event } from './fixtures';

it('orders events monotonically and refuses mutation through the repository API', async () => {
  const ledger = await createTestLedger();
  const first = await ledger.append(event('run_started'));
  const second = await ledger.append(event('timeline_created'));
  expect(second.sequence).toBe(first.sequence + 1);
  expect('update' in ledger).toBe(false);
});
```

- [ ] **Step 2: Verify the test fails before repositories exist**

Run: `npm test -- --run packages/persistence/test`  
Expected: FAIL resolving persistence modules.

- [ ] **Step 3: Implement migration schema and RLS**

Every tenant-owned table contains `tenant_id uuid not null`. Add foreign keys from run → objective, timeline → run, action/evidence/invariants → timeline, approval/commit → action, capability_version → capability, and causal_event → run. Add unique `(run_id, sequence)` to causal events and unique `idempotency_key` to commits. Enable RLS on all tenant tables and use policies comparing `tenant_id` with a membership lookup keyed by `auth.uid()`. Service-role access is restricted to trusted worker processes.

```sql
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  objective_id uuid not null references public.objectives(id) on delete cascade,
  status text not null check (status in ('queued','running','awaiting_approval','committed','rejected','failed')),
  created_at timestamptz not null default now()
);

create table public.causal_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  run_id uuid not null references public.runs(id) on delete cascade,
  sequence bigint not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id, sequence)
);

alter table public.runs enable row level security;
alter table public.causal_events enable row level security;
```

- [ ] **Step 4: Implement repository methods and append-only sequence transaction**

Use Supabase/PostgreSQL transactions via an RPC function `append_causal_event(p_run_id, p_event_type, p_payload)` that locks the run row, calculates the next sequence, inserts once, and returns the new event.

```sql
create function public.append_causal_event(p_run_id uuid, p_event_type text, p_payload jsonb)
returns public.causal_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.runs;
  v_sequence bigint;
  v_event public.causal_events;
begin
  select * into v_run from public.runs where id = p_run_id for update;
  if v_run.id is null then raise exception 'run_not_found'; end if;
  select coalesce(max(sequence), 0) + 1 into v_sequence from public.causal_events where run_id = p_run_id;
  insert into public.causal_events(tenant_id, run_id, sequence, event_type, payload)
  values (v_run.tenant_id, p_run_id, v_sequence, p_event_type, p_payload)
  returning * into v_event;
  return v_event;
end;
$$;
```

- [ ] **Step 5: Run local Supabase migration and tests**

Run: `supabase db reset && npm test -- --run packages/persistence`  
Expected: migration succeeds; repository and RLS tests PASS.

- [ ] **Step 6: Commit persistence**

```bash
git add supabase packages/persistence
git commit -m "feat: persist causal timelines with tenant isolation"
```

---

### Task 7: Temporal Durable Workflow and Crash-Safe Activities

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/src/workflows/apeiro-run.ts`
- Create: `apps/worker/src/activities/index.ts`
- Create: `apps/worker/src/worker.ts`
- Create: `apps/worker/test/worker-restart-harness.ts`
- Create: `apps/worker/test/apeiro-run.test.ts`

**Interfaces:**
- Produces: `apeiroRunWorkflow(input: ApeiroRunInput): Promise<ApeiroRunResult>`.
- Activities: `captureNullInit`, `synthesizeTimelines`, `executeTimeline`, `verifyTimeline`, `chooseSovereignDecision`, `prepareCommit`, `commitReality`, `appendCausalEvent`.
- Test harness produces `runWithInjectedWorkerRestart(objective: ObjectiveContract): Promise<ApeiroRunResult>`, `commitProbe.count(runId: string): number`, and `makeAcceptanceObjective(input: {objective: string; acceptanceCriteria: string[]}): ObjectiveContract`.

- [ ] **Step 1: Write a workflow recovery test using Temporal testing utilities**

```ts
import { commitProbe, makeAcceptanceObjective, runWithInjectedWorkerRestart } from './worker-restart-harness';

const objectiveFixture = makeAcceptanceObjective({
  objective: 'Produce a verified repository change',
  acceptanceCriteria: ['exactly one verified RealityCommit is recorded'],
});

it('resumes after a worker restart without applying RealityCommit twice', async () => {
  const result = await runWithInjectedWorkerRestart(objectiveFixture);
  expect(result.status).toBe('committed');
  expect(commitProbe.count(result.runId)).toBe(1);
});
```

- [ ] **Step 2: Verify it fails before the workflow exists**

Run: `npm test -- --run apps/worker/test/apeiro-run.test.ts`  
Expected: FAIL resolving workflow modules.

- [ ] **Step 3: Implement deterministic workflow orchestration**

Workflow code performs only deterministic orchestration. Model calls, database calls, runner operations, verification, and external effects execute as Temporal Activities. Timeline execution fans out with `Promise.all` inside workflow semantics. R2/R3 approval uses a workflow signal; commits carry stable idempotency keys derived before Activity execution.

```ts
import { condition, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow';

const activities = proxyActivities<ApeiroActivities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 },
});

const approvalSignal = defineSignal<[ApprovalRecord]>('approve_action');

export async function apeiroRunWorkflow(input: ApeiroRunInput): Promise<ApeiroRunResult> {
  let approval: ApprovalRecord | undefined;
  setHandler(approvalSignal, value => { approval = value; });
  const baseline = await activities.captureNullInit(input);
  const timelines = await activities.synthesizeTimelines(input, baseline);
  const executed = await Promise.all(timelines.map(timeline => activities.executeTimeline(timeline, baseline)));
  const verified = await Promise.all(executed.map(timeline => activities.verifyTimeline(timeline)));
  const decision = await activities.chooseSovereignDecision(verified, input.remainingBudgetUsd);
  const commitPlan = await activities.prepareCommit(input, baseline, decision);
  if (commitPlan.requiresApproval) await condition(() => approval !== undefined);
  return activities.commitReality(commitPlan, approval);
}
```

- [ ] **Step 4: Add replay and timeout tests**

Run: `npm test -- --run apps/worker && npm run typecheck`  
Expected: PASS for worker restart, activity retry, timeout, approval pause/resume, and duplicate commit delivery.

- [ ] **Step 5: Commit durable execution**

```bash
git add apps/worker
git commit -m "feat: run causal timelines on temporal"
```

---

### Task 8: Private Docker Runner and Branch Isolation

**Files:**
- Create: `apps/runner/package.json`
- Create: `apps/runner/src/docker-runner.ts`
- Create: `apps/runner/src/server.ts`
- Create: `apps/runner/test/docker-runner.integration.test.ts`

**Interfaces:**
- Produces: `DockerRunner.execute(request: RunnerRequest): Promise<RunnerResult>`.
- Runner request includes image digest, command array, input artifact refs, CPU/memory/time limits, network policy, and secret-reference IDs.
- Runner result includes exit code, stdout/stderr artifact hashes, produced artifact hashes, resource usage, and state delta.

- [ ] **Step 1: Write a real Docker isolation integration test**

```ts
import { DockerRunner } from '../src/docker-runner';

const runner = new DockerRunner();

it('runs a branch with no network and a read-only root filesystem by default', async () => {
  const result = await runner.execute({
    image: 'node:24-alpine',
    command: ['node', '-e', "fetch('https://example.com').then(()=>process.exit(9)).catch(()=>process.exit(0))"],
    network: 'none',
    readOnlyRoot: true,
    memoryMb: 256,
    cpu: 0.5,
    timeoutMs: 10_000,
    secretRefs: [],
  });
  expect(result.exitCode).toBe(0);
});
```

- [ ] **Step 2: Verify the test fails before the runner exists**

Run: `npm test -- --run apps/runner/test/docker-runner.integration.test.ts`  
Expected: FAIL resolving `DockerRunner`.

- [ ] **Step 3: Implement container constraints**

Use Dockerode 5.0.1. Defaults: `NetworkMode=none`, `ReadonlyRootfs=true`, `Memory=256 MiB`, `NanoCpus=500000000`, PID limit 128, no privileged mode, and a writable tmpfs only at `/tmp`. Reject host mounts and Docker socket mounts. Kill and remove the container after timeout or completion while retaining only hashed declared artifacts.

```ts
const container = await docker.createContainer({
  Image: request.image,
  Cmd: request.command,
  HostConfig: {
    NetworkMode: 'none',
    ReadonlyRootfs: true,
    Memory: 256 * 1024 * 1024,
    NanoCpus: 500_000_000,
    PidsLimit: 128,
    Privileged: false,
    Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=64m' },
  },
});
```

- [ ] **Step 4: Run isolation integration tests**

Run: `npm test -- --run apps/runner/test/docker-runner.integration.test.ts`  
Expected: PASS with Docker available.

- [ ] **Step 5: Commit runner isolation**

```bash
git add apps/runner
git commit -m "feat: isolate timeline execution in docker runners"
```

---

### Task 9: Next.js Control Plane and Approval Center

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/runs/[runId]/page.tsx`
- Create: `apps/web/src/app/api/objectives/route.ts`
- Create: `apps/web/src/app/api/approvals/[approvalId]/route.ts`
- Create: `apps/web/src/components/objective-console.tsx`
- Create: `apps/web/src/components/timeline-chamber.tsx`
- Create: `apps/web/src/components/invariant-matrix.tsx`
- Create: `apps/web/src/components/sovereign-decision.tsx`
- Create: `apps/web/src/components/approval-center.tsx`
- Create: `apps/web/src/components/capability-registry.tsx`
- Create: `apps/web/test/fixtures.ts`
- Create: `apps/web/test/api-authorization.test.ts`

**Interfaces:**
- POST `/api/objectives` accepts `ObjectiveContract` and starts one Temporal workflow.
- POST `/api/approvals/:approvalId` accepts `approve|reject` and optional fresh-auth proof for R3.
- Run page consumes persisted structured evidence; it never renders hidden chain-of-thought.
- Test fixture exports `tenantBUser: TestUser`, `tenantAApproval: TestApproval`, and `approveAs(user: TestUser, approvalId: string): Promise<Response>` backed by the local Supabase test database.

- [ ] **Step 1: Write API authorization test**

```ts
import { approveAs, tenantAApproval, tenantBUser } from './fixtures';

it('cannot approve another tenant run', async () => {
  const response = await approveAs(tenantBUser, tenantAApproval.id);
  expect(response.status).toBe(404);
});
```

- [ ] **Step 2: Verify it fails before routes exist**

Run: `npm test -- --run apps/web/test/api-authorization.test.ts`  
Expected: FAIL resolving the route test harness.

- [ ] **Step 3: Implement authenticated objective and approval APIs**

Resolve the Supabase user server-side, derive tenant membership from the database, parse bodies with shared Zod schemas, never accept `tenant_id` from the client as authority, and signal the existing Temporal workflow only after ownership checks pass.

```ts
export async function POST(request: Request): Promise<Response> {
  const user = await requireUser(request);
  const body = ObjectiveContractInputSchema.parse(await request.json());
  const tenantId = await requireTenantMembership(user.id, body.workspaceId);
  const contract = ObjectiveContractSchema.parse({ ...body, tenantId, operatorId: user.id });
  const run = await startApeiroWorkflow(contract);
  return Response.json({ runId: run.id }, { status: 202 });
}
```

- [ ] **Step 4: Implement the six approved V1 workspaces**

The default page is Objective Console. A run page renders Timeline Chamber, Invariant Matrix, Sovereign Decision, and Approval Center from structured server data. Capability Registry is a separate panel. R2/R3 approval cards show exact target, arguments summary, expected effect, risk reason, and evidence link before the action button.

```tsx
export function RunWorkspace({ run }: { run: RunView }) {
  return (
    <main>
      <TimelineChamber timelines={run.timelines} />
      <InvariantMatrix results={run.invariants} />
      <SovereignDecision decision={run.decision} />
      <ApprovalCenter approvals={run.pendingApprovals} />
    </main>
  );
}
```

- [ ] **Step 5: Run web tests and production build**

Run: `npm test -- --run apps/web && npm run build --workspace apps/web`  
Expected: PASS and Next.js production build succeeds.

- [ ] **Step 6: Commit control plane**

```bash
git add apps/web
git commit -m "feat: add apeirosyntharch operator control plane"
```

---

### Task 10: Observability, Acceptance Proof, and Production Bundle

**Files:**
- Create: `packages/observability/package.json`
- Create: `packages/observability/src/tracing.ts`
- Create: `tests/e2e/harness.ts`
- Create: `tests/e2e/causal-timeline-proof.test.ts`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `README.md`
- Create: `docs/APEIROSYNTHARCH_V1.md`

**Interfaces:**
- Produces trace spans keyed by `tenantId`, `runId`, `timelineId`, and `actionId` without secret values.
- E2E proof consumes the public ObjectiveContract/API and observes only public runtime outputs and persisted evidence.
- E2E harness exports `realRepositoryObjective: ObjectiveContract`, `submitObjective(objective: ObjectiveContract): Promise<{id: string}>`, `waitForAtLeastThreeTimelines(runId: string): Promise<void>`, and `waitForTerminalRun(runId: string): Promise<CompletedRun>` against the locally running real services.

- [ ] **Step 1: Write the complete V1 causal-timeline proof test**

```ts
import {
  realRepositoryObjective,
  submitObjective,
  waitForAtLeastThreeTimelines,
  waitForTerminalRun,
} from './harness';

it('executes competing futures and commits one verified winner', async () => {
  const run = await submitObjective(realRepositoryObjective);
  await waitForAtLeastThreeTimelines(run.id);
  const finished = await waitForTerminalRun(run.id);
  expect(finished.timelines.length).toBeGreaterThanOrEqual(3);
  expect(finished.timelines.some(t => t.status === 'rejected')).toBe(true);
  expect(finished.commits).toHaveLength(1);
  expect(finished.causalEvents.some(e => e.type === 'sovereign_decision')).toBe(true);
});
```

- [ ] **Step 2: Run it before final integration and confirm failure**

Run: `npm test -- --run tests/e2e/causal-timeline-proof.test.ts`  
Expected: FAIL until services are wired together.

- [ ] **Step 3: Wire Docker Compose for local/reproducible operation**

Compose includes a pinned Temporal development service, `worker`, `runner`, and `web`. Supabase is started separately with the Supabase CLI so the local environment includes Auth/RLS behavior rather than a plain PostgreSQL substitute. Runner is the only application component permitted to talk to Docker Engine. No production secrets are committed. `.env.example` lists variable names and explains whether each is required, BYOK, or local-development-only without containing secret values.

```yaml
services:
  web:
    build: ./apps/web
    depends_on: [worker]
  worker:
    build: ./apps/worker
    depends_on: [temporal]
  runner:
    build: ./apps/runner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
  temporal:
    image: temporalio/auto-setup:1.31.2
```

- [ ] **Step 4: Add OpenTelemetry spans and causal IDs**

Instrument objective acceptance, timeline synthesis, branch execution, invariant verification, sovereign decision, approval wait, and RealityCommit. Error spans include structured error codes but strip credentials and raw authorization headers.

```ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('apeirosyntharch');

export async function traced<T>(
  name: string,
  ids: { runId: string; timelineId?: string; actionId?: string },
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async span => {
    span.setAttribute('apeiro.run_id', ids.runId);
    if (ids.timelineId) span.setAttribute('apeiro.timeline_id', ids.timelineId);
    if (ids.actionId) span.setAttribute('apeiro.action_id', ids.actionId);
    try { return await operation(); } finally { span.end(); }
  });
}
```

- [ ] **Step 5: Run the full verification matrix**

Run: `npm test -- --run && npm run typecheck && npm run build`  
Expected: all unit/integration/e2e tests PASS; all workspaces type-check; production builds succeed.

- [ ] **Step 6: Run forced-crash acceptance**

Start a run, terminate the worker during branch execution, restart the worker, then verify the workflow resumes and the CausalLedger contains exactly one `reality_committed` event and one commit row for the run’s idempotency key.

- [ ] **Step 7: Commit V1 acceptance bundle**

```bash
git add packages/observability tests docker-compose.yml .env.example README.md docs/APEIROSYNTHARCH_V1.md
git commit -m "test: prove apeirosyntharch causal timeline v1"
```

---

## Completion Gate

Before calling V1 complete, all of these must be true:

- At least three materially different timelines are created for the acceptance objective.
- Timeline execution is isolated from production state.
- At least one inferior/hard-invalid timeline is rejected with stored evidence.
- SovereignArchitect selects or re-verifies a merge only from valid candidates.
- R2/R3 actions cannot commit without the required authorization.
- Duplicate Temporal Activity delivery cannot duplicate RealityCommit.
- Forced worker restart resumes the same run.
- CausalLedger exposes the complete structured decision/evidence chain.
- CapabilityGenesis cannot certify itself or receive production secrets while untrusted.
- Cross-tenant API and database tests fail closed.
- `npm test -- --run`, `npm run typecheck`, and `npm run build` all pass.
