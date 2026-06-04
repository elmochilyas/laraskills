# Decomposition: pgvector Native Support

## Topic Overview
pgvector is the default production vector database for Laravel RAG. Laravel 13 provides native support: `vector()` column type in migrations, `whereVectorSimilarTo()` query scope, and `Str::toEmbeddings()` embedding generation. pgvector runs on existing PostgreSQL infrastructure, supports ACID transactions, enables hybrid search (vector + full-text tsvector) in a single query, and requires zero additional services.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-pgvector-native/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### pgvector Native Support
- **Purpose:** pgvector is the default production vector database for Laravel RAG. Laravel 13 provides native support: `vector()` column type in migrations, `whereVectorSimilarTo()` query scope, and `Str::toEmbeddings()` embedding generation. pgvector runs on existing PostgreSQL infrastructure, supports ACID transactions, enables hybrid search (vector + full-text tsvector) in a single query, and requires zero additional services.
- **Difficulty:** Intermediate
- **Dependencies:** KU-021, KU-023, KU-025, KU-029, KU-033

## Dependency Graph
**Depends on:**
- KU-021
- KU-023
- KU-025
- KU-029
- KU-033

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- $table->vector('embedding', 1536)
- whereVectorSimilarTo('column', $embedding, 'cosine')
- Distance operators
- HNSW index
- IVFFlat index
- Hybrid search

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-023 topics covered in their respective KUs
- KU-025 topics covered in their respective KUs
- KU-029 topics covered in their respective KUs
- KU-033 topics covered in their respective KUs

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