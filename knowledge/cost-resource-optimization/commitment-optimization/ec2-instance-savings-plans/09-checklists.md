# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** EC2 Instance Savings Plans
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Compute Savings Plans baseline established before EC2 Instance SP
- [ ] Instance family stable with 3+ year outlook
- [ ] EC2 Instance SP layered on top of Compute SP
- [ ] Regional SP purchased (not zonal)
- [ ] Size flexibility understood and utilized
- [ ] Layer EC2 Instance SP on top of Compute SP applied
- [ ] Only commit for instance families with 3-year stability applied
- [ ] Use size flexibility within the family applied
- [ ] Layer EC2 Instance SP on Top of Compute SP, Not Instead Of followed
- [ ] Only Commit to Instance Families with 3+ Year Stability followed
- [ ] Purchase Regional SPs, Not Zonal followed
- [ ] Instance SP for Fargate or Lambda prevented
- [ ] Instance SP for development accounts prevented
- [ ] Buying EC2 Instance SP before Compute SP prevented
- [ ] No size flexibility awareness prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use EC2 Instance SP only after Compute SP baseline is established
- [ ] Architecture guideline: Purchase for the most expensive, most stable instance type first
- [ ] Architecture guideline: Combine with Auto Scaling
- [ ] Architecture guideline: Monitor stranded SP ratio (unused commitment / total commitment) Ã¢â‚¬â€ target <5%
- [ ] Architecture guideline: Set up Cost Explorer alerts for SP utilization drops below 90%
- [ ] Layer EC2 Instance SP on Top of Compute SP, Not Instead Of followed
- [ ] Only Commit to Instance Families with 3+ Year Stability followed
- [ ] Purchase Regional SPs, Not Zonal followed
- [ ] Monitor Stranded SP Ratio Ã¢â‚¬â€ Target <5% followed
- [ ] Size-Flexibility Within Family Ã¢â‚¬â€ Don't Purchase for Exact Instance Size followed

---

# Implementation Checklist

- [ ] Best practice applied: Layer EC2 Instance SP on top of Compute SP
- [ ] Best practice applied: Only commit for instance families with 3-year stability
- [ ] Best practice applied: Use size flexibility within the family
- [ ] Best practice applied: Purchase regional SPs, not zonal
- [ ] Layer EC2 Instance SP on Top of Compute SP, Not Instead Of followed
- [ ] Only Commit to Instance Families with 3+ Year Stability followed
- [ ] Purchase Regional SPs, Not Zonal followed
- [ ] Monitor Stranded SP Ratio Ã¢â‚¬â€ Target <5% followed
- [ ] Size-Flexibility Within Family Ã¢â‚¬â€ Don't Purchase for Exact Instance Size followed
- [ ] Workflow step completed: Inventory current Ec2 Instance Savings Plans resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Same as On-Demand performance (purely billing mechanism)
- [ ] Size flexibility allows instance upgrades within family (e.g., r6g.large to r6g.xlarge) at same discount
- [ ] No performance degradation from SP billing

---

# Security Checklist

- [ ] Same IAM restrictions as Compute SPs
- [ ] Higher financial risk due to lock-in (stranded SPs are unrecoverable cost)
- [ ] Limit purchasing authority to senior FinOps roles
- [ ] Monitor via AWS Budgets for auto-renewal prevention

---

# Reliability Checklist

- [ ] Mistake prevented: Buying EC2 Instance SP before Compute SP
- [ ] Mistake prevented: No size flexibility awareness
- [ ] Mistake prevented: Single-family lock-in for heterogeneous fleet

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Compute Savings Plans baseline established before EC2 Instance SP
- [ ] Instance family stable with 3+ year outlook
- [ ] EC2 Instance SP layered on top of Compute SP
- [ ] Regional SP purchased (not zonal)
- [ ] Size flexibility understood and utilized
- [ ] Stranded SP ratio <5%

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Ec2 Instance Savings Plans configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Layer EC2 Instance SP on Top of Compute SP, Not Instead Of followed
- [ ] Only Commit to Instance Families with 3+ Year Stability followed
- [ ] Purchase Regional SPs, Not Zonal followed
- [ ] Monitor Stranded SP Ratio Ã¢â‚¬â€ Target <5% followed
- [ ] Size-Flexibility Within Family Ã¢â‚¬â€ Don't Purchase for Exact Instance Size followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Instance SP for Fargate or Lambda
- [ ] Anti-pattern prevented: Instance SP for development accounts
- [ ] Anti-pattern prevented: Auto-renew without review
- [ ] Common mistake prevented: Buying EC2 Instance SP before Compute SP
- [ ] Common mistake prevented: No size flexibility awareness
- [ ] Common mistake prevented: Single-family lock-in for heterogeneous fleet

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Compute Savings Plans baseline established before EC2 Instance SP
- [ ] Verification passed: Instance family stable with 3+ year outlook
- [ ] Verification passed: EC2 Instance SP layered on top of Compute SP

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
