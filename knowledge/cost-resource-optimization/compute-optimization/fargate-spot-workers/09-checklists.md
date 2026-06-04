# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Fargate Spot Workers
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use Spot + On-Demand mixed capacity applied
- [ ] Implement graceful SIGTERM handling applied
- [ ] Set queue worker timeout < 2 minutes applied
- [ ] 100% Spot without fallback prevented
- [ ] Stateful services on Spot prevented
- [ ] Running stateful jobs on Spot without checkpointing prevented
- [ ] No On-Demand fallback prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker ASG with mixed capacity
- [ ] Architecture guideline: Service Auto Scaling on SQS queue depth (target
- [ ] Architecture guideline: Lifecycle hook for graceful shutdown
- [ ] Architecture guideline: Separate queues for Spot vs On-Demand workers if priority differentiation needed
- [ ] Architecture guideline: Use Fargate Spot for non-critical queues, On-Demand for priority queues

---

# Implementation Checklist

- [ ] Best practice applied: Use Spot + On-Demand mixed capacity
- [ ] Best practice applied: Implement graceful SIGTERM handling
- [ ] Best practice applied: Set queue worker timeout < 2 minutes
- [ ] Best practice applied: Use multiple instance types in Spot capacity provider
- [ ] Best practice applied: Distribute Spot tasks across multiple AZs
- [ ] Best practice applied: Monitor SpotInterruptionCount metric
- [ ] Workflow step completed: Inventory current Fargate Spot Workers resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Interruption rate spikes during AWS re:Invent, Black Friday, Prime Day
- [ ] Tasks restarting after interruption take 30-120 seconds (image pull), causing job processing lag
- [ ] Jobs should complete within 5 minutes ideally to survive interruption windows
- [ ] Long-running Horizon batches may need checkpointing (track progress in DB)
- [ ] ARM Spot tasks generally have lower interruption rates than x86

---

# Security Checklist

- [ ] Container images used for Spot tasks should be scanned and trusted
- [ ] IAM roles for Spot workers should be least-privilege (SQS receive/delete only)
- [ ] Termination lifecycle hooks should log interruption events for audit
- [ ] Spot capacity provider does not expose underlying host details
- [ ] Cross-account Spot usage requires careful IAM boundary configuration

---

# Reliability Checklist

- [ ] Mistake prevented: Running stateful jobs on Spot without checkpointing
- [ ] Mistake prevented: No On-Demand fallback
- [ ] Mistake prevented: Single AZ for Spot tasks
- [ ] Mistake prevented: Ignoring interruption rate variance

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
- [ ] Fargate Spot Workers configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 100% Spot without fallback
- [ ] Anti-pattern prevented: Stateful services on Spot
- [ ] Anti-pattern prevented: Spot for production web serving
- [ ] Anti-pattern prevented: No job retry limit
- [ ] Common mistake prevented: Running stateful jobs on Spot without checkpointing
- [ ] Common mistake prevented: No On-Demand fallback
- [ ] Common mistake prevented: Single AZ for Spot tasks
- [ ] Common mistake prevented: Ignoring interruption rate variance

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
