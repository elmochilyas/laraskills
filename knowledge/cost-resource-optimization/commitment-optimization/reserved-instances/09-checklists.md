# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Reserved Instances
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] RIs purchased for baseline EC2 capacity (not peak)
- [ ] RDS/Aurora RIs purchased for production databases
- [ ] ElastiCache RIs purchased for production cache clusters
- [ ] RI utilization >95% (monitored via Cost Explorer)
- [ ] 3-year All Upfront for stable workloads; appropriate term for others
- [ ] Purchase RIs for baseline capacity only applied
- [ ] Use All Upfront 3-year for maximum savings applied
- [ ] Separate RIs for database and compute applied
- [ ] Purchase RIs for Baseline Capacity Only Ã¢â‚¬â€ Not Peak or Variable followed
- [ ] Always Purchase RDS RIs Separately Ã¢â‚¬â€ EC2 RIs Don't Cover Databases followed
- [ ] Use All Upfront 3-Year for Stable Production Workloads followed
- [ ] Buying RIs for all instances including variable capacity prevented
- [ ] No RI for production database prevented
- [ ] Over-purchasing RIs prevented
- [ ] No RDS RIs prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Purchase RIs in the region where production runs
- [ ] Architecture guideline: Combine RIs with Auto Scaling
- [ ] Architecture guideline: Use AWS Organizations to share RIs across accounts (consolidated billing)
- [ ] Architecture guideline: Purchase RIs for
- [ ] Architecture guideline: Do NOT purchase RIs for
- [ ] Architecture guideline: For multi-account setups, purchase RIs in a central "management" account; benefits apply to all accounts
- [ ] Purchase RIs for Baseline Capacity Only Ã¢â‚¬â€ Not Peak or Variable followed
- [ ] Always Purchase RDS RIs Separately Ã¢â‚¬â€ EC2 RIs Don't Cover Databases followed
- [ ] Use All Upfront 3-Year for Stable Production Workloads followed
- [ ] Monitor RI Utilization Monthly Ã¢â‚¬â€ Target >95% followed
- [ ] Combine RIs with Spot for Layered Cost Strategy followed

---

# Implementation Checklist

- [ ] Best practice applied: Purchase RIs for baseline capacity only
- [ ] Best practice applied: Use All Upfront 3-year for maximum savings
- [ ] Best practice applied: Separate RIs for database and compute
- [ ] Best practice applied: Monitor RI utilization
- [ ] Best practice applied: Use regional RIs for flexibility
- [ ] Purchase RIs for Baseline Capacity Only Ã¢â‚¬â€ Not Peak or Variable followed
- [ ] Always Purchase RDS RIs Separately Ã¢â‚¬â€ EC2 RIs Don't Cover Databases followed
- [ ] Use All Upfront 3-Year for Stable Production Workloads followed
- [ ] Monitor RI Utilization Monthly Ã¢â‚¬â€ Target >95% followed
- [ ] Combine RIs with Spot for Layered Cost Strategy followed
- [ ] Workflow step completed: Inventory current Reserved Instances resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] RIs do not affect compute performance (same instance performance as On-Demand)
- [ ] Capacity reservation (zonal RI) ensures instance availability during contention events
- [ ] No performance penalty for Convertible vs Standard RI (same underlying instance)
- [ ] RDS RIs apply at the instance level; no replication performance impact

---

# Security Checklist

- [ ] RI purchase requires IAM permissions
- [ ] Limit RI purchasing authority to specific IAM roles (financial impact)
- [ ] RIs are financial commitment; monitor via AWS Budgets to prevent unexpected renewals
- [ ] Unused RIs can be sold in the Reserved Instance Marketplace (third-party, less discount)

---

# Reliability Checklist

- [ ] Mistake prevented: Over-purchasing RIs
- [ ] Mistake prevented: No RDS RIs
- [ ] Mistake prevented: 1-year Partial Upfront for stable workload

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] RIs purchased for baseline EC2 capacity (not peak)
- [ ] RDS/Aurora RIs purchased for production databases
- [ ] ElastiCache RIs purchased for production cache clusters
- [ ] RI utilization >95% (monitored via Cost Explorer)
- [ ] 3-year All Upfront for stable workloads; appropriate term for others

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Reserved Instances configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Purchase RIs for Baseline Capacity Only Ã¢â‚¬â€ Not Peak or Variable followed
- [ ] Always Purchase RDS RIs Separately Ã¢â‚¬â€ EC2 RIs Don't Cover Databases followed
- [ ] Use All Upfront 3-Year for Stable Production Workloads followed
- [ ] Monitor RI Utilization Monthly Ã¢â‚¬â€ Target >95% followed
- [ ] Combine RIs with Spot for Layered Cost Strategy followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Buying RIs for all instances including variable capacity
- [ ] Anti-pattern prevented: No RI for production database
- [ ] Anti-pattern prevented: Setting RI to auto-renew
- [ ] Common mistake prevented: Over-purchasing RIs
- [ ] Common mistake prevented: No RDS RIs
- [ ] Common mistake prevented: 1-year Partial Upfront for stable workload

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: RIs purchased for baseline EC2 capacity (not peak)
- [ ] Verification passed: RDS/Aurora RIs purchased for production databases
- [ ] Verification passed: ElastiCache RIs purchased for production cache clusters

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
