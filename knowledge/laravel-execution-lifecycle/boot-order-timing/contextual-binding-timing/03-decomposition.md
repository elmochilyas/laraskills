# Decomposition: Contextual Binding Timing

## Boundary Analysis
**Scope:** The timing of contextual binding registration and resolution — when `when()->needs()->give()` bindings are registered (in provider register()), when they are resolved (during consumer make()), and how their lifecycle interacts with the bootstrap and request phases.

**Excluded:**
- Contextual binding API syntax and usage patterns (covered in Service Container > Contextual Binding)
- Attribute-based contextual binding (covered in Service Container > Contextual Binding)
- Factory pattern alternatives to contextual binding
- Multi-tenant contextual binding strategies

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Contextual binding timing is a focused topic — the registration window, the resolution moment, and the lifecycle considerations. It's a single concept about when contextual bindings take effect.

## Dependency Graph
```
Contextual Binding Timing
  ├─ Registration: provider register() phase
  │   └─ $contextual array populated
  ├─ Resolution: consumer make() call
  │   └─ Check $contextual before $bindings
  └─ Lifecycle implications
      ├─ Too late (after consumer resolved) → no effect
      └─ Octane persistence → closure caution
```

## Follow-up Opportunities
- Benchmark the performance impact of 100+ contextual bindings on resolution time.
- Explore automatic contextual binding discovery via PHP 8 attributes — eliminating the need for explicit when()->needs()->give() calls.
- Investigate whether contextual bindings could support wildcards (e.g., when(Admin*)::class) for group-level resolution.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
