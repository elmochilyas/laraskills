# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.24 replicate, fill, forceFill, forceCreate
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replicate for duplicate content applied
- [ ] forceFill for internal operations applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using forceFill with user input**: Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data. prevented
- [ ] Replicate doesn't copy relationships**: Only the model's direct attributes are copied. Related records must be replicated separately. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] forceFill only used with trusted, internal data
- [ ] replicate correctly excludes specified attributes
- [ ] fill receives validated data from form requests

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replicate for duplicate content applied
- [ ] forceFill for internal operations applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Always Monitor Replica Lag followed
- [ ] Use `$post->replicate(['published_at'])->save()` to clone without specified attributes completed
- [ ] Use `$model->fill($request->validated())` for safe mass-assignment from validated data completed
- [ ] Use `$model->forceFill(['internal_flag' => true])` only with trusted data completed
- [ ] Use `Model::forceCreate([...])` only in admin/system contexts completed

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

- [ ] Using forceFill with user input**: Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data. prevented
- [ ] Replicate doesn't copy relationships**: Only the model's direct attributes are copied. Related records must be replicated separately. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Always Monitor Replica Lag followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] forceFill/forceCreate never used with user-supplied input
- [ ] replicate excludes timestamps and PKs when appropriate
- [ ] Dependent relationships replicated separately if needed
- [ ] fill used with validated data (not raw request input)
- [ ] forceFill only used with trusted, internal data
- [ ] replicate correctly excludes specified attributes
- [ ] fill receives validated data from form requests
- [ ] Relationship replication handled separately when needed

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
- [ ] ### Using forceFill with user input prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using forceFill with user input**: Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data. prevented
- [ ] Replicate doesn't copy relationships**: Only the model's direct attributes are copied. Related records must be replicated separately. prevented

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
