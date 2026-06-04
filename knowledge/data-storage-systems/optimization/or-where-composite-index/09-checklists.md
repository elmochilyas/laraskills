# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.11 orWhere on composite index without grouping
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always group orWhere applied
- [ ] UNION for high-selectivity OR applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Unintentional OR scope**: `where('a', 1)->orWhere('b', 2)` — the OR applies to the ENTIRE WHERE clause. Often the developer intended `where('a', 1)` AND `(x OR y)` but wrote `(where a) OR (b)`. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] OR queries use indexes instead of full table scans
- [ ] EXPLAIN confirms index access for all branches
- [ ] Query results remain unchanged after rewrite

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always group orWhere applied
- [ ] UNION for high-selectivity OR applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify `orWhere` clauses referencing different columns completed
- [ ] Check if a composite index covers the columns completed
- [ ] If OR spans columns in a composite index: group OR conditions with closure completed
- [ ] Alternatively, rewrite as UNION of two separate indexed queries completed
- [ ] Verify with EXPLAIN that type is no longer `ALL` completed

---

# Performance Checklist

- [ ] Performance: EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table q...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Unintentional OR scope**: `where('a', 1)->orWhere('b', 2)` — the OR applies to the ENTIRE WHERE clause. Often the developer intended `where('a', 1)` AND `(x OR y)` but wrote `(where a) OR (b)`. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] OR conditions grouped with closure `where(fn($q) => ...)`
- [ ] EXPLAIN does not show full table scan from OR conditions
- [ ] UNION used when each OR branch is highly selective
- [ ] OR queries use indexes instead of full table scans
- [ ] EXPLAIN confirms index access for all branches
- [ ] Query results remain unchanged after rewrite

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always EXPLAIN Before Optimizing prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Unintentional OR scope**: `where('a', 1)->orWhere('b', 2)` — the OR applies to the ENTIRE WHERE clause. Often the developer intended `where('a', 1)` AND `(x OR y)` but wrote `(where a) OR (b)`. prevented

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
