# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.16 Offset pagination deep-page problems (scanning discarded rows)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replace offset with cursor for large datasets applied
- [ ] Keep offset for small datasets applied
- [ ] Use paginate() for admin panels applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using offset for API cursor pagination**: Mobile apps scrolling through thousands of items with offset. Each new page degrades. Use cursor pagination. prevented
- [ ] Forgetting to ORDER BY**: Offset pagination without ORDER BY returns unpredictable results and may have inconsistent pagination. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Deep offset pagination replaced with cursor/keyset
- [ ] Page response time is constant regardless of depth
- [ ] EXPLAIN confirms index range scan (not full scan)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replace offset with cursor for large datasets applied
- [ ] Keep offset for small datasets applied
- [ ] Use paginate() for admin panels applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify queries using `offset()` or `paginate()` with deep page access completed
- [ ] Estimate future data growth — if >10K expected, switch to cursor pagination completed
- [ ] Replace `Model::paginate(20)` with `Model::cursorPaginate(20)` completed
- [ ] Ensure the cursor column is unique and indexed completed
- [ ] Update frontend to use cursor-based navigation (next/prev cursor) completed

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

- [ ] Using offset for API cursor pagination**: Mobile apps scrolling through thousands of items with offset. Each new page degrades. Use cursor pagination. prevented
- [ ] Forgetting to ORDER BY**: Offset pagination without ORDER BY returns unpredictable results and may have inconsistent pagination. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No `offset()` used for datasets that will exceed 10K rows
- [ ] `cursorPaginate()` used for large datasets with "load more" UI
- [ ] Cursor column is unique and indexed
- [ ] ORDER BY column matches cursor column direction
- [ ] Deep offset pagination replaced with cursor/keyset
- [ ] Page response time is constant regardless of depth
- [ ] EXPLAIN confirms index range scan (not full scan)

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
- [ ] Using offset for API cursor pagination**: Mobile apps scrolling through thousands of items with offset. Each new page degrades. Use cursor pagination. prevented
- [ ] Forgetting to ORDER BY**: Offset pagination without ORDER BY returns unpredictable results and may have inconsistent pagination. prevented

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
