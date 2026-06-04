# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.6 PostgreSQL slow query configuration (log_min_duration_statement, auto_explain)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use auto_explain for plan capture applied
- [ ] pg_stat_statements for top-N analysis applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not installing auto_explain**: Without it, you have the slow query text but no plan. Reproducing the exact plan later is difficult. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] PostgreSQL configured to log slow queries with plans
- [ ] `pg_stat_statements` providing top-N query rankings
- [ ] Auto-captured plans available for intermittent slow queries

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use auto_explain for plan capture applied
- [ ] pg_stat_statements for top-N analysis applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Set `log_min_duration_statement = 500` in postgresql.conf completed
- [ ] Load `auto_explain` via `shared_preload_libraries` completed
- [ ] Configure `auto_explain.log_min_duration = 500` and `auto_explain.log_analyze = on` completed
- [ ] Install `pg_stat_statements` via `CREATE EXTENSION` completed
- [ ] Query `pg_stat_statements` for top queries: `SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10` completed

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

- [ ] Not installing auto_explain**: Without it, you have the slow query text but no plan. Reproducing the exact plan later is difficult. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `log_min_duration_statement` set to appropriate value
- [ ] `auto_explain` is loaded and logging plans
- [ ] `pg_stat_statements` is installed and queryable
- [ ] Slow query plans are captured with execution times
- [ ] PostgreSQL configured to log slow queries with plans
- [ ] `pg_stat_statements` providing top-N query rankings
- [ ] Auto-captured plans available for intermittent slow queries

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
- [ ] Not installing auto_explain**: Without it, you have the slow query text but no plan. Reproducing the exact plan later is difficult. prevented

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
