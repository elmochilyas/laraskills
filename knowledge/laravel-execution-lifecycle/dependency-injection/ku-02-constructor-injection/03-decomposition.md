# Decomposition: Constructor Injection

## Boundary Analysis
**Scope:** The constructor injection pattern in Laravel — how the container resolves type-hinted constructor parameters, recursive dependency resolution, optional dependencies, readonly promoted properties, and best practices for different class types.

**Excluded:**
- Method injection (covered in Method Injection ku-03)
- Auto-resolution internals (covered in Automatic Injection ku-04)
- Interface binding specifics (covered in Interface Binding ku-08)
- Container mechanism details (covered in DI Container Basics ku-01)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Constructor injection is a single focused pattern — how classes declare and receive their dependencies at construction time. Best practices are specific to this injection site.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│             Constructor Injection (ku-02)                 │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── DI Container Basics (ku-01) — container's          │
│       build() and resolution mechanism                    │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Over-Injection Anti-Pattern — recognizing when    │
│   │   constructor injection is overused                   │
│   └── Injection Guidelines by Class Type — concrete      │
│       guidance per class type                             │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Constructor parameter count enforcement:** PHPStan/deptrac rule to warn when constructors exceed N parameters.
- **Readonly promoted property migration guide:** Upgrading from traditional property declaration to readonly promoted properties.
- **Constructor injection vs setter injection comparison:** Detailed tradeoff analysis for different scenarios.
- **Optional dependency audit tool:** Detect constructor parameters without defaults that should be optional.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
