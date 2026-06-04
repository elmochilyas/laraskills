# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.25 Subquery optimization (lateral joins in PostgreSQL, derived table optimization)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Eloquent subquery select with optimal indexing applied
- [ ] Subquery in EXISTS vs IN applied
- [ ] Semi-join in MySQL applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using subquery in WHERE IN with large result set**: `WHERE id IN (SELECT id FROM ...)` materializes the full subquery result. Use EXISTS or JOIN instead when the subquery returns thousands of rows. prevented
- [ ] Nested subquery in Eloquent without index**: Adding `Order::select('total')->whereColumn('user_id', 'users.id')->orderBy('created_at')->limit(1)` as an addSelect without indexing `orders.user_id` or `orders.created_at` causes a full scan per user. prevented
- [ ] LATERAL without proper index**: LATERAL is only fast when the inner query can use an index for the parameter passed from the outer query. prevented
- [ ] ```php prevented
- [ ] // Missing index: orders (user_id, created_at) => full scan per row prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Subqueries execute efficiently with proper indexes
- [ ] No correlated subqueries without matching indexes
- [ ] Appropriate pattern chosen (IN vs EXISTS vs JOIN vs LATERAL)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Eloquent subquery select with optimal indexing applied
- [ ] Subquery in EXISTS vs IN applied
- [ ] Semi-join in MySQL applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Run EXPLAIN on the subquery-heavy query completed
- [ ] Check for "DEPENDENT SUBQUERY" (MySQL) or correlated scan patterns (PostgreSQL) completed
- [ ] If correlated: verify the correlated column has an index completed
- [ ] If `WHERE IN (SELECT ...)` with large subquery result: rewrite as EXISTS or JOIN completed
- [ ] If PostgreSQL and LATERAL available: consider LATERAL join for per-row correlated data completed

---

# Performance Checklist

- [ ] Performance: - Always `EXPLAIN ANALYZE` subquery-heavy queries. Look for "DEPENDENT SUBQUERY" which indicates correlation.
- [ ] Performance: - A correlated subquery on a 100k-row table with no index on the correlated column = 100k full table scans.
- [ ] Performance: - PostgreSQL 17+ improves LATERAL join estimation and can use additional statistics for better plans.
- [ ] Performance: - MySQL 8.0.21+ adds hash join support which can benefit certain subquery patterns.
- [ ] Performance: -- Check for dependent subqueries in MySQL

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using subquery in WHERE IN with large result set**: `WHERE id IN (SELECT id FROM ...)` materializes the full subquery result. Use EXISTS or JOIN instead when the subquery returns thousands of rows. prevented
- [ ] Nested subquery in Eloquent without index**: Adding `Order::select('total')->whereColumn('user_id', 'users.id')->orderBy('created_at')->limit(1)` as an addSelect without indexing `orders.user_id` or `orders.created_at` causes a full scan per user. prevented
- [ ] LATERAL without proper index**: LATERAL is only fast when the inner query can use an index for the parameter passed from the outer query. prevented
- [ ] ```php prevented
- [ ] // Missing index: orders (user_id, created_at) => full scan per row prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Correlated subqueries have indexes on the correlated column
- [ ] EXISTS used instead of IN for large subquery result sets
- [ ] No "DEPENDENT SUBQUERY" in MySQL EXPLAIN for hot queries
- [ ] LATERAL considered for PostgreSQL per-row subqueries
- [ ] Subqueries execute efficiently with proper indexes
- [ ] No correlated subqueries without matching indexes
- [ ] Appropriate pattern chosen (IN vs EXISTS vs JOIN vs LATERAL)

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
- [ ] Using subquery in WHERE IN with large result set**: `WHERE id IN (SELECT id FROM ...)` materializes the full subquery result. Use EXISTS or JOIN instead when the subquery returns thousands of rows. prevented
- [ ] Nested subquery in Eloquent without index**: Adding `Order::select('total')->whereColumn('user_id', 'users.id')->orderBy('created_at')->limit(1)` as an addSelect without indexing `orders.user_id` or `orders.created_at` causes a full scan per user. prevented
- [ ] LATERAL without proper index**: LATERAL is only fast when the inner query can use an index for the parameter passed from the outer query. prevented
- [ ] ```php prevented
- [ ] // Missing index: orders (user_id, created_at) => full scan per row prevented
- [ ] User::addSelect(['last_order' => Order::selectRaw('JSON_OBJECT("id", id, "total", total)') prevented
- [ ] ->whereColumn('user_id', 'users.id') prevented
- [ ] ->latest() prevented
- [ ] ->limit(1) prevented
- [ ] ]); prevented

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
