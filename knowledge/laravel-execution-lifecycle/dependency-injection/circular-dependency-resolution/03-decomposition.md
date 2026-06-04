# Decomposition: Circular Dependency Resolution

## Boundary Analysis
**Scope:** Circular dependency detection and resolution — how `$buildStack` tracks the resolution chain, cycle detection algorithm, types of cycles (direct, transitive, self-injection), and resolution strategies (extraction, events, lazy injection).

**Excluded:**
- General constructor injection (covered in Constructor Injection ku-02)
- Container build() internals (covered in DI Container Basics ku-01)
- Service locator anti-pattern beyond cycle context
- Event system implementation (covered in other domains)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Circular dependency resolution is a single focused topic — how cycles are detected and how to fix them. The KU covers detection, types, and resolution strategies.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│        Circular Dependency Resolution (ku-09)             │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── DI Container Basics (ku-01) — build stack         │
│   └── Automatic Injection (ku-04) — resolution path     │
│       where cycles are detected                          │
│                                                          │
│ Prerequisite for:                                         │
│   └── Service Locator Anti-Pattern — using app() to    │
│       break cycles is a variant of the anti-pattern      │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **deptrac integration guide:** How to configure deptrac rules to prevent circular dependencies in Laravel.
- **Cycle detection in CI:** Automated CI step to detect new circular dependencies before deployment.
- **Event-driven refactoring catalog:** Common circular dependency patterns and their event-driven solutions.
- **Lazy injection vs structural fix decision tree:** When to refactor vs when to use lazy resolution (almost always refactor).
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
