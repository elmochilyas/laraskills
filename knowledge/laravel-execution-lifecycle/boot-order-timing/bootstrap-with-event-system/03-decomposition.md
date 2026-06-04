# Decomposition: Bootstrap with Event System

## Boundary Analysis
**Scope:** The event dispatching mechanism within `Kernel::bootstrapWith()`, the `bootstrapping:*` / `bootstrapped:*` event naming convention, listener registration patterns, event payload (Application instance), and suppression logic. Covers both built-in bootstrapper events and custom bootstrapper integration.

**Excluded:**
- The bootstrapper implementation details themselves (covered in Complete Boot Sequence)
- Service provider `register()`/`boot()` event system (covered in Register Phase Order, Boot Phase Order)
- `booting()`/`booted()` application callbacks (covered in Lifecycle Callback Hooks)
- Generic Laravel event dispatcher internals (project-level Event domain)
- Octane sandbox event differences (touched in Octane Boot Timing but not detailed here)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** The bootstrap event mechanism is a single, cohesive feature: events fired around bootstrapper execution. The event names, payload structure, suppression rules, and listener patterns are inseparable aspects of one mechanism. Splitting into "event names" vs "listener patterns" would create artificial separation.

## Dependency Graph
```
┌──────────────────────────────────────────────────────────┐
│              Bootstrap with Event System                  │
├──────────────────────────────────────────────────────────┤
│ Depends on: Complete Boot Sequence (provides the          │
│   bootstrapper pipeline that events wrap)                 │
│ Prerequisite for: Lifecycle Callback Hooks (events and    │
│   callbacks form the complete hook system)                │
│ Related to: Deferred Provider Loading Timing (deferred    │
│   providers bypass bootstrap events)                      │
└──────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Custom bootstrapper catalogue:** Document community patterns for custom bootstrappers and their events.
- **Wildcard listener performance benchmark:** Measure the overhead of `bootstrapping: *` vs specific listeners at scale (100+ listeners).
- **Event-driven boot visualization tool:** A CLI dashboard that shows real-time bootstrap event flow with listener durations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization