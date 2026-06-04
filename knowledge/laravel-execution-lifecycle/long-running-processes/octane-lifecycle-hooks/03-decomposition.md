# Decomposition: Octane Lifecycle Hooks

## Boundary Analysis
This KU covers the event and callback hooks provided by Octane for lifecycle observation and intervention. It is an **API-pattern** KU that teaches the hook surfaces without deep-diving into any single runtime implementation.

**In-scope:**
- `tick()` API, semantics, and lifecycle
- `RequestTerminated` event and listener patterns
- `RequestReceived`, `WorkerStarting`, `WorkerStopping` events
- `RouteResolved` event (Swoole-specific)
- Best practices for hook implementations
- Error handling and monitoring within hooks

**Out-of-scope:**
- Runtime-specific event loop details (covered in adapter-specific KUs)
- Queue worker lifecycle hooks (covered in `queue-worker-lifecycle`)
- Low-level Swoole event callbacks (e.g., `onWorkerStart`, `onReceive`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
All hooks are facets of the same lifecycle system. Splitting by hook type would create artificial fragmentation.

## Dependency Graph
```
octane-lifecycle-hooks
├── Requires: octane-architecture-overview (lifecycle context)
├── → singleton-state-leaks (cleanup strategy)
├── → static-property-accumulation (cleanup strategy)
├── → memory-profiling-and-observability (tick metrics)
├── → octane-configuration-and-workers (worker lifecycle interplay)
└── Related: queue-worker-lifecycle (parallel hook system)
```

## Follow-up Opportunities
- Create a "Swoole Event Loop Deep Dive" KU covering Swoole's native event callbacks and how Octane maps to them.
- Create a "Tick-Based Maintenance Patterns" KU with recipes (cache warming, metric aggregation, connection pool management).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization