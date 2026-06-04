# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** RDS Database Savings Plans
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Prefer Database Savings Plans over RDS RIs for new commitments applied
- [ ] Commit to 80-90% of minimum hourly database spend applied
- [ ] Let existing RDS RIs expire, replace with SPs applied
- [ ] 3-year SP for startup with uncertain future prevented
- [ ] SP for dev/test databases prevented
- [ ] Committing to 100% of current spend with SPs prevented
- [ ] Not switching from RDS RIs to SPs upon RI expiry prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Database SPs for provisioned RDS and Aurora (not Serverless v2)
- [ ] Architecture guideline: RDS RIs for maximum savings on static, single-instance deployments
- [ ] Architecture guideline: On-Demand for dev/test, variable workloads, burst capacity
- [ ] Architecture guideline: Serverless v2 for workloads >3:1 peak-to-trough (no SP/RI available)
- [ ] Architecture guideline: SPs cover compute only, not storage, I/O, or data transfer

---

# Implementation Checklist

- [ ] Best practice applied: Prefer Database Savings Plans over RDS RIs for new commitments
- [ ] Best practice applied: Commit to 80-90% of minimum hourly database spend
- [ ] Best practice applied: Let existing RDS RIs expire, replace with SPs
- [ ] Best practice applied: Use 3-year SP for stable production databases
- [ ] Best practice applied: Combine SP with On-Demand for burst
- [ ] Workflow step completed: Inventory current Rds Savings Plans resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] SPs are purely billing mechanism Ã¢â‚¬â€ no performance impact
- [ ] Same database performance whether covered by SP, RI, or On-Demand
- [ ] SPs don't affect failover, read replica, or backup behavior
- [ ] No capacity reservation benefit (unlike Zonal RIs)
- [ ] SPs co-apply with existing RIs (RIs apply first, then SPs)

---

# Security Checklist

- [ ] SP purchase does not require additional IAM permissions beyond cost management
- [ ] No impact on database encryption, authentication, or network security
- [ ] SP utilization data is accessible via Cost Explorer for billing teams only
- [ ] No change to compliance posture or audit requirements
- [ ] SPs are organizational-level commitments; individual accounts benefit automatically

---

# Reliability Checklist

- [ ] Mistake prevented: Committing to 100% of current spend with SPs
- [ ] Mistake prevented: Not switching from RDS RIs to SPs upon RI expiry
- [ ] Mistake prevented: Assuming SP covers Aurora Serverless v2
- [ ] Mistake prevented: Ignoring unused commitment monitoring

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
- [ ] Rds Savings Plans configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 3-year SP for startup with uncertain future
- [ ] Anti-pattern prevented: SP for dev/test databases
- [ ] Anti-pattern prevented: 100% SP coverage with no On-Demand
- [ ] Anti-pattern prevented: SP + RI overlap
- [ ] Common mistake prevented: Committing to 100% of current spend with SPs
- [ ] Common mistake prevented: Not switching from RDS RIs to SPs upon RI expiry
- [ ] Common mistake prevented: Assuming SP covers Aurora Serverless v2
- [ ] Common mistake prevented: Ignoring unused commitment monitoring

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
