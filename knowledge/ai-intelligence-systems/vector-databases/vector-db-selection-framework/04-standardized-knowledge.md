---
id: KU-032
title: "Vector Database Selection Framework"
subdomain: "vector-database-integration"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/05-vector-databases/vector-db-selection-framework/04-standardized-knowledge.md"
---

# Vector Database Selection Framework

## Overview

Choosing the right vector database for a Laravel application depends on scale, infrastructure, team expertise, and data sovereignty requirements. The decision framework: pgvector for 95% of cases (same PostgreSQL), Qdrant for self-hosted alternative at scale, Pinecone only when managed serverless is required and existing PostgreSQL isn't available. This KU provides the decision matrix and migration paths.

## Core Concepts

- **Scale tiers**: <1M (all options), 1M-50M (pgvector sweet spot), 50M+ (Qdrant or Pinecone)
- **Infrastructure fit**: pgvector on existing PostgreSQL vs. separate vector DB service
- **Operational cost**: Self-hosted (free) vs. managed ($70+/month)
- **Data sovereignty**: Self-hosted keeps data in your network vs. third-party processing
- **Feature requirements**: Hybrid search, payload filtering, ACID transactions
- **Migration cost**: Changing vector databases requires re-embedding all data

## When To Use

- Production applications requiring Vector Database Selection Framework functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Driver abstraction**: Use repository pattern (`VectorStoreInterface`) so vector DB is swappable
- **pgvector first, migrate if needed**: Start with pgvector (lowest friction), migrate to Qdrant/Pinecone if scale demands it
- **Multi-driver development**: Develop with SQLite-vec for offline dev, pgvector for staging, Qdrant for production
- **Cost-aware selection**: Calculate total cost of ownership â€” pgvector is free on existing PostgreSQL, Qdrant requires compute, Pinecone has per-vector pricing

- **Tiered recommendation engine**: Like choosing a database â€” SQLite for dev, PostgreSQL for prod, Cassandra for extreme scale. Vector DBs have similar tiers.
- **The 95% rule**: If you have PostgreSQL, use pgvector. The exceptions (5%) are specific enough to justify a separate decision.

## Architecture Guidelines

- **Decision**: Single vector DB vs. polyglot â†’ Start with one (pgvector). Only add a second if requirements diverge (e.g., pgvector for RAG, Qdrant for real-time recommendations).
- **Decision**: Driver abstraction needed? â†’ Yes for teams that may migrate. No for teams committed to pgvector.

## Performance Considerations

- At <100K vectors: all options perform similarly (~5ms queries)
- At 1M-10M vectors: pgvector HNSW and Qdrant are comparable (~8-10ms)
- At 10M-50M vectors: Qdrant edges ahead (~6ms vs ~12ms pgvector) due to Rust optimization
- At >50M vectors: Pinecone's distributed architecture becomes competitive
- The cost of switching outweighs performance differences at most scales

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

## Security Considerations

- Make the vector DB decision early â€” migration costs are high (re-embedding all data)
- Build a driver abstraction layer from day one if migration is possible
- Test your workload on both pgvector and Qdrant before committing
- Factor in team expertise â€” your team's PostgreSQL knowledge is a hidden advantage for pgvector
- Consider data residency requirements â€” self-hosted options give full control
- Monitor storage growth and query latency â€” leading indicators for migration need

## Common Mistakes

- Choosing Pinecone as default without evaluating pgvector (cost and complexity)
- Building without driver abstraction â€” locked into one vendor with no migration path
- Scaling prematurely â€” pgvector handles 50M vectors fine; most Laravel apps are below 1M
- Ignoring operational cost of separate vector DB â€” monitoring, backups, upgrades
- Assuming managed = better â€” pgvector on managed PostgreSQL (RDS, Cloud SQL) is also managed
- Not testing recall requirements â€” different vector DBs have different recall characteristics

## Anti-Patterns

- **Scale cliff**: Rapid growth exceeds pgvector capacity â†’ emergency migration to Qdrant/Pinecone
- **Vendor bankruptcy**: Pinecone or Qdrant Cloud goes under â†’ urgent self-hosted migration
- **Team skills gap**: Selected Pinecone but team lacks HTTP API reliability patterns â†’ frequent outages
- **Budget overrun**: Pinecone serverless costs at scale 5x higher than projected â†’ forced migration to self-hosted
- **Feature gap**: Selected pgvector but later need Qdrant's payload filtering â†’ additional query complexity

## Examples

The following ecosystem packages provide reference implementations:

- `moneo/laravel-rag` provides driver abstraction for pgvector and SQLite-vec
- No universal PHP vector DB abstraction covers pgvector, Qdrant, and Pinecone â€” custom repository pattern recommended
- LLPhant has provider abstraction for vector stores (pgvector, MongoDB, Redis)
- Community packages typically support one vector DB â€” check compatibility before choosing

## Related Topics

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-031: Pinecone Integration
- KU-033: Multi-Tenant Vector Isolation

## AI Agent Notes

- When asked about Vector Database Selection Framework, first determine the specific use case and requirements.
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

