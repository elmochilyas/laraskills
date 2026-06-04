# Decomposition: 3.3 GiST indexes (geometric, full-text, range types)

## Topic Overview
GiST (Generalized Search Tree) is a balanced tree structure supporting custom data types and query operators. Used in PostgreSQL for geometric data (points, polygons), range type overlaps (`&&`), full-text search (alternative to GIN), and nearest-neighbor (`ORDER BY col <-> point`) searches.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-3-gist-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.3 GiST indexes (geometric, full-text, range types)
- **Purpose:** GiST (Generalized Search Tree) is a balanced tree structure supporting custom data types and query operators. Used in PostgreSQL for geometric data (points, polygons), range type overlaps (`&&`), full-text search (alternative to GIN), and nearest-neighbor (`ORDER BY col <-> point`) searches.
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree index structure, 3.4 GIN indexes, 3.5 BRIN indexes, 3.14 Spatial indexes

## Dependency Graph
**Depends on:** "3.1 B-Tree index structure", "3.4 GIN indexes", "3.5 BRIN indexes", "3.14 Spatial indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Extensible framework**: GiST is not a single algorithm but a framework for implementing search trees for custom data types.; - **Operator classes**: Define which operators the GiST index supports. Geometric: `@>`, `<@`, `&&`, `~=`, `<->`. Range: `&&`, `@>`, `<@`, `-|-`. Inet: `&&`, `@>`, `<<`.; - **Nearest-neighbor**: GiST supports `ORDER BY col <-> point LIMIT 10` — find the 10 closest points. B-Tree cannot do this..
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