# Decomposition: Hybrid Search

## Topic Overview
Hybrid search combines vector similarity search (semantic) with full-text keyword search to overcome the limitations of each. Vector search captures meaning but misses exact keyword matches. Full-text search catches precise terms but misses semantic relationships. pgvector enables hybrid search in a single PostgreSQL query by combining `<=>` vector distance with `tsvector` full-text ranking.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-hybrid-search/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Hybrid Search
- **Purpose:** Hybrid search combines vector similarity search (semantic) with full-text keyword search to overcome the limitations of each. Vector search captures meaning but misses exact keyword matches. Full-text search catches precise terms but misses semantic relationships. pgvector enables hybrid search in a single PostgreSQL query by combining `<=>` vector distance with `tsvector` full-text ranking.
- **Difficulty:** Intermediate
- **Dependencies:** KU-021, KU-023, KU-024, KU-028

## Dependency Graph
**Depends on:**
- KU-021
- KU-023
- KU-024
- KU-028

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Dense retrieval
- Sparse retrieval
- Hybrid fusion
- Reciprocal Rank Fusion (RRF)
- Weighted combination
- pgvector + tsvector

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-023 topics covered in their respective KUs
- KU-024 topics covered in their respective KUs
- KU-028 topics covered in their respective KUs

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