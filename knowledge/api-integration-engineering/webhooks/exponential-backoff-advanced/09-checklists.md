# Exponential Backoff Customization in Spatie webhook-server — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Outgoing Webhooks
- **Knowledge Unit:** Exponential Backoff Customization in Spatie webhook-server
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Spatie webhook-server dispatch mechanism
- [ ] Familiarity with retry theory and exponential backoff
- [ ] Knowledge of `BackoffStrategy` interface

## Implementation Checklist
- [ ] Backoff strategy configured with jitter
- [ ] Max attempts set based on business criticality (10-15 typical)
- [ ] `FinalWebhookCallFailedEvent` handled for alerting
- [ ] Retry rate monitored as delivery metric
- [ ] Custom strategy tested with expected subscriber load
- [ ] Jitter (±25%) added to prevent thundering herd

## Verification Checklist
- [ ] Custom backoff behavior matches subscriber capacity
- [ ] Retry attempt count stored in webhook_calls table
- [ ] Final failures logged with full context for manual retry

## Security Checklist
- [ ] No sensitive data in retry logs or failure events
- [ ] Idempotency at receiver ensures safe retries
- [ ] Maximum retry horizon set to prevent infinite retry loops
- [ ] Subscriber cannot cause repeated retries intentionally

## Performance Checklist
- [ ] Backoff computation: negligible (in-memory calculation)
- [ ] Retry attempts add total delivery latency equal to sum of delays
- [ ] Jitter randomization adds no computational overhead

## Production Readiness Checklist
- [ ] Extend `BackoffStrategy` class for custom schedules
- [ ] Configure per-webhook-call backoff via `$webhookCall->useStrategy()`
- [ ] Jitter-based exponential backoff as production default
- [ ] Monitor retry rates and final failure events as key delivery metrics

## Common Mistakes to Avoid
- [ ] Avoid using default backoff without considering subscriber rate limits
- [ ] Avoid not adding jitter (retry storms when service recovers)
- [ ] Avoid setting max attempts too high (delays final failure detection)
- [ ] Avoid setting max attempts too low (premature failure on transient blips)
- [ ] Avoid not logging final failures with sufficient debugging context
