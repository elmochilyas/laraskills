# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Aurora Serverless v2 Pricing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Set minimum ACU to 4+ for production applied
- [ ] Use auto-pause (min=0 ACU) for all dev/test instances applied
- [ ] Evaluate I/O-Optimized when I/O charges exceed 25% of compute applied
- [ ] Min ACU = 0.5 in production prevented
- [ ] Serverless v2 + RDS Proxy without cost analysis prevented
- [ ] Setting min ACU to 0.5 for production prevented
- [ ] Not auto-pausing dev/test instances prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Provisioned + RI for steady workloads; Serverless v2 for variable
- [ ] Architecture guideline: Min ACU = working set size ÃƒÂ· 2GB (buffer pool size per ACU)
- [ ] Architecture guideline: Max ACU = peak traffic capacity + 20% headroom
- [ ] Architecture guideline: For RDS Proxy with Serverless v2
- [ ] Architecture guideline: Use Aurora Standard for dev/test; I/O-Optimized for production with high I/O
- [ ] Architecture guideline: Upgrade to Aurora Platform v4 for 28% cost reduction (immediate, free, no code changes)

---

# Implementation Checklist

- [ ] Best practice applied: Set minimum ACU to 4+ for production
- [ ] Best practice applied: Use auto-pause (min=0 ACU) for all dev/test instances
- [ ] Best practice applied: Evaluate I/O-Optimized when I/O charges exceed 25% of compute
- [ ] Best practice applied: Monitor ServerlessDatabaseCapacity and ACUUtilization metrics
- [ ] Best practice applied: Right-size min ACU by monitoring buffer pool hit ratio
- [ ] Workflow step completed: Inventory current Aurora Serverless V2 resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Scale-up
- [ ] Buffer pool hit ratio drops if min ACU is too low Ã¢â€ â€™ increased I/O charges
- [ ] No cold starts
- [ ] Connection pooling recommended (RDS Proxy or PgBouncer)
- [ ] Aurora v4

---

# Security Checklist

- [ ] Same encryption, IAM, and network security as provisioned Aurora
- [ ] IAM database authentication supported
- [ ] RDS Proxy for connection management with IAM auth
- [ ] Audit logs via Aurora Advanced Auditing
- [ ] Encryption at rest with AWS KMS (same as provisioned)

---

# Reliability Checklist

- [ ] Mistake prevented: Setting min ACU to 0.5 for production
- [ ] Mistake prevented: Not auto-pausing dev/test instances
- [ ] Mistake prevented: Choosing Serverless v2 for steady workloads
- [ ] Mistake prevented: Ignoring the minimum ACU charge when comparing costs

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
- [ ] Aurora Serverless V2 configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Min ACU = 0.5 in production
- [ ] Anti-pattern prevented: Serverless v2 + RDS Proxy without cost analysis
- [ ] Anti-pattern prevented: No max ACU limit
- [ ] Anti-pattern prevented: Serverless v2 for write-heavy workloads
- [ ] Common mistake prevented: Setting min ACU to 0.5 for production
- [ ] Common mistake prevented: Not auto-pausing dev/test instances
- [ ] Common mistake prevented: Choosing Serverless v2 for steady workloads
- [ ] Common mistake prevented: Ignoring the minimum ACU charge when comparing costs

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
