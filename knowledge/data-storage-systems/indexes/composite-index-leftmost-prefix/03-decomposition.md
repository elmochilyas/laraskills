# Decomposition: 3.8 Composite/compound indexes: leftmost prefix rule, column ordering

## Topic Overview
Composite indexes index multiple columns in a defined order (left to right). The leftmost prefix rule determines which query patterns the index can serve: queries must reference a leftmost subset of the indexed columns. Column ordering within a composite index is the most impactful index design decision.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-8-composite-index-leftmost-prefix/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.8 Composite/compound indexes: leftmost prefix rule, column ordering
- **Purpose:** Composite indexes index multiple columns in a defined order (left to right). The leftmost prefix rule determines which query patterns the index can serve: queries must reference a leftmost subset of the indexed columns.
- **Difficulty:** Foundation
- **Dependencies:** 3.1 B-Tree, 3.9 Composite index best practices, 3.10 Covering indexes, 3.18 Composite index selectivity

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.9 Composite index best practices", "3.10 Covering indexes", "3.18 Composite index selectivity"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Leftmost prefix**: Index on `(a, b, c)` serves queries on `(a)`, `(a, b)`, and `(a, b, c)`. Does NOT serve queries on `(b)`, `(c)`, or `(b, c)`.; - **Sort order**: The index is sorted by column a first, then within equal a values by column b, then within equal b values by column c.; - **Skip scan (PostgreSQL)**: Can use index for non-leading column if there are few distinct values in leading columns. MySQL 8.0.13+ supports similar functionality..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization