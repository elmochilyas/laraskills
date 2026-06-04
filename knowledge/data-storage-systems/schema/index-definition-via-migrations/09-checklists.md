# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.5 Index definition via migrations (index, unique, primary, fullText, spatial)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Composite indexes for multi-column queries applied
- [ ] Unique indexes for business rules applied
- [ ] FullText indexes for text search applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Foreign key without index**: `$table->foreignId('user_id')` without `->constrained()` or `->index()`. The FK constraint exists, but the column is not indexed, causing full table scans on joins. prevented
- [ ] Redundant indexes**: Creating both `unique('email')` and `index('email')` — the unique index already provides index functionality. The second index is redundant. prevented
- [ ] FullText on small tables**: On tables with < 1000 rows, a full table scan is cheaper than a FullText index lookup. Only add FullText when the table size justifies it. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All FK columns are indexed
- [ ] Composite indexes follow leftmost prefix with correct column order
- [ ] Business rules are enforced via unique indexes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Composite indexes for multi-column queries applied
- [ ] Unique indexes for business rules applied
- [ ] FullText indexes for text search applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Identify columns used in WHERE, JOIN, and ORDER BY clauses completed
- [ ] For single-column filters, add `$table->index('email')` completed
- [ ] For multi-column filters, add a composite index: `$table->index(['status', 'created_at'])` with the most selective column first completed
- [ ] For business-unique constraints, use `$table->unique(['email', 'tenant_id'])` to enforce at DB level completed
- [ ] For full-text search, use `$table->fullText('body')` and query with `whereFullText()` completed

---

# Performance Checklist

- [ ] Performance: - Every index adds write amplification: each INSERT must update all indexes on the table.
- [ ] Performance: - Indexes consume disk space and memory (buffer pool / shared buffers).
- [ ] Performance: - FullText indexes are large — evaluate whether the search use case justifies the storage cost.
- [ ] Performance: - Unique indexes on large or frequently written tables add constraint-check overhead.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Foreign key without index**: `$table->foreignId('user_id')` without `->constrained()` or `->index()`. The FK constraint exists, but the column is not indexed, causing full table scans on joins. prevented
- [ ] Redundant indexes**: Creating both `unique('email')` and `index('email')` — the unique index already provides index functionality. The second index is redundant. prevented
- [ ] FullText on small tables**: On tables with < 1000 rows, a full table scan is cheaper than a FullText index lookup. Only add FullText when the table size justifies it. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All foreign key columns are indexed (automatic with constrained())
- [ ] Composite indexes have columns ordered by selectivity
- [ ] Unique indexes exist for all business-unique constraints
- [ ] No redundant indexes (unique + index on same column)
- [ ] Full-text indexes used only for text search queries
- [ ] All FK columns are indexed
- [ ] Composite indexes follow leftmost prefix with correct column order
- [ ] Business rules are enforced via unique indexes
- [ ] No redundant or unused indexes exist
- [ ] Full-text and spatial indexes are used only when query patterns require them

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### FK column without index prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Foreign key without index**: `$table->foreignId('user_id')` without `->constrained()` or `->index()`. The FK constraint exists, but the column is not indexed, causing full table scans on joins. prevented
- [ ] Redundant indexes**: Creating both `unique('email')` and `index('email')` — the unique index already provides index functionality. The second index is redundant. prevented
- [ ] FullText on small tables**: On tables with < 1000 rows, a full table scan is cheaper than a FullText index lookup. Only add FullText when the table size justifies it. prevented

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
