# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.10 Transaction pooling limitations (prepared statements, session state, SET commands)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Enable `PDO::ATTR_EMULATE_PREPARES = true` in database config applied
- [ ] Use `SET LOCAL` instead of `SET SESSION` inside transactions applied
- [ ] Move session-state logic to application layer applied
- [ ] Use `DISCARD ALL` on connection return applied
- [ ] Provide a session-mode port for admin tools applied
- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in all transaction-pooled connections
- [ ] `server_reset_query = DISCARD ALL` is configured in PgBouncer
- [ ] No `SET SESSION` commands are executed in application code (use `SET LOCAL` instead)
- [ ] No `LISTEN`/`NOTIFY` is used on transaction-pooled connections
- [ ] No temporary tables are created on transaction-pooled connections
- [ ] Transaction pooling without emulate prepares prevented
- [ ] SET SESSION commands in middleware prevented
- [ ] LISTEN/NOTIFY with transaction pooling prevented
- [ ] No server_reset_query prevented
- [ ] Temporary tables in transaction pooling prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Laravel works correctly with transaction pooling
- [ ] No prepared statement errors
- [ ] No session-state leakage between clients

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Enable `PDO::ATTR_EMULATE_PREPARES = true` in database config applied
- [ ] Use `SET LOCAL` instead of `SET SESSION` inside transactions applied
- [ ] Move session-state logic to application layer applied
- [ ] Use `DISCARD ALL` on connection return applied
- [ ] Provide a session-mode port for admin tools applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Enable `PDO::ATTR_EMULATE_PREPARES = true` in database config: completed
- [ ] Configure `server_reset_query = DISCARD ALL` in PgBouncer: completed
- [ ] Replace `SET SESSION` with `SET LOCAL` inside transactions: completed
- [ ] Move session-state logic to the application layer: completed
- [ ] Audit the application for incompatible features: completed

---

# Performance Checklist

- [ ] Performance: Transaction pooling maximizes connection multiplexing: 50 backend connections can serve 500+ client connections.
- [ ] Performance: Session pooling with 500 clients requires 500 backend connections — 10× the RAM on the database server.
- [ ] Performance: `PDO::ATTR_EMULATE_PREPARES` has negligible performance impact (<5% overhead) compared to real prepared statements for typical Laravel workloads.
- [ ] Performance: Transaction pooling reduces per-query overhead (no PREPARE → EXECUTE → DEALLOCATE cycle) since queries are sent directly as SQL.
- [ ] Performance: The tradeoff: maximum efficiency (transaction pooling) vs maximum compatibility (session pooling).

---

# Security Checklist

- [ ] Security: Connection state leakage: Without `DISCARD ALL`, SET variables or temporary objects created in one transaction may be visible to the next user on t...
- [ ] Security: Session pooling does not have this state leakage issue (the same client holds the connection for the entire session).
- [ ] Security: ProxySQL multiplexing without proper isolation can cause cross-tenant data exposure if session state is used.
- [ ] Security: Regular security audits should verify that `server_reset_query` is configured correctly.

---

# Reliability Checklist

- [ ] Transaction pooling without emulate prepares prevented
- [ ] SET SESSION commands in middleware prevented
- [ ] LISTEN/NOTIFY with transaction pooling prevented
- [ ] No server_reset_query prevented
- [ ] Temporary tables in transaction pooling prevented

---

# Testing Checklist

- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in all transaction-pooled connections
- [ ] `server_reset_query = DISCARD ALL` is configured in PgBouncer
- [ ] No `SET SESSION` commands are executed in application code (use `SET LOCAL` instead)
- [ ] No `LISTEN`/`NOTIFY` is used on transaction-pooled connections
- [ ] No temporary tables are created on transaction-pooled connections
- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in all transaction-pooled connections
- [ ] `server_reset_query = DISCARD ALL` is configured in PgBouncer
- [ ] No `SET SESSION` commands executed in application code
- [ ] No `LISTEN`/`NOTIFY` used on transaction-pooled connections
- [ ] No temporary tables created on transaction-pooled connections
- [ ] Laravel works correctly with transaction pooling
- [ ] No prepared statement errors
- [ ] No session-state leakage between clients
- [ ] Admin tools use session-mode port
- [ ] DISCARD ALL properly resets all connection state

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Blindly enabling transaction pooling without application audit prevented
- [ ] Transaction pooling without emulate prepares â€” "prepared statement already exists" errors prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] "It works in dev" syndrome prevented
- [ ] Transaction pooling without emulate prepares prevented
- [ ] SET SESSION commands in middleware prevented
- [ ] LISTEN/NOTIFY with transaction pooling prevented
- [ ] No server_reset_query prevented
- [ ] Temporary tables in transaction pooling prevented

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
