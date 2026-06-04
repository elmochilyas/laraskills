# Decomposition: 3.1 B-Tree index structure and when it applies (equality, range, sort)

## Topic Overview
B-Tree (balanced tree) indexes are the default and most common index type in both MySQL and PostgreSQL. They organize data in a sorted tree structure enabling fast lookups (O(log n)) for equality, range, prefix, and sorted access. Understanding B-Tree structure is essential for composite index design, covering index strategies, and query plan analysis.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-1-b-tree-index-structure/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.1 B-Tree index structure and when it applies (equality, range, sort)
- **Purpose:** B-Tree (balanced tree) indexes are the default and most common index type in both MySQL and PostgreSQL. They organize data in a sorted tree structure enabling fast lookups (O(log n)) for equality, range, prefix, and sorted access.
- **Difficulty:** Foundation
- **Dependencies:** 3.8 Composite/compound indexes, 3.10 Covering indexes, 3.21 Index management in migrations

## Dependency Graph
**Depends on:** "3.8 Composite/compound indexes", "3.10 Covering indexes", "3.21 Index management in migrations"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Structure**: Balanced tree with root, internal nodes, and leaf pages. Each node contains sorted key values and pointers.; - **Lookup types**: Equality (`WHERE id = 5`), Range (`WHERE id > 100`), Prefix (`WHERE name LIKE 'Jon%'`), Sort (`ORDER BY name`).; - **Leaf pages**: Contain the actual index entries and pointers to heap tuples (PostgreSQL) or clustered index entries (MySQL InnoDB).; - **Clustered vs non-clustered**: InnoDB's primary key is a clustered index (data stored with index). Secondary indexes point to PK. PostgreSQL uses heap with separate index entries pointing to TIDs..
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