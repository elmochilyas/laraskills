| Metadata | |
|---|---|
| Knowledge Unit ID | ku-04 |
| Subdomain | dedicated-search-appliances |
| Topic | Search Appliance Comparison |
| Source | Meilisearch / Typesense / Algolia / Scout Docs |
| Maturity | Stable |

## Overview

Three primary dedicated search appliances integrate with Laravel Scout: Meilisearch (open-source, Rust), Typesense (open-source, C++), and Algolia (cloud-managed). Each makes different architectural tradeoffs in storage, schema, clustering, performance, and cost. This KU provides a structured comparison to guide engine selection.

## Core Concepts

- **Meilisearch**: Schema-free, disk-based (LMDB), instant search defaults, single-node primary
- **Typesense**: Schema-enforced, RAM-first, Raft-based HA clustering, fastest raw speed
- **Algolia**: Cloud-managed, global CDN, richest feature set, per-query pricing
- **Scout Abstraction**: All three share the same Scout API, enabling engine switching
- **Cost Models**: Self-hosted (Meilisearch/Typesense) vs per-query (Algolia) vs resource-based (Typesense Cloud)

## When To Use

- **Meilisearch**: Rapid prototyping, content sites, teams wanting zero-config start
- **Typesense**: High-traffic production, HA requirement, schema control needed
- **Algolia**: Enterprise with budget, global distribution, business-user tuning
- **Custom Engine**: Elasticsearch/OpenSearch needs, proprietary backend, multi-engine federation

## When NOT To Use

- **Meilisearch**: When HA clustering is required in free tier; dataset >2TiB
- **Typesense**: When dataset cannot fit in RAM; rapid schema iteration needed
- **Algolia**: Cost-sensitive high-volume apps; data residency restrictions
- **Custom Engine**: When existing community engines meet requirements

## Best Practices

1. **Start with the simplest engine that meets requirements**: Over-engineering is common.
2. **Consider operational maturity**: Self-hosted requires devops investment.
3. **Plan for migration**: Scout abstraction makes switching easier but not trivial.
4. **Use cloud-managed for production**: Unless you have dedicated ops team.
5. **Benchmark with real data**: Each engine performs differently with different data shapes.

## Architecture Guidelines

- Decision factors: dataset size, HA needs, team ops capability, budget, latency requirements
- For <50K records: Consider Scout database engine first (zero infrastructure)
- For 50K-1M records: Meilisearch or Typesense self-hosted
- For 1M+ records: Algolia or Typesense Cloud (managed)
- Evaluate using production-representative data and query patterns

## Performance Considerations

| Factor | Meilisearch | Typesense | Algolia |
|---|---|---|---|
| Query latency (P50) | 10-50ms | 5-30ms | <50ms |
| Storage model | Disk (LMDB) | RAM | Managed |
| Max dataset | ~2TiB | RAM-limited | Unlimited |
| HA clustering | Enterprise | Built-in (Raft) | Managed |
| Write speed | Fast | Fast | Async (~1s) |

## Security Considerations

- Self-hosted: You own security (network, encryption, access control)
- Algolia: Provider-managed security with API key controls
- All: Use search-only keys for frontend, admin keys server-side
- Self-hosted: Enable TLS, configure firewalls, regular security updates

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Choosing without benchmarking | Assumption-based | Poor performance or cost | Test with real data |
| Underestimating ops cost of self-hosted | Ignoring maintenance | Operational burden | Factor in devops time |
| Not considering migration path | Lock-in assumption | Hard to switch engines | Use Scout abstraction |
| Over-engineering for small datasets | Feature envy | Infrastructure complexity | Start with database engine |

## Anti-Patterns

- **Switching engines as first optimization**: Optimize relevance/indexing first
- **Running multiple engines without clear need**: Increased complexity
- **Ignoring Scout's database engine capability**: Viable for many applications
- **Assuming cloud is always better**: Self-hosted offers cost control and data sovereignty

## Examples

Decision matrix:
- Low traffic, low budget → Scout database engine
- Content site, moderate traffic → Meilisearch
- High traffic e-commerce → Typesense or Algolia
- Enterprise, global users → Algolia
- Maximum control, existing ops → Typesense self-hosted

## Related Topics

- K002 (Scout database engine)
- K014 (Custom engine development)
- K018 (Algolia driver setup)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)

## AI Agent Notes

- Engine selection is one of the most consequential decisions in Laravel search architecture
- Scout abstraction enables switching but engine-specific features require custom code
- Consider total cost of ownership: infrastructure + ops time + API costs
- For agents: gather requirements (dataset size, budget, HA needs, team ops) before recommending

## Verification

- [ ] Dataset size and growth rate estimated
- [ ] HA and latency requirements documented
- [ ] Team ops capability assessed
- [ ] Budget for search infrastructure determined
- [ ] At least two engines benchmarked with real data
- [ ] Migration path documented (how to switch engines)
