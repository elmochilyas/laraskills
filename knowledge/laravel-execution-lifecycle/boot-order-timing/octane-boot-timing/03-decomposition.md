# Decomposition: Octane Boot Timing

## Boundary Analysis
**Scope:** Octane's boot model: one-time boot vs per-request, the sandbox mechanism (`ApplicationState`, `Sandbox` classes), what is sandboxed vs shared, the `$booted` flag behavior, callback accumulation and deduplication patterns, memory model differences (worker-level singletons vs request-scoped instances), and Octane-specific lifecycle (ticks, tables, graceful reload).

**Excluded:**
- Octane server configuration (port, host, worker count — ops concern)
- Octane installation and setup (separate domain)
- RoadRunner vs Swoole server implementation details (only the Laravel-level boot differences)
- Performance benchmarking of Octane vs FPM (covered in Performance Considerations tangentially)
- Octane's integration with specific packages (mentioned only if relevant to boot timing)
- Octane's route caching or view caching (storage-layer concerns)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Octane's boot-timing characteristics form a single coherent concept: the shift from per-request booting to one-time booting with sandbox-based request isolation. The sandbox, callback deduplication, and memory management are all direct consequences of this shift and cannot be understood in isolation.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              Octane Boot Timing                          │
├─────────────────────────────────────────────────────────┤
│ Depends on: Complete Boot Sequence (Octane runs the      │
│   same 16-step sequence once; subsequent requests        │
│   skip steps 1-10)                                      │
│ Prerequisite for: (none—specialized KU for Octane devs)  │
│ Related to:                                              │
│   ├── Console vs HTTP Boot Differences (both share       │
│   │   the concept of "boot once, handle many")           │
│   ├── Deferred Provider Loading Timing (deferred         │
│   │   providers are less impactful under Octane's        │
│   │   amortized boot model)                              │
│   └── Lifecycle Callback Hooks (callbacks must be        │
│       registered to avoid accumulation under Octane)     │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Sandbox audit guide:** A systematic process for checking if a custom service provider is Octane-safe.
- **Automatic sandbox detection tool:** Static analysis that flags singleton closures capturing `request`, `session`, or `auth`.
- **Callback accumulation profiler:** Runtime detection of listener/callback count growth across requests.
- **Octane worker memory visualization:** Dashboard showing per-worker RSS growth over time, correlated with sandbox events.
- **Partial sandboxing RFC:** Design document for an attribute-based sandbox declaration system (`#[Sandboxed]`, `#[Shared]`).
- **Migration guide:** FPM-to-Octane migration checklist focused on boot-timing pitfalls.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization