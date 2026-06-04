# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.14 Connection health checks (hearbeat queries, idle connection timeout)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Let the pooler handle health checks applied
- [ ] For Octane without a pooler, rely on the built-in health check applied
- [ ] Set PDO::ATTR_TIMEOUT for health check queries applied
- [ ] Distinguish between connection drop and backend failure applied
- [ ] Monitor health check failure rate applied
- [ ] Pooler-level health checks are configured (PgBouncer `server_check_query`, ProxySQL monitor)
- [ ] PDO timeout is set to 2–3 seconds for connection-level timeout
- [ ] Octane's pool health check is active (automatic — verify pool config exists)
- [ ] Health check failure rate is monitored with alerts
- [ ] Stale connections are detected and recreated before they cause application errors
- [ ] No health check on Octane pool prevented
- [ ] Manual SELECT 1 on every query in PHP-FPM prevented
- [ ] Health check timeout too high prevented
- [ ] Not handling health check exception prevented
- [ ] No health check monitoring prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Pooler-level health checks detect dead backends automatically
- [ ] Octane pool health checks active (via pool config)
- [ ] Stale connections are detected and recreated proactively

---

# Architecture Checklist

- [ ] PgBouncer
- [ ] ProxySQL
- [ ] Octane
- [ ] PHP-FPM without pooler
- [ ] Horizon workers

---

# Implementation Checklist

- [ ] Let the pooler handle health checks applied
- [ ] For Octane without a pooler, rely on the built-in health check applied
- [ ] Set PDO::ATTR_TIMEOUT for health check queries applied
- [ ] Distinguish between connection drop and backend failure applied
- [ ] Monitor health check failure rate applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Configure pooler-level health checks: completed
- [ ] For Octane without pooler, rely on built-in pool health checks: completed
- [ ] Set PDO timeout for fast failure detection: completed
- [ ] Implement manual health check with reconnect (if no pooler): completed
- [ ] Distinguish between connection drop and backend failure: completed

---

# Performance Checklist

- [ ] Performance: Health check query (`SELECT 1`) takes ~0.1ms on the database server. At 1000 req/s, that's 100ms/s of DB time — negligible.
- [ ] Performance: Heartbeat queries on every pool checkout add overhead proportional to pool checkout frequency.
- [ ] Performance: Pooler-level health checks (PgBouncer, ProxySQL) are more efficient than application-level checks because the pooler batches checks and uses lightw...
- [ ] Performance: Octane's built-in health check adds no configurable overhead — it's part of the pool implementation.
- [ ] Performance: Aggressive health checks (checking every 1 second) add unnecessary load. Every 30–60 seconds is sufficient for most environments.

---

# Security Checklist

- [ ] Security: Health check queries touch the database — ensure the application user has `EXECUTE` on `SELECT 1` (always true).
- [ ] Security: Health checks should not log connection parameters or credentials if they fail.
- [ ] Security: Monitor health check failures as a security signal — a sudden spike may indicate a network-level attack or database compromise.
- [ ] Security: Health checks from monitoring tools should use a read-only connection, not the application connection.

---

# Reliability Checklist

- [ ] No health check on Octane pool prevented
- [ ] Manual SELECT 1 on every query in PHP-FPM prevented
- [ ] Health check timeout too high prevented
- [ ] Not handling health check exception prevented
- [ ] No health check monitoring prevented

---

# Testing Checklist

- [ ] Pooler-level health checks are configured (PgBouncer `server_check_query`, ProxySQL monitor)
- [ ] PDO timeout is set to 2–3 seconds for connection-level timeout
- [ ] Octane's pool health check is active (automatic — verify pool config exists)
- [ ] Health check failure rate is monitored with alerts
- [ ] Stale connections are detected and recreated before they cause application errors
- [ ] Pooler-level health checks configured
- [ ] PDO timeout set to 2–3 seconds
- [ ] Octane pool config exists (built-in health check active)
- [ ] Health check failure rate monitored with alerts
- [ ] Stale connections detected and recreated before causing errors
- [ ] Pooler-level health checks detect dead backends automatically
- [ ] Octane pool health checks active (via pool config)
- [ ] Stale connections are detected and recreated proactively
- [ ] No connection failures reach application users
- [ ] Health check failure rate is monitored and alerted

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] SELECT 1 on every database query prevented
- [ ] No health check on Octane pool â€” stale connection may be returned prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Health checks that modify data prevented
- [ ] No health check on Octane pool prevented
- [ ] Manual SELECT 1 on every query in PHP-FPM prevented
- [ ] Health check timeout too high prevented
- [ ] Not handling health check exception prevented
- [ ] No health check monitoring prevented

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
