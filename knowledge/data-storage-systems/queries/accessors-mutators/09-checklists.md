# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.16 Accessors and mutators (get{Attribute}Attribute, set{Attribute}Attribute)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Value normalization in mutators applied
- [ ] Computed read-only attributes applied
- [ ] Use casts over mutators for type conversion applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Accessors that query the database**: An accessor that calls `$this->relation()->first()` triggers a lazy load. Eager load the relationship instead. prevented
- [ ] Mutators that don't set the attribute**: `$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Accessors are side-effect-free and don't query the database
- [ ] Mutators properly normalize input and use `$this->attributes`
- [ ] Simple type conversions use casts, not accessors

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Value normalization in mutators applied
- [ ] Computed read-only attributes applied
- [ ] Use casts over mutators for type conversion applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Define accessor: `public function getNameAttribute($value)` — return transformed value completed
- [ ] Define mutator: `public function setNameAttribute($value)` — set `$this->attributes['name'] = $transformed` completed
- [ ] For computed accessors (not in DB), append to serialization via `$appends` completed
- [ ] Prefer attribute casting for simple type conversions completed

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

- [ ] Accessors that query the database**: An accessor that calls `$this->relation()->first()` triggers a lazy load. Eager load the relationship instead. prevented
- [ ] Mutators that don't set the attribute**: `$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Accessors don't query the database (no lazy loading inside accessors)
- [ ] Mutators use `$this->attributes['name']` not `$this->name =` (avoids recursion)
- [ ] Computed accessors are listed in `$appends` if needed in JSON output
- [ ] Simple type conversions use casts instead of accessors
- [ ] Accessors are side-effect-free and don't query the database
- [ ] Mutators properly normalize input and use `$this->attributes`
- [ ] Simple type conversions use casts, not accessors
- [ ] Computed accessors are listed in `$appends` when needed

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
- [ ] ### Accessors that query the database prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Accessors that query the database**: An accessor that calls `$this->relation()->first()` triggers a lazy load. Eager load the relationship instead. prevented
- [ ] Mutators that don't set the attribute**: `$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`. prevented

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
