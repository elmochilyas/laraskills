# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** Batch Processing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] MaxNumberOfMessages=10 configured on SQS receive
- [ ] DeleteMessageBatch used for message deletion
- [ ] Batch processing reduces API calls by 90%+
- [ ] Partial failure handling for batch operations
- [ ] Fast and slow jobs in separate queues
- [ ] Always set MaxNumberOfMessages=10 applied
- [ ] Use DeleteMessageBatch applied
- [ ] Process batch in worker loop applied
- [ ] Batching unrelated jobs into single Laravel batch prevented
- [ ] Synchronous batch processing in web request prevented
- [ ] MaxNumberOfMessages=1 default prevented
- [ ] DeleteMessage (single) after batch receive prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Worker loop
- [ ] Architecture guideline: Laravel's default worker uses single-message processing; custom worker for high throughput
- [ ] Architecture guideline: For SQS FIFO queues
- [ ] Architecture guideline: Batch processing works best with short-duration jobs (<1 second each)
- [ ] Architecture guideline: For mixed-duration jobs, separate fast and slow jobs into different queues
- [ ] Architecture guideline: Monitor batch size metric (SQS `NumberOfMessagesReceived` / `ReceiveMessage` calls)

---

# Implementation Checklist

- [ ] Best practice applied: Always set MaxNumberOfMessages=10
- [ ] Best practice applied: Use DeleteMessageBatch
- [ ] Best practice applied: Process batch in worker loop
- [ ] Best practice applied: Use Laravel job batching for coordinated workflows
- [ ] Best practice applied: Implement batch progress tracking
- [ ] Best practice applied: Batch SQS SendMessage when dispatching multiple jobs
- [ ] Workflow step completed: Inventory current Batch Processing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Single-message processing
- [ ] Batch processing
- [ ] Worker throughput
- [ ] Latency per message
- [ ] SQS short polling vs long polling

---

# Security Checklist

- [ ] Batch deletion
- [ ] Partial batch failure
- [ ] Batch size limits
- [ ] Message deduplication (FIFO)
- [ ] IAM permissions

---

# Reliability Checklist

- [ ] Mistake prevented: MaxNumberOfMessages=1 default
- [ ] Mistake prevented: DeleteMessage (single) after batch receive
- [ ] Mistake prevented: Batch processing without partial failure handling

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] MaxNumberOfMessages=10 configured on SQS receive
- [ ] DeleteMessageBatch used for message deletion
- [ ] Batch processing reduces API calls by 90%+
- [ ] Partial failure handling for batch operations
- [ ] Fast and slow jobs in separate queues
- [ ] Laravel job batching used for coordinated workflows only
- [ ] SQS API cost per million messages calculated

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Batch Processing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Batching unrelated jobs into single Laravel batch
- [ ] Anti-pattern prevented: Synchronous batch processing in web request
- [ ] Anti-pattern prevented: Batch size > 10
- [ ] Common mistake prevented: MaxNumberOfMessages=1 default
- [ ] Common mistake prevented: DeleteMessage (single) after batch receive
- [ ] Common mistake prevented: Batch processing without partial failure handling

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: MaxNumberOfMessages=10 configured on SQS receive
- [ ] Verification passed: DeleteMessageBatch used for message deletion
- [ ] Verification passed: Batch processing reduces API calls by 90%+

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
