# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.21 upsert operation (upsert, upsert with unique keys)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Idempotent imports applied
- [ ] Sync from external API applied
- [ ] Bulk update-or-create applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Missing unique index**: upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key. prevented
- [ ] Not including all unique columns**: upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update. prevented
- [ ] Model events not fired**: upsert does NOT fire model events (`saving`, `saved`, `creating`, `created`, `updating`, `updated`). Use `DB::table` upsert for event-less operations. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Upsert correctly inserts new rows and updates existing ones
- [ ] Unique index exists on conflict-detection columns
- [ ] No model events expected from upsert operations

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Idempotent imports applied
- [ ] Sync from external API applied
- [ ] Bulk update-or-create applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Ensure a unique index exists on the identifier columns completed
- [ ] Call `Model::upsert($values, $uniqueBy, $update)` where $values is an array of rows completed
- [ ] Verify row counts to confirm expected behavior completed
- [ ] For event-driven operations, use firstOrCreate in a transaction instead completed

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

- [ ] Missing unique index**: upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key. prevented
- [ ] Not including all unique columns**: upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update. prevented
- [ ] Model events not fired**: upsert does NOT fire model events (`saving`, `saved`, `creating`, `created`, `updating`, `updated`). Use `DB::table` upsert for event-less operations. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Unique index exists on the conflict-detection columns
- [ ] Model events are not expected (upsert bypasses them)
- [ ] All unique columns are specified in $uniqueBy
- [ ] Update columns don't include the unique columns (no-op)
- [ ] Upsert correctly inserts new rows and updates existing ones
- [ ] Unique index exists on conflict-detection columns
- [ ] No model events expected from upsert operations
- [ ] Batch processing replaces firstOrCreate loops

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
- [ ] ### Missing unique index prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Missing unique index**: upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key. prevented
- [ ] Not including all unique columns**: upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update. prevented
- [ ] Model events not fired**: upsert does NOT fire model events (`saving`, `saved`, `creating`, `created`, `updating`, `updated`). Use `DB::table` upsert for event-less operations. prevented

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
