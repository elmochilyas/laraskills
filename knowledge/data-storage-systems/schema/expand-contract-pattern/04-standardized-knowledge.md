# 1-18 Expand Contract Pattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-18 |
| Knowledge Unit Title | Expand Contract Pattern |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.10 Zero-downtime migration patterns | 1.19 Data backfill strategies | 11.6 Expand-contract detailed |
| Last Updated | 2026-06-02 |

## Overview

The expand-contract pattern is the most reliable approach for zero-downtime schema changes. It separates a single logical schema change into multiple deployment phases, ensuring old and new code can coexist during the transition. The phases are: add (new schema element), dual-write (write to both old and new), backfill (populate historical data), dual-read (read from new while verifying old), and remove (drop old structures).

---

## Core Concepts

- **Phase 1 — Add**: Deploy migration that adds the new column (nullable), creates the new table, or adds the new index. Old code works unchanged. No application deploy needed.
- **Phase 2 — Dual-write**: Deploy application code that writes to both old and new columns/tables. Old reads continue using old structures. New reads can optionally use new structures.
- **Phase 3 — Backfill**: Populate existing rows with data for the new column/table. Runs as queued jobs or chunked batch processing.
- **Phase 4 — Dual-read**: Switch reads to the new column/table. Monitor for correctness. Keep old as verification.
- **Phase 5 — Remove**: Deploy migration to drop old column/table. This is destructive — only safe after all code references to old structures are removed.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Backward-compatible add**: Always add columns as nullable or with a default. A NOT NULL column added without a default fails immediately on tables with existing rows.
- **Dual-write with same value**: Write the same value to both columns to prevent drift. If writing different values, the migration becomes a data transformation, not a rename.
- **Remove with delay**: Schedule the remove phase 24-48 hours after dual-read is verified. This catches delayed queue jobs and long-running processes that still reference the old structure.


## Architecture Guidelines

- | Phase | Duration | Risk |
- |-------|----------|------|
- | Add | Minutes (DDL execution) | Very low — no application changes |
- | Dual-write | One deploy cycle | Medium — application logic duplication |
- | Backfill | Hours to days (data volume dependent) | Low — throttled, idempotent |
- | Dual-read | One deploy cycle | Medium — must verify correctness |
- | Remove | Minutes (DDL execution) | High — destructive, irreversible |


## Performance Considerations

- - Dual-write doubles write throughput to the affected tables temporarily. Monitor database write IOPS during this phase.
- - Backfill should be throttled — use chunked processing with configurable sleep intervals between chunks.
- - Read path has constant-time overhead (ternary operator or feature flag check).


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Short compatibility window**: Dropping the old column 1 hour after switching reads. A queue job that was delayed 2 hours fails when it tries to write to the dropped column. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Backfill in the same deploy as column addition**: The column addition migration runs; the backfill starts; it takes 4 hours. The production deploy pipeline blocks on backfill completion. Always run backfill as a separate background process. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not verifying dual-read correctness**: Switching reads to the new column without verifying the data matches. If the dual-write had a bug, the new column has incorrect data and users see wrong results. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Inconsistent dual-write**: Application writes different values to old and new columns (e.g., one is transformed, the other is raw). The columns drift, and switching reads produces incorrect results.
- - **Backfill job failure**: The backfill crashes after processing 40% of rows. The new column has mixed populated/NULL values. Readers using the new column get inconsistent results.
- - **Feature flag misconfiguration**: A feature flag enables the new column read path before the backfill completes. Users see NULL values.


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

