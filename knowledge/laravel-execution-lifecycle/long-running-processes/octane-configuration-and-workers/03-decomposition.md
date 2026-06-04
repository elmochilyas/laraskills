# Decomposition: Octane Configuration and Workers

## Boundary Analysis
This KU covers operational configuration of Octane workers. It is an **ops-focused** KU bridging the architecture overview and the performance/memory KUs.

**In-scope:**
- `config/octane.php` all options and their effects
- Worker count, max requests, and timeout tuning
- Runtime-specific configuration differences
- Worker lifecycle management (spawn, recycle, shutdown)
- Performance tuning strategies for different app profiles

**Out-of-scope:**
- Sandbox mechanics (covered in `octane-architecture-overview`)
- Tick/hook configuration (covered in `octane-lifecycle-hooks`)
- Package compatibility (covered in `octane-package-compatibility`)
- Coroutine safety patterns (briefly mentioned, not detailed)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Configuration is a single coherent topic. Splitting by runtime would duplicate lifecycle concepts.

## Dependency Graph
```
octane-configuration-and-workers
├── Requires: octane-architecture-overview (worker model)
├── → octane-lifecycle-hooks (worker events)
├── → memory-profiling-and-observability (tuning inputs)
├── → static-property-accumulation (max_requests rationale)
└── Related: queue-worker-lifecycle (parallel config domain)
```

## Follow-up Opportunities
- Create a "Swoole Server Options Deep Dive" KU covering `swoole.settings` array options available in `config/octane.php` beyond the basic ones.
- Create a "RoadRunner .rr.yaml Reference" KU mapping Octane config values to RoadRunner configuration directives.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization