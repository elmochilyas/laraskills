# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.2 Laravel read/write configuration (config/database.php read/write arrays)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Simple replica config applied
- [ ] Database URL with replicas applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No read host fallback**: If all read hosts fail, Laravel does not fall back to write host for reads. Implement fallback logic or use a proxy. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Reads route to replicas, writes to primary
- [ ] Sticky writes prevent stale reads within same request
- [ ] Zero writes accidentally sent to replicas

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Simple replica config applied
- [ ] Database URL with replicas applied
- [ ] Always Monitor Replica Lag followed
- [ ] Configure `config/database.php` connection with `read` and `write` arrays: completed
- [ ] Laravel routes: SELECT, SHOW, DESCRIBE, EXPLAIN → read hosts completed
- [ ] Laravel routes: INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write hosts completed
- [ ] Enable `sticky` option: after write, subsequent reads use write connection (prevents stale reads) completed
- [ ] Test routing: verify SELECTs go to replica, writes go to primary completed

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

- [ ] No read host fallback**: If all read hosts fail, Laravel does not fall back to write host for reads. Implement fallback logic or use a proxy. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SELECT queries route to replica(s)
- [ ] INSERT/UPDATE/DELETE queries route to primary
- [ ] Sticky writes work correctly (after write, reads use primary)
- [ ] Read replica failure doesn't cause errors (fallback to primary)
- [ ] `DB::statement()` routes to write connection
- [ ] Reads route to replicas, writes to primary
- [ ] Sticky writes prevent stale reads within same request
- [ ] Zero writes accidentally sent to replicas

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
- [ ] Sticky writes disabled â€” stale read after write prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No read host fallback**: If all read hosts fail, Laravel does not fall back to write host for reads. Implement fallback logic or use a proxy. prevented

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
