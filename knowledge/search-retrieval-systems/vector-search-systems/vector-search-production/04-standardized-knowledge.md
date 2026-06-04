| Metadata | |
|---|---|
| KU ID | ku-16 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search Production |
| Source | Industry |
| Maturity | Stable |

## Overview

Running vector search in production requires attention to infrastructure, monitoring, backup, scaling, and operational reliability. Key considerations: index building and refresh strategy, hardware sizing (RAM, CPU), query monitoring, backup/restore, and disaster recovery.

## Core Concepts

- **Index Refresh**: When and how to rebuild ANN indexes
- **Hardware Sizing**: RAM for vectors + index structures, CPU for queries
- **Monitoring**: Query latency, recall degradation, index freshness
- **Backup**: Vector data + index structures must be backed up
- **Disaster Recovery**: Restore vectors from backup or regenerate from source
- **Scaling**: Vertical (more RAM) vs horizontal (more nodes) for vector search

## When To Use

- Any production vector search deployment
- Pre-production capacity planning
- Operational readiness review

## When NOT To Use

- Development/staging environments
- Pre-deployment planning only

## Best Practices

1. **Plan for index rebuilds**: ANN indexes need periodic rebuilding.
2. **Size RAM for vectors + index overhead**: HNSW needs 1.5-2x vector storage.
3. **Monitor query latency and recall**: Set alerts for degradation.
4. **Backup vectors AND source data**: Index can be rebuilt from vectors; vectors from source.
5. **Use managed service for simplicity**: Qdrant Cloud, Pinecone reduce ops burden.
6. **Plan for disaster recovery**: Regenerate embeddings from source data as ultimate backup.

## Related Topics

- K013 (Vector search performance)
- K014 (Benchmarking)
- K042 (HNSW / IVFFlat)

## AI Agent Notes

- Production vector search is operationally simpler with managed services
- RAM sizing is the most critical hardware decision
- For agents: use managed services for production, plan for index rebuilds and backup

## Verification

- [ ] HW sizing done (RAM, CPU)
- [ ] Index refresh strategy documented
- [ ] Monitoring for latency and recall
- [ ] Backup strategy (vectors + source)
- [ ] DR plan documented
- [ ] Scaling plan for growth
- [ ] Managed service selected if appropriate
- [ ] Production readiness checklist complete
