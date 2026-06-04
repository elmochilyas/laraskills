# 4-27 Profiling Tools

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-27 |
| Knowledge Unit Title | Profiling Tools |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.25 Lazy loading detection | 4.26 Query log analysis |
| Last Updated | 2026-06-02 |

## Overview

Three primary Laravel profiling tools serve different needs: Telescope (production monitoring with team debugging), Debugbar (development-only browser overlay), Clockwork (browser devtools integration). All capture query count, duration, N+1 detection, and request timeline.

---

## Core Concepts

- **Laravel Telescope**: Full request dump (queries, model actions, mail, notifications, jobs, logs). Stores to database. Built-in gate for authorization. Cleans old records via `telescope:prune`.
- **Debugbar**: In-browser toolbar showing queries, memory, load time, routes. Development-only. Zero-config for local dev.
- **Clockwork**: Chrome/Firefox devtools panel. Lightweight alternative to Debugbar. Works via custom panel in browser.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Telescope for staging/limited production**: Enable Telescope on staging or production with `TELESCOPE_ENABLED=true`. Whitelist specific users via gate. Monitor slow endpoints.
- **Debugbar for local development**: Install via composer `--dev`. Shows query count per page, duplicate queries, N+1 warnings.
- **Clockwork for lightweight profiling**: Lower overhead than Debugbar. Use when Debugbar conflicts with other packages.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Telescope in production without pruning**: Telescope stores every request. Without `telescope:prune`, storage fills up. Schedule the prune command. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Debugbar in production**: Debugbar exposes query data, environment config, and route parameters. Only install as dev dependency. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
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

