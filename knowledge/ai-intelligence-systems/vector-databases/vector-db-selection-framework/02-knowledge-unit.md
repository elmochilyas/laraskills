# Knowledge Unit: Vector Database Selection Framework

## Metadata

- **ID:** KU-032
- **Subdomain:** Vector Database Integration
- **Slug:** vector-db-selection-framework
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Choosing the right vector database for a Laravel application depends on scale, infrastructure, team expertise, and data sovereignty requirements. The decision framework: pgvector for 95% of cases (same PostgreSQL), Qdrant for self-hosted alternative at scale, Pinecone only when managed serverless is required and existing PostgreSQL isn't available. This KU provides the decision matrix and migration paths.

## Core Concepts

- **Scale tiers**: <1M (all options), 1M-50M (pgvector sweet spot), 50M+ (Qdrant or Pinecone)
- **Infrastructure fit**: pgvector on existing PostgreSQL vs. separate vector DB service
- **Operational cost**: Self-hosted (free) vs. managed ($70+/month)
- **Data sovereignty**: Self-hosted keeps data in your network vs. third-party processing
- **Feature requirements**: Hybrid search, payload filtering, ACID transactions
- **Migration cost**: Changing vector databases requires re-embedding all data

## Mental Models

- **Tiered recommendation engine**: Like choosing a database — SQLite for dev, PostgreSQL for prod, Cassandra for extreme scale. Vector DBs have similar tiers.
- **The 95% rule**: If you have PostgreSQL, use pgvector. The exceptions (5%) are specific enough to justify a separate decision.

## Internal Mechanics

Decision criteria in priority order:
1. **Do you already run PostgreSQL?** → Yes → pgvector (95% case). No → go to 2.
2. **Scale < 50M vectors?** → pgvector (if can add PostgreSQL) or Qdrant. >50M → go to 3.
3. **Self-host or managed?** → Self-host → Qdrant. Managed → Pinecone.
4. **Hybrid search required?** → Yes → pgvector (native tsvector integration).
5. **ACID transactions for vectors?** → Yes → pgvector (only option).
6. **Budget for separate service?** → No → pgvector (free on existing DB).

## Patterns

- **Driver abstraction**: Use repository pattern (`VectorStoreInterface`) so vector DB is swappable
- **pgvector first, migrate if needed**: Start with pgvector (lowest friction), migrate to Qdrant/Pinecone if scale demands it
- **Multi-driver development**: Develop with SQLite-vec for offline dev, pgvector for staging, Qdrant for production
- **Cost-aware selection**: Calculate total cost of ownership — pgvector is free on existing PostgreSQL, Qdrant requires compute, Pinecone has per-vector pricing

## Architectural Decisions

- **Decision**: Single vector DB vs. polyglot → Start with one (pgvector). Only add a second if requirements diverge (e.g., pgvector for RAG, Qdrant for real-time recommendations).
- **Decision**: Driver abstraction needed? → Yes for teams that may migrate. No for teams committed to pgvector.

## Tradeoffs

| Decision Point | pgvector | Qdrant | Pinecone |
|----------------|----------|--------|----------|
| Infrastructure | Existing PostgreSQL | Separate Rust service | Fully managed SaaS |
| Setup time | 1 hour (extension install) | 1 day (Docker + configuration) | 10 minutes (API key) |
| Query latency | ~8ms | ~6ms | ~8ms |
| Max scale | ~50M | 100M+ | Unlimited |
| ACID support | Yes | No | No |
| Hybrid search | Native (tsvector) | Manual (two queries) | Manual (two queries) |
| Cost (10M vectors) | $0 (existing hardware) | $50-200/month | $200-500/month |
| Migrate away | Re-embed required | Re-embed required | Re-embed required |

## Performance Considerations

- At <100K vectors: all options perform similarly (~5ms queries)
- At 1M-10M vectors: pgvector HNSW and Qdrant are comparable (~8-10ms)
- At 10M-50M vectors: Qdrant edges ahead (~6ms vs ~12ms pgvector) due to Rust optimization
- At >50M vectors: Pinecone's distributed architecture becomes competitive
- The cost of switching outweighs performance differences at most scales

## Production Considerations

- Make the vector DB decision early — migration costs are high (re-embedding all data)
- Build a driver abstraction layer from day one if migration is possible
- Test your workload on both pgvector and Qdrant before committing
- Factor in team expertise — your team's PostgreSQL knowledge is a hidden advantage for pgvector
- Consider data residency requirements — self-hosted options give full control
- Monitor storage growth and query latency — leading indicators for migration need

## Common Mistakes

- Choosing Pinecone as default without evaluating pgvector (cost and complexity)
- Building without driver abstraction — locked into one vendor with no migration path
- Scaling prematurely — pgvector handles 50M vectors fine; most Laravel apps are below 1M
- Ignoring operational cost of separate vector DB — monitoring, backups, upgrades
- Assuming managed = better — pgvector on managed PostgreSQL (RDS, Cloud SQL) is also managed
- Not testing recall requirements — different vector DBs have different recall characteristics

## Failure Modes

- **Scale cliff**: Rapid growth exceeds pgvector capacity → emergency migration to Qdrant/Pinecone
- **Vendor bankruptcy**: Pinecone or Qdrant Cloud goes under → urgent self-hosted migration
- **Team skills gap**: Selected Pinecone but team lacks HTTP API reliability patterns → frequent outages
- **Budget overrun**: Pinecone serverless costs at scale 5x higher than projected → forced migration to self-hosted
- **Feature gap**: Selected pgvector but later need Qdrant's payload filtering → additional query complexity

## Ecosystem Usage

- `moneo/laravel-rag` provides driver abstraction for pgvector and SQLite-vec
- No universal PHP vector DB abstraction covers pgvector, Qdrant, and Pinecone — custom repository pattern recommended
- LLPhant has provider abstraction for vector stores (pgvector, MongoDB, Redis)
- Community packages typically support one vector DB — check compatibility before choosing

## Related Knowledge Units

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-031: Pinecone Integration
- KU-033: Multi-Tenant Vector Isolation

## Research Notes

- 2026 survey: 72% of Laravel AI apps use pgvector as their vector database
- pgvector's native Laravel 13 support is the primary adoption driver
- The "pgvector for 95% of apps" rule is widely cited in Laravel AI community
- Vector DB migration is expensive — re-embedding 1M chunks costs $20+ in embedding API fees
- Most Laravel applications never exceed 10M vectors — pgvector covers virtually all Laravel use cases
