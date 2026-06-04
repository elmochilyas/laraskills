# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.2 EXPLAIN ANALYZE (actual time, loops, actual rows)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Compare actual rows to estimated applied
- [ ] Find the slowest node applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running on write queries**: EXPLAIN ANALYZE actually executes INSERT/UPDATE/DELETE. Use EXPLAIN (without ANALYZE) for write queries, or run inside a transaction that rolls back. prevented
- [ ] Not accounting for caching**: First run may be slow (buffer pool cold). Run twice and compare — the second run shows warm cache behavior. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Actual execution metrics captured per plan node
- [ ] Bottleneck node identified by total time
- [ ] Statistics freshness validated (actual vs estimated comparison)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Compare actual rows to estimated applied
- [ ] Find the slowest node applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Run `EXPLAIN ANALYZE <query>` (PostgreSQL) or `EXPLAIN ANALYZE <query>` (MySQL 8.0.18+) completed
- [ ] Compare actual rows vs estimated rows — large divergence indicates stale statistics completed
- [ ] Identify the slowest node by actual total time completed
- [ ] Check loop count — high loops + low rows per loop = nested loop problem completed
- [ ] Run a second time for warm cache comparison completed

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

- [ ] Running on write queries**: EXPLAIN ANALYZE actually executes INSERT/UPDATE/DELETE. Use EXPLAIN (without ANALYZE) for write queries, or run inside a transaction that rolls back. prevented
- [ ] Not accounting for caching**: First run may be slow (buffer pool cold). Run twice and compare — the second run shows warm cache behavior. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Actual vs estimated rows are within 10x of each other
- [ ] Slowest node is identified and understood
- [ ] Loop count matches expectations
- [ ] No plan nodes with disproportionate time
- [ ] Actual execution metrics captured per plan node
- [ ] Bottleneck node identified by total time
- [ ] Statistics freshness validated (actual vs estimated comparison)

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
- [ ] Running on write queries**: EXPLAIN ANALYZE actually executes INSERT/UPDATE/DELETE. Use EXPLAIN (without ANALYZE) for write queries, or run inside a transaction that rolls back. prevented
- [ ] Not accounting for caching**: First run may be slow (buffer pool cold). Run twice and compare — the second run shows warm cache behavior. prevented

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
