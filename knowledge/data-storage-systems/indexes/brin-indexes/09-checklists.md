# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.5 BRIN indexes (correlated physical ordering, large append-only tables)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Time-series data applied
- [ ] append-only tables applied
- [ ] Monitoring and observability applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] BRIN on randomly distributed data**: UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead. prevented
- [ ] Not choosing optimal pages_per_range**: Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering. Tune based on query patterns. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] BRIN index on time-series column with correlated insert order
- [ ] Range queries use BRIN (confirmed via EXPLAIN)
- [ ] Significant storage savings vs B-Tree

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Time-series data applied
- [ ] append-only tables applied
- [ ] Monitoring and observability applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Confirm data insertion order correlates with the indexed column completed
- [ ] Confirm the table is append-only (rare UPDATE/DELETE) completed
- [ ] Create BRIN index: `DB::statement('CREATE INDEX ON logs USING BRIN (created_at)')` completed
- [ ] Tune `pages_per_range` based on query precision needs (default 128) completed
- [ ] Verify with EXPLAIN that BRIN is used for range queries completed

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

- [ ] BRIN on randomly distributed data**: UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead. prevented
- [ ] Not choosing optimal pages_per_range**: Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering. Tune based on query patterns. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Data insertion order correlates with indexed column
- [ ] Table is append-only (rare UPDATE/DELETE)
- [ ] Queries are range-based (not point lookups)
- [ ] Storage savings are meaningful (>10x vs B-Tree)
- [ ] BRIN index on time-series column with correlated insert order
- [ ] Range queries use BRIN (confirmed via EXPLAIN)
- [ ] Significant storage savings vs B-Tree
- [ ] pages_per_range tuned for query pattern

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
- [ ] ### BRIN on randomly distributed data prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] BRIN on randomly distributed data**: UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead. prevented
- [ ] Not choosing optimal pages_per_range**: Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering. Tune based on query patterns. prevented

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
