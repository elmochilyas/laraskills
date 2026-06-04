# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Queue Priority Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] 2-3 priority levels defined (high/default/low)
- [ ] Separate worker ASGs per priority level
- [ ] High-priority on On-Demand; low-priority on Spot
- [ ] Low-priority scaling threshold > high-priority
- [ ] Per-queue latency monitored and targets met
- [ ] Use 3 priority levels applied
- [ ] Assign separate worker ASGs per priority applied
- [ ] Route job classes explicitly applied
- [ ] 9 priority levels prevented
- [ ] Priority queue without monitoring prevented
- [ ] Single queue for all jobs prevented
- [ ] Same worker pool for all priorities prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Queue structure
- [ ] Architecture guideline: High-priority
- [ ] Architecture guideline: Default
- [ ] Architecture guideline: Low-priority
- [ ] Architecture guideline: Laravel config
- [ ] Architecture guideline: Failed jobs

---

# Implementation Checklist

- [ ] Best practice applied: Use 3 priority levels
- [ ] Best practice applied: Assign separate worker ASGs per priority
- [ ] Best practice applied: Route job classes explicitly
- [ ] Best practice applied: Scale low-priority workers with backpressure
- [ ] Best practice applied: Monitor per-queue latency
- [ ] Best practice applied: Allow escalation for stuck jobs
- [ ] Workflow step completed: Inventory current Queue Priority Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] High-priority processing
- [ ] Low-priority processing
- [ ] Worker allocation
- [ ] Priority scheduling overhead
- [ ] Spot interruptions

---

# Security Checklist

- [ ] High-priority queues may need encryption (payment data, PII)
- [ ] Low-priority queues may have less stringent access controls
- [ ] Dead-letter queue per priority
- [ ] Queue URL should not be exposed; use VPC Endpoints for SQS
- [ ] Monitor unauthorized access to high-priority queues

---

# Reliability Checklist

- [ ] Mistake prevented: Single queue for all jobs
- [ ] Mistake prevented: Same worker pool for all priorities
- [ ] Mistake prevented: Over-provisioning low-priority

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] 2-3 priority levels defined (high/default/low)
- [ ] Separate worker ASGs per priority level
- [ ] High-priority on On-Demand; low-priority on Spot
- [ ] Low-priority scaling threshold > high-priority
- [ ] Per-queue latency monitored and targets met
- [ ] Job routing per class is explicit (onQueue())
- [ ] Escalation mechanism for stuck low-priority jobs

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Queue Priority Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 9 priority levels
- [ ] Anti-pattern prevented: Priority queue without monitoring
- [ ] Anti-pattern prevented: All jobs as high priority
- [ ] Anti-pattern prevented: Low-priority workers on On-Demand
- [ ] Common mistake prevented: Single queue for all jobs
- [ ] Common mistake prevented: Same worker pool for all priorities
- [ ] Common mistake prevented: Over-provisioning low-priority

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: 2-3 priority levels defined (high/default/low)
- [ ] Verification passed: Separate worker ASGs per priority level
- [ ] Verification passed: High-priority on On-Demand; low-priority on Spot

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
