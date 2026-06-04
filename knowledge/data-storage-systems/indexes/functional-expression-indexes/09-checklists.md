# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.12 Functional/expression indexes (index by expression result, PostgreSQL/MySQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Case-insensitive unique constraint applied
- [ ] Date-part indexing applied
- [ ] JSON path indexing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Expression mismatch**: Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used. prevented
- [ ] Expression index on volatile function**: `CREATE INDEX ON users (random())` — useless because the value changes constantly. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Expression indexes created for non-sargable function wraps
- [ ] Query expression exactly matches index expression
- [ ] Function is immutable (deterministic)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Case-insensitive unique constraint applied
- [ ] Date-part indexing applied
- [ ] JSON path indexing applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the function wrapping a column in WHERE: `WHERE LOWER(email) = ?` completed
- [ ] Create an index on the exact same expression: `CREATE INDEX ON users (LOWER(email))` completed
- [ ] Ensure the query expression matches the index expression exactly completed
- [ ] For MySQL 8.0+: `CREATE INDEX ON users ((LOWER(email)))` completed
- [ ] Verify with EXPLAIN completed

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

- [ ] Expression mismatch**: Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used. prevented
- [ ] Expression index on volatile function**: `CREATE INDEX ON users (random())` — useless because the value changes constantly. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Index expression exactly matches the query expression
- [ ] Function is immutable (same input always produces same output)
- [ ] MySQL 8.0+ for functional indexes on expressions
- [ ] B-Tree alternative (rewriting without function) was considered
- [ ] Expression indexes created for non-sargable function wraps
- [ ] Query expression exactly matches index expression
- [ ] Function is immutable (deterministic)
- [ ] EXPLAIN confirms index usage for the expression query

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
- [ ] ### Expression mismatch prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Expression mismatch**: Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used. prevented
- [ ] Expression index on volatile function**: `CREATE INDEX ON users (random())` — useless because the value changes constantly. prevented

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
