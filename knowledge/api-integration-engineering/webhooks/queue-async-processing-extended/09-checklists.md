# Laravel Queue Integration for Async Webhook Processing — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Laravel Queue Integration for Async Webhook Processing
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel queue fundamentals (jobs, queues, workers)
- [ ] Familiarity with Spatie webhook-client package
- [ ] Basic knowledge of job dispatch and retry mechanisms

## Implementation Checklist
- [ ] Webhook jobs dispatched to dedicated queue (e.g., `webhooks`)
- [ ] `$tries` and `backoff` configured per provider retry schedule
- [ ] Rate limiting middleware applied to job
- [ ] Idempotency check at start of `handle()` method
- [ ] Job timeout exceeds expected API call time but less than queue worker timeout
- [ ] `$maxExceptions` set to allow occasional failures without immediate retry

## Verification Checklist
- [ ] Failed webhooks have dead letter handling
- [ ] Queue length monitored for processing bottlenecks
- [ ] Webhook receipt (HTTP) responds within 10-50ms with queue dispatch

## Security Checklist
- [ ] Sensitive data never passed in job payloads (re-query from database)
- [ ] Webhook signature validated before dispatching to queue
- [ ] Separate queue connections used for untrusted webhook processing
- [ ] Job middleware rate limits downstream API calls per provider

## Performance Checklist
- [ ] Webhook receipt (HTTP): 10-50ms with queue dispatch
- [ ] Queue throughput balanced with worker count and downstream dependencies
- [ ] Job deserialization: <1ms; bottleneck is downstream API calls

## Production Readiness Checklist
- [ ] Dedicated queue worker per webhook queue for resource isolation
- [ ] Separate Horizon auto-scaling pools for webhooks vs application
- [ ] Dead letter handling for webhooks exceeding retry limits
- [ ] Failed_jobs table monitored for manual review

## Common Mistakes to Avoid
- [ ] Avoid processing webhooks synchronously in controller (defeats retry, ties up workers)
- [ ] Avoid not configuring `$tries` (unlimited retry without circuit breaker)
- [ ] Avoid passing entire Eloquent model to job (serialization issues)
- [ ] Avoid not setting `backoff` on webhook jobs (immediate retry on failure)
- [ ] Avoid using `dispatchNow` in production (defeats queuing purpose)
