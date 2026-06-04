# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Spot Interruption Costs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Net Spot savings calculated (gross - recovery - fallback - engineering)
- [ ] 30-day measurement period completed before scaling Spot
- [ ] Checkpointing implemented for jobs >5 minutes
- [ ] Spot interruption rate monitored per pool
- [ ] On-Demand fallback cost tracked in Cost Explorer
- [ ] Calculate net Spot savings before scaling applied
- [ ] Prioritize Spot for short-lived stateless jobs applied
- [ ] Implement checkpointing for jobs >5 minutes applied
- [ ] Calculate Net Spot Savings Ã¢â‚¬â€ Never Assume Gross Discount = Net Savings followed
- [ ] Prioritize Spot for Short-Lived Stateless Jobs (<5 Minutes) followed
- [ ] Implement Checkpointing for Jobs Longer Than 5 Minutes followed
- [ ] Spot for everything without analysis prevented
- [ ] No Spot interruption monitoring prevented
- [ ] Assuming Spot is always cheaper prevented
- [ ] No checkpointing for long-running jobs prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Start with 20% of workers on Spot, measure net savings over 30 days, scale up if positive
- [ ] Architecture guideline: Use mixed instances ASG with On-Demand fallback (avoids forced On-Demand at peak Spot prices)
- [ ] Architecture guideline: Implement Spot termination handling
- [ ] Architecture guideline: For Laravel Horizon
- [ ] Architecture guideline: Track "Spot savings realized" vs "On-Demand fallback cost" in Cost Explorer
- [ ] Calculate Net Spot Savings Ã¢â‚¬â€ Never Assume Gross Discount = Net Savings followed
- [ ] Prioritize Spot for Short-Lived Stateless Jobs (<5 Minutes) followed
- [ ] Implement Checkpointing for Jobs Longer Than 5 Minutes followed
- [ ] Monitor Spot Interruption Rate Per Instance Pool followed
- [ ] Use Capacity-Rebalancing for Proactive Instance Replacement followed

---

# Implementation Checklist

- [ ] Best practice applied: Calculate net Spot savings before scaling
- [ ] Best practice applied: Prioritize Spot for short-lived stateless jobs
- [ ] Best practice applied: Implement checkpointing for jobs >5 minutes
- [ ] Best practice applied: Use capacity-rebalancing for proactive replacement
- [ ] Best practice applied: Monitor Spot interruption rate per pool
- [ ] Calculate Net Spot Savings Ã¢â‚¬â€ Never Assume Gross Discount = Net Savings followed
- [ ] Prioritize Spot for Short-Lived Stateless Jobs (<5 Minutes) followed
- [ ] Implement Checkpointing for Jobs Longer Than 5 Minutes followed
- [ ] Monitor Spot Interruption Rate Per Instance Pool followed
- [ ] Use Capacity-Rebalancing for Proactive Instance Replacement followed
- [ ] Workflow step completed: Inventory current Spot Interruption Costs resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Spot recovery cost is measured in compute time, not user-facing latency
- [ ] For queue workers, recovery cost is ~1 job timeout (typically 60 seconds for Laravel Horizon)
- [ ] CI/CD recovery cost = full pipeline re-run (5-30 minutes depending on pipeline)
- [ ] Web server recovery cost is highest (dropped connections, session loss, cache rebuild)
- [ ] Fargate Spot recovery cost is minimal (containers restart in seconds)

---

# Security Checklist

- [ ] Interruption handling code must handle SIGTERM securely (no credential leakage on shutdown)
- [ ] Checkpoint state must be stored securely (S3 server-side encryption, DynamoDB encryption at rest)
- [ ] Fallback to On-Demand should preserve same security group and IAM boundaries
- [ ] Monitor Spot termination notification access (instance metadata endpoint)

---

# Reliability Checklist

- [ ] Mistake prevented: Assuming Spot is always cheaper
- [ ] Mistake prevented: No checkpointing for long-running jobs
- [ ] Mistake prevented: Single-pool Spot without fallback

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Net Spot savings calculated (gross - recovery - fallback - engineering)
- [ ] 30-day measurement period completed before scaling Spot
- [ ] Checkpointing implemented for jobs >5 minutes
- [ ] Spot interruption rate monitored per pool
- [ ] On-Demand fallback cost tracked in Cost Explorer
- [ ] Engineering overhead for Spot management included in cost model

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Spot Interruption Costs configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Calculate Net Spot Savings Ã¢â‚¬â€ Never Assume Gross Discount = Net Savings followed
- [ ] Prioritize Spot for Short-Lived Stateless Jobs (<5 Minutes) followed
- [ ] Implement Checkpointing for Jobs Longer Than 5 Minutes followed
- [ ] Monitor Spot Interruption Rate Per Instance Pool followed
- [ ] Use Capacity-Rebalancing for Proactive Instance Replacement followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Spot for everything without analysis
- [ ] Anti-pattern prevented: No Spot interruption monitoring
- [ ] Anti-pattern prevented: Ignoring engineering overhead
- [ ] Anti-pattern prevented: Long-running stateful jobs on Spot
- [ ] Common mistake prevented: Assuming Spot is always cheaper
- [ ] Common mistake prevented: No checkpointing for long-running jobs
- [ ] Common mistake prevented: Single-pool Spot without fallback

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Net Spot savings calculated (gross - recovery - fallback - engineering)
- [ ] Verification passed: 30-day measurement period completed before scaling Spot
- [ ] Verification passed: Checkpointing implemented for jobs >5 minutes

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
