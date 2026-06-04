# Skill: Implement Exponential Backoff for Webhook Delivery Retries

## Purpose
Configure exponential backoff with jitter for webhook delivery retries to prevent thundering herd on recovery and respect subscriber rate limits.

## When To Use
- Webhook delivery retry with growing delay intervals
- Preventing overload on recovering subscriber services
- Complying with subscriber rate limits during retries

## When NOT To Use
- Synchronous API calls (use Http retry)
- Non-retryable webhook delivery scenarios

## Prerequisites
- Queue system for delayed webhook delivery
- Webhook delivery failure handling

## Workflow
1. Define retry schedule: 1min, 5min, 15min, 1hr, 6hr, 24hr
2. Implement exponential backoff: `delay = base * (2 ^ attempt)`
3. Add jitter: `delay += random(0, delay * 0.1)` to prevent thundering herd
4. Cap maximum delay (e.g., 24 hours)
5. Set maximum retry attempts (e.g., 6-10)
6. Configure retry in Spatie Webhook Server or custom job
7. Log retry attempts and delays for monitoring
8. Implement dead-letter after max retries

## Validation Checklist
- [ ] Retry schedule defined with exponential growth
- [ ] Jitter added to prevent thundering herd
- [ ] Maximum delay configured and applied
- [ ] Maximum retry count configured
- [ ] Retry delays logged for monitoring
- [ ] Dead-letter handling after max retries
