# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.10 Covering indexes (index-only scans, avoid heap fetches)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dashboard queries applied
- [ ] List endpoints applied
- [ ] INCLUDE for unique indexes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Over-covering**: Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit. Selectively include only the columns that reduce heap fetches. prevented
- [ ] Not using INCLUDE in PostgreSQL**: Adding payload columns as regular index columns when they should be INCLUDE. This unnecessarily increases B-Tree depth and uniqueness constraints. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Hot queries achieve index-only scans
- [ ] INCLUDE used in PostgreSQL for non-key columns
- [ ] Index size doesn't exceed reasonable ratio to table size

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Dashboard queries applied
- [ ] List endpoints applied
- [ ] INCLUDE for unique indexes applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the query's SELECT columns beyond the index key columns completed
- [ ] For PostgreSQL: `DB::statement('CREATE INDEX ON orders (tenant_id, status) INCLUDE (total, name)')` completed
- [ ] For MySQL: add SELECT columns to the index as additional key columns completed
- [ ] Verify with EXPLAIN: "Using index" (MySQL) or "Index Only Scan" (PostgreSQL) completed

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

- [ ] Over-covering**: Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit. Selectively include only the columns that reduce heap fetches. prevented
- [ ] Not using INCLUDE in PostgreSQL**: Adding payload columns as regular index columns when they should be INCLUDE. This unnecessarily increases B-Tree depth and uniqueness constraints. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Covered query doesn't SELECT large columns unnecessarily
- [ ] PostgreSQL uses INCLUDE for non-key payload columns
- [ ] INCLUDE columns don't expand the index beyond reasonable size
- [ ] EXPLAIN confirms index-only scan
- [ ] Hot queries achieve index-only scans
- [ ] INCLUDE used in PostgreSQL for non-key columns
- [ ] Index size doesn't exceed reasonable ratio to table size
- [ ] EXPLAIN confirms "Index Only Scan" or "Using index"

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
- [ ] ### Over-covering prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Over-covering**: Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit. Selectively include only the columns that reduce heap fetches. prevented
- [ ] Not using INCLUDE in PostgreSQL**: Adding payload columns as regular index columns when they should be INCLUDE. This unnecessarily increases B-Tree depth and uniqueness constraints. prevented

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
