# Skill: Apply Exponential Backoff with Jitter to Webhook Delivery

## Purpose
Implement exponential backoff with full/equal jitter for webhook delivery retries to distribute retry load and prevent cascading failures.

## When To Use
- High-volume webhook delivery systems
- Preventing thundering herd on subscriber recovery
- Respecting subscriber rate limits during retries

## When NOT To Use
- Low-volume webhooks (simple retry delay suffices)
- Synchronous delivery without retry

## Prerequisites
- Queued webhook delivery
- Database or config for backoff parameters

## Workflow
1. Define base delay (e.g., 1 second) and multiplier (2-3x)
2. Calculate delay: `$delay = min($base * (2 ** $attempt), $maxDelay)`
3. Apply jitter: `$delay += random_int(0, (int)($delay * 0.1))`
4. Cap at maximum delay (e.g., 24 hours)
5. Set maximum retry count (6-10 attempts)
6. Use `$backoff` array on queued job for declarative schedule
7. Log retry attempt number and delay for monitoring
8. Test retry timing to verify backoff schedule

## Validation Checklist
- [ ] Exponential backoff formula implemented correctly
- [ ] Jitter applied to prevent thundering herd
- [ ] Maximum delay configured and enforced
- [ ] Maximum retry count configured
- [ ] `$backoff` array used on job class
- [ ] Retry timing verified through testing
- [ ] Retry delay logged per attempt
