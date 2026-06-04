# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.1 Connection lifecycle (connect, query, disconnect, reconnect)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always configure connection pooling for PHP-FPM applied
- [ ] Use Octane's built-in pool for long-lived workers applied
- [ ] Monitor connection churn applied
- [ ] Avoid `PDO::ATTR_PERSISTENT` applied
- [ ] Pre-warm connections in Octane applied
- [ ] Application connects to database successfully
- [ ] Connection pooling is active (PgBouncer/ProxySQL/Octane pool)
- [ ] No connection errors in logs under load
- [ ] `max_connections` on database is not exceeded during traffic spikes
- [ ] Connections are properly tagged for observability
- [ ] No pool configured for PHP-FPM prevented
- [ ] Not purging after config change prevented
- [ ] Persistent connections with PDO::ATTR_PERSISTENT prevented
- [ ] No health check on reused connections prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Pooling configured for runtime type
- [ ] No connection exhaustion under peak load
- [ ] Health checks detect and recycle stale connections

---

# Architecture Checklist

- [ ] PHP-FPM architecture
- [ ] Octane architecture
- [ ] Swoole architecture

---

# Implementation Checklist

- [ ] Always configure connection pooling for PHP-FPM applied
- [ ] Use Octane's built-in pool for long-lived workers applied
- [ ] Monitor connection churn applied
- [ ] Avoid `PDO::ATTR_PERSISTENT` applied
- [ ] Pre-warm connections in Octane applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Understand your runtime's connection model: completed
- [ ] Configure pooling based on runtime: completed
- [ ] Monitor connection health: completed
- [ ] Handle credential rotation without restart: completed
- [ ] Avoid `PDO::ATTR_PERSISTENT` — use a proper pooler instead completed

---

# Performance Checklist

- [ ] Performance: Connect/disconnect overhead: 50–200ms per request without pooling. Pooling reduces this to microseconds.
- [ ] Performance: Each database connection consumes 2–10MB of RAM (on the database server). 500 connections = 1–5GB RAM.
- [ ] Performance: SSL handshake adds 10–50ms to initial connection time but has negligible per-query impact after handshake.
- [ ] Performance: Connection storms (many workers connecting simultaneously after deploy) can overwhelm the database's connection handler. Pooling absorbs this burst.
- [ ] Performance: Pool sizing formula: Pool = (PHP-FPM workers × connections per worker) / multiplexing ratio. With PgBouncer transaction mode, 50 connections may se...

---

# Security Checklist

- [ ] Security: Connections should use TLS/SSL for encryption in transit, especially when crossing network boundaries.
- [ ] Security: Connection credentials must be managed via environment variables or secret managers, never hardcoded.
- [ ] Security: After credential rotation, purge and reconnect (`DB::purge`, `DB::reconnect`) without application restart.
- [ ] Security: Monitor for unexpected connection attempts via database audit logs.

---

# Reliability Checklist

- [ ] No pool configured for PHP-FPM prevented
- [ ] Not purging after config change prevented
- [ ] Persistent connections with PDO::ATTR_PERSISTENT prevented
- [ ] No health check on reused connections prevented

---

# Testing Checklist

- [ ] Application connects to database successfully
- [ ] Connection pooling is active (PgBouncer/ProxySQL/Octane pool)
- [ ] No connection errors in logs under load
- [ ] `max_connections` on database is not exceeded during traffic spikes
- [ ] Connections are properly tagged for observability
- [ ] Connection pooling configured for the runtime
- [ ] PHP-FPM: PgBouncer or ProxySQL deployed
- [ ] Octane: `pool` config present
- [ ] No "max_connections" errors under load
- [ ] Connection health checks configured
- [ ] Pooling configured for runtime type
- [ ] No connection exhaustion under peak load
- [ ] Health checks detect and recycle stale connections
- [ ] Credential rotation works without restart

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Connection-per-request without pool prevented
- [ ] PHP-FPM without pooler â€” 200 workers = 200 connections prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Using Eloquent models inside migrations prevented
- [ ] No pool configured for PHP-FPM prevented
- [ ] Not purging after config change prevented
- [ ] Persistent connections with PDO::ATTR_PERSISTENT prevented
- [ ] No health check on reused connections prevented

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
