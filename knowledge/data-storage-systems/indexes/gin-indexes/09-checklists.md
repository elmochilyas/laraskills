# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.4 GIN indexes (JSONB, arrays, full-text tsvector, trigrams)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] JSONB containment queries applied
- [ ] Array overlap applied
- [ ] Full-text search applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not specifying jsonb_path_ops**: `CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries. Only use default if you need `?`, `? prevented
- [ ] GIN on frequently updated JSONB**: Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] GIN index correctly serves JSONB/array/tsvector queries
- [ ] Appropriate operator class selected for query pattern
- [ ] Write-heavy columns evaluated for GIN maintenance cost

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] JSONB containment queries applied
- [ ] Array overlap applied
- [ ] Full-text search applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the data type and query operators needed completed
- [ ] For JSONB containment: use `jsonb_path_ops` operator class for best performance completed
- [ ] For full-text: create generated tsvector column, GIN index on it completed
- [ ] For trigram: `CREATE EXTENSION pg_trgm; CREATE INDEX ON table USING GIN (col gin_trgm_ops)` completed
- [ ] Use appropriate operators in queries completed

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

- [ ] Not specifying jsonb_path_ops**: `CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries. Only use default if you need `?`, `? prevented
- [ ] GIN on frequently updated JSONB**: Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] jsonb_path_ops used for JSONB (unless ?/?|/?& operators are needed)
- [ ] Write-heavy JSONB columns evaluated for GIN maintenance overhead
- [ ] pg_trgm extension created for trigram-based GIN indexes
- [ ] Full-text search uses tsvector column, not raw text
- [ ] GIN index correctly serves JSONB/array/tsvector queries
- [ ] Appropriate operator class selected for query pattern
- [ ] Write-heavy columns evaluated for GIN maintenance cost
- [ ] EXPLAIN confirms index usage

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
- [ ] ### Not specifying jsonb_path_ops prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not specifying jsonb_path_ops**: `CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries. Only use default if you need `?`, `? prevented
- [ ] GIN on frequently updated JSONB**: Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead. prevented

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
