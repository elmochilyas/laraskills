# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.4 Laravel Octane connection pool configuration (min/max connections)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always configure pool applied
- [ ] Set min to expected baseline concurrency applied
- [ ] Set max to peak concurrency + buffer applied
- [ ] Separate pool configs for read and write connections applied
- [ ] Consider total connections across all workers applied
- [ ] `pool` config array exists in all database connections used by Octane
- [ ] `pool.min` <= `pool.max` for all connections
- [ ] Total potential connections (workers × pool.max) < database `max_connections`
- [ ] No connection wait times in Octane dashboard during peak load
- [ ] Read and write connections have separate pool configurations
- [ ] No pool config in Octane prevented
- [ ] pool.max too high prevented
- [ ] pool.min = pool.max prevented
- [ ] Same pool config for all connections prevented
- [ ] Not monitoring pool utilization prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Pool config exists and is sized correctly for traffic
- [ ] No connection exhaustion under peak load
- [ ] Read and write pools have independent sizing

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always configure pool applied
- [ ] Set min to expected baseline concurrency applied
- [ ] Set max to peak concurrency + buffer applied
- [ ] Separate pool configs for read and write connections applied
- [ ] Consider total connections across all workers applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Add pool config to each database connection in `config/database.php`: completed
- [ ] Size pool.min to baseline concurrency per worker: completed
- [ ] Size pool.max to peak concurrency per worker + buffer: completed
- [ ] Calculate total potential connections: `workers × pool.max` completed
- [ ] Separate pool configs for read vs write connections: completed

---

# Performance Checklist

- [ ] Performance: Pool hit (connection from pool): ~0.01ms overhead
- [ ] Performance: Pool miss (create new connection): ~1–50ms depending on network and SSL
- [ ] Performance: Without pool config: every request pays connection overhead
- [ ] Performance: Total DB connections = workers × pool.max. For 16 workers × pool.max=8 = 128 connections.
- [ ] Performance: `pool.ttl` = 60s default. Adjust lower for dynamic environments (auto-scaling) or higher for stable workloads.

---

# Security Checklist

- [ ] Security: Each connection in the pool holds database credentials in memory. If a worker is compromised, all pooled connections are exposed. Minimize pool size.
- [ ] Security: Rotate credentials: after credential rotation, force pool refresh by restarting Octane workers or using `DB::purge` + reconnect logic.
- [ ] Security: The pool does not encrypt connections — configure TLS at the database driver level.

---

# Reliability Checklist

- [ ] No pool config in Octane prevented
- [ ] pool.max too high prevented
- [ ] pool.min = pool.max prevented
- [ ] Same pool config for all connections prevented
- [ ] Not monitoring pool utilization prevented

---

# Testing Checklist

- [ ] `pool` config array exists in all database connections used by Octane
- [ ] `pool.min` <= `pool.max` for all connections
- [ ] Total potential connections (workers × pool.max) < database `max_connections`
- [ ] No connection wait times in Octane dashboard during peak load
- [ ] Read and write connections have separate pool configurations
- [ ] `pool` config array exists in all database connections used by Octane
- [ ] `pool.min` <= `pool.max` for all connections
- [ ] Total potential connections (workers × pool.max) < database `max_connections`
- [ ] No connection wait times in Octane dashboard during peak load
- [ ] Read and write connections have separate pool configurations
- [ ] Pool config exists and is sized correctly for traffic
- [ ] No connection exhaustion under peak load
- [ ] Read and write pools have independent sizing
- [ ] Pool utilization stays below 80%

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] pool.max = 1 for all workers prevented
- [ ] No pool config â€” every request creates a new connection (no pooling benefit) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] No pool config at all prevented
- [ ] No pool config in Octane prevented
- [ ] pool.max too high prevented
- [ ] pool.min = pool.max prevented
- [ ] Same pool config for all connections prevented
- [ ] Not monitoring pool utilization prevented

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
