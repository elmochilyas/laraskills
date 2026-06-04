# Decomposition: Document Chunking Strategies

## Topic Overview
Chunking strategy is the single highest-leverage parameter in RAG quality. The same retrieval pipeline with different chunking can yield 20-40% accuracy differences. Strategies range from fixed-size character chunks to semantic-aware splitting that respects document structure. The Laravel ecosystem supports multiple chunking approaches via `moneo/laravel-rag` and custom implementations.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-document-chunking-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Document Chunking Strategies
- **Purpose:** Chunking strategy is the single highest-leverage parameter in RAG quality. The same retrieval pipeline with different chunking can yield 20-40% accuracy differences. Strategies range from fixed-size character chunks to semantic-aware splitting that respects document structure. The Laravel ecosystem supports multiple chunking approaches via `moneo/laravel-rag` and custom implementations.
- **Difficulty:** Intermediate
- **Dependencies:** KU-021, KU-023, KU-025, KU-027

## Dependency Graph
**Depends on:**
- KU-021
- KU-023
- KU-025
- KU-027

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Fixed-size chunking
- Sentence chunking
- Semantic chunking
- Recursive chunking
- Document-aware chunking
- Overlap

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-023 topics covered in their respective KUs
- KU-025 topics covered in their respective KUs
- KU-027 topics covered in their respective KUs

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