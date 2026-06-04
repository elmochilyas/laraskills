# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Worker Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] min=1 worker always running (prevents cold-start)
- [ ] Scale-in cooldown >= 300 seconds
- [ ] Job processing time tracked per worker
- [ ] Spot instance-based worker fleet
- [ ] Scale workers on SQS ApproximateNumberOfMessagesVisible applied
- [ ] Set min workers = 1 applied
- [ ] Use step scaling for large backlogs applied
- [ ] Manual worker management prevented
- [ ] Web + queue on same ASG prevented
- [ ] min=0 workers in auto-scaling prevented
- [ ] Scale-in too fast prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker ASG
- [ ] Architecture guideline: Scaling metric
- [ ] Architecture guideline: Scale-out cooldown
- [ ] Architecture guideline: Scale-in cooldown
- [ ] Architecture guideline: Use mixed instances policies for Spot diversification
- [ ] Architecture guideline: For Fargate
- [ ] Architecture guideline: For KEDA

---

# Implementation Checklist

- [ ] Best practice applied: Scale workers on SQS ApproximateNumberOfMessagesVisible
- [ ] Best practice applied: Set min workers = 1
- [ ] Best practice applied: Use step scaling for large backlogs
- [ ] Best practice applied: Set scale-in cooldown to 300+ seconds
- [ ] Best practice applied: Monitor job processing time per worker
- [ ] Best practice applied: Use queue-specific scaling policies
- [ ] Workflow step completed: Inventory current Worker Scaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Worker warm-up
- [ ] Pre-scaling
- [ ] SQS polling overhead
- [ ] Batching
- [ ] Job processing time variance

---

# Security Checklist

- [ ] Worker instances need SQS IAM permissions (receive, delete, change visibility)
- [ ] Use queue-specific IAM policies for least privilege
- [ ] Workers should not have database write access for read-only processing
- [ ] SQS encryption (SSE-KMS) for sensitive job data
- [ ] Monitor worker scaling events in CloudTrail

---

# Reliability Checklist

- [ ] Mistake prevented: min=0 workers in auto-scaling
- [ ] Mistake prevented: Scale-in too fast
- [ ] Mistake prevented: No job duration monitoring

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] min=1 worker always running (prevents cold-start)
- [ ] Scale-in cooldown >= 300 seconds
- [ ] Job processing time tracked per worker
- [ ] Spot instance-based worker fleet
- [ ] Queue-specific scaling policies for priority jobs
- [ ] Graceful shutdown configured via lifecycle hooks

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Worker Scaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Manual worker management
- [ ] Anti-pattern prevented: Web + queue on same ASG
- [ ] Anti-pattern prevented: On-Demand workers for fault-tolerant workloads
- [ ] Common mistake prevented: min=0 workers in auto-scaling
- [ ] Common mistake prevented: Scale-in too fast
- [ ] Common mistake prevented: No job duration monitoring

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Worker auto-scaling configured on SQS queue depth
- [ ] Verification passed: min=1 worker always running (prevents cold-start)
- [ ] Verification passed: Scale-in cooldown >= 300 seconds

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
