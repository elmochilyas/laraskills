# Decomposition: time manipulation

## Topic Overview

Time manipulation controls the perceived current time in tests, enabling deterministic testing of time-dependent logic: scheduling, deadlines, rate limits, subscription expirations, and time-based queries. Laravel provides `Carbon::setTestNow()`, `travel()`, `travelTo()`, `freezeTime()`, and `freezeSecond()` via Pest's time helpers. Without time manipulation, tests involving time are flaky (varying by execution time), slow (requires real waiting), or impossible (future dates).

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
time-manipulation/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### time manipulation
- **Purpose:** Time manipulation controls the perceived current time in tests, enabling deterministic testing of time-dependent logic: scheduling, deadlines, rate limits, subscription expirations, and time-based queries. Laravel provides `Carbon::setTestNow()`, `travel()`, `travelTo()`, `freezeTime()`, and `freezeSecond()` via Pest's time helpers. Without time manipulation, tests involving time are flaky (varying by execution time), slow (requires real waiting), or impossible (future dates).
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Carbon date library, Laravel scheduling concepts, Test double taxonomy, **Related Topics**: Rate limiting testing, Subscription testing, Scheduled task testing, Cache TTL testing, **Advanced Follow-up**: Clock facade, Database-level time handling, and Timezone-aware testing

## Dependency Graph
**Depends on:** **Prerequisites**: Carbon date library, Laravel scheduling concepts, Test double taxonomy, **Related Topics**: Rate limiting testing, Subscription testing, Scheduled task testing, Cache TTL testing, **Advanced Follow-up**: Clock facade, Database-level time handling, and Timezone-aware testing
**Depended on by:** Knowledge units that leverage or extend time manipulation patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for time manipulation.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization