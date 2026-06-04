# Decomposition: Offset Pagination Performance

## Topic Overview
Database-level performance characteristics of offset pagination: deep offset degradation, COUNT(*) costs, index utilization, and production mitigations.

## Decomposition Strategy
This KU is a performance deep-dive companion to `offset-pagination-design`. It focuses exclusively on database execution mechanics and optimization strategies, not API design.

## Proposed Folder Structure
```
offset-pagination-performance/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Offset Pagination Performance
- **Purpose:** Understand and mitigate performance degradation of offset pagination
- **Difficulty:** Intermediate
- **Dependencies:** Offset Pagination Design, SQL Indexing Fundamentals

## Dependency Graph
This KU depends on: Offset Pagination Design, SQL Indexing Fundamentals. It feeds into: Pagination Strategy Selection, Offset-to-Cursor Migration.

## Boundary Analysis
**In scope:** Deep offset O(N) behavior, COUNT(*) performance and optimization, index covering strategies, execution plan analysis, query timeouts, monitoring offset depth, automatic strategy switching.
**Out of scope:** Cursor/keyset pagination internals (dedicated KUs), API parameter design (offset-pagination-design KU), total approximate count methods (total-count-performance KU).

## Future Expansion Opportunities
None — performance characteristics are well-understood and stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization