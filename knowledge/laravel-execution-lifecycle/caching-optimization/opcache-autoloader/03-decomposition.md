# Decomposition: OpCache Autoloader

## Boundary Analysis
**Scope:** Infrastructure-level PHP optimization — OpCache configuration and behavior, Composer autoloader optimization (classmap, authoritative mode, APCu), and their combined impact on Laravel bootstrap performance.

**Excluded:**
- Laravel-specific cache files (covered in ku-01 through ku-05)
- PHP-FPM configuration (outside domain scope)
- Server-level caching (Redis, Memcached — outside domain scope)
- Preloading architecture details (covered in Octane Boot Timing)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** OpCache and autoloader optimization are infrastructure concerns with clear boundaries — they're PHP-level optimizations that Laravel benefits from but doesn't control.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              OpCache Autoloader (ku-07)                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── (infrastructure layer — no Laravel KU deps)        │
│                                                          │
│ Prerequisite for:                                         │
│   ├── Compilation Optimization (ku-06) — OpCache         │
│   │   caches all compiled cache files                     │
│   ├── Cache Invalidation (ku-08) — OpCache reset is     │
│   │   part of deployment                                  │
│   ├── Config Caching (ku-01) — OpCache caches config.php │
│   ├── Route Caching (ku-02) — OpCache caches routes.php  │
│   └── View Caching (ku-04) — OpCache caches compiled     │
│       view files                                          │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **OpCache monitoring dashboard:** Track cache hit rate, memory usage, and file count in production.
- **Preloading strategy optimizer:** Tool to determine which classes to preload for optimal Octane startup.
- **Classmap coverage analysis:** Script to find classes that are NOT in the classmap (PSR-4 fallback).
- **APCu vs OpCache benchmark:** Measure the marginal benefit of APCu autoloader caching vs classmap alone.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
