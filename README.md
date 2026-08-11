# Apeirosyntharch

Apeirosyntharch is a model-agnostic causal-timeline AI agent runtime. It executes multiple candidate futures in isolation, verifies their outcomes against explicit invariants, selects or merges the strongest valid result, and commits only an authorized winning state.

## Execution spine

```text
ObjectiveContract
  -> NullInit
  -> TimelineSynthesizer
  -> TimelineForks
  -> IsolatedExecution
  -> InvariantMatrix
  -> SovereignArchitect
  -> RiskGate
  -> ApprovalGate
  -> RealityCommit
  -> CausalLedger
```

## Current checkpoint

The repository currently contains the V1 domain contracts and causal kernel, invariant verification, sovereign timeline selection, risk-gated exactly-once commits, model routing, MCP capability normalization, and CapabilityGenesis lifecycle controls.

The remaining V1 implementation covers Supabase persistence and row-level security, Temporal durability, private isolated runners, the Next.js control plane, observability, and end-to-end production validation.

## Development

Requirements:

- Node.js 24
- npm 11+

Install and verify:

```bash
npm ci
npm test -- --run
npm run typecheck
```

## Documentation

- [Design specification](docs/superpowers/specs/2026-08-08-apeirosyntharch-design.md)
- [V1 implementation plan](docs/superpowers/plans/2026-08-08-apeirosyntharch-v1.md)

## Status

Private pre-release software. No open-source license has been granted.

Copyright 2026 Jeremy Gephart / OpenStar AI Agents. All rights reserved.
