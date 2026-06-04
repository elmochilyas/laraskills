# 1-9 Migration Isolation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-9 |
| Knowledge Unit Title | Migration Isolation |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 1.7 Migration batch tracking | 1.25 Rollback strategy | 1.21 Multi-tenant migration orchestration |
| Last Updated | 2026-06-02 |

## Overview

The `--isolated` option prevents multiple servers from running migrations concurrently. It acquires an atomic cache lock — only the first server acquires the lock; subsequent attempts exit gracefully. This is essential for load-balanced, multi-server deployments where concurrent migration execution causes race conditions, partial migration states, and deployment failures.

---

## Core Concepts

- **Problem**: In multi-server deployments, all servers may attempt `php artisan migrate` simultaneously. Both servers apply the same migration, causing duplicate schema errors.
- **Solution**: `php artisan migrate --isolated` uses the application's cache driver to acquire an atomic lock before executing migrations.
- **Lock timeout**: The lock is held for the migration duration. Configurable via `MIGRATION_LOCK_TIMEOUT` (default 30 seconds).
- **Exit behavior**: Servers that fail to acquire the lock exit with success code (0) — they don't fail the deployment.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always use --isolated in deploy scripts**: For any multi-server deployment, `--isolated` should be the default. The overhead of a cache lock is negligible.
- **Combine with horizon:terminate**: After the isolated migration completes, terminate Horizon workers so they reconnect with the updated schema.
- **Monitor lock acquisition**: Add logging to track which server acquired the migration lock and for how long.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | --isolated | Multi-server deployments | Single-server or zero-downtime deploy strategies |
- | No isolation | Single-server deployments | Risk of manual duplicate execution |


## Performance Considerations

- - Cache lock overhead is negligible (< 5ms).
- - Migration time is unchanged — only one server runs migrations anyway.
- - Lock timeout should exceed the expected longest migration time. Default 30 seconds may be too short for large data backfill migrations.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not using --isolated in multi-server deployments**: Two servers run the same migration simultaneously. The second server encounters "table already exists" or "duplicate column" errors, failing the deployment. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Lock timeout too short**: A migration takes 45 seconds but the lock timeout is 30. The lock expires, a second server acquires it, and both run the migration concurrently. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Assuming single-server safety**: Even on a single server, manual `php artisan migrate` from two terminal sessions can cause the same race. --isolated prevents this. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Cache down**: If the cache driver is unavailable, `--isolated` cannot acquire the lock. Migration either fails or runs without isolation depending on configuration.
- - **Lock holder crash**: The process holding the lock crashes mid-migration. The lock eventually expires. The migration state may be partially applied, requiring manual inspection and recovery.
- - **Simultaneous schema:dump conflicts**: Running `schema:dump` from multiple servers simultaneously can produce corrupted dump files.


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

