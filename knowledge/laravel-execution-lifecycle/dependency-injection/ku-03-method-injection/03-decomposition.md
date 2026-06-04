# Decomposition: Method Injection

## Boundary Analysis
**Scope:** The method injection pattern — how `Container::call()` and `BoundMethod` resolve method-level dependencies, explicit parameter overrides, and when to use method injection versus constructor injection.

**Excluded:**
- Constructor injection (covered in Constructor Injection ku-02)
- Container::call() implementation details beyond usage
- Controller dispatch internals (covered in HTTP Kernel Dispatch)
- Service provider boot() specifics (covered in Service Providers subdomain)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Method injection is a single focused pattern — how and when to resolve dependencies at the method level. The KU covers the API, use cases, and performance implications.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│                Method Injection (ku-03)                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── DI Container Basics (ku-01) — Container::call()   │
│   └── Constructor Injection (ku-02) — companion pattern │
│                                                          │
│ Prerequisite for:                                         │
│   └── Injection Guidelines by Class Type — method       │
│       injection recommendations per class type           │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Hot-path method injection detection:** Tool to find frequently-called methods using method injection that should use constructor injection.
- **Container::call() performance benchmark:** Measure Reflection overhead across different callable types.
- **Method injection in queued jobs:** Patterns for combining serializable payload (constructor) with non-serializable services (method injection).
- **BoundMethod source code walkthrough:** Deep dive into the reflection resolution logic.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
