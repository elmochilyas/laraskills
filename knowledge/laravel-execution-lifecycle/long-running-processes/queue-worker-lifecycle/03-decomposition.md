# Decomposition: Queue Worker Lifecycle

## Boundary Analysis
This KU covers the lifecycle of Laravel queue workers as long-running PHP processes, with emphasis on state persistence and leak patterns. It parallels the Octane lifecycle KUs.

**In-scope:**
- Queue worker boot sequence and job loop
- Container persistence across jobs
- `Queue::looping()` mechanism
- Horizon supervisor architecture
- Config options (`--max-jobs`, `--max-time`, `--sleep`, `--tries`)
- State leak patterns specific to queue workers
- Differences from Octane lifecycle

**Out-of-scope:**
- Specific queue driver internals (Redis, SQS, Database)
- Job batching mechanics
- Failed job storage and retry logic
- Queue event system (`JobProcessing`, `JobProcessed`, `JobFailed`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Queue worker lifecycle is a coherent topic. Splitting by driver or by parallel vs serial processing would lose the lifecycle perspective.

## Dependency Graph
```
queue-worker-lifecycle
├── Requires: singleton-state-leaks (shared state patterns)
├── Requires: static-property-accumulation (accumulation patterns)
├── Related: octane-architecture-overview (parallel architecture)
├── Related: octane-lifecycle-hooks (parallel hook system)
├── → memory-profiling-and-observability (profiling tools)
└── Related: service-binding-audit (applicable to queue bindings)
```

## Follow-up Opportunities
- Create a "Horizon Architecture and Tuning" KU covering Horizon supervisor internals, auto-scaling algorithm, and deployment patterns.
- Create a "Queue Job State Safety Guide" KU with a checklist for auditing job classes for state safety under long-running workers.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization