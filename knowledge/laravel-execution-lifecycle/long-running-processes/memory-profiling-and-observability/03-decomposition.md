# Decomposition: Memory Profiling and Observability

## Boundary Analysis
This KU covers the tools, metrics, and methodologies for profiling memory in long-running Laravel processes. It is an **ops/tooling** KU that bridges detection and remediation.

**In-scope:**
- Memory measurement primitives (`memory_get_usage`, `gc_status`)
- Per-request delta tracking and accumulation rate calculation
- Static property snapshotting and diffing
- Tool coverage (Blackfire, Telescope, Xdebug, php-meminfo)
- Production profiling setup (metrics dashboard, alerts)
- GC monitoring strategy
- False positive and overhead management

**Out-of-scope:**
- Specific leak remediation (covered in singleton-state-leaks, scoped-bindings)
- Static accumulation mechanics (covered in `static-property-accumulation`)
- Runtime-specific memory tuning (covered in `octane-configuration-and-workers`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Profiling methodology and tooling form a cohesive knowledge unit. Splitting by tool would lose the unified methodology.

## Dependency Graph
```
memory-profiling-and-observability
├── Requires: octane-architecture-overview (worker context)
├── Requires: singleton-state-leaks (what to profile for)
├── Requires: static-property-accumulation (what to profile for)
├── Requires: octane-lifecycle-hooks (measurement hooks)
├── Related: octane-configuration-and-workers (max_requests tuning)
├── Related: octane-package-compatibility (profiling packages)
└── Related: service-binding-audit (verification after audit)
```

## Follow-up Opportunities
- Create a "Memory Leak Investigation Playbook" KU with step-by-step incident response for OOM scenarios.
- Create a "Custom Memory Dashboard with Grafana" KU providing a complete dashboard JSON configuration for Octane memory metrics.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization