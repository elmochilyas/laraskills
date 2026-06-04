# Decomposition: query count expectations

## Topic Overview

Database query count expectations (`expectsDatabaseQueryCount()`) assert that specific code paths execute exactly N database queries. They serve as performance contracts, preventing query count regressions (N+1, missing eager loads, redundant queries). While N+1 detection catches the most egregious issue, query count expectations cover all query inflation�including duplicate fetches, unoptimized loops, and missing caching. Every feature test that touches the database should have a query count...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
query-count-expectations/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### query count expectations
- **Purpose:** Database query count expectations (`expectsDatabaseQueryCount()`) assert that specific code paths execute exactly N database queries. They serve as performance contracts, preventing query count regressions (N+1, missing eager loads, redundant queries). While N+1 detection catches the most egregious issue, query count expectations cover all query inflation�including duplicate fetches, unoptimized loops, and missing caching. Every feature test that touches the database should have a query count...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Database testing lifecycle, Feature test HTTP helpers, Eloquent relationships, **Related Topics**: N+1 query detection, Query Sentinel, Test suite profiling, **Advanced Follow-up**: Per-connection query count expectations, Custom query assertion macros, and Query plan analysis

## Dependency Graph
**Depends on:** **Prerequisites**: Database testing lifecycle, Feature test HTTP helpers, Eloquent relationships, **Related Topics**: N+1 query detection, Query Sentinel, Test suite profiling, **Advanced Follow-up**: Per-connection query count expectations, Custom query assertion macros, and Query plan analysis
**Depended on by:** Knowledge units that leverage or extend query count expectations patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for query count expectations.
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