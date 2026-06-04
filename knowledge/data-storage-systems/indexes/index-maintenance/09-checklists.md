# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.19 Index maintenance (bloat, fillfactor, rebuilding, VACUUM)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Monitor index bloat quarterly applied
- [ ] Set fillfactor for high-update columns applied
- [ ] Vacuum frequency applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not monitoring bloat**: Index performance degrades silently. A query that took 50ms now takes 200ms — and no index maintenance was ever run. prevented
- [ ] REINDEX without planning**: REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Index bloat stays below 20%
- [ ] Maintenance runs during low-traffic windows
- [ ] Concurrent rebuild used in production

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Monitor index bloat quarterly applied
- [ ] Set fillfactor for high-update columns applied
- [ ] Vacuum frequency applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Monitor index bloat quarterly using `pgstattuple` or bloat estimation queries completed
- [ ] For tables with > 20% bloat, schedule REINDEX or pg_repack completed
- [ ] For PostgreSQL: use `REINDEX INDEX CONCURRENTLY` (PG 12+) or `pg_repack` for zero-downtime completed
- [ ] For MySQL: `OPTIMIZE TABLE` or `ALTER TABLE ... ENGINE=InnoDB, ALGORITHM=INPLACE` completed
- [ ] Set fillfactor for high-update columns (70-80 instead of default 90) completed

---

# Performance Checklist

- [ ] Performance: B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index ad...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not monitoring bloat**: Index performance degrades silently. A query that took 50ms now takes 200ms — and no index maintenance was ever run. prevented
- [ ] REINDEX without planning**: REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Index bloat monitored regularly (quarterly)
- [ ] Rebuild method chosen for zero-downtime (CONCURRENTLY or pg_repack)
- [ ] fillfactor set appropriately for update-heavy columns
- [ ] Autovacuum tuned for high-write tables
- [ ] Index bloat stays below 20%
- [ ] Maintenance runs during low-traffic windows
- [ ] Concurrent rebuild used in production
- [ ] fillfactor and autovacuum tuned for write patterns

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Not monitoring bloat prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not monitoring bloat**: Index performance degrades silently. A query that took 50ms now takes 200ms — and no index maintenance was ever run. prevented
- [ ] REINDEX without planning**: REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production. prevented

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
