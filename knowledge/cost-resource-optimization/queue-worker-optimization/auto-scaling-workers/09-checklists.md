# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Auto Scaling Workers
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Worker auto-scaling configured on SQS backlogPerWorker
- [ ] Mixed instances policy (Spot + On-Demand)
- [ ] Lifecycle hook for graceful shutdown
- [ ] Queue-specific scaling policies for priority queues
- [ ] Scale-in cooldown >= 300 seconds
- [ ] Scale on backlogPerWorker, not queue depth alone applied
- [ ] Use ASG with mixed instances policy applied
- [ ] Set graceful shutdown lifecycle hook applied
- [ ] CPU-based worker scaling prevented
- [ ] min=0 workers prevented
- [ ] Scaling on SQS depth without backlogPerWorker prevented
- [ ] Identical scaling for all queues prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker ASG
- [ ] Architecture guideline: Scaling
- [ ] Architecture guideline: Scale-out
- [ ] Architecture guideline: Scale-in
- [ ] Architecture guideline: Cooldown
- [ ] Architecture guideline: Lifecycle hook
- [ ] Architecture guideline: CloudWatch alarm

---

# Implementation Checklist

- [ ] Best practice applied: Scale on backlogPerWorker, not queue depth alone
- [ ] Best practice applied: Use ASG with mixed instances policy
- [ ] Best practice applied: Set graceful shutdown lifecycle hook
- [ ] Best practice applied: Use per-queue scaling policies
- [ ] Best practice applied: Monitor scale-in events
- [ ] Best practice applied: Set warm-up time for new workers
- [ ] Workflow step completed: Inventory current Auto Scaling Workers resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] New worker boot time
- [ ] Scaling lag
- [ ] Warm workers
- [ ] Pre-scaling
- [ ] SQS polling

---

# Security Checklist

- [ ] Worker IAM role
- [ ] Queue-specific IAM
- [ ] Scale-in events logged in CloudTrail for audit
- [ ] Lifecycle hook should not expose credentials
- [ ] Monitor for unexpected scaling actions (possible cost attack)

---

# Reliability Checklist

- [ ] Mistake prevented: Scaling on SQS depth without backlogPerWorker
- [ ] Mistake prevented: Identical scaling for all queues
- [ ] Mistake prevented: No lifecycle hook
- [ ] Mistake prevented: Cooldown too short

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Worker auto-scaling configured on SQS backlogPerWorker
- [ ] Mixed instances policy (Spot + On-Demand)
- [ ] Lifecycle hook for graceful shutdown
- [ ] Queue-specific scaling policies for priority queues
- [ ] Scale-in cooldown >= 300 seconds
- [ ] min=1 worker always running
- [ ] No CPU-based worker scaling

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Auto Scaling Workers configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: CPU-based worker scaling
- [ ] Anti-pattern prevented: min=0 workers
- [ ] Anti-pattern prevented: Manual scaling during batch processing
- [ ] Anti-pattern prevented: On-Demand only workers
- [ ] Common mistake prevented: Scaling on SQS depth without backlogPerWorker
- [ ] Common mistake prevented: Identical scaling for all queues
- [ ] Common mistake prevented: No lifecycle hook
- [ ] Common mistake prevented: Cooldown too short

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Worker auto-scaling configured on SQS backlogPerWorker
- [ ] Verification passed: Mixed instances policy (Spot + On-Demand)
- [ ] Verification passed: Lifecycle hook for graceful shutdown

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
