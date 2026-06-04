# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.12 whereRaw and addBinding for raw expressions
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use whereRaw only when needed applied
- [ ] Always bind parameters applied
- [ ] addBinding for constructed queries applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] String interpolation in raw SQL**: `->whereRaw("status = '$status'")` — SQL injection vulnerability. Use `->whereRaw('status = ?', [$status])`. prevented
- [ ] Not using addBinding for constructed queries**: Building raw SQL with `implode()` and embedding values creates SQL injection vectors. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] All user input in raw expressions uses parameter binding
- [ ] No string interpolation in raw SQL anywhere in codebase
- [ ] addBinding correctly associates parameters with their clause type

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use whereRaw only when needed applied
- [ ] Always bind parameters applied
- [ ] addBinding for constructed queries applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Try query builder methods first — only use raw when necessary completed
- [ ] Write the SQL expression with `?` placeholders for values completed
- [ ] Pass values as the second argument: `whereRaw('MATCH(title) AGAINST(?)', [$search])` completed
- [ ] For constructed queries, use `addBinding($values, $type)` to attach parameters to specific clauses completed
- [ ] Never concatenate user input into raw SQL strings completed

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

- [ ] String interpolation in raw SQL**: `->whereRaw("status = '$status'")` — SQL injection vulnerability. Use `->whereRaw('status = ?', [$status])`. prevented
- [ ] Not using addBinding for constructed queries**: Building raw SQL with `implode()` and embedding values creates SQL injection vectors. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All user-influenced values use `?` placeholders, not string interpolation
- [ ] addBinding uses the correct clause type (where, join, having, order)
- [ ] Raw expressions cannot be replaced by query builder methods
- [ ] All user input in raw expressions uses parameter binding
- [ ] No string interpolation in raw SQL anywhere in codebase
- [ ] addBinding correctly associates parameters with their clause type
- [ ] Raw expressions are necessary (not replaceable by query builder)

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
- [ ] ### String interpolation in raw SQL prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] String interpolation in raw SQL**: `->whereRaw("status = '$status'")` — SQL injection vulnerability. Use `->whereRaw('status = ?', [$status])`. prevented
- [ ] Not using addBinding for constructed queries**: Building raw SQL with `implode()` and embedding values creates SQL injection vectors. prevented

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
