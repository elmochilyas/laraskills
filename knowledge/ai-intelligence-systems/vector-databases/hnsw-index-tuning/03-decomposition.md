# Decomposition: HNSW Index Tuning

## Topic Overview
HNSW (Hierarchical Navigable Small World) is the default graph-based index for pgvector. Proper tuning dramatically affects query latency, recall, and index build time. Key parameters: `m` (connections per node), `ef_construction` (build quality), `ef_search` (query accuracy). Defaults work for small datasets; tuning is essential for production deployments above 100K vectors.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-hnsw-index-tuning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### HNSW Index Tuning
- **Purpose:** HNSW (Hierarchical Navigable Small World) is the default graph-based index for pgvector. Proper tuning dramatically affects query latency, recall, and index build time. Key parameters: `m` (connections per node), `ef_construction` (build quality), `ef_search` (query accuracy). Defaults work for small datasets; tuning is essential for production deployments above 100K vectors.
- **Difficulty:** Intermediate
- **Dependencies:** KU-028, KU-030, KU-035

## Dependency Graph
**Depends on:**
- KU-028
- KU-030
- KU-035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- HNSW algorithm
- `m` (16 default)
- `ef_construction` (64 default)
- `ef_search` (40 default)
- IVFFlat alternative

**Out of scope:**
- KU-028 topics covered in their respective KUs
- KU-030 topics covered in their respective KUs
- KU-035 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization