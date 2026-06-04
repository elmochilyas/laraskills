# Decomposition: Static Property Accumulation

## Boundary Analysis
This KU focuses exclusively on memory growth from PHP static properties in long-running processes. It does not cover general memory management or container-based state leaks.

**In-scope:**
- Static property growth mechanics
- Common accumulation vectors (Macroable, Blade, Validator, etc.)
- Detection and mitigation strategies
- Interaction with Octane worker lifecycle
- Code patterns that prevent accumulation

**Out-of-scope:**
- Singleton container state leaks (covered in `singleton-state-leaks`)
- General PHP memory management (covered in `memory-profiling-and-observability`)
- Queue worker-specific statics (covered in `queue-worker-lifecycle`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Focused on a single leak vector with clear boundaries.

## Dependency Graph
```
static-property-accumulation
├── Requires: octane-architecture-overview (worker lifecycle)
├── Related: singleton-state-leaks (parallel leak vector)
├── → memory-profiling-and-observability (detection tooling)
├── → octane-package-compatibility (package evaluation)
└── → octane-lifecycle-hooks (cleanup hooks)
```

## Follow-up Opportunities
- Create a "Static Leak Detection Script" KU with a reusable PHP script that scans all defined classes for static properties, snapshots their values, and diffs between requests.
- Create a "Macroable Safety Guide" KU covering all Laravel classes using `Macroable` with per-class Octane safety recommendations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization