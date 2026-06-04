# Decomposition: Application Flush and Reset

## Boundary Analysis
The KU covers `flush()`, `reset()`, `hasBeenBootstrapped()`, `isBooted()`, and the selective state survival design. The boundary starts when `flush()` or `reset()` is invoked and ends when the container state is fully cleared and (in reset's case) re-initialized. Excluded are the Octane integration layer (which calls `reset()` and adds event dispatching) and the bootstrapper sequence itself.

**In scope:** `flush()` implementation, `reset()` implementation, `hasBeenBootstrapped` guard mechanics, state survival decisions, scoped singleton clearing, AliasLoader reset.
**Out of scope:** Octane middleware, Swoole/RoadRunner worker lifecycle, service provider `register()`/`boot()` re-execution after reset.

## Atomicity Assessment
**Status:** ⚡ Splittable (2 units)

**Proposed split:**
1. **Flush Mechanism** — `flush()` implementation, what survives and what is cleared, the design rationale for selective state survival.
2. **Reset and Guard Mechanism** — `reset()` implementation, re-registration of base bindings and aliases, `hasBeenBootstrapped` guard lifecycle, provider re-registration via `$this->loadedProviders` clearing.

**Splitting rationale:** `flush()` is a destructive operation (clearing state). `reset()` is a constructive operation (clearing + rebuilding + unlocking). They serve different architectural purposes and are consumed by different callers. Understanding what `flush()` clears does not require understanding how `reset()` rebuilds.

## Dependency Graph
```
┌─────────────────────┐
│  Application State  │
│  (post-bootstrap)   │
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
flush()    reset()
    │         │
    │         ├── flush()
    │         ├── registerBaseBindings()
    │         ├── registerCoreContainerAliases()
    │         └── hasBeenBootstrapped = false
    │
    ▼         ▼
┌────────┐ ┌────────┐
│ Minimal│ │ Clean  │
│ State  │ │ State  │
│(app ref│ │(ready  │
│ only)  │ │for use)│
└────────┘ └────────┘
```

`reset()` depends on `flush()` plus `registerBaseBindings()` and `registerCoreContainerAliases()` from the Application constructor phase.

## Follow-up Opportunities
- **Octane Integration Deep Dive:** How the `OctaneApplication` trait wraps `reset()` with pre/post event dispatching, and how these events are consumed by Octane's middleware pipeline.
- **Leak Detection Methodology:** Tools and techniques for detecting container state leaks across requests in long-running processes — comparing container state arrays before and after `flush()`.
- **Custom State Survival Configuration:** Propose an API for marking user-defined bindings as "flush immune" — analogous to how base bindings survive `flush()` — to reduce re-registration overhead for performance-critical bindings.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization