# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.25 Lazy loading detection & prevention in production
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Enable strict mode in development applied
- [ ] Query log middleware applied
- [ ] Telescope/Debugbar applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Disabling lazy loading prevention in production**: Without it, N+1 goes undetected. Use query log monitoring instead. prevented
- [ ] Relying on `$with` on the model**: `protected $with = ['comments']` always eager loads, even when not needed. Prefer `->with()` per query. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Lazy loading detected in development/staging
- [ ] Production monitoring in place for query count
- [ ] No N+1 queries in production endpoints

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Enable strict mode in development applied
- [ ] Query log middleware applied
- [ ] Telescope/Debugbar applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Enable `Model::preventLazyLoading()` in development/staging completed
- [ ] Install Telescope or Debugbar for query count visualization completed
- [ ] Create middleware to log total query count per request completed
- [ ] Set query count thresholds — alert when exceeded completed
- [ ] Review Telescope entries or query logs for N+1 patterns completed

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

- [ ] Disabling lazy loading prevention in production**: Without it, N+1 goes undetected. Use query log monitoring instead. prevented
- [ ] Relying on `$with` on the model**: `protected $with = ['comments']` always eager loads, even when not needed. Prefer `->with()` per query. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] Query logging middleware captures per-request query counts
- [ ] No lazy loading exceptions in tests or staging
- [ ] Blind eager loading avoided (`$with` property not used for everything)
- [ ] Lazy loading detected in development/staging
- [ ] Production monitoring in place for query count
- [ ] No N+1 queries in production endpoints

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
- [ ] Disabling lazy loading prevention in production**: Without it, N+1 goes undetected. Use query log monitoring instead. prevented
- [ ] Relying on `$with` on the model**: `protected $with = ['comments']` always eager loads, even when not needed. Prefer `->with()` per query. prevented

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
