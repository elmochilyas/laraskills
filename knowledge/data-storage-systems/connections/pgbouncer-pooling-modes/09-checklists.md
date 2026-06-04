# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.3 PgBouncer pooling modes (session, transaction, statement)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use transaction mode + `PDO::ATTR_EMULATE_PREPARES = true` applied
- [ ] Dedicated session-mode port for admin tools applied
- [ ] Connection init queries applied
- [ ] Monitor pool mode metrics applied
- [ ] PgBouncer is in transaction mode for application pool
- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in database config
- [ ] No "prepared statement already exists" or "lost connection" errors in logs
- [ ] Pool mode is verified via `SHOW POOLS` in PgBouncer admin console
- [ ] Admin tools use a separate session-mode port
- [ ] Transaction pooling without emulate prepares prevented
- [ ] Session pooling for web app prevented
- [ ] SET commands in middleware with transaction pooling prevented
- [ ] No `DISCARD ALL` on connection return prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] PgBouncer in transaction mode
- [ ] No prepared statement errors
- [ ] Pool utilization efficient (50 backend serving 200+ workers)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use transaction mode + `PDO::ATTR_EMULATE_PREPARES = true` applied
- [ ] Dedicated session-mode port for admin tools applied
- [ ] Connection init queries applied
- [ ] Monitor pool mode metrics applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Install PgBouncer on the database server or a dedicated instance completed
- [ ] Configure PgBouncer for dual-mode (transaction for app, session for admin): completed
- [ ] Enable `PDO::ATTR_EMULATE_PREPARES` in Laravel config: completed
- [ ] Remove any middleware or code that sets session-level variables (timezone, search_path) completed
- [ ] For admin tools, use the session-mode port (7432) for `psql` or admin panels completed

---

# Performance Checklist

- [ ] Performance: Transaction mode: ~5–10× multiplexing ratio (50 backend connections serve 250–500 clients). Best for web workloads.
- [ ] Performance: Session mode: ~1× multiplexing (virtually no sharing for web). Acceptable for low-traffic admin tools.
- [ ] Performance: Each backend connection consumes ~2–10MB on PostgreSQL. Session mode with 200 clients = 0.4–2GB RAM on DB.
- [ ] Performance: Transaction mode with 50 connections = 0.1–0.5GB RAM on DB.
- [ ] Performance: PgBouncer itself uses very little CPU/memory (~2MB per instance). The bottleneck is database-side connection memory.

---

# Security Checklist

- [ ] Security: PgBouncer supports `auth_type = scram-sha-256` (recommended), `md5`, `cert`, `trust`, `hba`, `any`.
- [ ] Security: With transaction pooling, `SET SESSION AUTHORIZATION` is lost between transactions — use connection-level auth instead.
- [ ] Security: Log all failed authentication attempts on PgBouncer.
- [ ] Security: PgBouncer does not encrypt connections by default — configure `client_tls_sslmode = require` for app-to-pooler encryption.

---

# Reliability Checklist

- [ ] Transaction pooling without emulate prepares prevented
- [ ] Session pooling for web app prevented
- [ ] SET commands in middleware with transaction pooling prevented
- [ ] No `DISCARD ALL` on connection return prevented

---

# Testing Checklist

- [ ] PgBouncer is in transaction mode for application pool
- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in database config
- [ ] No "prepared statement already exists" or "lost connection" errors in logs
- [ ] Pool mode is verified via `SHOW POOLS` in PgBouncer admin console
- [ ] Admin tools use a separate session-mode port
- [ ] PgBouncer in transaction mode for app pool
- [ ] `PDO::ATTR_EMULATE_PREPARES = true` in database config
- [ ] No prepared statement errors in logs
- [ ] `server_reset_query = DISCARD ALL` configured
- [ ] Admin tools use separate session-mode port
- [ ] PgBouncer in transaction mode
- [ ] No prepared statement errors
- [ ] Pool utilization efficient (50 backend serving 200+ workers)
- [ ] Admin tools work via session-mode port
- [ ] DISCARD ALL prevents state leaks

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Ignoring transaction pooling limitations prevented
- [ ] Transaction pooling without emulate prepares â€” "prepared statement already exists" errors prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Single pool mode for all use cases prevented
- [ ] Transaction pooling without emulate prepares prevented
- [ ] Session pooling for web app prevented
- [ ] SET commands in middleware with transaction pooling prevented
- [ ] No `DISCARD ALL` on connection return prevented

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
