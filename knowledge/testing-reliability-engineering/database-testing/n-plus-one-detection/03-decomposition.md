# Decomposition: n plus one detection

## Topic Overview

N+1 query problems occur when code executes one query to fetch parent records and an additional query for each parent's child relationship�resulting in exponential query growth. Laravel provides `expectsDatabaseQueryCount()` and `expectsDatabaseQueryCount()` for asserting exact query counts, and `Query Sentinel` (community package) for real-time detection. N+1 detection in tests is the most effective way to prevent performance regressions before they reach production.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
n-plus-one-detection/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### n plus one detection
- **Purpose:** N+1 query problems occur when code executes one query to fetch parent records and an additional query for each parent's child relationship�resulting in exponential query growth. Laravel provides `expectsDatabaseQueryCount()` and `expectsDatabaseQueryCount()` for asserting exact query counts, and `Query Sentinel` (community package) for real-time detection. N+1 detection in tests is the most effective way to prevent performance regressions before they reach production.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Eloquent relationships, Database query basics, Feature test HTTP helpers, **Related Topics**: Query count expectations, Database assertions, Performance profiling, **Advanced Follow-up**: Query Sentinel configuration, Custom eager loading policies, and Serialization loading optimization

## Dependency Graph
**Depends on:** **Prerequisites**: Eloquent relationships, Database query basics, Feature test HTTP helpers, **Related Topics**: Query count expectations, Database assertions, Performance profiling, **Advanced Follow-up**: Query Sentinel configuration, Custom eager loading policies, and Serialization loading optimization
**Depended on by:** Knowledge units that leverage or extend n plus one detection patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for n plus one detection.
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