# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Worker Failure Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] DLQ configured for all queues (3-5 max attempts)
- [ ] Exponential backoff with jitter implemented
- [ ] Explicit timeout set on all job classes
- [ ] Graceful shutdown for Spot interruption
- [ ] Failure rate monitored (alert at > 1%)
- [ ] Implement DLQ on every queue applied
- [ ] Use exponential backoff with jitter applied
- [ ] Set job timeout based on expected duration applied
- [ ] Endless retries for all jobs prevented
- [ ] Same retry strategy for all jobs prevented
- [ ] No DLQ for any queue prevented
- [ ] No job timeout prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Every queue has a DLQ with 3-5 max receives/attempts
- [ ] Architecture guideline: SQS redrive policy
- [ ] Architecture guideline: Laravel max_attempts
- [ ] Architecture guideline: Visibility timeout
- [ ] Architecture guideline: Failed jobs table
- [ ] Architecture guideline: Alert on DLQ message count > 0 (poison pill detected)
- [ ] Architecture guideline: Monitor failure cost

---

# Implementation Checklist

- [ ] Best practice applied: Implement DLQ on every queue
- [ ] Best practice applied: Use exponential backoff with jitter
- [ ] Best practice applied: Set job timeout based on expected duration
- [ ] Best practice applied: Monitor failure rate per job class
- [ ] Best practice applied: Handle Spot interruption gracefully
- [ ] Best practice applied: Use Laravel job middleware for rate limiting
- [ ] Best practice applied: Log failure reason to identify patterns
- [ ] Workflow step completed: Inventory current Worker Failure Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Failed job waste
- [ ] Poison pill waste
- [ ] Retry overhead
- [ ] DLQ redrive
- [ ] Failure rate threshold

---

# Security Checklist

- [ ] Failed jobs may contain sensitive data (PII, payment info)
- [ ] DLQ messages should be encrypted at rest (SQS SSE)
- [ ] Failed jobs table (database) should be access-controlled
- [ ] Notification on DLQ should not leak message content
- [ ] Manual DLQ reprocessing should be authorized (prevent re-processing of sensitive data)

---

# Reliability Checklist

- [ ] Mistake prevented: No DLQ for any queue
- [ ] Mistake prevented: No job timeout
- [ ] Mistake prevented: Immediate retry with no backoff
- [ ] Mistake prevented: Not monitoring failure rate

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] DLQ configured for all queues (3-5 max attempts)
- [ ] Exponential backoff with jitter implemented
- [ ] Explicit timeout set on all job classes
- [ ] Graceful shutdown for Spot interruption
- [ ] Failure rate monitored (alert at > 1%)
- [ ] DLQ alerting configured
- [ ] Rate limiting middleware for API-dependent jobs
- [ ] Failed job tracking (failed_jobs table or similar)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Worker Failure Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Endless retries for all jobs
- [ ] Anti-pattern prevented: Same retry strategy for all jobs
- [ ] Anti-pattern prevented: Ignoring Spot termination in workers
- [ ] Anti-pattern prevented: Large DLQ without review
- [ ] Common mistake prevented: No DLQ for any queue
- [ ] Common mistake prevented: No job timeout
- [ ] Common mistake prevented: Immediate retry with no backoff
- [ ] Common mistake prevented: Not monitoring failure rate

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: DLQ configured for all queues (3-5 max attempts)
- [ ] Verification passed: Exponential backoff with jitter implemented
- [ ] Verification passed: Explicit timeout set on all job classes

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
