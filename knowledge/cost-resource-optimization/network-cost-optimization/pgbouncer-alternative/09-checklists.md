# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** PgBouncer Alternative
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use transaction mode for most Laravel workloads applied
- [ ] Set default_pool_size to 2-3x CPU cores applied
- [ ] Run PgBouncer on the database server or dedicated tiny EC2 applied
- [ ] Use PgBouncer for PostgreSQL, Not for MySQL followed
- [ ] Use Transaction Mode for Most Laravel Workloads followed
- [ ] Run PgBouncer on t4g.nano ($5/Month) for Cost Optimization followed
- [ ] PgBouncer on the same server without resource limits prevented
- [ ] No auth_file configured prevented
- [ ] Using transaction mode with session-dependent features prevented
- [ ] Pool size too small causing queueing prevented

---

# Architecture Checklist

- [ ] Architecture guideline: PgBouncer on EC2/ECS sidecar for stable Laravel deployments
- [ ] Architecture guideline: RDS Proxy for Lambda-backed, serverless, or IAM-auth-required applications
- [ ] Architecture guideline: For high-traffic (>1000 req/s), use RDS Proxy for managed scaling
- [ ] Architecture guideline: For cost-optimized, use PgBouncer on t4g.nano ($5/month)
- [ ] Architecture guideline: Configure `reserve_pool` for administrative connections (prevents pool exhaustion lockout)
- [ ] Architecture guideline: Use `server_idle_timeout = 300` seconds to release idle connections
- [ ] Use PgBouncer for PostgreSQL, Not for MySQL followed
- [ ] Use Transaction Mode for Most Laravel Workloads followed
- [ ] Run PgBouncer on t4g.nano ($5/Month) for Cost Optimization followed
- [ ] Configure reserve_pool to Prevent Pool Exhaustion Lockout followed
- [ ] Monitor PgBouncer Metrics Ã¢â‚¬â€ avg_wait_time, maxwait, Server Establishes followed

---

# Implementation Checklist

- [ ] Best practice applied: Use transaction mode for most Laravel workloads
- [ ] Best practice applied: Set default_pool_size to 2-3x CPU cores
- [ ] Best practice applied: Run PgBouncer on the database server or dedicated tiny EC2
- [ ] Best practice applied: Use session mode for apps with prepared statements
- [ ] Best practice applied: Monitor PgBouncer metrics
- [ ] Use PgBouncer for PostgreSQL, Not for MySQL followed
- [ ] Use Transaction Mode for Most Laravel Workloads followed
- [ ] Run PgBouncer on t4g.nano ($5/Month) for Cost Optimization followed
- [ ] Configure reserve_pool to Prevent Pool Exhaustion Lockout followed
- [ ] Monitor PgBouncer Metrics Ã¢â‚¬â€ avg_wait_time, maxwait, Server Establishes followed
- [ ] Workflow step completed: Inventory current Pgbouncer Alternative resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] PgBouncer adds <0.5ms latency per connection (negligible)
- [ ] Transaction mode
- [ ] Connection reuse eliminates SSL handshake per request (5-30ms savings)
- [ ] Each connection consumes ~2KB in PgBouncer memory; 1000 connections = 2MB
- [ ] Default pool of 20 connections handles 500+ concurrent Laravel workers

---

# Security Checklist

- [ ] PgBouncer `auth_file` should have permissions 0600
- [ ] Enable TLS in PgBouncer config for encrypted connections to database
- [ ] PgBouncer logs connection attempts; monitor for unusual patterns
- [ ] No IAM authentication support; use database passwords (store in Secrets Manager)
- [ ] Run PgBouncer in private subnet; restrict access via security groups

---

# Reliability Checklist

- [ ] Mistake prevented: Using transaction mode with session-dependent features
- [ ] Mistake prevented: Pool size too small causing queueing
- [ ] Mistake prevented: Not configuring reserve_pool
- [ ] Mistake prevented: Deploying without monitoring

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Pgbouncer Alternative configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use PgBouncer for PostgreSQL, Not for MySQL followed
- [ ] Use Transaction Mode for Most Laravel Workloads followed
- [ ] Run PgBouncer on t4g.nano ($5/Month) for Cost Optimization followed
- [ ] Configure reserve_pool to Prevent Pool Exhaustion Lockout followed
- [ ] Monitor PgBouncer Metrics Ã¢â‚¬â€ avg_wait_time, maxwait, Server Establishes followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: PgBouncer on the same server without resource limits
- [ ] Anti-pattern prevented: No auth_file configured
- [ ] Anti-pattern prevented: Using PgBouncer with MySQL
- [ ] Anti-pattern prevented: Not patching PgBouncer
- [ ] Common mistake prevented: Using transaction mode with session-dependent features
- [ ] Common mistake prevented: Pool size too small causing queueing
- [ ] Common mistake prevented: Not configuring reserve_pool
- [ ] Common mistake prevented: Deploying without monitoring

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
