# 4-2 Explain Analyze

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-2 |
| Knowledge Unit Title | Explain Analyze |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.1 EXPLAIN output interpretation | 4.26 Correlation between row count and query response time |
| Last Updated | 2026-06-02 |

## Overview

`EXPLAIN ANALYZE` executes the query and returns actual execution metrics: actual time per node, loop count, actual rows returned, and execution time. Unlike `EXPLAIN` (estimates), `EXPLAIN ANALYZE` shows ground truth, revealing plan inaccuracies, parameterized plan issues, and time distribution.

---

## Core Concepts

- **Actual vs estimated**: `EXPLAIN` shows the planner's estimates. `EXPLAIN ANALYZE` shows what actually happened. Widely divergent actual vs estimated rows indicates stale statistics.
- **Timing per node**: Each query plan node shows actual startup time and total time. Identifies which operation is the bottleneck.
- **Loops**: Number of times a node is executed. High loops with low actual rows = nested loop problem.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Compare actual rows to estimated**: If actual rows >> estimated rows, run `ANALYZE TABLE` to update statistics and re-check the plan.
- **Find the slowest node**: Sort plan nodes by actual execution time. The node with highest total time is the bottleneck.


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
| 1 | Running on write queries**: EXPLAIN ANALYZE actually executes INSERT/UPDATE/DELETE. Use EXPLAIN (without ANALYZE) for write queries, or run inside a transaction that rolls back. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not accounting for caching**: First run may be slow (buffer pool cold). Run twice and compare — the second run shows warm cache behavior. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

