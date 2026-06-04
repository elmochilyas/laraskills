# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.26 Correlation between row count and query response time
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] LIMIT with correct order/index applied
- [ ] Chunked processing awareness applied
- [ ] COUNT optimization applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming row count is the only factor**: A query returning 5 rows with a filesort on an unindexed 1M-row column may take 500ms, while an aggregation on the same table takes 50ms. Row count returned ≠ row count examined. prevented
- [ ] Ignoring the buffer pool cliff**: A query that runs in 10ms on a warm cache on a dev machine may take 2s in production if the data doesn't fit in memory. Always test with production-sized datasets. prevented
- [ ] Using offset pagination on growing tables**: Offset skips rows by scanning them. As the table grows, page 1000 takes longer because the database scans 10,000+ rows to skip 9990. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Query response time complexity correctly predicted
- [ ] Working set size assessed against buffer pool
- [ ] Appropriate mitigations applied (indexes, LIMIT, caching)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] LIMIT with correct order/index applied
- [ ] Chunked processing awareness applied
- [ ] COUNT optimization applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Determine access pattern: PK lookup (O(1)), range scan (O(log n + range)), full scan (O(n)) completed
- [ ] Estimate if working set fits in buffer pool completed
- [ ] Measure response time on production-like data volume completed
- [ ] Check for short-circuit opportunities (LIMIT with correct order/index) completed
- [ ] Identify inflection point where O(log n) becomes O(n) completed

---

# Performance Checklist

- [ ] Performance: - **The inflection point**: Response time stays flat until the working set exceeds the buffer pool, then degrades rapidly (the "buffer pool cliff")...
- [ ] Performance: - **Elasticache / buffer pool sizing**: For read-heavy workloads, set `innodb_buffer_pool_size` to 70-80% of available RAM. This keeps the hot set ...
- [ ] Performance: - **PgBouncer transaction pooling**: In transaction mode, connections are recycled between transactions. If a query returns many rows, the connecti...
- [ ] Performance: - **Response time is not just row count**: A 10-row query with a complex ORDER BY on unindexed columns can be slower than a 10,000-row index range ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Assuming row count is the only factor**: A query returning 5 rows with a filesort on an unindexed 1M-row column may take 500ms, while an aggregation on the same table takes 50ms. Row count returned ≠ row count examined. prevented
- [ ] Ignoring the buffer pool cliff**: A query that runs in 10ms on a warm cache on a dev machine may take 2s in production if the data doesn't fit in memory. Always test with production-sized datasets. prevented
- [ ] Using offset pagination on growing tables**: Offset skips rows by scanning them. As the table grows, page 1000 takes longer because the database scans 10,000+ rows to skip 9990. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Access pattern complexity estimated (O(log n) vs O(n))
- [ ] Buffer pool adequacy assessed for working set
- [ ] LIMIT queries have matching ORDER BY index
- [ ] No unbounded queries without LIMIT on list endpoints
- [ ] Query response time complexity correctly predicted
- [ ] Working set size assessed against buffer pool
- [ ] Appropriate mitigations applied (indexes, LIMIT, caching)

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always EXPLAIN Before Optimizing prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming row count is the only factor**: A query returning 5 rows with a filesort on an unindexed 1M-row column may take 500ms, while an aggregation on the same table takes 50ms. Row count returned ≠ row count examined. prevented
- [ ] Ignoring the buffer pool cliff**: A query that runs in 10ms on a warm cache on a dev machine may take 2s in production if the data doesn't fit in memory. Always test with production-sized datasets. prevented
- [ ] Using offset pagination on growing tables**: Offset skips rows by scanning them. As the table grows, page 1000 takes longer because the database scans 10,000+ rows to skip 9990. prevented

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
