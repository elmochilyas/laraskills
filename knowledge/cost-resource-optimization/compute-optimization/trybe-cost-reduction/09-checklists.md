# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Trybe 40% Cost Reduction (Vapor to Cloud)
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Calculate your own Lambda multiplier before projecting savings applied
- [ ] Target apps at >$10K/month Vapor spend first applied
- [ ] Use Private Cloud for high-volume workloads needing dedicated capacity applied
- [ ] Vapor at extreme scale without evaluation prevented
- [ ] Rip-and-replace migration at 500M req/month prevented
- [ ] Assuming Trybe's 40% savings at lower volumes prevented
- [ ] Not measuring your actual Lambda multiplier prevented

---

# Architecture Checklist

- [ ] Architecture guideline: At 500M req/month, use Private Cloud (dedicated Fargate) or Forge+EC2
- [ ] Architecture guideline: Standard Cloud may suffice at <100M req/month
- [ ] Architecture guideline: Octane is mandatory at this scale for cost-effective compute
- [ ] Architecture guideline: Graviton instances across all Fargate tasks for 20% additional savings
- [ ] Architecture guideline: Compute Savings Plans for baseline Fargate usage (up to 66% discount)

---

# Implementation Checklist

- [ ] Best practice applied: Calculate your own Lambda multiplier before projecting savings
- [ ] Best practice applied: Target apps at >$10K/month Vapor spend first
- [ ] Best practice applied: Use Private Cloud for high-volume workloads needing dedicated capacity
- [ ] Best practice applied: Model Fargate + Octane cost, not just Fargate
- [ ] Best practice applied: Build cost model with upper and lower bounds
- [ ] Workflow step completed: Inventory current Trybe Cost Reduction resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] At 500M req/month, Octane throughput is critical (3-10x vs PHP-FPM)
- [ ] Fargate containers scale to match traffic; Cloud auto-scaling adds containers in 30-120s
- [ ] At this volume, even minor per-request optimizations yield significant cost savings
- [ ] Cloud auto-hibernation not relevant at sustained high traffic (containers never idle)
- [ ] Database R/W throughput becomes bottleneck before compute at this scale

---

# Security Checklist

- [ ] Private Cloud provides dedicated VPC with network isolation
- [ ] At 500M req/month, CDN and DDoS protection are essential
- [ ] Cloud IAM roles should be scoped to least privilege per environment
- [ ] AWS WAF recommended for high-volume production deployments
- [ ] Regular security audits required at enterprise scale

---

# Reliability Checklist

- [ ] Mistake prevented: Assuming Trybe's 40% savings at lower volumes
- [ ] Mistake prevented: Not measuring your actual Lambda multiplier
- [ ] Mistake prevented: Underestimating migration complexity at 500M req/month
- [ ] Mistake prevented: Ignoring database scaling alongside compute

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
- [ ] Trybe Cost Reduction configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Vapor at extreme scale without evaluation
- [ ] Anti-pattern prevented: Rip-and-replace migration at 500M req/month
- [ ] Anti-pattern prevented: No cost monitoring after migration
- [ ] Anti-pattern prevented: Single-environment deployment
- [ ] Common mistake prevented: Assuming Trybe's 40% savings at lower volumes
- [ ] Common mistake prevented: Not measuring your actual Lambda multiplier
- [ ] Common mistake prevented: Underestimating migration complexity at 500M req/month
- [ ] Common mistake prevented: Ignoring database scaling alongside compute

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
