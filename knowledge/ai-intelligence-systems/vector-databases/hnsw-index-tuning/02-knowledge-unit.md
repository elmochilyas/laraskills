# Knowledge Unit: HNSW Index Tuning

## Metadata

- **ID:** KU-029
- **Subdomain:** Vector Database Integration
- **Slug:** hnsw-index-tuning
- **Version:** 1.0.0
- **Maturity:** Mature
- **Status:** Published

## Executive Summary

HNSW (Hierarchical Navigable Small World) is the default graph-based index for pgvector. Proper tuning dramatically affects query latency, recall, and index build time. Key parameters: `m` (connections per node), `ef_construction` (build quality), `ef_search` (query accuracy). Defaults work for small datasets; tuning is essential for production deployments above 100K vectors.

## Core Concepts

- **HNSW algorithm**: Multi-layer graph where upper layers have fewer nodes (long-range connections), lower layers have more nodes (short-range connections). Search starts at top layer, descends to find nearest neighbors.
- **`m` (16 default)**: Maximum number of connections per node per layer. Higher = better recall, slower index, more memory.
- **`ef_construction` (64 default)**: Dynamic candidate list size during index build. Higher = better quality build, slower index creation.
- **`ef_search` (40 default)**: Candidate list size during query. Higher = better recall, slower query. Set per-query.
- **IVFFlat alternative**: Inverted file index — partitions vector space into cells. Faster build, slower query, worse recall at high scale.

## Mental Models

- **Tuning knobs on a search engine**: `m` = how well-connected the graph is, `ef_construction` = how carefully the graph is built, `ef_search` = how thoroughly you search it. Each has a latency/recall tradeoff.
- **Memory vs. speed vs. accuracy**: Standard trilemma — improving any two degrades the third. HNSW tuning is about finding the acceptable balance for your workload.

## Internal Mechanics

HNSW graph construction:
1. Insert vectors one by one into the graph
2. For each new vector, find its nearest neighbors in the current graph
3. Connect to those neighbors (up to `m` connections)
4. `ef_construction` controls how many candidates are evaluated during neighbor search
5. Upper layers have exponentially fewer nodes — enables logarithmic search complexity

Query execution:
1. Start at top-most layer, greedily traverse to nearest neighbor
2. Descend to next layer, continue search with `ef_search` candidate list
3. At bottom layer, exhaustive search within candidate list for final top-K

## Patterns

- **Tune for workload**: High-throughput, latency-sensitive → lower `ef_search`. Quality-critical, batch → higher `ef_search`.
- **Dynamic `ef_search`**: Set per-query based on latency budget: `SET hnsw.ef_search = 100;`
- **Rebuild for bulk operations**: Drop HNSW index before bulk loading, rebuild after — faster than incremental inserts
- **Memory budget tuning**: `m * (4 * 2 + dimensions * 4) ` bytes per vector — calculate memory requirements
- **Monitor recall**: Sample queries with brute-force comparison to measure recall@K

## Architectural Decisions

- **Decision**: HNSW vs. IVFFlat → HNSW for production (better recall, faster query). IVFFlat for prototyping or when index build time is critical (schedule-limited rebuilds).
- **Decision**: Build-time vs. query-time tuning → Build-time (`m`, `ef_construction`) set by schema. Query-time (`ef_search`) programmable per request.

## Tradeoffs

| Parameter | Range | Low | High | Impact |
|-----------|-------|-----|------|--------|
| `m` | 8-64 | Less memory, faster build | Better recall, more memory | Index quality, memory |
| `ef_construction` | 32-512 | Fast build, lower recall | Slow build, higher recall | Build time, index quality |
| `ef_search` | 1-1000 | Fast query, lower recall | Slow query, higher recall | Query latency, recall |

## Performance Considerations

- `ef_search=40` (default): ~10ms query + ~95% recall @ 1M vectors 1536d
- `ef_search=100`: ~25ms query + ~99% recall
- `ef_search=400`: ~100ms query + ~99.9% recall
- Index build: 1M vectors × 1536d = ~2 hours with `ef_construction=64`
- Memory: 1M vectors × 1536d × m=16 ≈ ~12GB for index alone (not including vector data)
- Each 0.1% recall improvement costs ~2x query latency near the ceiling

## Production Considerations

- Build HNSW index with `ONLINE` option (pgvector 0.7+) to allow concurrent reads
- Set `maintenance_work_mem` high (1-4GB) during index build — speeds up significantly
- Monitor index build progress via `pg_stat_progress_create_index`
- Rebuild index if recall degrades over time (vector distribution shifts)
- Test recall with representative query set before deploying index changes
- Use `ALTER INDEX ... SET (ef_search = N)` for instance-level default

## Common Mistakes

- Using default `m=16` for high-dimension vectors (3076d) — increase to 32-48 for better recall
- Building HNSW index on table with existing data without increasing `maintenance_work_mem` — slow build
- Setting `ef_search` globally too high — unnecessary latency for simple queries
- Not testing recall — tuned blindly without measurement
- Rebuilding index on every deployment — wasted compute; rebuild only when vectors change
- Using HNSW for <10K vectors — brute-force is faster and simpler below this threshold

## Failure Modes

- **Index build OOM**: `maintenance_work_mem` too low for large dataset — increase or reduce `ef_construction`
- **Query timeout with high `ef_search`**: Setting >500 on large datasets causes multi-second queries
- **Memory pressure**: HNSW index too large for available memory — switch to IVFFlat or upgrade hardware
- **Recall cliff**: Recall drops sharply past certain dataset size — retune parameters periodically
- **Corruption**: PostgreSQL crash during index build — rebuilt index required

## Ecosystem Usage

- Laravel AI SDK: no explicit HNSW parameter support — raw SQL for index management
- `moneo/laravel-rag`: provides index management commands
- Custom migration: raw SQL `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`
- pgvector 0.7+: `USING hnsw WITH (m = 24, ef_construction = 200)`

## Related Knowledge Units

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-035: Vector Database Selection Framework

## Research Notes

- HNSW parameters set at index creation time — cannot be changed without index rebuild
- `ef_search` is the only runtime-tunable parameter
- pgvector 0.7+ supports `USING hnsw WITH()` for build parameters
- pgvector 0.8+ adds support for halfvec (half-precision) for 2x memory savings with minimal recall loss
- For most Laravel RAG workloads (<10M vectors), HNSW with defaults + `ef_search=100` is sufficient
