# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.2 Relationship types (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, hasOneThrough, morphMany, morphToMany, morphedByMany)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Prefer explicit inverse definitions applied
- [ ] belongsToMany with custom pivot applied
- [ ] Polymorphic sparingly applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not defining the inverse relationship**: `Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides. prevented
- [ ] Polymorphic for simple cases**: Using `morphMany` when a `hasMany` with a dedicated FK column would work. Polymorphic adds complexity without benefit. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] All relationships have both sides defined
- [ ] FK columns match between related tables
- [ ] Pivot tables exist for many-to-many relationships

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Prefer explicit inverse definitions applied
- [ ] belongsToMany with custom pivot applied
- [ ] Polymorphic sparingly applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] For child referencing parent (FK on child table): define `belongsTo` on the child model completed
- [ ] For parent with children: define `hasMany` or `hasOne` on the parent model completed
- [ ] For many-to-many: define `belongsToMany` on both models with the pivot table completed
- [ ] For polymorphic: define `morphMany` on the parent and `morphTo` on the child completed
- [ ] Always define the inverse relationship explicitly for bidirectional eager loading completed

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

- [ ] Not defining the inverse relationship**: `Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides. prevented
- [ ] Polymorphic for simple cases**: Using `morphMany` when a `hasMany` with a dedicated FK column would work. Polymorphic adds complexity without benefit. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] FK column matches between child and parent
- [ ] Pivot table exists for belongsToMany relationships
- [ ] Inverse relationship defined on the related model
- [ ] Foreign key name matches convention or is explicitly set
- [ ] Morph columns (type, id) properly indexed
- [ ] All relationships have both sides defined
- [ ] FK columns match between related tables
- [ ] Pivot tables exist for many-to-many relationships
- [ ] Polymorphic columns are indexed for performance
- [ ] Eager loading prevents N+1 query problems

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
- [ ] ### Not defining the inverse relationship prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not defining the inverse relationship**: `Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides. prevented
- [ ] Polymorphic for simple cases**: Using `morphMany` when a `hasMany` with a dedicated FK column would work. Polymorphic adds complexity without benefit. prevented

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
