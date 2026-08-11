# Apeirosyntharch Universal Agent Runtime — Design Specification

**Date:** 2026-08-08  
**Inventor / Product Owner:** Jeremy Gephart  
**Product:** Apeirosyntharch (ah-PEER-oh-SINTH-ark)  
**Category:** Universal causal-timeline agent runtime  
**Status:** Approved design

## 1. Product Definition

Apeirosyntharch is a universal agent runtime that accepts an outcome-level objective, constructs multiple executable candidate futures, runs those futures in isolation, verifies their outcomes with evidence, selects or merges the best causally valid result, and commits only a verified winning state to the real environment.

It is not tied to one model provider, one tool protocol, one business domain, or one execution environment. Models supply intelligence; tools supply capabilities; Temporal supplies durable workflow mechanics; Apeirosyntharch owns the causal-timeline semantics and decision protocol.

The science-fiction language in the source document is retained as product vocabulary, but every V1 term has a concrete software definition. “Retrocausal execution” means evaluating future candidate states from an earlier checkpoint and using those outcomes to revise earlier planning decisions before any winning state is committed. It does not claim literal physical retrocausality.

## 2. Product Principles

1. **Outcome-first:** Users specify desired outcomes and constraints, not hand-authored workflows.
2. **Executable futures:** A timeline is an isolated execution with observable effects and evidence, not another prose answer.
3. **Evidence before commitment:** No LLM may declare its own branch correct without independent evidence.
4. **Fail closed:** Any hard-invariant violation disqualifies a timeline.
5. **Controlled autonomy:** Reversible low-risk work may commit automatically; consequential actions require explicit operator authorization.
6. **Provider independence:** OpenAI, Anthropic, Google, xAI, Kimi, local models, and future providers are replaceable intelligence resources.
7. **Capability growth:** Missing capabilities can be generated, sandboxed, tested, certified, and promoted.
8. **Durable causality:** Every material transition and real-world commit is recoverable, attributable, and replay-safe.
9. **Portable ownership:** The product may be developed in Replit but cannot depend on Replit-specific model keys, database state, or hosting.

## 3. Canonical Execution Spine

```text
ObjectiveContract
  -> NullInit
  -> TimelineSynthesizer
  -> TimelineForks (2–8 adaptive)
  -> IsolatedExecution
  -> InvariantMatrix
  -> SovereignArchitect
  -> RiskGate
  -> ApprovalGate when required
  -> RealityCommit
  -> CausalLedger + LearningMemory
```

Default V1 fan-out is three timelines. The runtime may reduce to two or expand up to eight when task complexity, uncertainty, and the run budget justify additional search.

## 4. Core Runtime Primitives

### ObjectiveContract

Normalized immutable input for a run:

- objective text;
- measurable acceptance criteria;
- hard constraints;
- soft preferences;
- maximum wall-clock duration;
- maximum model/tool spend;
- risk policy;
- allowed capability scopes;
- operator identity.

### NullInit

Captures the immutable baseline required to evaluate and recover the run:

- world-state snapshot or references to immutable snapshots;
- environment/version identifiers;
- available capability manifest;
- model/provider policy;
- previous run memory selected for this objective;
- causal root hash.

Secrets are never copied into NullInit or model context. State stores opaque credential references only.

### TimelineFork

Each timeline contains:

- stable timeline ID and parent ID;
- strategy hypothesis;
- assigned model/provider profile;
- execution DAG;
- branch-local state overlay;
- action intents and tool evidence;
- resource consumption;
- invariant results;
- output delta against NullInit;
- terminal status.

### OmniMesh

The provider/tool routing fabric. It selects models and capabilities according to task fit, cost, latency, reliability history, privacy constraints, and operator policy. BYOK is supported. The kernel consumes normalized model and tool interfaces rather than provider-specific APIs.

### InvariantMatrix

Verifies a completed or partially completed timeline in this order:

1. hard constraints;
2. deterministic tests and schemas;
3. security/policy checks;
4. acceptance-criterion evidence;
5. cost/time compliance;
6. evaluator judgment for residual qualitative criteria.

Hard-constraint failure immediately disqualifies the branch. High-risk timelines cannot rely on the producing model as their sole evaluator.

### SovereignArchitect

Receives only evidence-bearing candidate timelines and returns exactly one of:

- `select`: choose one verified timeline;
- `merge`: combine non-conflicting deltas, then re-run verification;
- `fork_again`: create a new generation using failure evidence;
- `reject`: no valid path exists under the current contract/budget.

The selector never commits effects directly.

### RealityCommit

Applies a verified winning delta to the real environment. Every commit operation has an idempotency key, precondition check, risk class, provenance link, and—where technically possible—a compensating action.

### CausalLedger

Append-only application-level evidence history containing objective, baseline, timelines, actions, verification results, approvals, sovereign decision, and real commits. Temporal history supplies workflow recovery; CausalLedger supplies product-level explainability and auditability.

## 5. Adaptive Search and Replanning

If every candidate violates a hard invariant, Apeirosyntharch must not select “the least bad” branch. It returns to the latest valid causal checkpoint, incorporates branch failure evidence, and synthesizes another generation if the ObjectiveContract budget permits.

V1 limits automatic replanning to the objective’s explicit time and spend budgets. A run exits with structured `no_valid_timeline` evidence rather than silently relaxing a hard constraint.

## 6. Controlled Autonomy Policy

| Class | Meaning | Default behavior |
| --- | --- | --- |
| R0 | Read/search/analyze with no external mutation | Automatic |
| R1 | Reversible sandbox or local mutation | Automatic |
| R2 | External write, deployment, outbound communication | Operator approval |
| R3 | Destructive, financial, credential/security-sensitive, or legally consequential action | Operator approval plus fresh authorization |

Risk classification is performed before execution and rechecked before RealityCommit. Unrecognized actions default upward to the safer class.

## 7. CapabilityGenesis

When no registered capability satisfies an ActionIntent, the runtime may enter CapabilityGenesis:

```text
Capability Need
 -> Generate typed adapter/tool
 -> Compile/static validation
 -> Isolated sandbox
 -> Contract tests
 -> Security/adversarial tests
 -> Capability certification record
 -> Operator approval
 -> Versioned Capability Registry
```

Generated capabilities receive no production credential material during creation or testing. Promotion creates a versioned capability with declared input/output schema, permissions, risk level, network policy, test evidence, and integrity hash. Changes create a new version rather than mutating certified history.

## 8. Failure, Recovery, and Concurrency

- Temporal is the durable workflow substrate and resumes orchestration after worker/process failures.
- External side effects are Activities guarded by idempotency keys.
- RealityCommit uses preconditions to detect world-state drift between simulation and commit.
- A per-run/target commit lease prevents two timelines from committing the same resource concurrently.
- Retry policies distinguish transient transport failure from semantic/tool failure.
- Circuit breakers suppress repeatedly failing providers/tools and allow OmniMesh to route alternatives.
- Where rollback is impossible, the action is automatically R3.
- Rejected and failed timelines remain evidence records even when their bulky sandbox artifacts expire.

## 9. Security Model

- Secrets live in runtime secret stores; models receive scoped references or short-lived capability access, never raw long-lived secrets by default.
- Every tool has declared permissions, network egress policy, mutation/risk annotations, and an allowlist scope.
- Sandbox network egress is deny-by-default and explicitly granted per capability.
- User/tenant ownership is present on every objective, run, timeline, approval, capability, and ledger record.
- PostgreSQL Row Level Security protects tenant data.
- Generated code cannot access production credentials before certification and promotion.
- Prompt/tool outputs are treated as untrusted input and validated against typed schemas.
- Audit records are immutable to ordinary application roles.

## 10. V1 Product Surface

The operator UI contains six primary workspaces:

1. **Objective Console** — objective, acceptance criteria, constraints, budget, risk settings.
2. **Timeline Chamber** — live branch topology, status, strategy, resource consumption, and evidence.
3. **Invariant Matrix** — pass/fail state by hard and soft verification criterion.
4. **Sovereign Decision** — selected/merged path with evidence and rejected-path explanations.
5. **Approval Center** — R2/R3 actions with exact proposed effect and provenance.
6. **Capability Registry** — installed, generated, certified, disabled, and versioned capabilities.

The UI must expose useful evidence without displaying private chain-of-thought. Stored reasoning is structured decision metadata, tool results, tests, scores, and concise rationales.

## 11. V1 Technology Foundation

| Layer | Foundation |
| --- | --- |
| Primary language | TypeScript |
| Web/control plane | Next.js |
| Database/Auth/Realtime | Supabase/PostgreSQL |
| Durable execution | Temporal |
| Model abstraction | Provider-agnostic AI SDK/provider adapters with BYOK |
| Tool protocol | MCP 2026-07-28 plus native adapters |
| Managed execution | Isolated ephemeral container runners |
| Private execution | Docker-based Apeiro Runner |
| Validation | Zod + deterministic task-specific validators |
| Testing | Vitest + integration/e2e suites |
| Observability | OpenTelemetry + CausalLedger |

Next.js handles the control/UI surface, not long-lived execution. Durable workers and sandbox runners run as independently scalable services.

## 12. Logical Services and Boundaries

### Control Plane

Authenticates operators, accepts ObjectiveContracts, streams run state, presents approvals, and queries ledger evidence. It cannot bypass the runtime’s risk gate.

### Causal Kernel

Owns objective normalization, timeline generation, branch generations, verification orchestration, sovereign decisions, and commit authorization.

### Durable Worker

Maps kernel commands onto Temporal workflows/activities and guarantees replay-safe progress.

### Runner

Executes branch actions in isolated environments, captures deltas/evidence, enforces resource/network constraints, and cannot decide RealityCommit.

### Model Mesh

Normalizes provider invocation, budgets, fallback, routing metadata, and usage accounting.

### Capability Mesh

Normalizes MCP/native tools, permissions, schemas, risk classification, versioning, and credential references.

### Verification Service

Runs deterministic validators and evaluator policies independently from the producing branch.

## 13. Core Persistence Entities

V1 persists at minimum:

- `tenants`
- `users`
- `objectives`
- `runs`
- `checkpoints`
- `timelines`
- `timeline_actions`
- `evidence`
- `invariant_results`
- `sovereign_decisions`
- `approvals`
- `commits`
- `capabilities`
- `capability_versions`
- `provider_connections`
- `causal_events`

Large sandbox artifacts live in object storage and are referenced by content hash; relational tables hold the durable metadata and audit links.

## 14. Required V1 Test Families

1. ObjectiveContract schema and budget enforcement.
2. Timeline isolation: one branch cannot mutate another branch or production state.
3. Hard-invariant rejection and no “least bad” fallback.
4. Sovereign merge conflict detection and re-verification.
5. R2/R3 approval gate fails closed.
6. Idempotent RealityCommit under duplicate delivery/replay.
7. Crash/restart recovery in every major execution phase.
8. World-state drift detection before commit.
9. Cross-tenant isolation and RLS.
10. Model/tool timeout, provider failover, and circuit breaking.
11. Prompt/tool-output injection and malformed schema defenses.
12. CapabilityGenesis sandbox/credential isolation and certification.
13. Budget exhaustion returns structured evidence without hidden continuation.
14. End-to-end proof scenario across at least three candidate timelines.

## 15. V1 Acceptance Demonstration

V1 is successful only when a real objective demonstrates this complete story:

1. an operator submits an ObjectiveContract;
2. Apeirosyntharch creates at least three materially different executable timelines;
3. timelines execute in isolation;
4. at least one inferior/invalid branch is rejected using evidence;
5. a verified winner is selected or a verified merge is created;
6. the runtime requests approval for any consequential real-world action;
7. the winning state is committed exactly once;
8. a forced worker crash proves resumability without duplicate side effects;
9. CausalLedger explains the decision using structured evidence;
10. the completed run is reusable as learning memory for later objectives.

## 16. Product and Revenue Boundary

The commercial product is a managed control plane with optional private execution runners. This supports recurring subscription revenue while allowing enterprises to keep sensitive execution inside their own infrastructure.

V1 product packaging should preserve these natural value meters:

- active objectives/runs;
- parallel timeline capacity;
- managed execution compute;
- model/tool usage when not BYOK;
- private runners;
- audit/evidence retention;
- team/enterprise policy controls.

The proprietary value should remain concentrated in the Causal Timeline Kernel, Invariant Matrix semantics, Sovereign decision protocol, capability certification, causal evidence model, and accumulated execution/evaluation data.

## 17. Novelty Positioning

The exact product name “Apeirosyntharch” produced no matching named AI agent in the preliminary exact-string web search performed during design. That supports distinctiveness of the name, not a legal conclusion of trademark availability, patentability, or architectural priority.

Individual ingredients—multi-agent orchestration, durable workflows, speculative execution, model routing, sandboxing, MCP, verification, and HITL—already exist in the market. Product differentiation therefore rests on the specific end-to-end causal-timeline execution contract: executable future forks from a durable baseline, invariant-based rejection, sovereign select/merge/re-fork semantics, risk-gated reality commitment, and evidence retained across rejected futures.

Any public “first-to-market” or patent claim should be preceded by a dedicated prior-art and trademark search.

## 18. Explicit V1 Non-Goals

- Literal physical time manipulation, quantum-vacuum computation, or altered laws of physics.
- Unlimited recursive agents or unlimited timeline fan-out.
- Autonomous high-consequence actions without an approval gate.
- Training a new foundation model.
- Replacing Temporal with a custom durability engine in V1.
- Dependence on a single cloud, model provider, IDE, or proprietary API-key proxy.

## 19. Canonical Product Statement

**Apeirosyntharch is a universal causal-timeline agent runtime that executes competing futures before committing reality.**

Its defining loop is:

**Synthesize → Execute → Verify → Select → Authorize → Commit → Learn.**
