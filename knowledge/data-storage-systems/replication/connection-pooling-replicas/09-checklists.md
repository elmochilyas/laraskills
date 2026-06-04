# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.8 Connection pooling for replicas (max connections per replica)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] ProxySQL connection pool applied
- [ ] Octane connection pool applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No connection pooling for high-traffic apps**: 200 workers × 3 replicas = 600 connections. Each replica's `max_connections` may be 150. Connection pooling reduces to 150 total shared connections. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Peak connection count per replica ≤ 80% of `max_connections`
- [ ] Zero connection timeout errors during traffic spikes
- [ ] Pool queue wait < 10ms at peak

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] ProxySQL connection pool applied
- [ ] Octane connection pool applied
- [ ] Always Monitor Replica Lag followed
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Determine total potential connections: workers × replicas (e.g., 200 × 3 = 600) completed
- [ ] Compare against replica `max_connections` (e.g., 150 per replica) completed
- [ ] Choose pooler: ProxySQL (MySQL), pgbouncer (PostgreSQL), Octane pool (Laravel) completed
- [ ] Configure pool size: `max_connections` per replica minus headroom completed
- [ ] Point Laravel read connections at pooler address instead of direct replica completed

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

- [ ] No connection pooling for high-traffic apps**: 200 workers × 3 replicas = 600 connections. Each replica's `max_connections` may be 150. Connection pooling reduces to 150 total shared connections. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Connection count to replicas stays well below `max_connections`
- [ ] No connection errors during traffic spikes
- [ ] Pool utilization is between 60-80% at peak
- [ ] Queue wait times are within acceptable latency budget
- [ ] Application functions correctly under chosen pooling mode
- [ ] Peak connection count per replica ≤ 80% of `max_connections`
- [ ] Zero connection timeout errors during traffic spikes
- [ ] Pool queue wait < 10ms at peak
- [ ] Application passes full functional test suite under chosen mode
- [ ] Connection utilization improved by at least 5x

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
- [ ] Queue wait grows unbounded: pool size too small for peak concurrency prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No connection pooling for high-traffic apps**: 200 workers × 3 replicas = 600 connections. Each replica's `max_connections` may be 150. Connection pooling reduces to 150 total shared connections. prevented

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
