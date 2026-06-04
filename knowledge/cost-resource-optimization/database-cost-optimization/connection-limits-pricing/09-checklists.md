# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Connection Limits Pricing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] max_connections calculated for instance size
- [ ] Connection pooler (RDS Proxy/PgBouncer) configured for >50 workers
- [ ] Connection utilization alarm at 80%
- [ ] Admin connections reserved (10-20% of max)
- [ ] Connection timeout configured in Laravel (5s)
- [ ] Calculate max_connections for your instance applied
- [ ] Use RDS Proxy for at-scale deployments applied
- [ ] Monitor connection usage with CloudWatch applied
- [ ] Setting max_connections to 10000 on small instance prevented
- [ ] No connection timeout prevented
- [ ] No connection limit planning prevented
- [ ] Upgrading instance solely for connections prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Choose instance with `max_connections` > 2x expected peak connections (without pooler)
- [ ] Architecture guideline: With RDS Proxy
- [ ] Architecture guideline: For Aurora Serverless v2
- [ ] Architecture guideline: For PostgreSQL
- [ ] Architecture guideline: Monitor at application level
- [ ] Architecture guideline: Set connection timeout in Laravel

---

# Implementation Checklist

- [ ] Best practice applied: Calculate max_connections for your instance
- [ ] Best practice applied: Use RDS Proxy for at-scale deployments
- [ ] Best practice applied: Monitor connection usage with CloudWatch
- [ ] Best practice applied: Right-size based on connection budget not just compute
- [ ] Best practice applied: Use connection pooler before upgrading instance
- [ ] Best practice applied: Set max_connections explicitly in parameter group
- [ ] Workflow step completed: Inventory current Connection Limits Pricing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Each open connection uses ~2-10MB memory (depending on configuration)
- [ ] Connection creation time
- [ ] MySQL max_connections includes replication connections (reserve 5% for replication)
- [ ] Too many connections > 200 on small instance causes context switching at database level
- [ ] Connection pooler memory overhead

---

# Security Checklist

- [ ] RDS Proxy IAM auth generates temporary credentials (more secure than stored passwords)
- [ ] PgBouncer auth_file should have restrictive permissions (0600)
- [ ] Monitor for connection flood attacks (rapid connection creation)
- [ ] Connection pooler logs connection attempts for audit trail
- [ ] Enable TLS for all database connections (including through pooler)

---

# Reliability Checklist

- [ ] Mistake prevented: No connection limit planning
- [ ] Mistake prevented: Upgrading instance solely for connections
- [ ] Mistake prevented: Not reserving connections for admin

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] max_connections calculated for instance size
- [ ] Connection pooler (RDS Proxy/PgBouncer) configured for >50 workers
- [ ] Connection utilization alarm at 80%
- [ ] Admin connections reserved (10-20% of max)
- [ ] Connection timeout configured in Laravel (5s)
- [ ] Connection pooler cost-benefit analyzed vs instance upgrade

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Connection Limits Pricing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Setting max_connections to 10000 on small instance
- [ ] Anti-pattern prevented: No connection timeout
- [ ] Anti-pattern prevented: Sharing max_connections budget across apps
- [ ] Anti-pattern prevented: Ignoring RDS Proxy cost
- [ ] Common mistake prevented: No connection limit planning
- [ ] Common mistake prevented: Upgrading instance solely for connections
- [ ] Common mistake prevented: Not reserving connections for admin

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: max_connections calculated for instance size
- [ ] Verification passed: Connection pooler (RDS Proxy/PgBouncer) configured for >50 workers
- [ ] Verification passed: Connection utilization alarm at 80%

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
