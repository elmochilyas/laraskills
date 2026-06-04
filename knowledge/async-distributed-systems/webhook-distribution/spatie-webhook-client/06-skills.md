# Skill: Set Up Spatie Webhook Client for Receiving

## Purpose
Use Spatie's `laravel-webhook-client` to receive, validate, and process incoming webhooks with signature verification, replay attack prevention, and async payload handling.

## When To Use
Receiving webhooks from external systems where payload authenticity must be verified; when signature verification and replay protection are needed; when async processing of incoming webhooks is required.

## When NOT To Use
Trusted internal network; webhooks from a single known source where simple request validation is sufficient; already using Laravel's built-in request handling for all webhook endpoints.

## Prerequisites
- `spatie/laravel-webhook-client` installed
- Shared secret with sending system
- `webhook_calls` table migrated (from webhook-server or client package)

## Inputs
- Webhook profile (maps incoming webhook to handler)
- Shared secret for signature verification
- Timestamp tolerance window

## Workflow
1. Create webhook profile implementing `WebhookProfile` — maps incoming payload to job/event
2. Configure `config/webhook-client.php` with endpoint name, secret, profile class
3. Validate signature: recompute HMAC from timestamp + payload, compare with `Signature` header
4. Set timestamp tolerance (default 5 minutes) — reject expired requests
5. Store incoming webhook in `webhook_calls` table
6. Dispatch a queued job to process the payload (HTTP returns immediately)
7. Implement idempotency in the processing job — same webhook may arrive twice

## Validation Checklist
- [ ] Webhook profile created with handler mapping
- [ ] Secret from sending system stored in env var
- [ ] Signature validation enabled (HMAC-SHA256)
- [ ] Timestamp tolerance configured (5 min default)
- [ ] Async processing job configured (not synchronous)
- [ ] Processing job is idempotent
- [ ] Replay attack prevention active
- [ ] `webhook_calls` table storing incoming webhooks

## Common Failures
- No profile configured — all incoming webhooks rejected with 500
- No idempotency — duplicate webhooks cause duplicate processing
- Timestamp tolerance too high (>15 min) — replay risk
- No signature validation — accepts any POST to webhook endpoint
- Processing synchronously — slow webhook response causes sender timeouts

## Decision Points
- Per-sender profile: one profile per sender for different handling
- Processing: always queue the handler job for async execution
- Logging: store all valid webhooks in DB for audit trail

## Related Rules
- Rule 1: validate-webhook-secret-on-receive
- Rule 2: set-reasonable-timeout-and-retries
- Rule 3: implement-idempotency
- Rule 4: use-timestamped-nonce-in-signature

## Related Skills
- Configure Spatie Webhook Server for Certified Delivery
- Prevent Webhook Replay Attacks
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
Incoming webhooks are validated for signature and freshness, stored in `webhook_calls`, processed asynchronously, and the processing job is idempotent against duplicates.
