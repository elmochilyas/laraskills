# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.13 Tenant connection caching and pooling
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] ProxySQL connection routing applied
- [ ] Octane connection reuse applied
- [ ] Read/write split pooling applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Creating connection per request without pooling**: 1000 tenants × 10 PHP-FPM workers = 10,000 connections. Pooling reduces this to N tenants × 1-2 connections. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Connection pool utilization > 70% under load
- [ ] Zero connection exhaustion errors in production
- [ ] Connection caching reduces per-request overhead to < 1ms

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] ProxySQL connection routing applied
- [ ] Octane connection reuse applied
- [ ] Read/write split pooling applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] For PHP-FPM: deploy PgBouncer (PostgreSQL) or ProxySQL (MySQL) as server-side pooler completed
- [ ] Configure pooler with max backend connections = expected concurrent queries × 1.5 completed
- [ ] For Octane: configure `pool.min` and `pool.max` per tenant connection completed
- [ ] Implement connection factory caching: cache resolved PDO instance keyed by tenant ID completed
- [ ] Flush connection cache when credentials rotate completed

---

# Performance Checklist

- [ ] Performance: Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Creating connection per request without pooling**: 1000 tenants × 10 PHP-FPM workers = 10,000 connections. Pooling reduces this to N tenants × 1-2 connections. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Connection pooler deployed and configured
- [ ] Connection count stays below database `max_connections`
- [ ] No connection timeout errors under peak load
- [ ] Connection caching reduces per-request connection overhead
- [ ] Pool config present on all tenant connections
- [ ] Connection pool utilization > 70% under load
- [ ] Zero connection exhaustion errors in production
- [ ] Connection caching reduces per-request overhead to < 1ms
- [ ] Zero connection handshake overhead after pool pre-warming
- [ ] No connection exhaustion under peak load

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Pooler not configured for PHP-FPM â€” each worker opens a new connection prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Creating connection per request without pooling**: 1000 tenants × 10 PHP-FPM workers = 10,000 connections. Pooling reduces this to N tenants × 1-2 connections. prevented

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
