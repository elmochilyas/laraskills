# Decomposition: Aliasing Primitives

## Boundary Analysis
**Scope:** Primitive aliasing (contextual primitive binding) — how scalar values are bound to constructor parameters via `when()->needs('$param')->give(value)`, replaces injecting entire Config repository, and the $ prefix syntax.

**Excluded:**
- Contextual binding for classes (covered in Contextual Binding ku-05)
- Config repository internals (covered in Config Caching ku-01)
- General constructor injection (covered in Constructor Injection ku-02)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Primitive aliasing is a single focused technique — binding scalar values to named constructor parameters. The KU covers the pattern, syntax, and use cases.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              Aliasing Primitives (ku-07)                  │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── Contextual Binding (ku-05) — the mechanism         │
│   └── DI Container Basics (ku-01) — parameter            │
│       resolution in build()                               │
│                                                          │
│ Prerequisite for:                                         │
│   └── (usage pattern — no downstream KUs depend on it)   │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Config injection audit tool:** Detect classes injecting entire Config repository when only specific keys are needed.
- **$ prefix linter:** Static analysis to detect `needs()` calls without the `$` prefix.
- **Primitive binding documentation generator:** Auto-document which parameters get which values from bindings.
- **Configuration object refactoring guide:** When primitive bindings exceed N, extract into a configuration DTO.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
