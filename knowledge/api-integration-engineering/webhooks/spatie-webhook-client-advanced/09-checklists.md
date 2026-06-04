# Spatie laravel-webhook-client Configuration and Customization — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Spatie laravel-webhook-client Configuration and Customization
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand CSRF bypass requirements for webhook endpoints
- [ ] Familiarity with Laravel queues and job dispatch
- [ ] Knowledge of signature verification concepts

## Implementation Checklist
- [ ] WebhookConfig configured per provider in `config/webhook-client.php`
- [ ] CSRF exception configured for webhook URLs
- [ ] `ProcessWebhookJob` defined and dispatched
- [ ] `delete_after_days` set to control database growth
- [ ] `InvalidWebhookSignatureEvent` monitored for alerting
- [ ] Webhook routes cached after deployment
- [ ] Unique `ProcessWebhookJob` per provider to isolate processing logic

## Verification Checklist
- [ ] Webhook config includes all keys: `signing_secret`, `signature_header_name`, `signature_validator`, `webhook_profile`, `process_webhook_job`
- [ ] Provider-specific signing secrets used (never reused across providers)
- [ ] Idempotency in `ProcessWebhookJob` to handle duplicate delivery

## Security Checklist
- [ ] Webhook URLs in CSRF exception list (419 errors otherwise)
- [ ] Timing-safe comparison in all signature validators
- [ ] Raw signing secrets never exposed in logs or error responses
- [ ] Signing secrets rotated regularly using multi-config transition
- [ ] Rate limiting on webhook endpoints regardless of package

## Performance Checklist
- [ ] Signature verification: <1ms; main bottleneck is database write
- [ ] Queue job dispatch adds ~1-5ms to response time
- [ ] Index `name` and `created_at` columns on `webhook_calls` for cleanup
- [ ] Short TTL for `delete_after_days` (30 days default)

## Production Readiness Checklist
- [ ] One WebhookConfig per external provider
- [ ] Separate queue connection for webhook processing
- [ ] Provider-relevant headers stored in `store_headers` config for audit
- [ ] Route webhooks to provider-specific event handlers via job dispatch

## Common Mistakes to Avoid
- [ ] Avoid forgetting CSRF exception (causes 419 errors on all webhooks)
- [ ] Avoid not configuring `process_webhook_job` (webhooks stored but never processed)
- [ ] Avoid same signing secret across multiple providers
- [ ] Avoid modifying `WebhookCall` payload after creation (write-once)
- [ ] Avoid processing webhooks synchronously in controller
