# Queued Processing — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Queued Processing
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel queues and job lifecycle
- [ ] Familiarity with Spatie `ProcessWebhookJob` default behavior
- [ ] Knowledge of job dispatch, retry, and failure handling

## Implementation Checklist
- [ ] Webhook processing dispatched to queue, not handled in HTTP request
- [ ] Dedicated queue configured for webhook processing (e.g., `webhooks`)
- [ ] Job timeout configured exceeding expected processing time
- [ ] Circuit breaker middleware applied to webhook jobs
- [ ] Failed webhooks logged and notified for manual review
- [ ] `$tries` and `backoff` configured on `ProcessWebhookJob`
- [ ] Idempotency check at start of job processing

## Verification Checklist
- [ ] HTTP receipt: 10-50ms with queue dispatch
- [ ] Failed job dashboard accessible for manual review
- [ ] Dead letter handling implemented for exhausted retries

## Security Checklist
- [ ] Signature verified before queue dispatch
- [ ] Rate limiting middleware on webhook jobs to protect downstream services
- [ ] Circuit breaker prevents retry storms during outages

## Performance Checklist
- [ ] Queue throughput balanced with worker count
- [ ] Job deserialization <1ms; downstream API calls are bottleneck
- [ ] Multiple workers configured but external API load considered

## Production Readiness Checklist
- [ ] Dedicated Horizon worker pool for webhook queue
- [ ] Job middleware for rate limiting, circuit breaker, and idempotency
- [ ] Final failure notification for manual review
- [ ] Queue length monitored as leading indicator

## Common Mistakes to Avoid
- [ ] Avoid processing webhooks synchronously in the controller
- [ ] Avoid not configuring `$tries` or using `$tries = 0` without circuit breaker
- [ ] Avoid not setting `backoff` on webhook jobs (immediate retry floods logs)
- [ ] Avoid passing entire `WebhookCall` model to job (pass ID instead)
