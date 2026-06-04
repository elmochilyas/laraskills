# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.20 Concurrent index creation (PostgreSQL CONCURRENTLY, MySQL INPLACE)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always use CONCURRENTLY for large tables applied
- [ ] Single statement per transaction applied
- [ ] MySQL: explicit ALGORITHM applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] CONCURRENTLY inside transaction**: PostgreSQL raises error. Must use raw `DB::statement()` outside transaction. prevented
- [ ] Multiple CONCURRENTLY in one migration**: Each CONCURRENTLY triggers an implicit commit. Only one per migration file. prevented
- [ ] Ignoring invalid indexes**: If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Index created without blocking writes on production
- [ ] PostgreSQL CONCURRENTLY not inside a transaction
- [ ] Invalid indexes detected and recreated if CONCURRENTLY fails

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always use CONCURRENTLY for large tables applied
- [ ] Single statement per transaction applied
- [ ] MySQL: explicit ALGORITHM applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] For PostgreSQL: `DB::statement('CREATE INDEX CONCURRENTLY idx_name ON table (col)')` completed
- [ ] For MySQL: `DB::statement('ALTER TABLE table ADD INDEX idx_name (col), ALGORITHM=INPLACE, LOCK=NONE')` completed
- [ ] Verify the index exists and is not in INVALID state (PostgreSQL) completed
- [ ] Monitor for failures — if CONCURRENTLY fails, the index is left in INVALID state completed

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

- [ ] CONCURRENTLY inside transaction**: PostgreSQL raises error. Must use raw `DB::statement()` outside transaction. prevented
- [ ] Multiple CONCURRENTLY in one migration**: Each CONCURRENTLY triggers an implicit commit. Only one per migration file. prevented
- [ ] Ignoring invalid indexes**: If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] CONCURRENTLY not used inside a transaction (PostgreSQL)
- [ ] Only one CONCURRENTLY per migration file (PostgreSQL)
- [ ] MySQL uses explicit ALGORITHM=INPLACE LOCK=NONE
- [ ] Invalid indexes are detected and recreated if CONCURRENTLY fails
- [ ] Index created without blocking writes on production
- [ ] PostgreSQL CONCURRENTLY not inside a transaction
- [ ] Invalid indexes detected and recreated if CONCURRENTLY fails
- [ ] MySQL uses explicit ALGORITHM=INPLACE LOCK=NONE

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### CONCURRENTLY inside transaction prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] CONCURRENTLY inside transaction**: PostgreSQL raises error. Must use raw `DB::statement()` outside transaction. prevented
- [ ] Multiple CONCURRENTLY in one migration**: Each CONCURRENTLY triggers an implicit commit. Only one per migration file. prevented
- [ ] Ignoring invalid indexes**: If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated. prevented

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
