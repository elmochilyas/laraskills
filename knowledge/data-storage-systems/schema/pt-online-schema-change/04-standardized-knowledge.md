# 1-12 Pt Online Schema Change

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-12 |
| Knowledge Unit Title | Pt Online Schema Change |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.11 gh-ost tool | 1.13 Spirit tool | 1.10 Zero-downtime migration patterns | 1.26 MySQL ALGORITHM/LOCK options |
| Last Updated | 2026-06-02 |

## Overview

pt-online-schema-change (pt-osc) is Percona Toolkit's online schema change tool for MySQL. It uses database triggers to capture ongoing changes while the ghost table is being populated. Unlike gh-ost (binlog-based), pt-osc relies on triggers (INSERT/UPDATE/DELETE) to keep the ghost table synchronized. It supports FK constraints natively and has extensive throttling controls.

---

## Core Concepts

- **Trigger-based sync**: AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers on the original table propagate changes to the ghost table.
- **Chunked row copy**: Reads original table in chunks using a unique index (typically PRIMARY KEY) and inserts into the ghost table.
- **FK handling**: pt-osc can update FK constraints to reference the new table after swap. Use `--alter-foreign-keys-method` to control behavior.
- **Throttling**: Configurable via replication lag, thread count, chunk size, and sleep intervals.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **FK management**: Use `--alter-foreign-keys-method=auto` to let pt-osc handle FK updates. `rebuild_constraints` rebuilds all FK constraints pointing to the table. `drop_swap` drops the original table after swap and creates FK references.
- **Chunk-size tuning**: Start with default (1000 rows). Increase for tables with larger rows (decrease chunk size). Decrease for tables under high write load.
- **Replication throttle**: `--max-lag=5` pauses the migration if replication lag exceeds 5 seconds on any replica.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | pt-osc over gh-ost | FK-heavy schemas, established Percona tooling | Tables with high trigger sensitivity |
- | Trigger approach | Simple ALTER, lower concurrency workloads | High-concurrency OLTP (triggers cause deadlocks) |
- | Rebuild_constraints FK method | When FK column names change | When no FK changes needed |


## Performance Considerations

- - Trigger overhead persists for the entire migration duration — every INSERT/UPDATE/DELETE on the original table runs three triggers (AFTER INSERT, AFTER UPDATE, AFTER DELETE).
- - Chunk copying competes with application workload for IO and CPU.
- - FK constraint rebuild during swap requires locking the referencing tables.
- - pt-osc creates an implicit table-level lock briefly during the final RENAME.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not indexing the ghost table correctly**: The ghost table inherits the original schema + ALTER, but if the original has no suitable unique index for chunking, pt-osc falls back to `--chunk-index` selection, which may be suboptimal. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Trigger deadlock cascade**: Under high concurrency, trigger-lock interactions can escalate to deadlocks. This is the most common pt-osc failure mode. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | FK constraint rebuild fails**: If a referencing table is large, the FK rebuild during swap can take significant time and block writes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Trigger storms**: A bulk insert into the original table triggers a storm of trigger executions, overwhelming the ghost table's write capacity.
- - **Swap failure**: The final RENAME TABLE fails because the ghost table is not fully caught up (trigger sync is behind).
- - **FK deadlock during swap**: The FK constraint rebuild blocks on a long-running transaction, extending the migration's write-blocking window.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
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

