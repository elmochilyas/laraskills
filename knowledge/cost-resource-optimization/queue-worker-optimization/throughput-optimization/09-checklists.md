# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Throughput Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Long polling configured (WaitTimeSeconds=20)
- [ ] MaxNumberOfMessages=10 configured
- [ ] Fast and slow jobs on separate queues
- [ ] Job durations profiled and monitored
- [ ] Parallel/async processing for I/O-heavy jobs
- [ ] Use long polling with WaitTimeSeconds=20 applied
- [ ] Receive maximum 10 messages per poll applied
- [ ] Process messages in parallel within a batch applied
- [ ] 1-second polling interval prevented
- [ ] All jobs on same queue prevented
- [ ] Short polling default prevented
- [ ] Single message receive prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker configuration
- [ ] Architecture guideline: Process messages in parallel (Guzzle pool, ReactPHP, or Laravel's `@async`)
- [ ] Architecture guideline: Use separate queues for fast (<100ms) and slow (>1s) jobs
- [ ] Architecture guideline: Monitor throughput
- [ ] Architecture guideline: Optimize slowest 5% of jobs first (biggest impact on throughput)
- [ ] Architecture guideline: Use SQS Extended Client for messages > 256KB

---

# Implementation Checklist

- [ ] Best practice applied: Use long polling with WaitTimeSeconds=20
- [ ] Best practice applied: Receive maximum 10 messages per poll
- [ ] Best practice applied: Process messages in parallel within a batch
- [ ] Best practice applied: Optimize job duration to < 500ms
- [ ] Best practice applied: Use SQS extended client for large messages (>256KB)
- [ ] Best practice applied: Separate fast and slow jobs into different queues
- [ ] Workflow step completed: Inventory current Throughput Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Long polling (20s)
- [ ] Batch processing
- [ ] Parallel processing
- [ ] Chunk processing
- [ ] SQS API limits
- [ ] Worker CPU

---

# Security Checklist

- [ ] Long polling is safe (same IAM permissions as short polling)
- [ ] Parallel processing shares worker memory; ensure isolation between jobs
- [ ] Large messages stored in S3 need S3 IAM permissions
- [ ] SQS API throttling can be triggered by aggressive polling; use exponential backoff
- [ ] Monitor for rapid polling as potential abuse indicator

---

# Reliability Checklist

- [ ] Mistake prevented: Short polling default
- [ ] Mistake prevented: Single message receive
- [ ] Mistake prevented: Processing jobs serially within batch
- [ ] Mistake prevented: Not profiling job durations

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Long polling configured (WaitTimeSeconds=20)
- [ ] MaxNumberOfMessages=10 configured
- [ ] Fast and slow jobs on separate queues
- [ ] Job durations profiled and monitored
- [ ] Parallel/async processing for I/O-heavy jobs
- [ ] SQS API cost calculated per worker
- [ ] Throughput optimized (jobs/sec/worker)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Throughput Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 1-second polling interval
- [ ] Anti-pattern prevented: All jobs on same queue
- [ ] Anti-pattern prevented: No throughput monitoring
- [ ] Anti-pattern prevented: Receiving 1 message per poll
- [ ] Common mistake prevented: Short polling default
- [ ] Common mistake prevented: Single message receive
- [ ] Common mistake prevented: Processing jobs serially within batch
- [ ] Common mistake prevented: Not profiling job durations

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Long polling configured (WaitTimeSeconds=20)
- [ ] Verification passed: MaxNumberOfMessages=10 configured
- [ ] Verification passed: Fast and slow jobs on separate queues

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
