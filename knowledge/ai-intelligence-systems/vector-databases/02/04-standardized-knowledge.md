---
id: ku-02
title: "Indexing Strategies"
subdomain: "vector-database-integration"
ku-type: "optimization"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/vector-database-integration/ku-02/04-standardized-knowledge.md"
---

# Indexing Strategies

## Overview

Indexing strategies determine how vectors are organized for fast approximate nearest neighbor (ANN) search. The choice of index type and its parameters directly impacts search speed, recall accuracy, memory usage, and insert/update performance. Different workloads require different indexes: HNSW for low-latency production search, IVF for large-scale batch search, PQ for memory-constrained environments. In the Laravel AI ecosystem, index configuration is part of the vector database setup and is managed through the vector store abstraction.

## Core Concepts

- **HNSW (Hierarchical Navigable Small World):** A graph-based index that provides excellent search speed and recall. Default choice for most production workloads.
- **IVF (Inverted File):** Partitions the vector space into clusters (Voronoi cells). Searches the nearest clusters first. Good for very large datasets.
- **IVF+PQ (Product Quantization):** Combines IVF with vector compression (PQ). Reduces memory usage at the cost of some recall.
- **Flat (Brute Force):** No index — compares query vector against all stored vectors. Only suitable for small datasets (<10K vectors) or exact search requirements.
- **efConstruction (HNSW):** The size of the dynamic candidate list during index construction. Higher = better recall, slower build time.
- **M (HNSW):** Maximum number of connections per node. Higher = better recall, more memory.
- **nlist (IVF):** Number of Voronoi cells. Higher = more granular search, slower.
- **nprobe (IVF):** Number of cells to search during query. Higher = better recall, slower.
- **Recall@K:** Percentage of true nearest neighbors found in the top-K results. Target >95% for production.
- **Index Build Time:** The time required to build the index. HNSW builds in O(n log n), IVF builds in O(n).

## When To Use

- Every vector database deployment — indexing is mandatory for acceptable search performance.
- When search latency needs improvement — index type and parameters are the primary levers.
- When recall needs improvement — index tuning trades speed for accuracy.
- When working with large datasets (>100K vectors) — brute force is too slow without an index.

## When NOT To Use

- Very small datasets (<1000 vectors) where brute force search is fast enough.
- Prototypes where index configuration adds unnecessary complexity.
- When exact search is required and the dataset fits in memory.

## Best Practices

- **Start with HNSW.** It provides the best balance of speed, recall, and memory for most workloads (10K-10M vectors).
- **Tune efConstruction and M.** Start with efConstruction=200, M=16. Increase efConstruction for higher recall, decrease for faster build.
- **Benchmark recall@10 with your data.** Don't use default parameters — tune based on your vector distribution and query patterns.
- **Rebuild indexes periodically.** As vectors are added, the index quality degrades. Schedule index optimization or rebuilds.
- **Use separate indexes for different content types.** Documents, images, and user profiles have different vector distributions.
- **Consider memory constraints.** HNSW with M=16 uses ~2-4x the vector storage size in memory. PQ reduces this to 0.5-1x.

## Architecture Guidelines

- Configure index parameters in a **configuration file** (not hardcoded) for environment-specific tuning.
- Implement a **benchmark script** that tests different index configurations against your dataset and reports recall/speed.
- Use **async index building** for large datasets — build indexes in background queue jobs.
- For multi-tenant systems, use **separate indexes per tenant** (collection per tenant) rather than a shared index with filters.
- Monitor **index quality metrics** (recall@10, average search latency) in production — set alerts for degradation.
- For real-time insert workloads, use **HNSW** (supports incremental inserts). IVF requires periodic rebuilds.

## Performance Considerations

| Index Type | Build Time | Search Latency | Memory | Recall | Use Case |
|-----------|-----------|---------------|--------|--------|----------|
| Flat (none) | 0 | 100ms (10K) | Vector size | 100% | Small datasets |
| HNSW | O(n log n) | 5-50ms | 2-4x vector | 95-99% | Production search |
| IVF | O(n) | 10-100ms | 1.1x vector | 90-95% | Large scale |
| IVF+PQ | O(n) | 10-80ms | 0.3-0.5x | 85-95% | Memory-constrained |

- HNSW search latency: O(log n) — stays fast as the dataset grows.
- IVF search latency: O(sqrt(n) × nprobe/centroids) — degrades more gracefully than brute force.
- PQ compression: 4-8x memory reduction with 1-5% recall loss.
- Batch inserts: inserting vectors in batches (100-1000) is 10-100x faster than single inserts.

## Common Mistakes

- Not creating any index — defaults to brute force search, which is unusable for datasets over 10K vectors.
- Using default index parameters without tuning — HNSW defaults may be too slow or too memory-intensive.
- Not rebuilding indexes after significant inserts — recall degrades by 5-20% over time.
- Using IVF for real-time inserts — IVF requires periodic index rebuilds (offline).
- Ignoring memory requirements — HNSW with M=32 can use 8x the vector size in RAM.
- Using a single index for diverse content types — different distributions may need different index configurations.

## Anti-Patterns

- **Index-and-Forget:** Creating an index once and never rebuilding. Index quality degrades as vectors are added.
- **Maximum Parameters:** Setting efConstruction=1000, M=128 for maximum recall. The build takes hours and memory usage explodes.
- **One Index for All:** Using the same index configuration for documents, images, and embeddings from different models.
- **No Benchmarking:** Choosing an index type based on reputation instead of benchmarking with your data.
- **Ignoring Insert Performance:** Using IVF for a system that inserts 1000 vectors/second. IVF rebuilds can't keep up.

## Examples

### HNSW Index Configuration
```php
class HNSWConfig {
    public function __construct(
        public readonly int $m = 16,           // connections per node
        public readonly int $efConstruction = 200, // build-time search width
        public readonly int $efSearch = 50,    // query-time search width
    ) {}

    public function toArray(): array {
        return [
            'type' => 'hnsw',
            'm' => $this->m,
            'ef_construction' => $this->efConstruction,
            'ef_search' => $this->efSearch,
        ];
    }
}
```

### Index Benchmark Runner
```php
class IndexBenchmark {
    public function run(VectorStore $store, array $configs): array {
        $results = [];

        foreach ($configs as $name => $config) {
            $store->createCollection("benchmark_{$name}", 1536, $config);
            $store->insert("benchmark_{$name}", $this->testVectors, $this->metadata);

            $start = microtime(true);
            $hits = 0;

            foreach ($this->queries as $i => $query) {
                $result = $store->search(new VectorQuery($query->vector, topK: 10));
                if (in_array($query->expectedId, array_column($result->matches, 'id'))) {
                    $hits++;
                }
            }

            $results[$name] = [
                'latency_ms' => (microtime(true) - $start) / count($this->queries) * 1000,
                'recall_at_10' => $hits / count($this->queries),
            ];
        }

        return $results;
    }
}
```

## Related Topics

- ku-01 (Vector Database Fundamentals): Foundation for indexing.
- ku-03 (Query Patterns & Filtering): How queries use the index.
- ku-05 (Performance & Scaling): Index performance optimization.
- retrieval-augmented-generation/ku-01: RAG indexing strategies.
- local-llm-development/ku-01: Local vector DB index configuration.

## AI Agent Notes

- When asked about vector DB performance, first check: index type, efSearch/M/nprobe parameters, and whether the index needs rebuilding.
- For indexing issues, check: index type appropriateness for the workload, recall metrics, and insert throughput requirements.
- Prefer reading the index configuration and benchmark results before suggesting changes.
- When generating index configuration code, include: type selection based on workload, tunable parameters, and periodic rebuild scheduling.

## Verification

- [ ] ANN index is created (HNSW, IVF, or PQ) — not brute force.
- [ ] Index parameters are tuned for the specific workload (efConstruction, M, efSearch for HNSW).
- [ ] Index quality (recall@10) is monitored in production.
- [ ] Index is rebuilt or optimized periodically (schedule based on insert volume).
- [ ] Index type matches the workload (HNSW for real-time, IVF for batch).
- [ ] Memory requirements for the index are accounted for in capacity planning.
- [ ] Separate indexes exist for different content types (if applicable).
