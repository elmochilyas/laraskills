# Spatie laravel-webhook-server Dispatch and Retry Customization — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Outgoing Webhooks
- **Knowledge Unit:** Spatie laravel-webhook-server Dispatch and Retry Customization
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand queue fundamentals and HMAC signing
- [ ] Familiarity with Spatie laravel-webhook-server architecture
- [ ] Knowledge of `WebhookCall` model lifecycle

## Implementation Checklist
- [ ] Webhook dispatch on queue, not synchronous
- [ ] `max_attempts` configured for retry behavior (10-15 typical)
- [ ] `FinalWebhookCallFailedEvent` listener implemented
- [ ] Webhook URLs encrypted at rest
- [ ] Old `WebhookCall` records cleaned up via scheduled job
- [ ] Signing secrets unique per subscriber
- [ ] `WebhookCall::create()` dispatch in service classes, not controllers

## Verification Checklist
- [ ] Lifecycle events (success/failure/final) all handled
- [ ] `WebhookCall` model tracks each dispatch attempt
- [ ] Delivery attempt logging with response status and duration

## Security Checklist
- [ ] All outgoing webhooks signed so subscribers can verify authenticity
- [ ] Raw signing secrets never logged
- [ ] HTTPS for all webhook delivery endpoints
- [ ] Subscriber endpoint verification before adding to system
- [ ] Signing secrets rotated regularly

## Performance Checklist
- [ ] WebhookCall creation: ~5-10ms (database write)
- [ ] Signing: <1ms per webhook
- [ ] HTTP dispatch time depends on subscriber response time
- [ ] Cleanup strategy needed: old WebhookCall records grow indefinitely

## Production Readiness Checklist
- [ ] Dedicated queue for webhook dispatch (`webhook-dispatches`)
- [ ] Per-endpoint webhook secrets (never shared across subscribers)
- [ ] Webhook endpoint health monitoring to skip dead subscribers
- [ ] Signed payloads for subscriber authenticity verification

## Common Mistakes to Avoid
- [ ] Avoid dispatching webhooks synchronously from HTTP requests
- [ ] Avoid not handling `FinalWebhookCallFailedEvent` (silent delivery failures)
- [ ] Avoid storing subscriber webhook URLs without encryption at rest
- [ ] Avoid not cleaning up old WebhookCall records (unbounded database growth)
- [ ] Avoid using same signing secret for all subscribers
