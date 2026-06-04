# Dispatching Webhooks — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Outgoing Webhooks
- **Knowledge Unit:** Dispatching Webhooks
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HTTP POST, queue basics
- [ ] Familiarity with Spatie laravel-webhook-server package
- [ ] Knowledge of HMAC signing for payload authentication

## Implementation Checklist
- [ ] Webhooks dispatched via queue in production (not synchronous)
- [ ] Payload signed with HMAC using subscriber-specific secret
- [ ] Lifecycle events (success/failure/final) handled
- [ ] Failed webhook retries tracked and dashboard-accessible
- [ ] Subscriber URLs stored in database, not config files
- [ ] `backoff_strategy` set for high-volume webhooks

## Verification Checklist
- [ ] Webhook delivery lifecycle fully event-driven
- [ ] `FinalWebhookCallFailedEvent` triggers business logic fallback
- [ ] Payload versioning: version field included for subscriber compatibility

## Security Checklist
- [ ] Signing secrets configured per subscriber (security isolation)
- [ ] Subscriber URL validation before adding to system
- [ ] HTTPS for all webhook delivery endpoints
- [ ] Payload data doesn't leak sensitive information

## Performance Checklist
- [ ] Webhook delivery latency dominated by subscriber response time (100ms-30s)
- [ ] Queue dispatch adds negligible overhead (~1-5ms)
- [ ] Database writes for WebhookCall tracking: ~2-5ms per operation

## Production Readiness Checklist
- [ ] Queue-based dispatch to `webhooks` queue with dedicated workers
- [ ] Event listeners for delivery lifecycle (success/failure/final failure)
- [ ] Dashboard for manual retry of failed webhook dispatches
- [ ] Subscriber health data stored for early dead endpoint detection

## Common Mistakes to Avoid
- [ ] Avoid dispatching webhooks synchronously in HTTP request lifecycle
- [ ] Avoid not handling `FinalWebhookCallFailedEvent` (silent delivery failures)
- [ ] Avoid using mutable payload data that changes between retry attempts
- [ ] Avoid not setting `backoff_strategy` for high-volume webhooks
