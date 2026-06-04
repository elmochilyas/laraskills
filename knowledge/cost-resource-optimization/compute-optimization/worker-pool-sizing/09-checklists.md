# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Worker Pool Sizing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Worker count calculated from bottleneck analysis
- [ ] Idle worker percentage monitored (target 10-20% at peak)
- [ ] Separate pools for web vs queue workloads
- [ ] Queue depth monitored (alarm at 100+ messages)
- [ ] Workers adjusted for I/O vs CPU profile
- [ ] Calculate worker count from bottleneck applied
- [ ] Monitor idle worker percentage applied
- [ ] Use separate pools for different workloads applied
- [ ] Fixed workers for variable load prevented
- [ ] Shared pool for web and queue prevented
- [ ] Oversubscribed workers prevented
- [ ] Equal workers for all queues prevented

---

# Architecture Checklist

- [ ] Architecture guideline: PHP-FPM web
- [ ] Architecture guideline: Octane workers
- [ ] Architecture guideline: Queue workers
- [ ] Architecture guideline: Separate queue pools
- [ ] Architecture guideline: Monitor queue wait time; if > 5 minutes, add workers or queue concurrency

---

# Implementation Checklist

- [ ] Best practice applied: Calculate worker count from bottleneck
- [ ] Best practice applied: Monitor idle worker percentage
- [ ] Best practice applied: Use separate pools for different workloads
- [ ] Best practice applied: Right-size queue workers for throughput
- [ ] Best practice applied: Set max_workers with buffer
- [ ] Workflow step completed: Inventory current Worker Pool Sizing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Context switching overhead
- [ ] Memory overhead
- [ ] Laravel boot overhead
- [ ] Queue worker efficiency
- [ ] Worker restart cost

---

# Security Checklist

- [ ] Separate pool permissions
- [ ] Worker memory limits prevent resource exhaustion attacks
- [ ] Max execution time
- [ ] Isolate sensitive jobs

---

# Reliability Checklist

- [ ] Mistake prevented: Oversubscribed workers
- [ ] Mistake prevented: Equal workers for all queues
- [ ] Mistake prevented: No queue depth monitoring

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Worker count calculated from bottleneck analysis
- [ ] Idle worker percentage monitored (target 10-20% at peak)
- [ ] Separate pools for web vs queue workloads
- [ ] Queue depth monitored (alarm at 100+ messages)
- [ ] Workers adjusted for I/O vs CPU profile
- [ ] Memory headroom maintained (20% free during peak)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Worker Pool Sizing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Fixed workers for variable load
- [ ] Anti-pattern prevented: Shared pool for web and queue
- [ ] Anti-pattern prevented: Workers > RAM capacity
- [ ] Common mistake prevented: Oversubscribed workers
- [ ] Common mistake prevented: Equal workers for all queues
- [ ] Common mistake prevented: No queue depth monitoring

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Worker count calculated from bottleneck analysis
- [ ] Verification passed: Idle worker percentage monitored (target 10-20% at peak)
- [ ] Verification passed: Separate pools for web vs queue workloads

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
