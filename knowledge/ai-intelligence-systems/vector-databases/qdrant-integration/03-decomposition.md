# Decomposition: Qdrant Integration

## Topic Overview
Qdrant is an open-source (Apache 2.0) vector database written in Rust, offering self-hosted and cloud-managed options. It provides vector search with payload filtering, HNSW indexing, and horizontal scaling. In the Laravel ecosystem, `Spirit13/qdrant-laravel` and `wontonee/laravel-qdrant-sdk` provide PHP SDK integration. Qdrant is the primary alternative to pgvector when PostgreSQL isn't available or when scale exceeds pgvector's range.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-qdrant-integration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Qdrant Integration
- **Purpose:** Qdrant is an open-source (Apache 2.0) vector database written in Rust, offering self-hosted and cloud-managed options. It provides vector search with payload filtering, HNSW indexing, and horizontal scaling. In the Laravel ecosystem, `Spirit13/qdrant-laravel` and `wontonee/laravel-qdrant-sdk` provide PHP SDK integration. Qdrant is the primary alternative to pgvector when PostgreSQL isn't available or when scale exceeds pgvector's range.
- **Difficulty:** Intermediate
- **Dependencies:** KU-028, KU-031, KU-035

## Dependency Graph
**Depends on:**
- KU-028
- KU-031
- KU-035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Collections
- Points
- Payload filtering
- HNSW index
- Self-hosted
- Qdrant Cloud

**Out of scope:**
- KU-028 topics covered in their respective KUs
- KU-031 topics covered in their respective KUs
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