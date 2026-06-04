# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.5 MySQL Slow Query Log configuration and analysis (mysqldumpslow, pt-query-digest)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Start with long_query_time = 0.5 applied
- [ ] Use pt-query-digest weekly applied
- [ ] Log queries not using indexes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] long_query_time too high**: Setting to 5 seconds captures only the worst offenders. Misses the 200ms queries that run 1000 times/second. prevented
- [ ] analyzing slow log without aggregation**: Reading individual entries is overwhelming. Always use pt-query-digest for aggregated analysis. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Slow query log configured and collecting data
- [ ] Top queries by total time identified and ranked
- [ ] Optimization targets selected based on aggregate impact

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Start with long_query_time = 0.5 applied
- [ ] Use pt-query-digest weekly applied
- [ ] Log queries not using indexes applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Enable slow query log: `SET GLOBAL slow_query_log = 1` completed
- [ ] Set threshold: `SET GLOBAL long_query_time = 0.5` (500ms) completed
- [ ] Log non-indexed queries: `SET GLOBAL log_queries_not_using_indexes = 1` completed
- [ ] Collect log data over a representative period (24-48 hours) completed
- [ ] Run `pt-query-digest /var/log/mysql/slow.log` for aggregated analysis completed

---

# Performance Checklist

- [ ] Performance: EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table q...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] long_query_time too high**: Setting to 5 seconds captures only the worst offenders. Misses the 200ms queries that run 1000 times/second. prevented
- [ ] analyzing slow log without aggregation**: Reading individual entries is overwhelming. Always use pt-query-digest for aggregated analysis. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `long_query_time` set to appropriate threshold (0.5s default)
- [ ] `log_queries_not_using_indexes` enabled
- [ ] Slow log file is accessible and growing
- [ ] pt-query-digest report shows top queries by total time
- [ ] Slow query log configured and collecting data
- [ ] Top queries by total time identified and ranked
- [ ] Optimization targets selected based on aggregate impact

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
- [ ] long_query_time too high**: Setting to 5 seconds captures only the worst offenders. Misses the 200ms queries that run 1000 times/second. prevented
- [ ] analyzing slow log without aggregation**: Reading individual entries is overwhelming. Always use pt-query-digest for aggregated analysis. prevented

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
