# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.6 Relationship existence filtering (whereHas, whereDoesntHave, orWhereHas)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use whereHas for semantic filtering applied
- [ ] Use JOIN for performance-critical filters applied
- [ ] Avoid deep nesting applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] orWhereHas without grouping**: `->where('status', 'active')->orWhereHas('comments')` — the OR applies to the entire WHERE clause, potentially returning unexpected results. Use a closure group. prevented
- [ ] Repeated whereHas for the same relation**: Calling `whereHas('comments', ...)` and later `whereHas('comments', ...)` in the same query generates two identical subqueries. Combine constraints in a single closure. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Existence queries use has()/whereHas() instead of in-memory filtering
- [ ] Absence queries use doesntHave()/whereDoesntHave()
- [ ] Conditional existence uses whereHas() with proper closure constraints

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use whereHas for semantic filtering applied
- [ ] Use JOIN for performance-critical filters applied
- [ ] Avoid deep nesting applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] For simple existence: `Post::has('comments')->get()` — posts with >= 1 comment completed
- [ ] For absence: `Post::doesntHave('comments')->get()` — posts with 0 comments completed
- [ ] For conditional existence: `Post::whereHas('comments', fn($q) => $q->where('approved', true))->get()` completed
- [ ] For absence with conditions: `Post::whereDoesntHave('comments', fn($q) => $q->where('spam', true))->get()` completed
- [ ] For nested existence: `User::whereHas('posts.comments', fn($q) => $q->where('approved', true))->get()` completed

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

- [ ] orWhereHas without grouping**: `->where('status', 'active')->orWhereHas('comments')` — the OR applies to the entire WHERE clause, potentially returning unexpected results. Use a closure group. prevented
- [ ] Repeated whereHas for the same relation**: Calling `whereHas('comments', ...)` and later `whereHas('comments', ...)` in the same query generates two identical subqueries. Combine constraints in a single closure. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Relationship exists on the model
- [ ] `has()` vs `whereHas()` chosen correctly (with or without conditions)
- [ ] `doesntHave()` used for absence queries
- [ ] Nested dot-notation works for deep relationships
- [ ] Existence queries use has()/whereHas() instead of in-memory filtering
- [ ] Absence queries use doesntHave()/whereDoesntHave()
- [ ] Conditional existence uses whereHas() with proper closure constraints
- [ ] Nested existence queries use dot notation correctly

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
- [ ] ### Using has() when whereHas() is needed prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] orWhereHas without grouping**: `->where('status', 'active')->orWhereHas('comments')` — the OR applies to the entire WHERE clause, potentially returning unexpected results. Use a closure group. prevented
- [ ] Repeated whereHas for the same relation**: Calling `whereHas('comments', ...)` and later `whereHas('comments', ...)` in the same query generates two identical subqueries. Combine constraints in a single closure. prevented

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
