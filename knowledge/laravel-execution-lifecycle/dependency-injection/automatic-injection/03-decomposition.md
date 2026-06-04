# Decomposition: Automatic Injection

## Boundary Analysis
**Scope:** The auto-resolution mechanism — how the container resolves concrete classes without explicit bindings, the Reflection-based constructor inspection, recursive dependency resolution, and the boundaries where auto-resolution fails (interfaces, primitives, abstracts).

**Excluded:**
- Explicit binding mechanics (covered in Interface Binding ku-08)
- Constructor injection pattern (covered in Constructor Injection ku-02)
- Circular dependency detection (covered in Circular Dependency Resolution ku-09)
- Container build() internals beyond auto-resolution

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Auto-resolution is a single mechanism — the fallback resolution strategy when no binding exists. The KU covers its mechanics, limitations, and performance characteristics.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│             Automatic Injection (ku-04)                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── DI Container Basics (ku-01) — build() method      │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Interface Binding (ku-08) — explicit counterpart  │
│   ├── Circular Dependency Resolution (ku-09) — cycle    │
│   │   detection during auto-resolution                   │
│   └── Constructor Injection (ku-02) — auto-resolution   │
│       is the engine behind constructor injection         │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Auto-resolution profiling tool:** Measure Reflection cost for each resolved class to identify hot paths.
- **Missing binding detector:** Static analysis to find interface type-hints without corresponding bindings.
- **build() source code walkthrough:** Detailed trace through the auto-resolution code path.
- **Constructor parameter analysis for auto-resolution:** Detect parameters that will cause auto-resolution to fail.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
