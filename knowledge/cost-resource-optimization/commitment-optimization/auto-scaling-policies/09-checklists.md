# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Auto Scaling Policies
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Target tracking scaling policy configured (ALB RequestCountPerTarget)
- [ ] Predictive scaling enabled with 2+ weeks of historical data
- [ ] Lifecycle hooks for instance warm-up
- [ ] Scale-in cool-down of 10+ minutes
- [ ] Min = 2 (multi-AZ), max = appropriate cap
- [ ] Use target tracking with ALB RequestCountPerTarget applied
- [ ] Set sufficient warm-up time applied
- [ ] Combine predictive + dynamic applied
- [ ] Prefer Target Tracking over Step or Simple Scaling followed
- [ ] Always Use ALB RequestCountPerTarget, Not CPU, for Web Tier Scaling followed
- [ ] Set Instance Warm-Up Time to 120-300 Seconds via Lifecycle Hooks followed
- [ ] Manual scaling prevented
- [ ] Scaling on CloudWatch metrics with 1-minute resolution prevented
- [ ] Scaling on CPU only prevented
- [ ] No predictive scaling for predictable traffic prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Web tier
- [ ] Architecture guideline: Worker tier
- [ ] Architecture guideline: Set min capacity = 2 (for AZ redundancy), max = 20 (cost cap)
- [ ] Architecture guideline: Use lifecycle hooks for warm-up before registering with ALB
- [ ] Architecture guideline: Use mixed instances groups for Spot diversification in the scaling pool
- [ ] Prefer Target Tracking over Step or Simple Scaling followed
- [ ] Always Use ALB RequestCountPerTarget, Not CPU, for Web Tier Scaling followed
- [ ] Set Instance Warm-Up Time to 120-300 Seconds via Lifecycle Hooks followed
- [ ] Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Use One Without the Other followed
- [ ] Set Scale-In Cool-Down to 10+ Minutes to Prevent Thrashing followed

---

# Implementation Checklist

- [ ] Best practice applied: Use target tracking with ALB RequestCountPerTarget
- [ ] Best practice applied: Set sufficient warm-up time
- [ ] Best practice applied: Combine predictive + dynamic
- [ ] Best practice applied: Use instance refresh with RollingUpdate
- [ ] Best practice applied: Set cooldown to 60-120 seconds
- [ ] Prefer Target Tracking over Step or Simple Scaling followed
- [ ] Always Use ALB RequestCountPerTarget, Not CPU, for Web Tier Scaling followed
- [ ] Set Instance Warm-Up Time to 120-300 Seconds via Lifecycle Hooks followed
- [ ] Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Use One Without the Other followed
- [ ] Set Scale-In Cool-Down to 10+ Minutes to Prevent Thrashing followed
- [ ] Set Minimum Capacity to 2 (Multi-AZ) and Maximum to a Cost Cap followed
- [ ] Use Mixed Instances Groups for Spot Diversification followed
- [ ] Workflow step completed: Inventory current Auto Scaling Policies resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Scaling lag
- [ ] Predictive scaling eliminates lag by provisioning 15-30 minutes before forecasted traffic
- [ ] Cold start on new instances
- [ ] Scale-in protection

---

# Security Checklist

- [ ] Scaling actions should be logged via CloudTrail for audit
- [ ] Lifecycle hooks can trigger Lambda for custom actions (log cleanup, security patching)
- [ ] Ensure new instances are patched and scanned before registering with ALB
- [ ] Use launch template versions for immutable infrastructure (new version always has latest security patches)

---

# Reliability Checklist

- [ ] Mistake prevented: Scaling on CPU only
- [ ] Mistake prevented: No predictive scaling for predictable traffic
- [ ] Mistake prevented: Too aggressive scale-in

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Target tracking scaling policy configured (ALB RequestCountPerTarget)
- [ ] Predictive scaling enabled with 2+ weeks of historical data
- [ ] Lifecycle hooks for instance warm-up
- [ ] Scale-in cool-down of 10+ minutes
- [ ] Min = 2 (multi-AZ), max = appropriate cap
- [ ] No manual scaling in place

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Auto Scaling Policies configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Prefer Target Tracking over Step or Simple Scaling followed
- [ ] Always Use ALB RequestCountPerTarget, Not CPU, for Web Tier Scaling followed
- [ ] Set Instance Warm-Up Time to 120-300 Seconds via Lifecycle Hooks followed
- [ ] Combine Predictive + Dynamic Scaling Ã¢â‚¬â€ Never Use One Without the Other followed
- [ ] Set Scale-In Cool-Down to 10+ Minutes to Prevent Thrashing followed
- [ ] Set Minimum Capacity to 2 (Multi-AZ) and Maximum to a Cost Cap followed
- [ ] Use Mixed Instances Groups for Spot Diversification followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Manual scaling
- [ ] Anti-pattern prevented: Scaling on CloudWatch metrics with 1-minute resolution
- [ ] Anti-pattern prevented: Identical min/max capacity
- [ ] Anti-pattern prevented: No scale-in protection
- [ ] Common mistake prevented: Scaling on CPU only
- [ ] Common mistake prevented: No predictive scaling for predictable traffic
- [ ] Common mistake prevented: Too aggressive scale-in

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Target tracking scaling policy configured (ALB RequestCountPerTarget)
- [ ] Verification passed: Predictive scaling enabled with 2+ weeks of historical data
- [ ] Verification passed: Lifecycle hooks for instance warm-up

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
