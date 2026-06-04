# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.14 Unions (union, unionAll)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] OR optimization applied
- [ ] Cross-table search applied
- [ ] Use unionAll when possible applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using union when unionAll suffices**: The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`. prevented
- [ ] ORDER BY in individual queries**: ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] unionAll used by default, union only when deduplication is required
- [ ] Final ORDER BY on entire union result
- [ ] No ORDER BY in individual queries (unless with LIMIT)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] OR optimization applied
- [ ] Cross-table search applied
- [ ] Use unionAll when possible applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Build the first query: `$first = DB::table('users')->where('role', 'admin')` completed
- [ ] Add union: `$first->unionAll($second)` where $second is another query builder instance completed
- [ ] Apply final ORDER BY and LIMIT to the unioned result (not individual queries) completed
- [ ] Execute with `->get()`, `->paginate()`, or `->cursor()` completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using union when unionAll suffices**: The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`. prevented
- [ ] ORDER BY in individual queries**: ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] unionAll used when duplicates are acceptable (avoids sort+distinct overhead)
- [ ] No ORDER BY in individual queries unless combined with LIMIT
- [ ] Final ORDER BY applied to the entire union result
- [ ] All queries return the same number of columns with compatible types
- [ ] unionAll used by default, union only when deduplication is required
- [ ] Final ORDER BY on entire union result
- [ ] No ORDER BY in individual queries (unless with LIMIT)
- [ ] Column structure matches across all combined queries

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Using union when unionAll suffices prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using union when unionAll suffices**: The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`. prevented
- [ ] ORDER BY in individual queries**: ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY. prevented

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
