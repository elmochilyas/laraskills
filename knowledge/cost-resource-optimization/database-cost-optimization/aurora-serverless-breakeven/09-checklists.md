# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Aurora Serverless v2 Breakeven
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Run cost model with your actual 90-day traffic pattern applied
- [ ] Consider hybrid architecture: provisioned writer + Serverless v2 readers applied
- [ ] Set minimum ACU to working set size, not the absolute minimum applied
- [ ] Serverless v2 for everything prevented
- [ ] Min ACU = 0.5 in production prevented
- [ ] Comparing Serverless v2 On-Demand to provisioned On-Demand without RI prevented
- [ ] Not modeling the actual peak-to-trough ratio over 90 days prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Run cost model with actual traffic pattern before choosing
- [ ] Architecture guideline: Provisioned + RI for steady workloads (<2:1 variation)
- [ ] Architecture guideline: Serverless v2 for variable workloads (>5:1 variation)
- [ ] Architecture guideline: Hybrid for workloads between 2:1 and 5:1
- [ ] Architecture guideline: Serverless v2 for dev/test regardless of ratio (auto-pause saves)
- [ ] Architecture guideline: Use Aurora Standard for dev/test; evaluate I/O-Optimized for production with high I/O

---

# Implementation Checklist

- [ ] Best practice applied: Run cost model with your actual 90-day traffic pattern
- [ ] Best practice applied: Consider hybrid architecture: provisioned writer + Serverless v2 readers
- [ ] Best practice applied: Set minimum ACU to working set size, not the absolute minimum
- [ ] Best practice applied: Factor RDS Proxy cost into breakeven
- [ ] Best practice applied: Re-evaluate quarterly as traffic patterns evolve
- [ ] Workflow step completed: Inventory current Aurora Serverless Breakeven resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Serverless v2 scale-up is near-instant; scale-down is slower (minutes)
- [ ] Buffer pool hit ratio drops if min ACU is too low Ã¢â€ â€™ increased I/O charges
- [ ] Serverless v2 does NOT have cold starts (always warm at configured min)
- [ ] At 4 ACU minimum, buffer pool performance matches provisioned r6g.large
- [ ] Write-heavy workloads may not benefit from read auto-scaling; ACU scaling responds to CPU + connections

---

# Security Checklist

- [ ] Same security model for Serverless v2 and provisioned Aurora
- [ ] IAM database authentication available for both
- [ ] Encryption at rest and in transit identical
- [ ] Connection pooling (RDS Proxy, PgBouncer) works with both
- [ ] Audit logging via Aurora Advanced Auditing for both

---

# Reliability Checklist

- [ ] Mistake prevented: Comparing Serverless v2 On-Demand to provisioned On-Demand without RI
- [ ] Mistake prevented: Not modeling the actual peak-to-trough ratio over 90 days
- [ ] Mistake prevented: Ignoring that minimum ACU charge sets a floor
- [ ] Mistake prevented: Not factoring storage and I/O costs

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
- [ ] Aurora Serverless Breakeven configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Serverless v2 for everything
- [ ] Anti-pattern prevented: Min ACU = 0.5 in production
- [ ] Anti-pattern prevented: No RI on provisioned
- [ ] Anti-pattern prevented: RDS Proxy with every Serverless v2
- [ ] Common mistake prevented: Comparing Serverless v2 On-Demand to provisioned On-Demand without RI
- [ ] Common mistake prevented: Not modeling the actual peak-to-trough ratio over 90 days
- [ ] Common mistake prevented: Ignoring that minimum ACU charge sets a floor
- [ ] Common mistake prevented: Not factoring storage and I/O costs

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
