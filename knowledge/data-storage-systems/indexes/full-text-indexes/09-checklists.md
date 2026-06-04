# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.13 Full-text indexes (MySQL FULLTEXT, PostgreSQL GIN tsvector)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] MySQL applied
- [ ] PostgreSQL applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] - **Indexing every column**: Adding indexes on every column "just in case" increases write amplification (every INSERT/UPDATE/DELETE must update each index), bloats storage, and confuses the query planner. Only index columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses. prevented
- [ ] - **Ignoring composite index column order**: The leftmost prefix rule means column order in a composite index matters dramatically. Place high-selectivity columns first and range-filtered columns last. A wrong column order can render the index useless for common queries. prevented
- [ ] - **Not monitoring unused indexes**: Indexes that are never used by the query planner still incur write overhead and storage costs. Use pg_stat_user_indexes or performance_schema to identify and drop unused indexes. prevented
- [ ] - **Over-indexing foreign keys**: While FK columns benefit from indexing, adding separate indexes when a composite index already covers the FK leads to redundancy. Check existing indexes before adding FK-specific ones. prevented
- [ ] - **Indexing without query analysis**: Adding indexes based on column names rather than actual query patterns leads to wasted effort. Use slow query logs, EXPLAIN plans, and query profiling to identify the exact queries that need optimization. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Full-text search returns relevant, ranked results
- [ ] Index supports the search queries (confirmed by EXPLAIN)
- [ ] Appropriate database-specific implementation chosen

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] MySQL applied
- [ ] PostgreSQL applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] For MySQL: add FULLTEXT index, query with `WHERE MATCH(title, body) AGAINST('search terms' IN BOOLEAN MODE)` completed
- [ ] For PostgreSQL: add generated tsvector column, GIN index, query with `WHERE tsv @@ to_tsquery('english', 'search & terms')` completed
- [ ] Test ranking and relevance for the use case completed
- [ ] Tune configuration (stop words, minimum word length) completed

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

- [ ] - **Indexing every column**: Adding indexes on every column "just in case" increases write amplification (every INSERT/UPDATE/DELETE must update each index), bloats storage, and confuses the query planner. Only index columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses. prevented
- [ ] - **Ignoring composite index column order**: The leftmost prefix rule means column order in a composite index matters dramatically. Place high-selectivity columns first and range-filtered columns last. A wrong column order can render the index useless for common queries. prevented
- [ ] - **Not monitoring unused indexes**: Indexes that are never used by the query planner still incur write overhead and storage costs. Use pg_stat_user_indexes or performance_schema to identify and drop unused indexes. prevented
- [ ] - **Over-indexing foreign keys**: While FK columns benefit from indexing, adding separate indexes when a composite index already covers the FK leads to redundancy. Check existing indexes before adding FK-specific ones. prevented
- [ ] - **Indexing without query analysis**: Adding indexes based on column names rather than actual query patterns leads to wasted effort. Use slow query logs, EXPLAIN plans, and query profiling to identify the exact queries that need optimization. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] FULLTEXT index on MySQL or GIN index on PostgreSQL
- [ ] Query uses the correct search operator (MATCH...AGAINST or @@)
- [ ] Search returns relevant results with proper ranking
- [ ] Boolean mode used when operators (+, -, *) are needed
- [ ] Full-text search returns relevant, ranked results
- [ ] Index supports the search queries (confirmed by EXPLAIN)
- [ ] Appropriate database-specific implementation chosen
- [ ] Search is performant at expected data volume

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
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] - **Indexing every column**: Adding indexes on every column "just in case" increases write amplification (every INSERT/UPDATE/DELETE must update each index), bloats storage, and confuses the query planner. Only index columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses. prevented
- [ ] - **Ignoring composite index column order**: The leftmost prefix rule means column order in a composite index matters dramatically. Place high-selectivity columns first and range-filtered columns last. A wrong column order can render the index useless for common queries. prevented
- [ ] - **Not monitoring unused indexes**: Indexes that are never used by the query planner still incur write overhead and storage costs. Use pg_stat_user_indexes or performance_schema to identify and drop unused indexes. prevented
- [ ] - **Over-indexing foreign keys**: While FK columns benefit from indexing, adding separate indexes when a composite index already covers the FK leads to redundancy. Check existing indexes before adding FK-specific ones. prevented
- [ ] - **Indexing without query analysis**: Adding indexes based on column names rather than actual query patterns leads to wasted effort. Use slow query logs, EXPLAIN plans, and query profiling to identify the exact queries that need optimization. prevented
- [ ] - **Neglecting maintenance**: B-Tree indexes can bloat over time from UPDATE/DELETE activity. Schedule regular REINDEX (PostgreSQL) or OPTIMIZE TABLE (MySQL) during maintenance windows to reclaim space and improve performance. prevented

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
