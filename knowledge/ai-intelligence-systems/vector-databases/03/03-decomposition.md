# Decomposition: Query Patterns & Filtering

## Topic Overview

Query patterns and filtering define how applications search vector databases â€” combining vector similarity with metadata filters, hybrid search (vector + keyword), multi-vector queries, and pagination. Effective query design ensures that search results are both semantically relevant and contextually appropriate (filtered by source, date, access level, etc.). In the Laravel AI ecosystem, query patterns are implemented through the vector store abstraction's search method, with provider-specific syntax for metadata filtering.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Query Patterns & Filtering
- **Purpose:** Query patterns and filtering define how applications search vector databases â€” combining vector similarity with metadata filters, hybrid search (vector + keyword), multi-vector queries, and pagination. Effective query design ensures that search results are both semantically relevant and contextually appropriate (filtered by source, date, access level, etc.). In the Laravel AI ecosystem, query patterns are implemented through the vector store abstraction's search method, with provider-specific syntax for metadata filtering.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-04, ku-01, ku-05

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-04
- ku-01
- ku-05

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Vector Query:** A search request containing a query vector, top-K count, distance threshold, and metadata filters.
- **Metadata Filtering:** Applying structured conditions (field = value, field IN list, field > threshold) alongside vector search.
- **Pre-Filtering vs. Post-Filtering:** Applying metadata filters before vector search (pre-filter) vs. after retrieving results (post-filter). Pre-filtering preserves recall for large filtered subsets.
- **Hybrid Search:** Combining vector similarity with keyword (BM25) search. Uses weighted fusion to combine result sets. Essential for domains with proper nouns and exact matches.
- **Multi-Vector Query:** Searching with multiple query vectors and combining results (for multi-modal queries or query decomposition).
- **Filter Expression Syntax:** Provider-specific syntax for metadata filters (Qdrant: `should`/`must`, Pinecone: `$eq`/`$in`, pgvector: SQL WHERE).
- **Pagination:** Iterating through search results in pages (offset/limit or cursor-based). Limited support in ANN search â€” pagination is approximate.
- **Re-ranking:** Applying a more expensive relevance model to refine the results from a fast initial ANN search.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

