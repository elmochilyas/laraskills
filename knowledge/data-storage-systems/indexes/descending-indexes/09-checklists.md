# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.15 Descending indexes (order by DESC aligned with index order)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Latest records per group applied
- [ ] Timeline queries applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not needed for single-column DESC**: MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] DESC index eliminates reverse scan for composite-index queries
- [ ] Index direction matches query ORDER BY
- [ ] Single-column queries don't use DESC index (unnecessary)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Latest records per group applied
- [ ] Timeline queries applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the ORDER BY direction for each sort column completed
- [ ] For DESC columns, add `DESC` to the index definition completed
- [ ] Create index: `DB::statement('CREATE INDEX ON orders (user_id, created_at DESC)')` completed
- [ ] For mixed directions: `CREATE INDEX ON orders (status ASC, created_at DESC)` completed
- [ ] Verify with EXPLAIN — no "Backward index scan" or "Sort" should appear completed

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

- [ ] Not needed for single-column DESC**: MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] DESC index used only in composite indexes (single-column doesn't benefit)
- [ ] Index direction matches query ORDER BY direction
- [ ] EXPLAIN doesn't show "Backward scan" or "Sort"
- [ ] Query pattern justifies the specialized index
- [ ] DESC index eliminates reverse scan for composite-index queries
- [ ] Index direction matches query ORDER BY
- [ ] Single-column queries don't use DESC index (unnecessary)
- [ ] EXPLAIN confirms no "Backward scan" or "Sort"

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
- [ ] ### Not needed for single-column DESC prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not needed for single-column DESC**: MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes. prevented

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
