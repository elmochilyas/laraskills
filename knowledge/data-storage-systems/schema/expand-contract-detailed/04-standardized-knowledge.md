# 11-6 Expand Contract Detailed

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-6 |
| Knowledge Unit Title | Expand Contract Detailed |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | None |
| Related KUs | 11.1 Zero-downtime taxonomy, 11.9 Data backfill |
| Last Updated | 2026-06-02 |

## Overview

Expand-contract (parallel change) is the safest zero-downtime migration pattern. Phase 1 (expand): add new column/table, write to both old and new. Application reads from old. Phase 2 (backfill): fill new structure with data. Phase 3 (switch): read from new, write to both. Phase 4 (contract): remove old code/column. Each phase is a deployable code change.

---

## Core Concepts

- **Phase 1 — Expand**: Deploy app update that writes to both old and new structures. Old structure is still source of truth for reads.
- **Phase 2 — Backfill**: Fill new structure with existing data (batch job). Not a deploy step.
- **Phase 3 — Switch**: Deploy app update that reads from new structure. Old structure is still written to (fallback).
- **Phase 4 — Contract**: Deploy app update that removes old structure writes and code. Old structure dropped.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Column rename**: Expand: add new column `email_v2`, dual-write. Backfill: copy email to email_v2. Switch: read from email_v2. Contract: drop email.
- **Table migration**: Expand: create `orders_v2`, dual-write. Backfill: copy orders to orders_v2. Switch: read from orders_v2. Contract: drop orders.


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
| 1 | Skipping dual-write phase**: Direct switch from old to new without dual-write = rollback requires data backfill. Dangerous. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

