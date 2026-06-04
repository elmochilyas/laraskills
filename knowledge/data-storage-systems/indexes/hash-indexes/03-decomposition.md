# Decomposition: 3.2 Hash indexes (equality only, PostgreSQL)

## Topic Overview
Hash indexes in PostgreSQL store a 32-bit hash code of the indexed value, enabling fast equality lookups. They are smaller than B-Tree indexes for equality-only queries but do not support range queries, sorting, or prefix matching. WAL-logged since PostgreSQL 10.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-2-hash-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.2 Hash indexes (equality only, PostgreSQL)
- **Purpose:** Hash indexes in PostgreSQL store a 32-bit hash code of the indexed value, enabling fast equality lookups. They are smaller than B-Tree indexes for equality-only queries but do not support range queries, sorting, or prefix matching.
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree index structure, 3.4 GIN indexes, 3.5 BRIN indexes

## Dependency Graph
**Depends on:** "3.1 B-Tree index structure", "3.4 GIN indexes", "3.5 BRIN indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Hash function**: Computes a 32-bit hash of the key. Index stores (hash, TID) pairs.; - **Equality only**: `WHERE col = ?` can use hash index. `WHERE col > ?`, `ORDER BY col`, `LIKE` cannot.; - **Collisions**: Hash collisions are handled by storing multiple entries per hash value.; - **WAL logging**: Pre-PostgreSQL 10, hash indexes were not WAL-logged and were lost on crash. Since PG 10, they are fully crash-safe..
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