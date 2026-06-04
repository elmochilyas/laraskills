# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.18 Composite index selectivity and cardinality analysis
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] High cardinality first applied
- [ ] Low cardinality as second column applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Misunderstanding cardinality distribution**: A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows. prevented
- [ ] Ignoring correlated columns**: `created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Leading column effectively reduces the search space
- [ ] Actual data distribution (not just distinct count) guides ordering
- [ ] Correlated columns identified and not over-indexed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] High cardinality first applied
- [ ] Low cardinality as second column applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Estimate the cardinality (distinct values) of each filter column completed
- [ ] Calculate selectivity: 1/cardinality completed
- [ ] Place highest-selectivity (most distinct values) column first completed
- [ ] Place lowest-selectivity (fewest distinct values) column last completed
- [ ] Exception: if a low-selectivity column is always filtered with equality, it may be better first completed

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

- [ ] Misunderstanding cardinality distribution**: A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows. prevented
- [ ] Ignoring correlated columns**: `created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Leading column is selective enough to meaningfully reduce search space
- [ ] Low-cardinality columns are not leading alone (composite with selective column)
- [ ] Correlated columns identified and not over-indexed
- [ ] Actual cardinality distribution checked (not just count of distinct values)
- [ ] Leading column effectively reduces the search space
- [ ] Actual data distribution (not just distinct count) guides ordering
- [ ] Correlated columns identified and not over-indexed
- [ ] EXPLAIN shows low estimated rows after index conditions

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
- [ ] ### Misunderstanding cardinality distribution prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Misunderstanding cardinality distribution**: A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows. prevented
- [ ] Ignoring correlated columns**: `created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one. prevented

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
