# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Index Tuning Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] All foreign key columns indexed
- [ ] Composite indexes for common multi-column filter queries
- [ ] No unused indexes (confirmed via monitoring)
- [ ] EXPLAIN shows index usage for all production queries
- [ ] Index storage < 50% of table storage
- [ ] Add indexes on all foreign keys applied
- [ ] Create composite indexes for common queries applied
- [ ] Monitor unused indexes applied
- [ ] Index-every-column approach prevented
- [ ] No monitoring of index usage prevented
- [ ] No indexes on foreign key columns prevented
- [ ] Too many composite indexes prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Add indexes in the same migration that creates the table (or as subsequent migration)
- [ ] Architecture guideline: Use `EXPLAIN` to verify index usage for all production queries
- [ ] Architecture guideline: Set up `pt-query-digest` or similar to identify queries needing indexes
- [ ] Architecture guideline: Review schema changes with index impact analysis (add/remove indexes as part of PR)
- [ ] Architecture guideline: Archive old data to keep active table sizes manageable (smaller tables need fewer indexes)

---

# Implementation Checklist

- [ ] Best practice applied: Add indexes on all foreign keys
- [ ] Best practice applied: Create composite indexes for common queries
- [ ] Best practice applied: Monitor unused indexes
- [ ] Best practice applied: Use partial indexes in PostgreSQL
- [ ] Best practice applied: Prefer covering indexes for hot queries
- [ ] Best practice applied: Use Laravel migration friendly index naming
- [ ] Workflow step completed: Inventory current Index Tuning Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Index lookup (B-Tree depth 3)
- [ ] Full table scan
- [ ] Write overhead
- [ ] Storage overhead
- [ ] Buffer pool pressure

---

# Security Checklist

- [ ] Index logs may reveal query patterns; mask sensitive data in monitoring tools
- [ ] Slow queries due to missing indexes can be exploited for DoS (attacker triggers expensive queries)
- [ ] Index-only scans can bypass row-level security in some configurations (verify with PostgreSQL RLS)
- [ ] Backup/restore time increases with index count (more indexes = slower restore)

---

# Reliability Checklist

- [ ] Mistake prevented: No indexes on foreign key columns
- [ ] Mistake prevented: Too many composite indexes
- [ ] Mistake prevented: Indexing low-cardinality columns

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] All foreign key columns indexed
- [ ] Composite indexes for common multi-column filter queries
- [ ] No unused indexes (confirmed via monitoring)
- [ ] EXPLAIN shows index usage for all production queries
- [ ] Index storage < 50% of table storage
- [ ] Write performance acceptable (index count appropriate)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Index Tuning Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Index-every-column approach
- [ ] Anti-pattern prevented: No monitoring of index usage
- [ ] Anti-pattern prevented: Indexing cascade in migrations
- [ ] Anti-pattern prevented: Duplicate indexes
- [ ] Common mistake prevented: No indexes on foreign key columns
- [ ] Common mistake prevented: Too many composite indexes
- [ ] Common mistake prevented: Indexing low-cardinality columns

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: All foreign key columns indexed
- [ ] Verification passed: Composite indexes for common multi-column filter queries
- [ ] Verification passed: No unused indexes (confirmed via monitoring)

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
