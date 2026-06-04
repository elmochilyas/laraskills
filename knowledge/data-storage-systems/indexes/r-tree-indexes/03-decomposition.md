# Decomposition: 3.7 R-Tree indexes (MySQL spatial data)

## Topic Overview
R-Tree indexes are MySQL's spatial index type, used with spatial data types (POINT, LINESTRING, POLYGON). They organize spatial objects by their bounding boxes using a tree structure. Enable efficient spatial queries: proximity, containment, intersection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-7-r-tree-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.7 R-Tree indexes (MySQL spatial data)
- **Purpose:** R-Tree indexes are MySQL's spatial index type, used with spatial data types (POINT, LINESTRING, POLYGON). They organize spatial objects by their bounding boxes using a tree structure.
- **Difficulty:** Intermediate
- **Dependencies:** 3.3 GiST indexes, 3.14 Spatial indexes, 13.11 Spatial data types, 13.12 Spatial indexes

## Dependency Graph
**Depends on:** "3.3 GiST indexes", "3.14 Spatial indexes", "13.11 Spatial data types", "13.12 Spatial indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Minimum Bounding Rectangle (MBR)**: Each node stores the MBR of its children. Query evaluates MBR overlap/containment to prune search space.; - **MySQL support**: Available on MyISAM and InnoDB tables with GEOMETRY columns.; - **Spatial operators**: `MBRContains()`, `MBRWithin()`, `ST_Distance_Sphere()`, `ST_Within()`..
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