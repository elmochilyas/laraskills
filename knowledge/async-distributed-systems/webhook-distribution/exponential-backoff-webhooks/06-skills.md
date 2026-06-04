# Skill: Implement Exponential Backoff for Webhook Delivery

## Purpose
Configure exponential backoff with jitter and a maximum delay cap for webhook retry timing, preventing thundering herds while providing graduated retry pressure on recovering endpoints.

## When To Use
Webhook delivery retries in the Spatie webhook server; any retry mechanism for external API calls where multiple requests target the same endpoint; transient failure recovery.

## When NOT To Use
Uniform retry intervals acceptable for low-traffic webhooks; single webhook endpoint where thundering herd isn't a concern; no retry needed (fire-and-forget).

## Prerequisites
- Spatie webhook server or custom job class with retry
- `retry_until` timestamp configured

## Inputs
- Base delay (e.g., 10s)
- Retry attempt count
- Maximum delay cap

## Workflow
1. Apply exponential formula: `delay = baseDelay * (2^attempt)`
2. Add jitter: `jitter = random_int(0, delay * 0.3)` — spread retry timing
3. Cap maximum delay: `min(delay + jitter, maxDelay)` — prevent unbounded delays
4. Set `retry_until` on webhook profile to cap total retry window
5. Use Laravel's job `backoff` property for automatic exponential progression
6. Implement on the webhook profile's `ProcessWebhookJob` class

## Validation Checklist
- [ ] Base delay > 0 (10s minimum recommended)
- [ ] Jitter added (30% range)
- [ ] Maximum delay capped (e.g., 3600s = 1 hour)
- [ ] `retry_until` set on profile (absolute deadline)
- [ ] Backoff array matches retry count if using `$backoff`
- [ ] Multiple concurrent webhook deliveries have staggered retry timing due to jitter
- [ ] Thundering herd prevented — not all retries happen simultaneously

## Common Failures
- No jitter — all retries happen at identical intervals, creating thundering herd
- No max delay cap — exponential growth produces hours-long delays
- Linear backoff — doesn't provide graduated recovery pressure
- `retry_until` not set — retries continue indefinitely
- Base delay too low (1s) — retry too aggressive

## Decision Points
- Fast recovery: base 10s, max 600s, `retry_until` 4h
- Standard webhook: base 60s, max 3600s, `retry_until` 24h
- Critical: base 30s, max 1800s, `retry_until` 48h

## Related Rules
- Rule 1: implement-exponential-backoff-with-jitter
- Rule 2: cap-max-retry-delay
- Rule 3: set-retry-until-deadline
- Rule 4: use-job-backoff-property

## Related Skills
- Configure Spatie Webhook Server for Certified Delivery
- Configure Backoff Strategies for Retry Timing
- Write Retry-Safe Job Classes

## Success Criteria
Exponential backoff uses base delay with jitter and max cap, `retry_until` provides absolute deadline, and thundering herd is prevented through staggered retry timing.
