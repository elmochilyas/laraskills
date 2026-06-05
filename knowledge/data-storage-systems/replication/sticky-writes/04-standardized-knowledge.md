# 7-4 Sticky Writes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-4 |
| Knowledge Unit Title | Sticky Writes |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.7 Lag-aware read splitting |
| Related KUs | 7.3 Query routing |
| Last Updated | 2026-06-02 |

## Overview

After a write, a subsequent read may go to a replica that hasn't replicated the write yet. The user sees stale data. Sticky writes ensure that after a write, subsequent reads use the write connection for the same request/session. Laravel does this automatically within a request via `Illuminate\Database\Connection::$recordsModified`.

---

## Core Concepts

- **Read-after-write inconsistency**: User creates a post (write to primary), redirects to post list (read from replica). Replica lag → post not visible.
- **Laravel's $recordsModified**: After any write on a connection, `$recordsModified = true`. All subsequent reads on that connection use the write PDO.
- **Scope**: Applies only within the same request. Next request from the same user may still hit a lagged replica.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Session sticky writes**: Store a `written_at` timestamp in session. On the next request, force read from primary for N seconds (e.g., 5s).
- **Redirect with cache bust**: After write, redirect with a unique hash that forces read from primary. Less common.


## Architecture Guidelines

- Async MySQL binlog replication: zero write impact, seconds of data loss risk. Sync PostgreSQL replication: higher write latency, zero data loss. Aurora storage replication: minimal write impact, zero data loss.

## Performance Considerations

- Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual consistency.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Disabling $recordsModified globally**: Breaks read-after-write consistency for all users. Only disable if you understand the consistency tradeoff. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Read-after-write inconsistency from replication lag. Stale reads from replicas under heavy write loads. Connection pooling with transaction pooling breaks session state.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Replication Read Write Splitting
- **Closely Related**: Other KUs within Replication Read Write Splitting
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

