# Decomposition: Route Caching

## Boundary Analysis
**Scope:** The route caching mechanism — how `route:cache` collects, serializes, and compiles routes, the compiled matcher structure, URL generation caching, closure limitations, and deployment implications.

**Excluded:**
- Route registration order (covered in Route Registration Order ku-07)
- Config caching (covered in Config Caching ku-01)
- URL generation algorithms (outside domain scope)
- Controller resolution after route match (covered in HTTP Kernel Dispatch)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Route caching is a single mechanism with clear inputs (routes) and outputs (cached file). The KU covers the entire cache lifecycle from build to runtime loading to invalidation.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│                  Route Caching (ku-02)                    │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── Config Caching (ku-01) — config must be cached     │
│   │   first                                               │
│   └── Route Registration Order (ku-07) — cached routes   │
│       preserve registration order                         │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Optimize Command (ku-09) — route:cache is part     │
│   │   of the optimize sequence                            │
│   └── Cache Invalidation (ku-08) — route cache must be   │
│       managed in deployment                               │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Closure-to-controller conversion tool:** Automated refactoring to replace route closures with invokable controllers.
- **Route cache size analyzer:** Tool to estimate cache file size and match performance impact.
- **Dynamic route strategies for cached apps:** Patterns for handling tenant-specific or dynamic routes alongside cached routes.
- **Route cache in Octane:** How route caching interacts with long-running processes — cache loaded once per worker.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
