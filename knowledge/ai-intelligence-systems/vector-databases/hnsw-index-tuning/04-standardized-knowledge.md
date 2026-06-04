---
id: KU-029
title: "HNSW Index Tuning"
subdomain: "vector-database-integration"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/05-vector-databases/hnsw-index-tuning/04-standardized-knowledge.md"
---

# HNSW Index Tuning

## Overview

HNSW (Hierarchical Navigable Small World) is the default graph-based index for pgvector. Proper tuning dramatically affects query latency, recall, and index build time. Key parameters: `m` (connections per node), `ef_construction` (build quality), `ef_search` (query accuracy). Defaults work for small datasets; tuning is essential for production deployments above 100K vectors.

## Core Concepts

- **HNSW algorithm**: Multi-layer graph where upper layers have fewer nodes (long-range connections), lower layers have more nodes (short-range connections). Search starts at top layer, descends to find nearest neighbors.
- **`m` (16 default)**: Maximum number of connections per node per layer. Higher = better recall, slower index, more memory.
- **`ef_construction` (64 default)**: Dynamic candidate list size during index build. Higher = better quality build, slower index creation.
- **`ef_search` (40 default)**: Candidate list size during query. Higher = better recall, slower query. Set per-query.
- **IVFFlat alternative**: Inverted file index â€” partitions vector space into cells. Faster build, slower query, worse recall at high scale.

## When To Use

- Production applications requiring HNSW Index Tuning functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Tune for workload**: High-throughput, latency-sensitive â†’ lower `ef_search`. Quality-critical, batch â†’ higher `ef_search`.
- **Dynamic `ef_search`**: Set per-query based on latency budget: `SET hnsw.ef_search = 100;`
- **Rebuild for bulk operations**: Drop HNSW index before bulk loading, rebuild after â€” faster than incremental inserts
- **Memory budget tuning**: `m * (4 * 2 + dimensions * 4) ` bytes per vector â€” calculate memory requirements
- **Monitor recall**: Sample queries with brute-force comparison to measure recall@K

- **Tuning knobs on a search engine**: `m` = how well-connected the graph is, `ef_construction` = how carefully the graph is built, `ef_search` = how thoroughly you search it. Each has a latency/recall tradeoff.
- **Memory vs. speed vs. accuracy**: Standard trilemma â€” improving any two degrades the third. HNSW tuning is about finding the acceptable balance for your workload.

## Architecture Guidelines

- **Decision**: HNSW vs. IVFFlat â†’ HNSW for production (better recall, faster query). IVFFlat for prototyping or when index build time is critical (schedule-limited rebuilds).
- **Decision**: Build-time vs. query-time tuning â†’ Build-time (`m`, `ef_construction`) set by schema. Query-time (`ef_search`) programmable per request.

## Performance Considerations

- `ef_search=40` (default): ~10ms query + ~95% recall @ 1M vectors 1536d
- `ef_search=100`: ~25ms query + ~99% recall
- `ef_search=400`: ~100ms query + ~99.9% recall
- Index build: 1M vectors Ã— 1536d = ~2 hours with `ef_construction=64`
- Memory: 1M vectors Ã— 1536d Ã— m=16 â‰ˆ ~12GB for index alone (not including vector data)
- Each 0.1% recall improvement costs ~2x query latency near the ceiling

| Parameter | Range | Low | High | Impact |
|-----------|-------|-----|------|--------|
| `m` | 8-64 | Less memory, faster build | Better recall, more memory | Index quality, memory |
| `ef_construction` | 32-512 | Fast build, lower recall | Slow build, higher recall | Build time, index quality |
| `ef_search` | 1-1000 | Fast query, lower recall | Slow query, higher recall | Query latency, recall |

## Security Considerations

- Build HNSW index with `ONLINE` option (pgvector 0.7+) to allow concurrent reads
- Set `maintenance_work_mem` high (1-4GB) during index build â€” speeds up significantly
- Monitor index build progress via `pg_stat_progress_create_index`
- Rebuild index if recall degrades over time (vector distribution shifts)
- Test recall with representative query set before deploying index changes
- Use `ALTER INDEX ... SET (ef_search = N)` for instance-level default

## Common Mistakes

- Using default `m=16` for high-dimension vectors (3076d) â€” increase to 32-48 for better recall
- Building HNSW index on table with existing data without increasing `maintenance_work_mem` â€” slow build
- Setting `ef_search` globally too high â€” unnecessary latency for simple queries
- Not testing recall â€” tuned blindly without measurement
- Rebuilding index on every deployment â€” wasted compute; rebuild only when vectors change
- Using HNSW for <10K vectors â€” brute-force is faster and simpler below this threshold

## Anti-Patterns

- **Index build OOM**: `maintenance_work_mem` too low for large dataset â€” increase or reduce `ef_construction`
- **Query timeout with high `ef_search`**: Setting >500 on large datasets causes multi-second queries
- **Memory pressure**: HNSW index too large for available memory â€” switch to IVFFlat or upgrade hardware
- **Recall cliff**: Recall drops sharply past certain dataset size â€” retune parameters periodically
- **Corruption**: PostgreSQL crash during index build â€” rebuilt index required

## Examples

The following ecosystem packages provide reference implementations:

- Laravel AI SDK: no explicit HNSW parameter support â€” raw SQL for index management
- `moneo/laravel-rag`: provides index management commands
- Custom migration: raw SQL `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`
- pgvector 0.7+: `USING hnsw WITH (m = 24, ef_construction = 200)`

## Related Topics

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-035: Vector Database Selection Framework

## AI Agent Notes

- When asked about HNSW Index Tuning, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

