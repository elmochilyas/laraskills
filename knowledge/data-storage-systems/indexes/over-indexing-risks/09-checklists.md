# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.23 Over-indexing risks (write amplification, storage cost)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Minimum viable indexes applied
- [ ] Index consolidation applied
- [ ] Drop unused indexes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Index every column**: "This column might be queried someday." Indexes have costs. Add when needed, not preemptively. prevented
- [ ] Duplicate indexes**: Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] No redundant indexes on any table
- [ ] Unused indexes dropped
- [ ] Write amplification factor is acceptable

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Minimum viable indexes applied
- [ ] Index consolidation applied
- [ ] Drop unused indexes applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] List all indexes on each table completed
- [ ] Identify redundant indexes: composite (a, b) makes single (a) redundant completed
- [ ] Consolidate overlapping indexes into fewer composite indexes completed
- [ ] Drop indexes with zero or near-zero usage (from pg_stat_user_indexes) completed
- [ ] For remaining indexes, calculate write amplification factor: index count × write IO completed

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

- [ ] Index every column**: "This column might be queried someday." Indexes have costs. Add when needed, not preemptively. prevented
- [ ] Duplicate indexes**: Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No redundant indexes (composite doesn't exist alongside its prefix)
- [ ] Unused indexes (zero scans in 30 days) identified and dropped
- [ ] Write amplification factor is acceptable for the table's write volume
- [ ] Each index has a documented justification
- [ ] No redundant indexes on any table
- [ ] Unused indexes dropped
- [ ] Write amplification factor is acceptable
- [ ] Each index has a documented justification based on query patterns

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
- [ ] ### Index every column prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Index every column**: "This column might be queried someday." Indexes have costs. Add when needed, not preemptively. prevented
- [ ] Duplicate indexes**: Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`. prevented

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
