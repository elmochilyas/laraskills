# 7-2 Laravel Read Write Config

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-2 |
| Knowledge Unit Title | Laravel Read Write Config |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.3 Automatic query routing | 7.9 Load balancing replicas |
| Last Updated | 2026-06-02 |

## Overview

Laravel's `database.php` connection config supports `read` and `write` host arrays. Writes always go to the first `write` host. Reads are randomly distributed among `read` hosts. Configuration is static — all models on this connection automatically split reads/writes.

---

## Core Concepts

- **Read array**: `'read' => ['host' => ['replica1', 'replica2']]` — Laravel randomly picks one for SELECT queries.
- **Write array**: `'write' => ['host' => ['primary']]` — all INSERT/UPDATE/DELETE go to write hosts.
- **Connection name**: If `read` and `write` are specified, Laravel creates two internal PDO connections (`connection_name::read`, `connection_name::write`).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Simple replica config**: `'mysql' => ['write' => ['host' => env('DB_HOST_WRITE')], 'read' => ['host' => explode(',', env('DB_HOST_READ'))], 'database' => env('DB_DATABASE'), ...]`.
- **Database URL with replicas**: Use `DB_REPLICA_URL` environment variables for read hosts. Parse in `config/database.php`.


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
| 1 | No read host fallback**: If all read hosts fail, Laravel does not fall back to write host for reads. Implement fallback logic or use a proxy. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

