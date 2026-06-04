# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.7 Connection count management (max_connections, pool sizing, avoiding connection storms)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always reserve admin connections applied
- [ ] Calculate pool size from server memory applied
- [ ] Stagger worker startup applied
- [ ] Use pooler multiplexing to reduce connection count applied
- [ ] Monitor connection utilization, not just count applied
- [ ] Database `max_connections` is set based on available RAM calculation
- [ ] Reserved/superuser connections are configured
- [ ] Pooler is deployed if using PHP-FPM (or Octane pool is configured)
- [ ] Worker startup is staggered to prevent connection storms
- [ ] Total potential connections (workers × pool.max) < max_connections - reserved
- [ ] max_connections set too high prevented
- [ ] No reserved admin connections prevented
- [ ] Simultaneous worker startup prevented
- [ ] No pooler for PHP-FPM prevented
- [ ] Octane pool.max too high prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] max_connections correctly calculated from available RAM
- [ ] Admin reserved connections prevent lockout
- [ ] Pool sizing matches runtime and traffic profile

---

# Architecture Checklist

- [ ] PHP-FPM without pooler
- [ ] PHP-FPM with PgBouncer
- [ ] Octane without pooler
- [ ] Octane with PgBouncer
- [ ] Reserve 5–10 connections

---

# Implementation Checklist

- [ ] Always reserve admin connections applied
- [ ] Calculate pool size from server memory applied
- [ ] Stagger worker startup applied
- [ ] Use pooler multiplexing to reduce connection count applied
- [ ] Monitor connection utilization, not just count applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Calculate `max_connections` from available memory: completed
- [ ] Configure reserved admin connections: completed
- [ ] Calculate pool sizing based on runtime: completed
- [ ] Apply multiplexing ratio for pooler: completed
- [ ] Prevent connection storms during deployments: completed

---

# Performance Checklist

- [ ] Performance: Each connection consumes 2–10MB on the database server (depends on config: sort buffers, statement timeouts, etc.).
- [ ] Performance: More connections = more context switching on the database CPU. PostgreSQL is particularly sensitive to high connection counts (designed for few con...
- [ ] Performance: Connection pooling reduces database-side memory by 5–10× compared to direct connections.
- [ ] Performance: Setting `max_connections` too low causes `too many connections` errors. Setting it too high causes out-of-memory crashes.
- [ ] Performance: `pgbouncer.default_pool_size` should be sized for the P95 concurrent query count, not P99 or max.

---

# Security Checklist

- [ ] Security: `superuser_reserved_connections` prevents complete lockout but requires superuser credentials — protect them.
- [ ] Security: Connection storms can be caused by DDoS attacks. Rate-limit new connection attempts at the network level (load balancer, firewall).
- [ ] Security: Monitor for sudden connection spikes as a potential security incident indicator.
- [ ] Security: Each connection is an authentication event. High connection churn increases the surface area for credential-based attacks.

---

# Reliability Checklist

- [ ] max_connections set too high prevented
- [ ] No reserved admin connections prevented
- [ ] Simultaneous worker startup prevented
- [ ] No pooler for PHP-FPM prevented
- [ ] Octane pool.max too high prevented

---

# Testing Checklist

- [ ] Database `max_connections` is set based on available RAM calculation
- [ ] Reserved/superuser connections are configured
- [ ] Pooler is deployed if using PHP-FPM (or Octane pool is configured)
- [ ] Worker startup is staggered to prevent connection storms
- [ ] Total potential connections (workers × pool.max) < max_connections - reserved
- [ ] Database `max_connections` is set based on available RAM calculation
- [ ] Reserved/superuser connections are configured
- [ ] Pooler is deployed if using PHP-FPM (or Octane pool is configured)
- [ ] Worker startup is staggered
- [ ] Total potential connections < max_connections - reserved
- [ ] max_connections correctly calculated from available RAM
- [ ] Admin reserved connections prevent lockout
- [ ] Pool sizing matches runtime and traffic profile
- [ ] No connection storms during deployments
- [ ] Connection utilization monitored and alerted

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Connection counting without monitoring prevented
- [ ] max_connections set too high â€” OOM crash on DB server prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] `max_connections` as a scaling strategy prevented
- [ ] max_connections set too high prevented
- [ ] No reserved admin connections prevented
- [ ] Simultaneous worker startup prevented
- [ ] No pooler for PHP-FPM prevented
- [ ] Octane pool.max too high prevented

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
