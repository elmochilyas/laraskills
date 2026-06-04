# Skill: Configure Spatie Webhook Server for Certified Delivery

## Purpose
Use Spatie's `laravel-webhook-server` to dispatch outbound webhooks with HMAC signing, queued delivery, retry logic, and delivery audit trails.

## When To Use
Multiple external endpoints receiving event notifications from your app; need delivery tracking, automatic retry, signature verification, and audit trails for outbound HTTP calls.

## When NOT To Use
Simple fire-and-forget HTTP calls (use `Http::post()` in a job); single internal endpoint (overhead of full package); webhook server is not needed on the sending side (use `laravel-webhook-client` for receiving).

## Prerequisites
- `spatie/laravel-webhook-server` installed
- Database table for `webhook_calls` (published and migrated)
- Shared secret with receiving endpoint

## Inputs
- Webhook profile class with event name, payload type, queue config
- Shared secret for HMAC signing
- `retry_until` timestamp

## Workflow
1. Create a webhook profile class implementing `WebhookProfile`
2. Configure `signing_secret` per endpoint, stored in env vars
3. Config file: `config/webhook-server.php` — set skip state storage, batch size
4. Dispatch: `WebhookCall::create()->url($url)->payload($data)->useSecret($secret)->dispatch()`
5. The call is queued, signed, and delivered automatically
6. Monitor `webhook_calls` table for delivery status
7. Configure retry in profile: `retry_until` sets absolute deadline

## Validation Checklist
- [ ] Webhook profile created with event name, serializer, queue config
- [ ] Secrets stored in env vars, not hardcoded
- [ ] `retry_until` configured for delivery deadline
- [ ] Queue config (connection, queue) set on profile
- [ ] `webhook_calls` table migrated
- [ ] Dispatch test works end-to-end
- [ ] HMAC signature verified on receiving side
- [ ] Monitor delivery failures via `webhook_calls` table

## Common Failures
- No `retry_until` — webhook retries indefinitely
- Secret in source code — security exposure
- Forgetting to call `useSecret()` — unsigned webhook rejected by client
- No queue connection set — uses default queue, may be wrong connection
- No monitoring on delivery failures — silent failures in retry cycle

## Decision Points
- Event-driven dispatching: dispatch webhook call in event listener
- Per-endpoint config: separate profile per target endpoint
- `retry_until`: align with business SLA (e.g., 24 hours)

## Related Rules
- Rule 1: sign-all-outgoing-webhooks
- Rule 2: validate-webhook-secret-on-receive
- Rule 3: set-reasonable-timeout-and-retries
- Rule 4: monitor-webhook-delivery-failures

## Related Skills
- Set Up Spatie Webhook Client for Receiving
- Implement Exponential Backoff for Webhook Delivery
- Prevent Webhook Replay Attacks

## Success Criteria
Outbound webhooks are signed with HMAC, dispatched via queue, retried within `retry_until` window, and delivery status is tracked and monitored.
