# 11-4 Spirit Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-4 |
| Knowledge Unit Title | Spirit Tool |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 11.2 gh-ost | 11.3 pt-online-schema-change |
| Last Updated | 2026-06-02 |

## Overview

Spirit is a newer online schema change tool (by CashApp/Block) that uses MySQL physical replication for schema changes. Creates a new replica with the desired schema, builds it via physical replication, then cuts over. Avoids trigger overhead (unlike pt-osc) and binlog requirement (unlike gh-ost). Suitable for RDS and Aurora.

---

## Core Concepts

- **Physical replication**: Spirit clones the original table via physical file copy (faster than row-by-row copy). Requires replica from backup.
- **No triggers**: Unlike pt-osc, Spirit doesn't add triggers. Performance impact during migration is lower.
- **Cutover**: Atomic table rename. Same as other online schema change tools.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Spirit for RDS/Aurora**: Works well with RDS read replicas and Aurora clusters. No need for binlog retention or trigger cleanup.
- **Spirit for large tables**: Physical copy is faster than row copy for multi-hundred-GB tables.


## Architecture Guidelines

- gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Performance Considerations

- Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Spirit requires disk space**: Physical copy requires space for both original and shadow table. Ensure enough free storage. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Production Schema Operations
- **Closely Related**: Other KUs within Production Schema Operations
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

