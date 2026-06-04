# 7-3 Automatic Query Routing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-3 |
| Knowledge Unit Title | Automatic Query Routing |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.2 Read/write config | 7.4 Sticky writes |
| Last Updated | 2026-06-02 |

## Overview

Laravel determines read vs write by checking the SQL statement's first word: SELECT, SHOW, DESCRIBE, EXPLAIN → read. INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write. The query builder and Eloquent inherit this routing. Raw `DB::statement()` is sent to the write connection.

---

## Core Concepts

- **Keyword detection**: `str_starts_with($query, 'select')` (case-insensitive). Simple heuristic. Works for most frameworks.
- **Write connection for transactions**: When a transaction is started, all queries use the write connection (read-your-writes consistency).
- **DB::statement routing**: Always goes to write connection. Use `DB::select()` for reads.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Explicit read connection**: `DB::connection('mysql::read')->select(...)` — force read replica for specific queries.
- **Transaction scoping**: `DB::transaction(function() { ... })` — all queries within use write connection. After commit, subsequent reads use replicas.


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
| 1 | Assumption that SELECT routes to read replica**: `DB::statement('SELECT ...')` goes to write. Use `DB::select()` for read routing. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

