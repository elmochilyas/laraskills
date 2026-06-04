# Decomposition: Singleton State Leaks

## Boundary Analysis
This KU focuses strictly on mutation of singleton service instances across requests under Octane. It does not cover static properties (separate KU) or configuration binding strategies.

**In-scope:**
- Mechanism of singleton sharing in the container
- Patterns of state mutation that cause leaks
- Detection and mitigation strategies
- First-party Laravel services that historically leaked

**Out-of-scope:**
- Static property accumulation (separate KU)
- Scoped bindings as a solution (covered in `scoped-bindings-for-octane`)
- Queue worker lifecycle (covered in `queue-worker-lifecycle`)
- Memory profiling tools (covered in `memory-profiling-and-observability`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
This is the most critical single concept for Octane correctness. The KU is focused and self-contained.

## Dependency Graph
```
singleton-state-leaks
├── Requires: octane-architecture-overview (sandbox concept)
├── → scoped-bindings-for-octane (solution KU, downstream)
├── → static-property-accumulation (parallel concern, related)
├── → service-binding-audit (tooling KU, downstream)
└── → octane-package-compatibility (evaluation KU, downstream)
```

## Follow-up Opportunities
- Create a "Depth: Laravel Service Provider Audit" KU with concrete code examples of each first-party provider's Octane safety status.
- Create a "Singleton Leak Test Patterns" KU covering automated test strategies for detecting leaks in CI.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization