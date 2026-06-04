# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.12 Type mismatch implicit casts (string vs integer comparison)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cast in PHP before querying applied
- [ ] Use same types in FK relationships applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Request parameter not cast**: `Model::where('uuid', $request->uuid)` — if `uuid` is a string column and `$request->uuid` is missing (null), MySQL compares `string_column = NULL` (always false) or `string_column = 0` (implicit cast). prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Query parameters match column types exactly
- [ ] EXPLAIN confirms index usage
- [ ] No implicit cast warnings in query logs

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Cast in PHP before querying applied
- [ ] Use same types in FK relationships applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify column types in WHERE conditions completed
- [ ] Check if the bound parameter type matches the column type completed
- [ ] For string columns: ensure values are cast to string: `where('uuid', (string) $value)` completed
- [ ] For FK relationships: ensure both sides use same type (`foreignId()` = `unsignedBigInteger`) completed
- [ ] Verify with EXPLAIN that index is used completed

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

- [ ] Request parameter not cast**: `Model::where('uuid', $request->uuid)` — if `uuid` is a string column and `$request->uuid` is missing (null), MySQL compares `string_column = NULL` (always false) or `string_column = 0` (implicit cast). prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Query parameters explicitly cast to match column types
- [ ] FK and referenced PK use identical types
- [ ] `$request` input cast before use in queries
- [ ] EXPLAIN shows index usage
- [ ] Query parameters match column types exactly
- [ ] EXPLAIN confirms index usage
- [ ] No implicit cast warnings in query logs

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
- [ ] Request parameter not cast**: `Model::where('uuid', $request->uuid)` — if `uuid` is a string column and `$request->uuid` is missing (null), MySQL compares `string_column = NULL` (always false) or `string_column = 0` (implicit cast). prevented

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
