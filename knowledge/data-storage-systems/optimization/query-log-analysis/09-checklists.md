# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.26 Query log analysis and identifying slow queries in production
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Laravel query log applied
- [ ] Percona Toolkit / pt-query-digest applied
- [ ] PostgreSQL auto_explain applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Fixing the slowest individual query**: A 5-second query running 5x/day is less impactful than a 50ms query running 100,000x/day. Always prioritize by total time. prevented
- [ ] Not normalizing query shapes**: `SELECT * FROM posts WHERE id = 1` and `SELECT * FROM posts WHERE id = 2` are the same query shape. Group them. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Top queries by total time identified and ranked
- [ ] Optimization targets selected based on impact, not outliers
- [ ] Baseline metrics established before making changes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Laravel query log applied
- [ ] Percona Toolkit / pt-query-digest applied
- [ ] PostgreSQL auto_explain applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Collect slow query log over a representative period (24-48 hours) completed
- [ ] Normalize queries by removing parameter values completed
- [ ] Group by normalized query shape completed
- [ ] Calculate total time = average duration × frequency completed
- [ ] Rank by total time descending completed

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

- [ ] Fixing the slowest individual query**: A 5-second query running 5x/day is less impactful than a 50ms query running 100,000x/day. Always prioritize by total time. prevented
- [ ] Not normalizing query shapes**: `SELECT * FROM posts WHERE id = 1` and `SELECT * FROM posts WHERE id = 2` are the same query shape. Group them. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Queries grouped by normalized shape (parameters removed)
- [ ] Ranked by total time (not just individual query duration)
- [ ] Top 5 queries by total time identified for optimization
- [ ] Baseline metrics captured before making changes
- [ ] Top queries by total time identified and ranked
- [ ] Optimization targets selected based on impact, not outliers
- [ ] Baseline metrics established before making changes

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
- [ ] Fixing the slowest individual query**: A 5-second query running 5x/day is less impactful than a 50ms query running 100,000x/day. Always prioritize by total time. prevented
- [ ] Not normalizing query shapes**: `SELECT * FROM posts WHERE id = 1` and `SELECT * FROM posts WHERE id = 2` are the same query shape. Group them. prevented

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
