# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.18 Model serialization (toArray, toJson, hidden, visible, append)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Hide sensitive attributes applied
- [ ] Append computed fields applied
- [ ] Use API Resources for endpoint-specific serialization applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] $appends triggering N+1**: An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization. prevented
- [ ] Not hiding sensitive attributes**: `toJson()` on a user model exposes `password` if not in `$hidden`. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] No sensitive attributes exposed in JSON responses
- [ ] $appends accessors don't cause N+1 queries
- [ ] Appropriate serialization strategy chosen ($hidden/$visible/API Resource)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Hide sensitive attributes applied
- [ ] Append computed fields applied
- [ ] Use API Resources for endpoint-specific serialization applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Set `protected $hidden = ['password', 'remember_token']` for sensitive fields completed
- [ ] Alternatively, set `protected $visible = ['id', 'name', 'email']` to whitelist completed
- [ ] Add computed accessors to `protected $appends = ['full_name']` completed
- [ ] Use `toArray()` or `toJson()` for serialization completed
- [ ] Use API Resource classes for per-endpoint customization completed

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

- [ ] $appends triggering N+1**: An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization. prevented
- [ ] Not hiding sensitive attributes**: `toJson()` on a user model exposes `password` if not in `$hidden`. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Sensitive attributes (passwords, tokens, keys) are in $hidden
- [ ] Accessors in $appends don't trigger lazy loading
- [ ] API Resources used when different endpoints need different field sets
- [ ] $appends attributes are computed, not stored in DB
- [ ] No sensitive attributes exposed in JSON responses
- [ ] $appends accessors don't cause N+1 queries
- [ ] Appropriate serialization strategy chosen ($hidden/$visible/API Resource)
- [ ] Queued models serialize correctly without relationship issues

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
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] $appends triggering N+1**: An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization. prevented
- [ ] Not hiding sensitive attributes**: `toJson()` on a user model exposes `password` if not in `$hidden`. prevented

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
