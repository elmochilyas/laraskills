# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.17 Cursor pagination (whereValueOrderBy, seek method)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Default to cursorPaginate for API endpoints applied
- [ ] Use paginate() for numbered pages applied
- [ ] Cursor on created_at applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cursor on non-unique column**: `WHERE status > ?` — if multiple rows have the same status, pages are inconsistent. Always use a unique column or a composite (status, id). prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Cursor pagination implemented and working
- [ ] Response time constant across all pages
- [ ] EXPLAIN shows index range scan with expected row count

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Default to cursorPaginate for API endpoints applied
- [ ] Use paginate() for numbered pages applied
- [ ] Cursor on created_at applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Ensure cursor column is unique and monotonically ordered (id, created_at) completed
- [ ] Replace `Model::paginate(20)` with `Model::cursorPaginate(20)` completed
- [ ] Return `nextCursor` and `previousCursor` in API response completed
- [ ] Client passes cursor in request parameter completed
- [ ] Verify EXPLAIN shows index range scan with constant rows completed

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

- [ ] Cursor on non-unique column**: `WHERE status > ?` — if multiple rows have the same status, pages are inconsistent. Always use a unique column or a composite (status, id). prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cursor column is unique and indexed
- [ ] `cursorPaginate()` produces constant-time queries
- [ ] Next/previous cursors are opaque (encoded if exposing sequential IDs)
- [ ] ORDER BY column matches cursor column direction
- [ ] Cursor pagination implemented and working
- [ ] Response time constant across all pages
- [ ] EXPLAIN shows index range scan with expected row count

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
- [ ] Cursor on non-unique column**: `WHERE status > ?` — if multiple rows have the same status, pages are inconsistent. Always use a unique column or a composite (status, id). prevented

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
