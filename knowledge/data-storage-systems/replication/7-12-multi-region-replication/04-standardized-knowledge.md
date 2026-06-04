# 7-12 Multi-Region Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-12 |
| Knowledge Unit Title | Multi-Region Replication |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.10 Multi-master replication | 7.11 Conflict resolution | 7.13 Plan replication topology |
| Last Updated | 2026-06-04 |

## Overview

Multi-region replication copies data across geographically distributed regions for reduced read latency, disaster recovery, and data residency compliance. Topologies include active-passive (single write region) and active-active (multi-master across regions).

---

## Core Concepts

- **Active-passive**: Single primary region for writes, replica regions for reads. Simpler, no conflicts.
- **Active-active**: Multiple regions accept writes. Higher availability, requires conflict resolution.
- **Cross-region latency**: 10-200ms RTT depending on geographic distance.
- **Async replication**: Zero write latency impact, seconds of potential data loss.
- **Geo-DNS routing**: Directs read traffic to nearest region based on DNS resolution.
- **Data residency**: Legal requirement to keep data within specific geographic boundaries.

## When To Use

- Global user base with high read traffic from multiple regions
- Disaster recovery across regions (active-passive or active-active)
- Data residency compliance requirements

## When NOT To Use

- Single-region user base
- Write latency impact unacceptable
- Application requires strong global consistency

## Best Practices

- Monitor cross-region replication lag continuously
- Use async replication for cross-region (sync is too slow)
- Test cross-region failover regularly

## Architecture Guidelines

| Topology | Write Latency | Read Latency | Data Loss Risk | Complexity |
|----------|--------------|-------------|---------------|------------|
| Active-passive | Local | Local replica | Seconds (async) | Low |
| Active-active | Local | Local | Seconds + conflicts | High |
| Hub-and-spoke | Hub local | Spoke local | Seconds | Medium |

## Performance Considerations

- Cross-region async: zero write impact, 100ms-sec lag
- Cross-region sync: write latency = RTT (unacceptable for most)
- Bandwidth costs for cross-region data transfer

## Security Considerations

- Cross-region replication must use TLS encryption
- Data transferred across borders must comply with regulations

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Cross-region sync replication | Ignoring latency | 50-200ms write latency | Use async for cross-region |
| 2 | No data residency check | Missing compliance review | Regulatory violation | Map data flows before setup |
| 3 | Network partition unhandled | No retry mechanism | Replication stalls | Implement retry with backoff |

## Anti-Patterns

- Using sync replication across continents
- Replicating data to restricted regions
- No monitoring of cross-region lag

## Verification

- [ ] Cross-region replication configured and running
- [ ] Replication lag meets SLAs
- [ ] Reads route to nearest region
- [ ] Failover between regions works
- [ ] Data residency compliance met
