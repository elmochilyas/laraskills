# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Queue Worker Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] Spot instances used for worker fleet
- [ ] Separate scaling policies per queue priority
- [ ] Scale-in cooldown >= 5 minutes
- [ ] Graceful shutdown via lifecycle hooks
- [ ] Scale workers on ApproximateNumberOfMessagesVisible applied
- [ ] Use Spot instances for worker fleets applied
- [ ] Set cooldown of 5+ minutes for scale-in applied
- [ ] Manual worker management prevented
- [ ] Web + queue on same server prevented
- [ ] Not auto-scaling queue workers prevented
- [ ] Same scaling for all queues prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker ASG
- [ ] Architecture guideline: Scaling metric
- [ ] Architecture guideline: Scale-out threshold
- [ ] Architecture guideline: Scale-in threshold
- [ ] Architecture guideline: Add scale-out cooldown=120s, scale-in cooldown=600s (slow scale-in to prevent oscillation)
- [ ] Architecture guideline: For Fargate

---

# Implementation Checklist

- [ ] Best practice applied: Scale workers on ApproximateNumberOfMessagesVisible
- [ ] Best practice applied: Use Spot instances for worker fleets
- [ ] Best practice applied: Set cooldown of 5+ minutes for scale-in
- [ ] Best practice applied: Use separate auto-scaling groups per queue priority
- [ ] Best practice applied: Configure lifecycle hooks for graceful shutdown
- [ ] Workflow step completed: Inventory current Queue Worker Scaling resources, configurations, and usage patterns
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
- [ ] Job processing time variability

---

# Security Checklist

- [ ] Worker instances need SQS IAM permissions (send, receive, delete, change visibility)
- [ ] Use queue-specific IAM policies for least privilege
- [ ] Enable SQS encryption (SSE-KMS) for sensitive job data
- [ ] Workers should not have database write access if processing read-only jobs
- [ ] Rotate queue URLs and credentials; workers should fetch from parameter store

---

# Reliability Checklist

- [ ] Mistake prevented: Not auto-scaling queue workers
- [ ] Mistake prevented: Same scaling for all queues
- [ ] Mistake prevented: Scale-in too aggressive

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] Spot instances used for worker fleet
- [ ] Separate scaling policies per queue priority
- [ ] Scale-in cooldown >= 5 minutes
- [ ] Graceful shutdown via lifecycle hooks
- [ ] No workers running on web servers
- [ ] SQS metrics monitored for backlog alerts

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Queue Worker Scaling configured and functioning correctly
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
- [ ] Anti-pattern prevented: Web + queue on same server
- [ ] Anti-pattern prevented: On-Demand workers only
- [ ] Anti-pattern prevented: No backpressure handling
- [ ] Common mistake prevented: Not auto-scaling queue workers
- [ ] Common mistake prevented: Same scaling for all queues
- [ ] Common mistake prevented: Scale-in too aggressive

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Worker auto-scaling configured on SQS queue depth
- [ ] Verification passed: Spot instances used for worker fleet
- [ ] Verification passed: Separate scaling policies per queue priority

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
