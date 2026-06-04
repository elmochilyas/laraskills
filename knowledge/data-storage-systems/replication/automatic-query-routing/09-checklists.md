# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.3 Automatic query routing (how Laravel determines read/write queries)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Explicit read connection applied
- [ ] Transaction scoping applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assumption that SELECT routes to read replica**: `DB::statement('SELECT ...')` goes to write. Use `DB::select()` for read routing. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] All SELECT queries route to read connection
- [ ] All write queries route to write connection
- [ ] Zero misrouted queries

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Explicit read connection applied
- [ ] Transaction scoping applied
- [ ] Always Monitor Replica Lag followed
- [ ] Understand Laravel's automatic routing: completed
- [ ] For Eloquent: routing is automatic via the query builder completed
- [ ] For raw queries: use `DB::select()` for reads, `DB::insert/update/delete/statement()` for writes completed
- [ ] For stored procedures: use `DB::statement()` (routes to write) completed
- [ ] Test routing: enable query log and verify correct connection usage completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Assumption that SELECT routes to read replica**: `DB::statement('SELECT ...')` goes to write. Use `DB::select()` for read routing. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SELECT queries route to read connection
- [ ] INSERT/UPDATE/DELETE route to write connection
- [ ] `DB::statement()` routes to write connection
- [ ] Transaction scoping uses write connection for all queries
- [ ] `DB::select()` routes to read connection
- [ ] All SELECT queries route to read connection
- [ ] All write queries route to write connection
- [ ] Zero misrouted queries

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] `DB::statement('SELECT ...')` routes to write connection (use DB::select) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assumption that SELECT routes to read replica**: `DB::statement('SELECT ...')` goes to write. Use `DB::select()` for read routing. prevented

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
