# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** Connection Pool Sizing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Connection pool size = 2-3x database vCPUs
- [ ] Connection utilization monitored (alarm at 80%)
- [ ] Pooler configured (RDS Proxy for Aurora, PgBouncer for PostgreSQL)
- [ ] IAM auth enabled for RDS Proxy
- [ ] Separate read/write pools if applicable
- [ ] Set pool size to 2-3x database vCPUs applied
- [ ] Monitor connection utilization applied
- [ ] Right-size pool based on connection duration applied
- [ ] Set Pool Size to 2-3x Database vCPUs followed
- [ ] Monitor Connection Utilization with Alarm at 80% followed
- [ ] Use Separate Pools for Read vs Write Connections followed
- [ ] No pooler with many workers prevented
- [ ] Same pool size for all connections prevented
- [ ] Over-sized pool prevented
- [ ] No pool size monitoring prevented

---

# Architecture Checklist

- [ ] Architecture guideline: RDS Proxy
- [ ] Architecture guideline: PgBouncer
- [ ] Architecture guideline: Pooler on same AZ as application (cross-AZ latency adds 1-5ms)
- [ ] Architecture guideline: Configure pool_timeout = 5s (request waits 5s before failing with timeout)
- [ ] Architecture guideline: Set server_idle_timeout = 300s (close idle server connections after 5 minutes)
- [ ] Architecture guideline: Use connection pooler with both read and write replicas
- [ ] Set Pool Size to 2-3x Database vCPUs followed
- [ ] Monitor Connection Utilization with Alarm at 80% followed
- [ ] Use Separate Pools for Read vs Write Connections followed
- [ ] Avoid Connection Leaks Ã¢â‚¬â€ Use PHP-FPM max_requests as Safety Net followed
- [ ] Right-Size Pool Based on Connection Duration Ã¢â‚¬â€ Short vs Long Transactions followed

---

# Implementation Checklist

- [ ] Best practice applied: Set pool size to 2-3x database vCPUs
- [ ] Best practice applied: Monitor connection utilization
- [ ] Best practice applied: Right-size pool based on connection duration
- [ ] Best practice applied: Use separate pools for read vs write
- [ ] Best practice applied: Avoid connection leaks
- [ ] Set Pool Size to 2-3x Database vCPUs followed
- [ ] Monitor Connection Utilization with Alarm at 80% followed
- [ ] Use Separate Pools for Read vs Write Connections followed
- [ ] Avoid Connection Leaks Ã¢â‚¬â€ Use PHP-FPM max_requests as Safety Net followed
- [ ] Right-Size Pool Based on Connection Duration Ã¢â‚¬â€ Short vs Long Transactions followed
- [ ] Workflow step completed: Inventory current Connection Pool Sizing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Pooler overhead
- [ ] Connection creation time saved
- [ ] Pool exhaustion timeout
- [ ] Long transactions reduce effective multiplexing (connection held for entire transaction)
- [ ] Prepared statements with PgBouncer transaction pooling

---

# Security Checklist

- [ ] RDS Proxy IAM authentication
- [ ] PgBouncer auth
- [ ] TLS encryption
- [ ] Network ACL
- [ ] Audit pooler logs for connection attempts (anomaly detection)

---

# Reliability Checklist

- [ ] Mistake prevented: Over-sized pool
- [ ] Mistake prevented: No pool size monitoring
- [ ] Mistake prevented: Using RDS Proxy without IAM auth

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Connection pool size = 2-3x database vCPUs
- [ ] Connection utilization monitored (alarm at 80%)
- [ ] Pooler configured (RDS Proxy for Aurora, PgBouncer for PostgreSQL)
- [ ] IAM auth enabled for RDS Proxy
- [ ] Separate read/write pools if applicable
- [ ] pool_timeout configured (5s)
- [ ] No connection leaks observed

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Connection Pool Sizing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Set Pool Size to 2-3x Database vCPUs followed
- [ ] Monitor Connection Utilization with Alarm at 80% followed
- [ ] Use Separate Pools for Read vs Write Connections followed
- [ ] Avoid Connection Leaks Ã¢â‚¬â€ Use PHP-FPM max_requests as Safety Net followed
- [ ] Right-Size Pool Based on Connection Duration Ã¢â‚¬â€ Short vs Long Transactions followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No pooler with many workers
- [ ] Anti-pattern prevented: Same pool size for all connections
- [ ] Anti-pattern prevented: Unlimited pool size
- [ ] Common mistake prevented: Over-sized pool
- [ ] Common mistake prevented: No pool size monitoring
- [ ] Common mistake prevented: Using RDS Proxy without IAM auth

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Connection pool size = 2-3x database vCPUs
- [ ] Verification passed: Connection utilization monitored (alarm at 80%)
- [ ] Verification passed: Pooler configured (RDS Proxy for Aurora, PgBouncer for PostgreSQL)

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
