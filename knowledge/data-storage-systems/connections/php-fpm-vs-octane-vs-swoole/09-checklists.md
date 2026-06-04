# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.12 Connection behavior in PHP-FPM vs. Octane vs. Swoole
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] PHP-FPM must use a server-side pooler applied
- [ ] Octane must configure pool applied
- [ ] Match pool sizing to runtime applied
- [ ] Use server-side pooler with PHP-FPM + Octane mixed applied
- [ ] Swoole coroutine pool requires manual management applied
- [ ] PHP-FPM: PgBouncer or ProxySQL is deployed and configured
- [ ] Octane: `pool` config exists in all database connections
- [ ] Swoole: Coroutine-safe connection pool is implemented (Channel-based)
- [ ] Total connections formula matches the runtime (PHP-FPM: workers × 1, Octane: workers × pool.max, Swoole: pool.size)
- [ ] No connection exhaustion under peak load
- [ ] PHP-FPM without pooler prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for PHP-FPM and Octane prevented
- [ ] Swoole coroutine pool without Channel prevented
- [ ] PgBouncer deployed when only Octane is used prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Connection strategy matches runtime type
- [ ] Pool sizing formula correctly applied for runtime
- [ ] No connection exhaustion under peak load

---

# Architecture Checklist

- [ ] PHP-FPM only
- [ ] Octane only
- [ ] Swoole native
- [ ] Mixed PHP-FPM + Octane
- [ ] Multi-server Octane
- [ ] Octane + read replicas

---

# Implementation Checklist

- [ ] PHP-FPM must use a server-side pooler applied
- [ ] Octane must configure pool applied
- [ ] Match pool sizing to runtime applied
- [ ] Use server-side pooler with PHP-FPM + Octane mixed applied
- [ ] Swoole coroutine pool requires manual management applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Identify your runtime: completed
- [ ] Configure based on runtime: completed
- [ ] Match pool sizing formula to runtime: completed
- [ ] For mixed PHP-FPM + Octane, use a server-side pooler for both completed

---

# Performance Checklist

- [ ] Performance: PHP-FPM without pooler: 1–50ms connection overhead per request. 500 req/s = 0.5–25 seconds of connection time per second.
- [ ] Performance: PHP-FPM with PgBouncer: Connection overhead reduced to ~0.01ms (pool hit). Negligible per-request cost.
- [ ] Performance: Octane without pool config: Same as PHP-FPM (connection per request). With pool: ~0.01ms per request.
- [ ] Performance: Swoole coroutine pool: Most efficient — connections are shared across all coroutines, minimizing total connections.
- [ ] Performance: Memory per connection is the same regardless of runtime: ~2–10MB on the database server.

---

# Security Checklist

- [ ] Security: PHP-FPM: Connections are ephemeral — each request gets a fresh connection. No cross-request state leakage risk.
- [ ] Security: Octane: Connections persist across requests within the same worker. State (SET SESSION, temp tables) must be explicitly reset between requests.
- [ ] Security: Swoole: Same concern as Octane but amplified — coroutines share the pool concurrently. Connection state management is critical.
- [ ] Security: For all runtimes: Use connection tagging (`application_name`) to identify the runtime source in monitoring.

---

# Reliability Checklist

- [ ] PHP-FPM without pooler prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for PHP-FPM and Octane prevented
- [ ] Swoole coroutine pool without Channel prevented
- [ ] PgBouncer deployed when only Octane is used prevented

---

# Testing Checklist

- [ ] PHP-FPM: PgBouncer or ProxySQL is deployed and configured
- [ ] Octane: `pool` config exists in all database connections
- [ ] Swoole: Coroutine-safe connection pool is implemented (Channel-based)
- [ ] Total connections formula matches the runtime (PHP-FPM: workers × 1, Octane: workers × pool.max, Swoole: pool.size)
- [ ] No connection exhaustion under peak load
- [ ] PHP-FPM: PgBouncer or ProxySQL deployed
- [ ] Octane: `pool` config exists in all database connections
- [ ] Swoole: Coroutine-safe connection pool implemented (Channel-based)
- [ ] Total connections formula matches runtime
- [ ] No connection exhaustion under peak load
- [ ] Connection strategy matches runtime type
- [ ] Pool sizing formula correctly applied for runtime
- [ ] No connection exhaustion under peak load
- [ ] Migration from one runtime to another updates pooling strategy

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Migrating from PHP-FPM to Octane without pool review prevented
- [ ] PHP-FPM without pooler â€” 200 workers = 200 connections, exhaustion prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Swoole coroutines sharing a single PDO instance prevented
- [ ] PHP-FPM without pooler prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for PHP-FPM and Octane prevented
- [ ] Swoole coroutine pool without Channel prevented
- [ ] PgBouncer deployed when only Octane is used prevented

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
