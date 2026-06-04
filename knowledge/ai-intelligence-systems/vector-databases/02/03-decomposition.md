# Decomposition: Indexing Strategies

## Topic Overview

Indexing strategies determine how vectors are organized for fast approximate nearest neighbor (ANN) search. The choice of index type and its parameters directly impacts search speed, recall accuracy, memory usage, and insert/update performance. Different workloads require different indexes: HNSW for low-latency production search, IVF for large-scale batch search, PQ for memory-constrained environments. In the Laravel AI ecosystem, index configuration is part of the vector database setup and is managed through the vector store abstraction.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-02/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Indexing Strategies
- **Purpose:** Indexing strategies determine how vectors are organized for fast approximate nearest neighbor (ANN) search. The choice of index type and its parameters directly impacts search speed, recall accuracy, memory usage, and insert/update performance. Different workloads require different indexes: HNSW for low-latency production search, IVF for large-scale batch search, PQ for memory-constrained environments. In the Laravel AI ecosystem, index configuration is part of the vector database setup and is managed through the vector store abstraction.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-05, ku-01, ku-01

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-05
- ku-01
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **HNSW (Hierarchical Navigable Small World):** A graph-based index that provides excellent search speed and recall. Default choice for most production workloads.
- **IVF (Inverted File):** Partitions the vector space into clusters (Voronoi cells). Searches the nearest clusters first. Good for very large datasets.
- **IVF+PQ (Product Quantization):** Combines IVF with vector compression (PQ). Reduces memory usage at the cost of some recall.
- **Flat (Brute Force):** No index â€” compares query vector against all stored vectors. Only suitable for small datasets (<10K vectors) or exact search requirements.
- **efConstruction (HNSW):** The size of the dynamic candidate list during index construction. Higher = better recall, slower build time.
- **M (HNSW):** Maximum number of connections per node. Higher = better recall, more memory.
- **nlist (IVF):** Number of Voronoi cells. Higher = more granular search, slower.
- **nprobe (IVF):** Number of cells to search during query. Higher = better recall, slower.
- **Recall@K:** Percentage of true nearest neighbors found in the top-K results. Target >95% for production.
- **Index Build Time:** The time required to build the index. HNSW builds in O(n log n), IVF builds in O(n).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

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

