# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.4 Lazy loading prevention (Model::preventLazyLoading)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Standard boilerplate applied
- [ ] Production violation logging applied
- [ ] Opt-in for small tables applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Disabling globally for production without logging**: N+1 goes completely undetected. The app runs fine at low traffic but fails under load. prevented
- [ ] Not enabling in CI**: CI passes even though the code has N+1. Violations are only caught locally (if at all). prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] N+1 query problems are caught during development
- [ ] Production logs capture lazy loading violations without breaking UX
- [ ] Test suite has zero lazy loading violations

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Standard boilerplate applied
- [ ] Production violation logging applied
- [ ] Opt-in for small tables applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] In `AppServiceProvider::boot()`, add: `Model::preventLazyLoading(! $this->app->isProduction())` completed
- [ ] For production, use: `Model::handleLazyLoadingViolationUsing(fn($model, $relation) => Log::warning("Lazy loading $relation on ".get_class($model)))` completed
- [ ] Run the application's feature/integration tests — lazy loading violations will throw exceptions completed
- [ ] Fix violations by adding `with()` or `load()` as needed completed
- [ ] In production, monitor logs for lazy loading warnings and fix them in the next sprint completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Disabling globally for production without logging**: N+1 goes completely undetected. The app runs fine at low traffic but fails under load. prevented
- [ ] Not enabling in CI**: CI passes even though the code has N+1. Violations are only caught locally (if at all). prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] Lazy loading violations logged (not thrown) in production
- [ ] Test suite passes without lazy loading violations
- [ ] Production logs monitored for lazy loading warnings
- [ ] N+1 query problems are caught during development
- [ ] Production logs capture lazy loading violations without breaking UX
- [ ] Test suite has zero lazy loading violations
- [ ] Team has a process for fixing logged violations

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Enabling with throwing in production prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Disabling globally for production without logging**: N+1 goes completely undetected. The app runs fine at low traffic but fails under load. prevented
- [ ] Not enabling in CI**: CI passes even though the code has N+1. Violations are only caught locally (if at all). prevented

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
