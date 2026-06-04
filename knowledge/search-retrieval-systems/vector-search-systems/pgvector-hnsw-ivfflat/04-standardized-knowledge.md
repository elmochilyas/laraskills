| Metadata | |
|---|---|
| KU ID | K042 |
| Subdomain | vector-similarity-search |
| Topic | pgvector HNSW / IVFFlat Indexing |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector provides two ANN index types: HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File with Flat Compression). HNSW builds a multi-layer graph structure for fast approximate search with excellent recall. IVFFlat partitions vectors into lists and searches the closest lists. Each has different build time, query performance, and recall characteristics.

## Core Concepts

- **HNSW**: Graph-based index with multiple layers; faster queries, slower build, higher recall.
- **IVFFlat**: Cluster-based index (Voronoi cells); faster build, slower queries, lower recall.
- **Distance Functions**: Both support L2, cosine, and inner product distances.
- **Index Build Parameters**: HNSW uses `m` (connections) and `ef_construction`; IVFFlat uses `lists`.
- **Query Parameters**: HNSW uses `ef_search`; IVFFlat uses `probes`.

## When To Use

- HNSW: Production workloads prioritizing query speed and recall
- IVFFlat: Large datasets where index build time and memory are concerns
- HNSW: Default choice for most applications (better query performance)
- IVFFlat: Bulk-loading scenarios where fast index creation matters

## When NOT To Use

- Exact nearest neighbor search (use no index with small datasets)
- Very small datasets (<10K vectors) where sequential scan is fast enough
- When index build time is critical and HNSW build is too slow (use IVFFlat)

## Best Practices

1. **Default to HNSW**: Better query performance and recall for most workloads.
2. **Tune HNSW parameters**: `m=16` (default), `ef_construction=200` for build, `ef_search` for queries.
3. **Use IVFFlat for large bulk imports**: Faster index creation, rebuild as needed.
4. **Rebuild indexes after significant data changes**: Maintains index quality.
5. **Benchmark both**: Test HNSW vs IVFFlat with your dataset and query patterns.

## Architecture Guidelines

- Create HNSW: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);`
- Create IVFFlat: `CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- Query tuning: `SET hnsw.ef_search = 200;` or `SET ivfflat.probes = 10;`.
- Drop and recreate indexes during major data changes for optimal structure.

## Performance Considerations

| Factor | HNSW | IVFFlat |
|---|---|---|
| Build time | Slower (O(N log N)) | Faster (O(N)) |
| Query speed | Faster | Slower (more probes = slower) |
| Recall | Higher (>99% with good params) | Lower (depends on lists/probes) |
| Memory | Higher (graph structure) | Lower (centroids + lists) |
| Update cost | Higher (graph maintenance) | Lower |

## Related Topics

- K041 (pgvector extension)
- K043 (pgvector distance functions)
- K046 (pgvector iterative index scans)
- K047 (pgvector binary quantization)

## AI Agent Notes

- HNSW is the default recommendation for production pgvector deployments.
- IVFFlat is useful for initial bulk loads where index build time matters.
- For agents: use HNSW for production; tune ef_search at query time for recall/latency balance; rebuild indexes after significant data changes.

## Verification

- [ ] Index type chosen (HNSW or IVFFlat) based on workload
- [ ] Index parameters tuned (m, ef_construction for HNSW; lists for IVFFlat)
- [ ] Query parameters configured (ef_search, probes)
- [ ] Index build time and recall benchmarked
- [ ] Index rebuild strategy documented
