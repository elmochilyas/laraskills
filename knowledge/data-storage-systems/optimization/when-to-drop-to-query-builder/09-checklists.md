# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.23 When to drop to query builder or raw SQL (reporting, complex aggregation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dashboard aggregation applied
- [ ] Reporting exports applied
- [ ] Complex reporting applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using Eloquent for everything**: `Order::all()->groupBy('status')->map(fn($g) => $g->sum('total'))` — hydrates all models, groups in PHP. Use query builder aggregation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Appropriate query layer chosen (Eloquent vs query builder vs raw SQL)
- [ ] Memory usage significantly reduced for large result sets
- [ ] Database-specific features accessible when needed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Dashboard aggregation applied
- [ ] Reporting exports applied
- [ ] Complex reporting applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Determine if model methods/relationships are needed in the result completed
- [ ] If no model methods needed: use `DB::table('table')` — stdClass results completed
- [ ] For database-specific features: use `DB::select('SELECT ...')` with raw SQL completed
- [ ] For aggregation: use `selectRaw()` with `groupBy()` in query builder completed
- [ ] Verify memory usage difference with large datasets completed

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

- [ ] Using Eloquent for everything**: `Order::all()->groupBy('status')->map(fn($g) => $g->sum('total'))` — hydrates all models, groups in PHP. Use query builder aggregation. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Reporting/aggregation uses query builder, not Eloquent
- [ ] Database-specific features use raw SQL where query builder can't express
- [ ] No Eloquent hydration for result sets > 10K rows where model features aren't used
- [ ] Appropriate query layer chosen (Eloquent vs query builder vs raw SQL)
- [ ] Memory usage significantly reduced for large result sets
- [ ] Database-specific features accessible when needed

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
- [ ] Using Eloquent for everything**: `Order::all()->groupBy('status')->map(fn($g) => $g->sum('total'))` — hydrates all models, groups in PHP. Use query builder aggregation. prevented

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
