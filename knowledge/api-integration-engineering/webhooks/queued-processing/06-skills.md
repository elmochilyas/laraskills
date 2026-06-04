# Skill: Implement Queued Processing of Incoming Webhooks

## Purpose
Dispatch incoming webhook business logic to queue jobs for reliable, retryable, and scalable processing decoupled from HTTP request handling.

## When To Use
- Production webhook endpoints requiring reliable processing
- Webhooks that trigger complex or slow business logic
- Ensuring webhook processing survives after HTTP request completes

## When NOT To Use
- Simple, fast webhook handling that can run synchronously
- Prototypes without queue infrastructure

## Prerequisites
- Queue driver configured (Redis, SQS, database)
- Queue workers running

## Workflow
1. Validate webhook signature synchronously before queuing
2. Create job class with webhook payload data (not request or model)
3. Use `ShouldBeUnique` trait or manual unique key deduplication
4. Configure `$tries` and `$backoff` for retry behavior
5. Handle failure: `fail()` for non-retryable, `release()` for transient
6. Dispatch to specific queue: `->onQueue('webhooks')`
7. Return 200 after validation and queue dispatch
8. Monitor queue depth and webhook processing latency

## Validation Checklist
- [ ] Signature validated before queue dispatch
- [ ] Job receives payload data (not request/model)
- [ ] Unique constraints prevent duplicate processing
- [ ] Retry/backoff configured for transient failures
- [ ] Specific queue used for webhook jobs
- [ ] HTTP 200 returned promptly after dispatch
- [ ] Queue depth and latency monitored
