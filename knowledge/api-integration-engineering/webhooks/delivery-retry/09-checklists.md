# Delivery Retry — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Outgoing Webhooks
- **Knowledge Unit:** Delivery Retry
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand exponential backoff concepts
- [ ] Familiarity with HTTP status codes (429, 5xx)
- [ ] Knowledge of Spatie laravel-webhook-server retry mechanism

## Implementation Checklist
- [ ] Backoff strategy configured with exponential + jitter
- [ ] Max attempts set (5-10 typical)
- [ ] Error-aware delays: 429 follows Retry-After, 5xx uses exponential
- [ ] FinalFailureEvent triggers business logic fallback
- [ ] Circuit breaker stops retry when subscriber is down
- [ ] Retry behavior tested under simulated failures
- [ ] Jitter (±25%) added universally to prevent thundering herd

## Verification Checklist
- [ ] Retry schedule matches subscriber capacity
- [ ] Backoff strategy execution: negligible CPU (<1µs per call)
- [ ] Final failure triggers alternative delivery paths (email, SMS fallback)

## Security Checklist
- [ ] No sensitive data in retry logs
- [ ] Circuit breaker prevents abuse of failing endpoints
- [ ] Idempotency at receiver ensures safe retries

## Performance Checklist
- [ ] Backoff strategy: negligible CPU
- [ ] Long retry delays keep WebhookCall in pending state
- [ ] Database cleanup accounts for max retry horizon (3+ days)

## Production Readiness Checklist
- [ ] Spatie `ExponentialBackoffStrategy` for default; custom for subscriber-specific
- [ ] Backoff configuration in `config/webhook-server.php` per subscriber group
- [ ] Standard Webhooks retry schedule: 5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h
- [ ] Circuit breaker middleware prevents retry when subscriber persistently down

## Common Mistakes to Avoid
- [ ] Avoid no backoff strategy configured (default may be too aggressive)
- [ ] Avoid zero or sub-second delays causing retry storms
- [ ] Avoid same backoff for all subscribers regardless of capacity
- [ ] Avoid no jitter in high-volume systems (thundering herd on recovery)
- [ ] Avoid confusing attempt numbering (attempt 1 = initial, 2+ = retries)
