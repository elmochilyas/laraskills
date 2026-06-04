# Decomposition: Detection — N+1 Query Detection

## Boundary Analysis
This KU covers techniques and tools for detecting N+1 query problems in Eloquent applications. It includes Debugbar, Telescope, manual query logging, automated test assertions, and middleware-based counting. It excludes fixing detected issues (handled by `prevention-strategies`), strict mode enforcement (`lazy-loading-violations`), and general query optimization beyond N+1 detection.

## Atomicity Assessment
**Status:** ✅ Atomic
Detection is a single concern: identifying excessive query patterns. The various detection tools (Debugbar, Telescope, tests) are alternative implementations of the same detection principle, not separate conceptual units.

## Dependency Graph
- **Depends on:** Relationship definition fundamentals (to understand what causes N+1)
- **Depends on:** Lazy loading behavior understanding
- **Referenced by:** `prevention-strategies` (fixes what detection finds)
- **Referenced by:** `lazy-loading-violations` (automated enforcement)
- **Referenced by:** All performance-oriented KUs (as diagnostic step)

## Follow-up Opportunities
- AI-assisted N+1 detection in code review
- Runtime N+1 detection with automatic eager loading injection
- Distributed tracing integration for N+1 across queued job chains
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization