# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.29 Database statistics, cardinality estimates and optimizer decisions
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] After bulk data changes applied
- [ ] Auto-analyze tuning applied
- [ ] MySQL auto-recompute applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming ANALYZE is unnecessary**: "My query was fast yesterday, slow today" — statistics may have changed. Run ANALYZE. prevented
- [ ] Skipping ANALYZE after import**: Freshly imported tables have default statistics. Run ANALYZE immediately. Without it, the optimizer may produce poor plans. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Statistics refreshed after bulk data changes
- [ ] Query plan row estimates match actuals within 10x
- [ ] Auto-analyze configured for workload patterns

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] After bulk data changes applied
- [ ] Auto-analyze tuning applied
- [ ] MySQL auto-recompute applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Check when table statistics were last updated: `SHOW TABLE STATUS` (MySQL) or `SELECT relname, last_analyze FROM pg_stat_user_tables` (PostgreSQL) completed
- [ ] Run ANALYZE if stale or after bulk changes: `ANALYZE TABLE table` (MySQL) or `ANALYZE table` (PostgreSQL) completed
- [ ] Verify improvement: re-run the slow query and check EXPLAIN for plan change completed
- [ ] For PostgreSQL: tune `autovacuum_analyze_scale_factor` for frequently updated tables completed

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

- [ ] Assuming ANALYZE is unnecessary**: "My query was fast yesterday, slow today" — statistics may have changed. Run ANALYZE. prevented
- [ ] Skipping ANALYZE after import**: Freshly imported tables have default statistics. Run ANALYZE immediately. Without it, the optimizer may produce poor plans. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Statistics refreshed after bulk data changes
- [ ] EXPLAIN shows more accurate row estimates after ANALYZE
- [ ] Auto-analyze configured appropriately for table update frequency
- [ ] Statistics refreshed after bulk data changes
- [ ] Query plan row estimates match actuals within 10x
- [ ] Auto-analyze configured for workload patterns

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
- [ ] Assuming ANALYZE is unnecessary**: "My query was fast yesterday, slow today" — statistics may have changed. Run ANALYZE. prevented
- [ ] Skipping ANALYZE after import**: Freshly imported tables have default statistics. Run ANALYZE immediately. Without it, the optimizer may produce poor plans. prevented

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
