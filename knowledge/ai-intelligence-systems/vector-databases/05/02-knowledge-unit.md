# Knowledge Unit: Performance & Scaling

## Metadata

- **ID:** ku-05
- **Subdomain:** Vector Databases
- **Slug:** performance---scaling
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Performance and scaling for vector databases covers optimizing query latency, indexing throughput, memory usage, and capacity for growing datasets. As the vector collection grows from thousands to millions of vectors, search latency and memory requirements scale non-linearly. Performance optimization involves index tuning, hardware provisioning, sharding, caching, and choosing between self-hosted and managed vector database services.

## Core Concepts

- **Query Latency:** The time between sending a query and receiving results. Target: <50ms for user-facing search, <200ms for RAG pipelines.
- **Indexing Throughput:** The rate at which vectors can be inserted into the index. Critical for batch backfills and real-time sync.
- **Memory Hierarchy:** Vector data may live in RAM (fastest), SSD (memory-mapped), or HDD (slowest). ANN indexes perform best in RAM.
- **Sharding:** Partitioning a large vector index across multiple nodes. Each shard handles a subset of vectors.
- **Replication:** Copying shards across nodes for high availability and read throughput.
- **Distributed Search:** Querying across multiple shards and merging results. Adds latency proportional to the number of shards.
- **Query Concurrency:** The number of simultaneous queries the vector DB can handle. Scales with CPU cores and available RAM.
- **Cache Hit Rate:** Results from the query cache (identical or similar queries) served in <1ms instead of 5-50ms.

## Mental Models

- **Query Latency:** The time between sending a query and receiving results. Target: <50ms for user-facing search, <200ms for RAG pipelines.
- **Indexing Throughput:** The rate at which vectors can be inserted into the index. Critical for batch backfills and real-time sync.
- **Memory Hierarchy:** Vector data may live in RAM (fastest), SSD (memory-mapped), or HDD (slowest). ANN indexes perform best in RAM.


## Internal Mechanics

The internal mechanics of Performance & Scaling follow established patterns within the Vector Databases domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Provision enough RAM for the index.** The index should fit in RAM for best performance. Monitor memory pressure.
- **Use SSDs for disk-based vector DBs** (Qdrant, Milvus). HDDs add 10-100x latency for index reads.
- **Separate indexing and query workloads.** Indexing (inserts) consumes CPU and I/O that competes with query performance.
- **Benchmark with production data size.** Benchmarks with 10K vectors don't predict performance at 1M vectors.
- **Monitor query latency percentiles (p50/p95/p99).** Average latency hides tail latency issues.
- **Plan for data growth.** Vector storage grows linearly with data. A 1M vector index today may be 10M next year.
- **Use a managed service for most deployments.** Qdrant Cloud, Pinecone, and Weaviate Cloud handle sharding, replication, and backups.

## Patterns

- **Provision enough RAM for the index.** The index should fit in RAM for best performance. Monitor memory pressure.
- **Use SSDs for disk-based vector DBs** (Qdrant, Milvus). HDDs add 10-100x latency for index reads.
- **Separate indexing and query workloads.** Indexing (inserts) consumes CPU and I/O that competes with query performance.
- **Benchmark with production data size.** Benchmarks with 10K vectors don't predict performance at 1M vectors.
- **Monitor query latency percentiles (p50/p95/p99).** Average latency hides tail latency issues.
- **Plan for data growth.** Vector storage grows linearly with data. A 1M vector index today may be 10M next year.
- **Use a managed service for most deployments.** Qdrant Cloud, Pinecone, and Weaviate Cloud handle sharding, replication, and backups.

## Architectural Decisions

- For self-hosted vector DBs, deploy on **dedicated instances** (not shared with the application server) â€” vector DBs are memory and CPU intensive.
- Use **sharding for datasets >1M vectors** â€” distribute the index across multiple nodes for parallel search.
- Use **replication for high availability** â€” replicate shards across availability zones.
- Implement a **query cache layer** (Redis) in front of the vector DB for frequent queries.
- For multi-region deployments, use **geo-distributed vector DB** (Pinecone, Qdrant Cloud) or replicate indexes per region.
- For Laravel, use **dedicated queue workers** for indexing jobs and **separate database connections** for production queries.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

| Dataset Size | Memory (1536-dim) | Index Type | Approx. Latency | Recommended Setup |
|-------------|-------------------|------------|-----------------|-------------------|
| 10K | 60MB | HNSW | 2-5ms | Single node, app memory |
| 100K | 600MB | HNSW | 5-15ms | Single node, dedicated |
| 1M | 6GB | HNSW | 10-30ms | Single node, dedicated |
| 10M | 60GB | IVF+PQ | 20-80ms | Sharded (2-4 nodes) |
| 100M | 600GB | IVF+PQ | 50-200ms | Sharded (8-16 nodes) |

- HNSW memory: 2-4x raw vector size (graph edges consume additional memory).
- IVF memory: 1.1x raw vector size (centroids only).
- PQ reduces memory by 4-8x with 1-5% recall loss.
- Query concurrency: a single node can handle 50-200 QPS depending on latency target.
- Sharding improves both capacity and QPS (search N shards in parallel, merge results).

## Production Considerations



## Common Mistakes

- Under-provisioning RAM â€” the index doesn't fit in memory, causing 10-100x slower searches.
- Using HNSW without considering memory â€” a 10M vector HNSW index can use 60GB+ RAM.
- Running vector DB on the same server as the application â€” resource contention degrades both.
- Not sharding before hitting performance limits â€” performance degrades gradually, then suddenly.
- Assuming all vector DBs scale the same â€” each has different sharding, replication, and consistency models.
- Not monitoring index growth â€” capacity planning is reactive instead of proactive.

## Failure Modes

- **Over-Provisioning:** Running 10 nodes for a 100K vector dataset. Cloud costs are wasted on idle capacity.
- **No Caching:** Every query hits the vector DB, even when 40% of queries are repeats of the same or similar queries.
- **Re-index-on-Query:** Triggering index rebuilds based on query activity. Index operations should be scheduled, not reactive.
- **Single-Region Single-Node:** All queries route to one instance in one region. Downtime affects all users.
- **Ignoring Cold Start:** The first query after a restart is slow (index loading from disk). Pre-warm the index.
- **Manual Scaling:** Manually adding nodes when performance degrades. Auto-scale based on CPU/memory/QPS metrics.

## Ecosystem Usage

### Vector DB Capacity Planner
```php
class VectorDBCapacityPlanner {
    public function plan(int $vectorCount, int $dimensions, string $indexType): CapacityPlan {
        $bytesPerElement = 4; // float32
        $vectorSize = $dimensions * $bytesPerElement;
        $rawSize = $vectorCount * $vectorSize;

        $memoryMultiplier = match($indexType) {
            'hnsw' => 3.0,   // HNSW uses 2-4x
            'ivf' => 1.2,    // IVF uses ~1.1x
            'ivf_pq' => 0.5, // PQ uses 0.3-0.5x
            default => 1.0,
        };

        $requiredRAM = $rawSize * $memoryMultiplier;

        $nodes = match(true) {
            $requiredRAM < 1 * 1024**3 => 1,   // <1GB
            $requiredRAM < 8 * 1024**3 => 1,   // <8GB, single node
            $requiredRAM < 64 * 1024**3 => 2,  // <64GB, two nodes
            default => ceil($requiredRAM / (32 * 1024**3)), // 32GB per node
        };

        return new CapacityPlan(
            requiredRAM: $requiredRAM,
            recommendedNodes: $nodes,
            recommendedNodeSize: '32GB RAM, 4 vCPU',
        );
    }
}
```

### Multi-Node Query Distribution
```php
class DistributedVectorStore implements VectorStore {
    /** @param VectorStore[] $shards */
    public function __construct(private array $shards) {}

    public function search(VectorQuery $query): SearchResult {
        $allResults = [];

        // Query all shards in parallel
        $promises = [];
        foreach ($this->shards as $shard) {
            $shardQuery = clone $query;
            $shardQuery->topK = $query->topK; // Each shard returns top-K
            $promises[] = async(fn() => $shard->search($shardQuery));
        }

        $allResults = awaitAll($promises);

        // Merge and re-rank results from all shards
        return $this->mergeResults($allResults, $query->topK);
    }
}
```

## Related Knowledge Units

- ku-01 (Vector Database Fundamentals): Foundation for scaling.
- ku-02 (Indexing Strategies): Index selection affects scaling.
- ku-03 (Query Patterns & Filtering): Query patterns affect QPS.
- retrieval-augmented-generation/ku-01: RAG scaling with vector DBs.
- streaming-real-time-ai/ku-05: Scaling streaming alongside vector DB.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

