# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Database Connection Pool
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Connection pooler configured (RDS Proxy or PgBouncer)
- [ ] Pool size proportional to database vCPUs (2-3x)
- [ ] IAM auth enabled for RDS Proxy
- [ ] No session pooling issues (SET commands, temp tables) checked
- [ ] Pool utilization monitored (alarm at 80%)
- [ ] Use RDS Proxy for Aurora applied
- [ ] Use PgBouncer for PostgreSQL applied
- [ ] Set pool size to 2-3x database vCPUs applied
- [ ] No pooling with Octane prevented
- [ ] Pooler on database server prevented
- [ ] Not using connection pooling with PHP-FPM prevented
- [ ] Transaction pooling with session dependencies prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Place RDS Proxy/PgBouncer in same VPC as application and database
- [ ] Architecture guideline: RDS Proxy must be in same VPC as RDS instance
- [ ] Architecture guideline: PgBouncer can run on EC2 (t4g.micro, ~$8/month) or alongside database
- [ ] Architecture guideline: Set max_connections in Postgres higher than default (200-500) for pooler management
- [ ] Architecture guideline: Configure pool_timeout to prevent long queue waits (default 5s; apps retry connection)
- [ ] Architecture guideline: Use separate pool sizes for read vs write connections

---

# Implementation Checklist

- [ ] Best practice applied: Use RDS Proxy for Aurora
- [ ] Best practice applied: Use PgBouncer for PostgreSQL
- [ ] Best practice applied: Set pool size to 2-3x database vCPUs
- [ ] Best practice applied: Enable RDS Proxy IAM auth
- [ ] Best practice applied: Monitor connection pool utilization
- [ ] Workflow step completed: Inventory current Database Connection Pool resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] RDS Proxy adds <1ms latency per connection (negligible)
- [ ] PgBouncer transaction pooling adds ~0.1ms latency
- [ ] Connection creation avoided
- [ ] Pool exhaustion
- [ ] Octane with RDS Proxy

---

# Security Checklist

- [ ] RDS Proxy IAM auth requires TLS 1.2+ (enforced)
- [ ] PgBouncer should use TLS for client-to-pooler connections
- [ ] RDS Proxy automatically rotates credentials with IAM
- [ ] PgBouncer auth file should be restricted (600 permissions)
- [ ] RDS Proxy integrates with AWS Secrets Manager for password rotation

---

# Reliability Checklist

- [ ] Mistake prevented: Not using connection pooling with PHP-FPM
- [ ] Mistake prevented: Transaction pooling with session dependencies
- [ ] Mistake prevented: Overly large pool size

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Connection pooler configured (RDS Proxy or PgBouncer)
- [ ] Pool size proportional to database vCPUs (2-3x)
- [ ] IAM auth enabled for RDS Proxy
- [ ] No session pooling issues (SET commands, temp tables) checked
- [ ] Pool utilization monitored (alarm at 80%)
- [ ] Connection creation time reduced (trace before/after)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Database Connection Pool configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No pooling with Octane
- [ ] Anti-pattern prevented: Pooler on database server
- [ ] Anti-pattern prevented: No monitoring on pool
- [ ] Common mistake prevented: Not using connection pooling with PHP-FPM
- [ ] Common mistake prevented: Transaction pooling with session dependencies
- [ ] Common mistake prevented: Overly large pool size

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Connection pooler configured (RDS Proxy or PgBouncer)
- [ ] Verification passed: Pool size proportional to database vCPUs (2-3x)
- [ ] Verification passed: IAM auth enabled for RDS Proxy

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
