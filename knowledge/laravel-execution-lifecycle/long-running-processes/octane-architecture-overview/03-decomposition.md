# Decomposition: Octane Architecture Overview

## Boundary Analysis
This KU covers the architectural foundation of Laravel Octane. It is a **survey-level** KU that establishes vocabulary and mental models for all other KUs in this subdomain.

**In-scope:**
- Worker boot sequence and lifecycle
- Sandbox creation and destruction mechanism
- Runtime adapters (Swoole, RoadRunner, FrankenPHP)
- One-time boot vs per-request boot distinction
- Max-requests recycling strategy

**Out-of-scope:**
- Detailed singleton leak mechanics (delegated to `singleton-state-leaks`)
- Per-binding sandbox behavior (delegated to `scoped-bindings-for-octane`)
- Static property leak analysis (delegated to `static-property-accumulation`)
- Tick and hook implementation details (delegated to `octane-lifecycle-hooks`)
- Configuration tuning specifics (delegated to `octane-configuration-and-workers`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The KU is cohesive — architecture overview must be understood before any of the deeper KUs. It is the prerequisite entry point.

## Dependency Graph
```
octane-architecture-overview
├── → singleton-state-leaks (downstream consumer)
├── → scoped-bindings-for-octane (downstream consumer)
├── → static-property-accumulation (downstream consumer)
├── → octane-lifecycle-hooks (downstream consumer)
├── → octane-configuration-and-workers (downstream consumer)
├── → service-binding-audit (downstream consumer)
├── → octane-package-compatibility (downstream consumer)
└── → memory-profiling-and-observability (downstream consumer)
```

## Follow-up Opportunities
- Create a KU on "Octane Sandbox Internals" that dives into the `Sandbox` class source code, cloning strategy, and performance optimization of sandbox creation.
- Create a KU on "Runtime Adapter Comparison" comparing Swoole vs RoadRunner vs FrankenPHP for specific deployment scenarios (high concurrency, I/O-bound, CPU-bound).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization