# Decomposition: withExists / loadExists — Boolean Existence Checks via Subquery

## Boundary Analysis
This KU covers boolean existence subqueries (`EXISTS` pattern) appended via `withExists()`/`loadExists()`. It excludes `whereHas`/`orWhereHas` (filtering based on existence, not annotation), `withCount` (cardinality, not boolean), and raw `whereExists` clauses. The boundary is methods that annotate each parent model with a boolean `{relation}_exists` attribute at query time.

## Atomicity Assessment
**Status:** ✅ Atomic
The existence-check pattern is a single concept: `EXISTS (SELECT 1 ... LIMIT 1)`. The eager/lazy API split (withExists vs loadExists) does not warrant separate coverage. The mechanics, tradeoffs, and performance characteristics are unified across all relationship types.

## Dependency Graph
- **Depends on:** with-count (subquery infrastructure)
- **Depends on:** Basic relationship definitions
- **Depends on:** SQL `EXISTS` understanding
- **Referenced by:** Authorization and feature-gating patterns
- **Referenced by:** Query performance optimization (replacing `->count() > 0` checks)

## Follow-up Opportunities
- Replacing N+1 existence checks in middleware with `withExists`
- Pre-computed `has_*` boolean columns strategy
- `whereHas` internals (filters via existence, different from annotation)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization