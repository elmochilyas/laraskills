# Decomposition: Middleware Configuration in Bootstrap
## Boundary Analysis
This KU covers the Laravel 11+ middleware configuration API in `bootstrap/app.php`. It is the configuration layer that feeds into all other middleware KUs (global stack, groups, aliases, priority). The boundary stops at the configuration API itself — it does not cover the runtime behavior that the configuration controls.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
- **Depends On:** Pipeline Pattern Fundamentals, Global Middleware Stack, Middleware Groups
- **Related To:** Middleware Aliases, Middleware Priority, Default Middleware Members

## Follow-up Opportunities
- Laravel 11 application bootstrap deep-dive
- Migration guide: Kernel property configuration to bootstrap/app.php
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization