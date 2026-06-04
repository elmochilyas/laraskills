# Retry & Failure — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Retry & Failure
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel queue retry system (`$tries`, `backoff`, `maxExceptions`)
- [ ] Familiarity with exponential backoff concepts
- [ ] Knowledge of circuit breaker pattern for downstream protection

## Implementation Checklist
- [ ] Retry with exponential backoff configured on webhook jobs
- [ ] Circuit breaker middleware applied to stop retry during outages
- [ ] Final failure event triggers alerting/notification
- [ ] Manual retry UI available for failed webhooks
- [ ] Failed webhook rates monitored and alerted
- [ ] Exponential backoff with jitter (30s base, 12h max typical)
- [ ] `$maxExceptions` set to 3 to tolerate occasional failures

## Verification Checklist
- [ ] Retry behavior tested under simulated failures
- [ ] Failed job dashboard accessible for manual retry
- [ ] Circuit breaker actually stops retry when downstream is down

## Security Checklist
- [ ] No sensitive data in retry logs
- [ ] Circuit breaker prevents retry storms on failing services
- [ ] Idempotent processing ensures retry safety

## Performance Checklist
- [ ] Retry delay calculation negligible CPU cost
- [ ] Long backoff delays keep webhook in pending state
- [ ] Circuit breaker check adds ~1-5ms cache read per job

## Production Readiness Checklist
- [ ] Event listener on `FinalWebhookCallFailedEvent` for escalation
- [ ] Dashboard for manual retry of failed webhooks
- [ ] Dead letter queue for webhooks that exhaust all retry paths
- [ ] Fuse `CircuitBreakerMiddleware` for queue job circuit breaking

## Common Mistakes to Avoid
- [ ] Avoid not configuring `backoff` (immediate retry wastes resources)
- [ ] Avoid counting all exceptions as failures for retry (some shouldn't trigger retry)
- [ ] Avoid no circuit breaker around downstream calls (hammer failing service)
- [ ] Avoid no manual retry capability (failed webhooks lost forever)
- [ ] Avoid not monitoring failed webhook rates (silent failures accumulate)
