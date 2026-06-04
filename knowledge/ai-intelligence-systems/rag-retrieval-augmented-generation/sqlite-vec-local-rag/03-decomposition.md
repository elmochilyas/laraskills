# Decomposition: SQLite-vec for Local RAG

## Topic Overview
SQLite-vec is a vector search extension for SQLite enabling local RAG development without PostgreSQL or external vector databases. It's supported by `moneo/laravel-rag` as a development driver, enabling zero-infrastructure RAG on the developer's machine. Not recommended for production â€” limited to ~1M vectors and lacking production features.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-sqlite-vec-local-rag/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SQLite-vec for Local RAG
- **Purpose:** SQLite-vec is a vector search extension for SQLite enabling local RAG development without PostgreSQL or external vector databases. It's supported by `moneo/laravel-rag` as a development driver, enabling zero-infrastructure RAG on the developer's machine. Not recommended for production â€” limited to ~1M vectors and lacking production features.
- **Difficulty:** Advanced
- **Dependencies:** KU-021, KU-028, KU-035

## Dependency Graph
**Depends on:**
- KU-021
- KU-028
- KU-035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Zero infrastructure
- Maximum practical scale
- No HNSW index

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-028 topics covered in their respective KUs
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