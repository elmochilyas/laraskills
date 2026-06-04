# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.30 Strict mode (preventSilentlyDiscardingAttributes, preventAccessingMissingAttributes)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Enable in development applied
- [ ] Log in production applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not enabling in development**: Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database. prevented
- [ ] Enabling with throwing in production**: User-facing exceptions for missing attributes. Use logging handler in production. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] preventSilentlyDiscardingAttributes enabled in development
- [ ] preventAccessingMissingAttributes enabled in development
- [ ] Production uses logging (not throwing) for missing attributes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Enable in development applied
- [ ] Log in production applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] In `AppServiceProvider::boot()`: `Model::preventSilentlyDiscardingAttributes(! $app->isProduction())` completed
- [ ] Also enable: `Model::preventAccessingMissingAttributes(! $app->isProduction())` completed
- [ ] For production: use `Model::handleMissingAttributeAccessUsing(fn($model, $key) => Log::warning(...))` completed
- [ ] Run test suite and verify no warnings in development completed

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

- [ ] Not enabling in development**: Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database. prevented
- [ ] Enabling with throwing in production**: User-facing exceptions for missing attributes. Use logging handler in production. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Strict modes enabled in non-production environments
- [ ] Production uses logging (not throwing) for missing attributes
- [ ] All tests pass with strict modes enabled
- [ ] No warnings in development for legitimate attribute access
- [ ] preventSilentlyDiscardingAttributes enabled in development
- [ ] preventAccessingMissingAttributes enabled in development
- [ ] Production uses logging (not throwing) for missing attributes
- [ ] No silent attribute discarding or missing-attribute bugs in production

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
- [ ] ### Not enabling in development prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not enabling in development**: Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database. prevented
- [ ] Enabling with throwing in production**: User-facing exceptions for missing attributes. Use logging handler in production. prevented

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
