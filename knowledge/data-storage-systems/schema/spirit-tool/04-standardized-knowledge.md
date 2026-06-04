# 1-13 Spirit Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-13 |
| Knowledge Unit Title | Spirit Tool |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.11 gh-ost tool | 1.12 pt-online-schema-change | 1.10 Zero-downtime migration patterns |
| Last Updated | 2026-06-02 |

## Overview

Spirit is a modern online schema migration tool for MySQL 8.0+, designed as a successor to gh-ost. It uses the same binlog-based, trigger-free approach but is built specifically for MySQL 8.0+ features (better performance schema, improved binlog handling). Developed to address gh-ost's limitations with newer MySQL versions and larger datasets.

---

## Core Concepts

- **MySQL 8.0+ focus**: Built for and tested on MySQL 8.0+ only. Leverages MySQL 8.0's improved performance schema for throttling feedback.
- **Binlog-based, trigger-free**: Same architecture as gh-ost — no triggers, reads binary log for change capture.
- **Improved cut-over**: Faster, more reliable atomic swap than gh-ost in high-concurrency environments.
- **Built-in throttling**: Performance schema-based metrics for more accurate self-regulation.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration from gh-ost**: If already using gh-ost, Spirit is a drop-in replacement for most use cases. The configuration interface is similar.
- **Performance schema reliance**: Spirit uses `performance_schema` metrics for throttling decisions. Ensure `performance_schema` is enabled on MySQL 8.0+.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | Spirit over gh-ost | MySQL 8.0+ with large tables | < MySQL 8.0 (use gh-ost or pt-osc) |
- | Spirit over pt-osc | Trigger-deadlock concerns | FK-heavy schemas needing Percona support |


## Performance Considerations

- - Up to 2x faster row copy than gh-ost on large tables in benchmarks.
- - Reduced binlog storage requirements during migration.
- - More accurate throttling via performance_schema reduces workload impact.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using it on MySQL 5.7**: Not supported. Use gh-ost or pt-osc for 5.7 environments. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Disabling performance_schema**: Spirit loses its primary throttling data source. Falls back to less accurate metrics. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **MySQL 5.7 incompatibility**: Spirit only supports MySQL 8.0+. Attempting to run it on 5.7 fails with no graceful fallback. Use gh-ost for legacy MySQL versions.
- - **Configuration requirement failures**: Spirit requires specific MySQL settings (`binlog_format=ROW`, `innodb_autoinc_lock_mode=2`, `performance_schema=1`). Missing configuration causes runtime failures.
- - **Replica lag amplification**: Spirit's multi-threaded row copying can cause significant replica lag (seconds to minutes), especially on systems where replicas serve read traffic.
- - **Cut-over failures**: The atomic table swap during cut-over can fail under high write load, leaving both old and new tables in an intermediate state. The old table is preserved, but the migration must be retried.
- - **Disk space pressure**: Row copying doubles storage requirements for the target table during migration. Monitor free space closely.
- - **Checksum mismatches**: The verification checksum between old and new tables may fail due to data drift, requiring manual investigation and potential rollback.

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

