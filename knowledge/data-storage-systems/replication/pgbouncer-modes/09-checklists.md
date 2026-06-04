# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.18 PgBouncer modes (session, transaction, statement)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Transaction pooling for Laravel applied
- [ ] Session pooling for long-running queries applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Prepared statements with transaction pooling**: Prepared statements are session-level. Create on each connection — fails in transaction mode. `ATTR_EMULATE_PREPARES` solves this. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] PostgreSQL connection count reduced by 10x or more
- [ ] Application passes all functional tests with chosen pool mode
- [ ] Zero connection-related errors under peak load

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Transaction pooling for Laravel applied
- [ ] Session pooling for long-running queries applied
- [ ] Always Monitor Replica Lag followed
- [ ] Audit application for session-level SQL: `SET SESSION`, `SET LOCAL`, prepared statements, `LISTEN`/`NOTIFY`, temp tables, cursors completed
- [ ] If session-level features are required → session pooling (least efficient, one connection per client) completed
- [ ] If no session-level features → transaction pooling (recommended, efficient) completed
- [ ] Configure pgbouncer.ini: completed
- [ ] For Laravel: set `'options' => ['pdo_options' => [PDO::ATTR_EMULATE_PREPARES => true]]` for transaction pooling completed

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

- [ ] Prepared statements with transaction pooling**: Prepared statements are session-level. Create on each connection — fails in transaction mode. `ATTR_EMULATE_PREPARES` solves this. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Application functions correctly with chosen pool mode
- [ ] Prepared statements work (emulated or real) in transaction mode
- [ ] `LISTEN`/`NOTIFY` works (if used) — switch to session pooling if needed
- [ ] PostgreSQL connection count stays below `max_connections`
- [ ] No connection timeout errors under peak load
- [ ] PostgreSQL connection count reduced by 10x or more
- [ ] Application passes all functional tests with chosen pool mode
- [ ] Zero connection-related errors under peak load
- [ ] Application errors related to pooling reduced to zero
- [ ] Connection count stays within limits

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
- [ ] Prepared statements in transaction pooling: create on every connection â€” fails. Use `ATTR_EMULATE_PREPARES` prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Prepared statements with transaction pooling**: Prepared statements are session-level. Create on each connection — fails in transaction mode. `ATTR_EMULATE_PREPARES` solves this. prevented

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
