# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.21 Index management in Laravel migrations (index, unique, fullText, spatial, raw DB::statement)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Composite indexes in migrations applied
- [ ] Named indexes applied
- [ ] Raw for advanced types applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not using composite indexes**: Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`. prevented
- [ ] Indexing without understanding query patterns**: Adding indexes before profiling what queries actually run. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Indexes defined at migration time based on query analysis
- [ ] Composite indexes used instead of redundant single-column indexes
- [ ] Advanced indexes use correct raw DDL syntax

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Composite indexes in migrations applied
- [ ] Named indexes applied
- [ ] Raw for advanced types applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] For standard indexes: `$table->index(['tenant_id', 'status'])` in migration completed
- [ ] For unique: `$table->unique('email')` completed
- [ ] For full-text: `$table->fullText('body')` completed
- [ ] For spatial: `$table->spatialIndex('location')` completed
- [ ] For advanced types: use `DB::statement('CREATE INDEX CONCURRENTLY ...')` completed

---

# Performance Checklist

- [ ] Performance: B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index ad...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not using composite indexes**: Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`. prevented
- [ ] Indexing without understanding query patterns**: Adding indexes before profiling what queries actually run. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Composite indexes defined as one index, not separate single-column indexes
- [ ] Named indexes used for clarity and to prevent auto-generated name collisions
- [ ] Advanced index types use raw DDL with proper syntax
- [ ] Index names follow naming conventions
- [ ] Indexes defined at migration time based on query analysis
- [ ] Composite indexes used instead of redundant single-column indexes
- [ ] Advanced indexes use correct raw DDL syntax
- [ ] Index names follow project conventions

---

# Maintainability Checklist

- [ ] Named indexes applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Not using composite indexes prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not using composite indexes**: Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`. prevented
- [ ] Indexing without understanding query patterns**: Adding indexes before profiling what queries actually run. prevented

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
