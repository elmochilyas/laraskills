# Decomposition: Interface Binding

## Boundary Analysis
**Scope:** The interface binding mechanism — how `bind()`, `singleton()`, and Closure bindings map interfaces to concrete implementations, binding storage in `$bindings` array, and resolution flow for interface-type requests.

**Excluded:**
- Contextual binding (covered in Contextual Binding ku-05)
- Tagged bindings (covered in Tagged Bindings ku-06)
- Container auto-resolution (covered in Automatic Injection ku-04)
- Service provider registration patterns (covered in Service Providers subdomain)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Interface binding is a single mechanism — the explicit binding of interfaces to concretions. The KU covers registration, resolution, lifecycle (bind vs singleton), and testing implications.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│               Interface Binding (ku-08)                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── DI Container Basics (ku-01) — binding storage     │
│       and resolution flow                                 │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Contextual Binding (ku-05) — extends interface    │
│   │   binding per-consumer                                │
│   ├── Tagged Bindings (ku-06) — groups interface        │
│   │   implementations under a tag                         │
│   └── Testing with Container — swap bindings via        │
│       instance() in tests                                 │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Binding coverage report:** Tool to check which interfaces have bindings vs relying on auto-resolution.
- **Interface explosion audit:** Detect interfaces created prematurely (only one implementation, no foreseeable swap).
- **Binding-to-interface validation:** Static analysis to ensure bound concrete implements the interface.
- **Singleton vs bind decision guide:** Decision tree for choosing between bind() and singleton() for interfaces.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
