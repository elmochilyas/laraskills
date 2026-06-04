# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Query Optimization Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No N+1 queries in application (checked with Debugbar)
- [ ] Slow query log enabled (threshold < 500ms)
- [ ] SELECT queries limited to needed columns
- [ ] CHUNK used for large dataset processing
- [ ] Indexes on all WHERE/JOIN/ORDER BY columns
- [ ] Always eager load in loops applied
- [ ] Use Laravel Debugbar locally applied
- [ ] Monitor slow query log applied
- [ ] Lazy loading in production prevented
- [ ] Over-fetching in API resources prevented
- [ ] N+1 queries in production prevented
- [ ] Missing indexes on join columns prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Set up slow query log on all production databases
- [ ] Architecture guideline: Use Laravel Telescope or Scout APM for query monitoring in production
- [ ] Architecture guideline: Implement database query count budget
- [ ] Architecture guideline: Profile with EXPLAIN on any query taking > 100ms
- [ ] Architecture guideline: Use read replicas for reporting/analytical queries
- [ ] Architecture guideline: Archive old data to reduce table size (smaller tables = faster queries)

---

# Implementation Checklist

- [ ] Best practice applied: Always eager load in loops
- [ ] Best practice applied: Use Laravel Debugbar locally
- [ ] Best practice applied: Monitor slow query log
- [ ] Best practice applied: SELECT only needed columns
- [ ] Best practice applied: Use chunks for large datasets
- [ ] Best practice applied: Avoid WHERE IN with subqueries
- [ ] Workflow step completed: Inventory current Query Optimization Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] N+1 at 100 parents + 5 children each
- [ ] Missing index on 1M row table
- [ ] SELECT * instead of needed columns
- [ ] Each unnecessary query = database CPU cycle = lower capacity for real traffic

---

# Security Checklist

- [ ] Slow queries can be exploited for denial-of-service (trigger expensive queries)
- [ ] Query logging may expose data patterns; mask sensitive query parameters in logs
- [ ] Use read replicas for heavy queries to avoid impacting write performance
- [ ] Rate limit query-heavy endpoints to prevent accidental database overload

---

# Reliability Checklist

- [ ] Mistake prevented: N+1 queries in production
- [ ] Mistake prevented: Missing indexes on join columns
- [ ] Mistake prevented: SELECT * on large tables

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] No N+1 queries in application (checked with Debugbar)
- [ ] Slow query log enabled (threshold < 500ms)
- [ ] SELECT queries limited to needed columns
- [ ] CHUNK used for large dataset processing
- [ ] Indexes on all WHERE/JOIN/ORDER BY columns
- [ ] Query count < 10 per page load (average)
- [ ] Database CPU < 50% at peak traffic

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Query Optimization Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Lazy loading in production
- [ ] Anti-pattern prevented: Over-fetching in API resources
- [ ] Anti-pattern prevented: No pagination on list endpoints
- [ ] Common mistake prevented: N+1 queries in production
- [ ] Common mistake prevented: Missing indexes on join columns
- [ ] Common mistake prevented: SELECT * on large tables

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: No N+1 queries in application (checked with Debugbar)
- [ ] Verification passed: Slow query log enabled (threshold < 500ms)
- [ ] Verification passed: SELECT queries limited to needed columns

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
