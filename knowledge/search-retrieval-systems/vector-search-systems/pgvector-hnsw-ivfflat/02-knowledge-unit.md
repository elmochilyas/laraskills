# Knowledge Unit: pgvector HNSW / IVFFlat Indexing

## Metadata

- **ID:** K042
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** ANN index types

## Executive Summary

pgvector provides two index types for approximate nearest neighbor (ANN) search: HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File with Flat Compression). HNSW is the production default — offering better recall and query performance at the cost of slower builds and higher memory. IVFFlat builds faster and uses less memory but requires training data and has lower recall.

## Core Concepts

- **HNSW**: A multi-layer graph where each layer contains fewer nodes. Search navigates from top to bottom. No training required. Supports incremental inserts.
- **IVFFlat**: Partitions vectors into cells via k-means clustering. Search probes the nearest cells. Requires training step. Not suitable for frequently changing data.
- **Build Parameters**: HNSW: `m` (connections per node, default 16), `ef_construction` (build candidate list, default 64). IVFFlat: `lists` (number of partitions).
- **Query Parameter**: HNSW: `hnsw.ef_search` (search candidate list, default 40). IVFFlat: `ivfflat.probes` (number of partitions to probe).

## Internal Mechanics

HNSW builds a hierarchical graph during index creation. Each node connects to its `m` nearest neighbors. The top layer is sparse (fewer nodes), lower layers are dense. Search starts at the top layer, greedily navigates to the nearest node, then descends to the next layer. `ef_search` controls the candidate queue size during navigation. IVFFlat runs k-means clustering to create `lists` partitions, then assigns each vector to the nearest centroid. Search probes `probes` nearest partitions and returns the best candidates.

## Patterns

- **HNSW as default**: Best recall, no training, supports incremental inserts.
- **IVFFlat for static datasets**: Faster build, smaller index, but must retrain if data distribution shifts.
- **Use `halfvec` to reduce index size**: HNSW on `halfvec(1536)` is ~8GB for 1M vectors vs ~3GB with quantization.
- **Build after bulk loading**: Always build indexes after loading data, not incrementally.

## Architectural Decisions

pgvector implements both HNSW and IVFFlat because no single index type fits all workloads. HNSW is preferred for most production use cases; IVFFlat remains relevant for very large datasets where build speed is critical and data is static.

## Tradeoffs

| Factor | HNSW | IVFFlat |
|---|---|---|
| Build time | Slower (29s for 25K 3072d) | Faster (5s for same) |
| Query speed | 2-6ms | 2-10ms |
| Recall at default | 95-99% | 80-90% |
| Training required | No | Yes (k-means) |
| Incremental inserts | Yes (supports) | No (retrain needed) |
| Memory pressure | Higher (graph structure) | Lower |
| Max dimensions (vector) | 2000 | 2000 |

## Performance Considerations

- HNSW build time is proportional to `m * ef_construction`. Defaults are good starting points.
- IVFFlat probes should be tuned: `sqrt(lists)` is a good starting point.
- HNSW `ef_search` at 40-200 provides the best recall-to-latency tradeoff for most datasets.
- Parallel workers speed up index builds: `max_parallel_maintenance_workers=4`.

## Production Considerations

- **Use HNSW by default** — switch to IVFFlat only when build speed or index size is a hard constraint.
- **Sweep `ef_search`** against recall on production data to find the optimal value.
- **Use `CREATE INDEX CONCURRENTLY`** for zero-downtime index creation.
- **Schedule REINDEX** for HNSW during low-traffic windows.
- **Monitor `maintenance_work_mem`** — HNSW build can exhaust memory on large datasets.

## Common Mistakes

- Using IVFFlat on frequently updated data — recall degrades as centroids drift.
- Not tuning `ef_search` — default of 40 is conservative; raising to 100 often improves recall significantly.
- Building HNSW index on a table with existing data without enough `maintenance_work_mem`.
- Expecting IVFFlat recall to match HNSW — it won't without careful probe tuning.

## Failure Modes

- **IVFFlat centroid drift**: After >30% new inserts, recall drops significantly. Requires REINDEX.
- **HNSW memory exhaustion during build**: Index building fails with OOM. Raise `maintenance_work_mem`.
- **Index not used**: Query planner may skip the index for very small tables or when filters change selectivity.

## Ecosystem Usage

Standard for all pgvector-based production vector search. HNSW is the default recommendation for new implementations.

## Related Knowledge Units

- K041 (pgvector extension)
- K043 (pgvector distance functions)
- K044 (pgvector half-precision)
- K046 (pgvector iterative index scans)

## Research Notes

Sources: pgvector docs, academic papers (HNSW: Malkov & Yashunin 2016, arXiv:1603.09320). The `ef_search` recall sweep is the single most important tuning exercise for pgvector. Defaults are safe but rarely optimal for specific datasets or recall requirements.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

