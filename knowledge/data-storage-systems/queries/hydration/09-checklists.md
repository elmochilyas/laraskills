# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.20 Hydration (hydrate, hydrateRaw)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache hydration applied
- [ ] Query builder to Eloquent bridge applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Forgetting retrieved event**: `hydrate` fires the `retrieved` model event. If the event has side effects, expect them when hydrating. prevented
- [ ] Hydrating from stale data**: The hydrated model may have attributes that differ from the database state. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Hydrated models correctly use accessors and casts
- [ ] Cached data successfully restored to model instances
- [ ] `retrieved` event side effects accounted for

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Cache hydration applied
- [ ] Query builder to Eloquent bridge applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Prepare data as array of attribute arrays: `[['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']]` completed
- [ ] Call `Model::hydrate($data)` to get a Collection of model instances completed
- [ ] Access Eloquent features (accessors, casts, relationships) on hydrated models completed
- [ ] For raw SQL results, use `Model::hydrateRaw($sql, $bindings)` completed

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

- [ ] Forgetting retrieved event**: `hydrate` fires the `retrieved` model event. If the event has side effects, expect them when hydrating. prevented
- [ ] Hydrating from stale data**: The hydrated model may have attributes that differ from the database state. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Hydrated data includes all attributes needed by accessors and casts
- [ ] `retrieved` event side effects are expected when hydrating
- [ ] Hydrated models are recognized as not persisted (exists = false)
- [ ] Hydrated models correctly use accessors and casts
- [ ] Cached data successfully restored to model instances
- [ ] `retrieved` event side effects accounted for
- [ ] Data is recognized as non-persisted (exists = false)

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
- [ ] ### Forgetting retrieved event fires prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Forgetting retrieved event**: `hydrate` fires the `retrieved` model event. If the event has side effects, expect them when hydrating. prevented
- [ ] Hydrating from stale data**: The hydrated model may have attributes that differ from the database state. prevented

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
