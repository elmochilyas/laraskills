# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.1 Model definition conventions (table name, primary key, timestamps, connection)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always define $table explicitly in multi-tenant apps applied
- [ ] Use UUID/ULID for public-facing models applied
- [ ] Per-model connection applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Forgetting to disable incrementing for UUIDs**: `Model::create()` tries to insert with `id = 0` because Eloquent expects an auto-incrementing integer. Error or silent wrong insertion. prevented
- [ ] Timestamps on non-entity tables**: Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary columns. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Models correctly map to their database tables
- [ ] UUID/ULID PKs insert correctly
- [ ] Timestamps only on tables that have the columns

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always define $table explicitly in multi-tenant apps applied
- [ ] Use UUID/ULID for public-facing models applied
- [ ] Per-model connection applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Create the model class extending `Model` completed
- [ ] If the table name doesn't follow snake_case plural convention, set `protected $table = 'custom_table'` completed
- [ ] If the PK is not `id`, set `protected $primaryKey = 'uuid'` completed
- [ ] If the PK is not auto-incrementing (UUID, ULID), set `public $incrementing = false` and `protected $keyType = 'string'` completed
- [ ] If the table doesn't use timestamps, set `public $timestamps = false` completed

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

- [ ] Forgetting to disable incrementing for UUIDs**: `Model::create()` tries to insert with `id = 0` because Eloquent expects an auto-incrementing integer. Error or silent wrong insertion. prevented
- [ ] Timestamps on non-entity tables**: Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary columns. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Table name matches database table (explicit or conventional)
- [ ] Primary key type matches database column
- [ ] Auto-incrementing disabled for UUID/ULID PKs
- [ ] Timestamps enabled only when columns exist
- [ ] Connection set for multi-database setups
- [ ] Models correctly map to their database tables
- [ ] UUID/ULID PKs insert correctly
- [ ] Timestamps only on tables that have the columns
- [ ] Multi-connection models use correct database

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
- [ ] ### Forgetting to disable incrementing for UUIDs prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Forgetting to disable incrementing for UUIDs**: `Model::create()` tries to insert with `id = 0` because Eloquent expects an auto-incrementing integer. Error or silent wrong insertion. prevented
- [ ] Timestamps on non-entity tables**: Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary columns. prevented

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
