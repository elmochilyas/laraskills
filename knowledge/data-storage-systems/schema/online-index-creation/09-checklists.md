# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.27 Online index creation in PostgreSQL/SQL Server (.online() modifier)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use CONCURRENTLY for indexes on large tables applied
- [ ] Single-migration for CONCURRENTLY applied
- [ ] Multiple CONCURRENTLY indexes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running CONCURRENTLY inside a transaction**: PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper. prevented
- [ ] Multiple CONCURRENTLY operations in one migration**: Two `CREATE INDEX CONCURRENTLY` statements in one migration. Each triggers an implicit commit, but the second fails because there's no active transaction for its commit context. prevented
- [ ] Not cleaning up invalid indexes**: A failed CONCURRENTLY operation leaves an invalid index that must be dropped before retrying. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Indexes on large tables are created without write blocking
- [ ] PostgreSQL CONCURRENTLY indexes are in separate migration files
- [ ] No invalid indexes remain after failed builds

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use CONCURRENTLY for indexes on large tables applied
- [ ] Single-migration for CONCURRENTLY applied
- [ ] Multiple CONCURRENTLY indexes applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] For PostgreSQL: create a separate, single-operation migration file completed
- [ ] Use `DB::statement('CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status)')` — raw SQL outside any transaction completed
- [ ] Ensure this migration is the ONLY operation in its file completed
- [ ] For MySQL: use `DB::statement('ALTER TABLE orders ADD INDEX idx_status (status) ALGORITHM=INPLACE, LOCK=NONE')` completed
- [ ] Verify the index was created successfully — for PostgreSQL, check for INVALID state completed

---

# Performance Checklist

- [ ] Performance: - CONCURRENTLY reads the table without blocking writes, but the additional IO may slow write operations slightly.
- [ ] Performance: - Index build process competes with application queries for CPU and memory.
- [ ] Performance: - The `maintenance_work_mem` setting in PostgreSQL affects CONCURRENTLY index build speed.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Running CONCURRENTLY inside a transaction**: PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper. prevented
- [ ] Multiple CONCURRENTLY operations in one migration**: Two `CREATE INDEX CONCURRENTLY` statements in one migration. Each triggers an implicit commit, but the second fails because there's no active transaction for its commit context. prevented
- [ ] Not cleaning up invalid indexes**: A failed CONCURRENTLY operation leaves an invalid index that must be dropped before retrying. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] CONCURRENTLY is used for PostgreSQL indexes on large tables
- [ ] PostgreSQL migration is the only operation in its file
- [ ] MySQL ALTER TABLE specifies ALGORITHM=INPLACE, LOCK=NONE
- [ ] Index state is VALID after creation (PostgreSQL)
- [ ] No invalid indexes left after failed CONCURRENTLY builds
- [ ] Indexes on large tables are created without write blocking
- [ ] PostgreSQL CONCURRENTLY indexes are in separate migration files
- [ ] No invalid indexes remain after failed builds
- [ ] MySQL indexes use INPLACE with LOCK=NONE
- [ ] Application traffic is unaffected during index creation

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
- [ ] ### CONCURRENTLY inside a transaction prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running CONCURRENTLY inside a transaction**: PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper. prevented
- [ ] Multiple CONCURRENTLY operations in one migration**: Two `CREATE INDEX CONCURRENTLY` statements in one migration. Each triggers an implicit commit, but the second fails because there's no active transaction for its commit context. prevented
- [ ] Not cleaning up invalid indexes**: A failed CONCURRENTLY operation leaves an invalid index that must be dropped before retrying. prevented

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
