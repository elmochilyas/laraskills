# 1-11 Gh Ost Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-11 |
| Knowledge Unit Title | Gh Ost Tool |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 1.10 Zero-downtime migration patterns | 1.18 Expand-contract pattern |
| Related KUs | 1.12 pt-online-schema-change, 1.13 Spirit tool |
| Last Updated | 2026-06-02 |

## Overview

gh-ost (GitHub Online Schema Transfer) is a trigger-free, binlog-based online schema migration tool for MySQL. Unlike trigger-based approaches (pt-online-schema-change), gh-ost avoids triggers by reading the binary log to capture ongoing changes. It supports pause/resume, throttling, test-on-replica, and controlled cut-over locking. Designed by GitHub for large-scale MySQL migrations with minimal production impact.

---

## Core Concepts

- **Trigger-free architecture**: Reads the binary log (binlog) to capture writes happening on the original table during migration. Avoids trigger overhead and trigger-related deadlocks.
- **Shadow-table approach**: Creates a ghost table with the new schema, applies the migration, streams live changes via binlog, then atomically swaps.
- **Cut-over phase**: The final swap from original table to ghost table. Brief lock period (typically < 1 second).
- **Throttling**: Self-regulates based on replication lag, thread count, load, or custom thresholds.
- **Test-on-replica**: Runs the full migration on a replica without executing cut-over, verifying correctness and timing before touching the primary.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Test-on-replica first**: Use `--test-on-replica --host=replica_host` to run the entire migration on a replica. Verify timing, row counts, and lock duration before running on the primary.
- **Throttle during peak traffic**: Set `--throttle-flag-file` that is created during peak hours. gh-ost pauses when the flag file exists.
- **Default cut-over**: Let gh-ost manage cut-over automatically (default). Manual cut-over is an option for advanced scenarios.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | gh-ost over pt-osc | Tables > 100GB, trigger overhead concerns | Tables < 10GB (pt-osc may be simpler) |
- | Test-on-replica | First-time use, critical tables | Simple additive changes (instant DDL suffices) |
- | Automatic throttle | Production with variable traffic | Controlled maintenance windows |


## Performance Considerations

- - gh-ost reads type table in chunks — chunk size determines rows-per-statement and affects load.
- - Binlog streaming adds minimal overhead (< 5% write amplification).
- - Throttle by replication lag: if replica lag exceeds threshold (default 10 seconds), gh-ost pauses row copy.
- - Network latency between gh-ost host and MySQL affects throughput.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not testing on replica first**: Running gh-ost on production without verifying on a replica. A misconfiguration can cause extended write blocking. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Cut-over timeout**: The cut-over lock wait timeout is exceeded because the ghost table is still catching up. This extends the write-blocking window. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Insufficient binlog retention**: gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found" error. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Binlog position lost**: gh-ost cannot find the binlog position from when the migration started. The entire migration must restart from scratch.
- - **Cut-over lock escalation**: Lock wait timeout during cut-over because a long-running transaction holds a conflicting lock.
- - **Ghost table corruption**: Network issue or crash during migration corrupts the ghost table. gh-ost must be restarted (state file tracks position).


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

