# Decomposition: DI Container Basics

## Boundary Analysis
**Scope:** The fundamental concepts of Laravel's service container — binding types, resolution, aliases, auto-resolution, and the container's role as a dependency manager. Covers `Container` and `Application` classes, their properties, and core methods.

**Excluded:**
- Specific injection patterns (covered in ku-02 through ku-04)
- Advanced container features (covered in ku-05 through ku-09)
- Service provider integration (covered in Service Providers subdomain)
- Container internals (build stack, resolution callbacks — covered in specific KUs)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Container basics is a single coherent topic — the core API and mental models for understanding the container. Advanced features deserve their own KUs.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│               DI Container Basics (ku-01)                 │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── (foundational — no prior KU knowledge needed)      │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Constructor Injection (ku-02)                      │
│   ├── Method Injection (ku-03)                           │
│   ├── Automatic Injection (ku-04)                        │
│   ├── Contextual Binding (ku-05)                         │
│   ├── Tagged Bindings (ku-06)                            │
│   ├── Aliasing Primitives (ku-07)                        │
│   ├── Interface Binding (ku-08)                          │
│   └── Circular Dependency Resolution (ku-09)             │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Container API reference:** Quick-reference guide for all container methods with examples.
- **Container resolution debugger:** Tool to trace resolution paths and identify bottlenecks.
- **Container vs Application comparison:** Detailed diff of what Application adds over Container.
- **Global container access anti-pattern catalog:** Common misuses of `app()` in codebases.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
