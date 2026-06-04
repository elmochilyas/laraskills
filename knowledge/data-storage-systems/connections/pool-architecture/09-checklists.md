# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.2 Pool architecture (client-side vs server-side, ProxySQL, pgBouncer, RDS Proxy)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use server-side pool for PHP-FPM applied
- [ ] Use Octane built-in pool for Octane apps applied
- [ ] Right-size pool with formulas applied
- [ ] Separate read/write pools applied
- [ ] Monitor pool utilization applied
- [ ] Pooler is deployed and configured (server-side) or pool config present (Octane)
- [ ] Total backend connections ≤ database `max_connections` at peak load
- [ ] Pooler health checks pass
- [ ] No "max_connections" errors in application logs
- [ ] Pool utilization stays below 80% at peak traffic
- [ ] No pool at all in PHP-FPM prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for read and write prevented
- [ ] PgBouncer session mode for web prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Pool architecture matches runtime and traffic profile
- [ ] Pool size handles peak traffic without exhaustion
- [ ] Pool utilization stays below 80%

---

# Architecture Checklist

- [ ] Simple web app (1–5 PHP-FPM servers)
- [ ] Octane app (no legacy PHP-FPM)
- [ ] High-traffic MySQL app (10+ web servers)
- [ ] AWS RDS/Aurora
- [ ] Multi-tenant architecture

---

# Implementation Checklist

- [ ] Use server-side pool for PHP-FPM applied
- [ ] Use Octane built-in pool for Octane apps applied
- [ ] Right-size pool with formulas applied
- [ ] Separate read/write pools applied
- [ ] Monitor pool utilization applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Choose pool architecture based on runtime: completed
- [ ] For server-side pool (PHP-FPM): completed
- [ ] For client-side pool (Octane): completed
- [ ] Right-size pool using formulas: completed
- [ ] Monitor pool utilization: alert at >80% active connections completed

---

# Performance Checklist

- [ ] Performance: Pooling reduces per-request connection overhead from 1–2ms to microseconds after initial connection.
- [ ] Performance: Server-side pools add <1ms proxy latency per query (PgBouncer is extremely fast).
- [ ] Performance: Each backend connection uses DB memory: account for this in pool sizing.
- [ ] Performance: Transaction pooling maximizes multiplexing efficiency but breaks session state. Session pooling is safer but uses more backend connections.
- [ ] Performance: Optimal pool size per database core: `2 × core_count + spindle_count` (PostgreSQL rule of thumb).

---

# Security Checklist

- [ ] Security: Poolers add a network hop — ensure TLS between app and pooler and between pooler and database.
- [ ] Security: PgBouncer supports `auth_type = cert`, `md5`, `scram-sha-256`. Use SCRAM for PostgreSQL.
- [ ] Security: ProxySQL supports MySQL native password and TLS. Configure `mysql-have_ssl=true`.
- [ ] Security: RDS Proxy integrates with IAM — database credentials never reach the application.
- [ ] Security: Log all pooler authentication failures. Monitor for brute-force attempts.

---

# Reliability Checklist

- [ ] No pool at all in PHP-FPM prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for read and write prevented
- [ ] PgBouncer session mode for web prevented

---

# Testing Checklist

- [ ] Pooler is deployed and configured (server-side) or pool config present (Octane)
- [ ] Total backend connections ≤ database `max_connections` at peak load
- [ ] Pooler health checks pass
- [ ] No "max_connections" errors in application logs
- [ ] Pool utilization stays below 80% at peak traffic
- [ ] Pool architecture matches runtime
- [ ] PHP-FPM: server-side pooler deployed
- [ ] Octane: pool config present in database.php
- [ ] Pool size formula applied
- [ ] Read/write pools sized asymmetrically
- [ ] Pool architecture matches runtime and traffic profile
- [ ] Pool size handles peak traffic without exhaustion
- [ ] Pool utilization stays below 80%
- [ ] Pooler health checks pass

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Single huge pool for all environments prevented
- [ ] PHP-FPM without pooler â€” connection exhaustion prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Nested poolers prevented
- [ ] No pool at all in PHP-FPM prevented
- [ ] Octane without pool config prevented
- [ ] Same pool config for read and write prevented
- [ ] PgBouncer session mode for web prevented

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
