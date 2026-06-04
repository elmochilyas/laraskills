# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.22 insertOrIgnore
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Seed idempotent data applied
- [ ] Log deduplication applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] - **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed. prevented
- [ ] - **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners. prevented
- [ ] - **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows. prevented
- [ ] - **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions. prevented
- [ ] - **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] insertOrIgnore correctly skips existing rows without errors
- [ ] Unique constraints exist on the deduplication columns
- [ ] Row counts verified when data consistency is critical

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Seed idempotent data applied
- [ ] Log deduplication applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Ensure unique constraints exist on the deduplication columns completed
- [ ] Call `Model::insertOrIgnore([$row1, $row2, ...])` completed
- [ ] Verify the count of actually inserted rows if needed completed
- [ ] Handle the case where some rows were silently skipped completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] - **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed. prevented
- [ ] - **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners. prevented
- [ ] - **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows. prevented
- [ ] - **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions. prevented
- [ ] - **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Unique constraints exist on the deduplication columns
- [ ] No model events expected (insertOrIgnore bypasses them)
- [ ] Batch size is reasonable (100-500 rows to avoid parameter limits)
- [ ] Silent skip behavior is acceptable for the use case
- [ ] insertOrIgnore correctly skips existing rows without errors
- [ ] Unique constraints exist on the deduplication columns
- [ ] Row counts verified when data consistency is critical
- [ ] Batch sizes are within database parameter limits

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Assuming insertOrIgnore succeeds for all rows prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] - **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed. prevented
- [ ] - **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners. prevented
- [ ] - **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows. prevented
- [ ] - **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions. prevented
- [ ] - **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries. prevented
- [ ] - **Missing index maintenance**: Over time, heavily written indexes fragment and lose performance. Schedule regular index rebuilds for tables with high write volume. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
