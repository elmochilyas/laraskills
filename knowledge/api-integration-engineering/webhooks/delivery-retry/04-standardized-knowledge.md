# ECC Standardized Knowledge — Delivery Retry

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Delivery Retry |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K012, K019, K005 |

## Overview (Engineering Value)
Webhook delivery retry handles failed delivery attempts with configurable backoff strategies, ensuring webhooks are eventually delivered to subscribers even during transient outages. Spatie's laravel-webhook-server supports configurable backoff strategies implementing exponential backoff with jitter, error-aware delays (different delays for 429 vs 5xx), and subscriber-specific retry schedules. The retry pipeline respects circuit breaker state, logs each attempt for audit, and provides events for final failure notification when all attempts are exhausted.

## Core Concepts
- **Backoff Strategy**: Determines delay between retry attempts; pluggable via `BackoffStrategy` interface
- **Exponential Backoff**: Base delay doubles per attempt: `min(base × 2^(attempt-1), maxDelay)`
- **Jitter**: Random variation (±25%) to prevent thundering herd on subscriber recovery
- **Max Attempts**: Upper bound on delivery attempts before marking permanently failed
- **Error-Aware Backoff**: Different delays based on HTTP status code (429 = Retry-After, 5xx = standard)
- **Final Failure Event**: `FinalWebhookCallFailedEvent` for business logic fallback when retries exhausted

## When To Use
- All outgoing webhook delivery (retry is essential for at-least-once semantics)
- Subscriber endpoints with variable reliability
- Critical webhooks where delivery must be eventually guaranteed

## When NOT To Use
- Non-critical notifications where occasional loss is acceptable
- Real-time channels (WebSockets) where retry is irrelevant
- Idempotent events where at-most-once delivery is sufficient

## Best Practices
- Use exponential backoff with full jitter as the default strategy (AWS-recommended)
- Implement error-aware strategies: 429 responses follow Retry-After header, 5xx use standard exponential
- Set max attempts to 5-10 balancing delivery probability vs resource consumption
- Add jitter (±25%) universally to prevent synchronized retry storms on subscriber recovery
- Test retry behavior with subscriber endpoint simulation tools

## Architecture Guidelines
- Spatie's `ExponentialBackoffStrategy` for default; custom class for subscriber-specific schedules
- Backoff configuration in `config/webhook-server.php` per subscriber group
- Standard Webhooks retry schedule: 5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h
- Circuit breaker middleware prevents retry when subscriber is persistently down
- Final failure event triggers alternative delivery paths (email, SMS fallback)

## Performance Considerations
- Backoff strategy execution: negligible CPU (<1µs per call)
- Long retry delays keep WebhookCall in pending state longer
- Queue worker holds retry metadata for active retry chains
- Database cleanup must account for max retry horizon (3+ days for some schedules)

## Common Mistakes
- No backoff strategy configured (default exponential may be too aggressive for some subscribers)
- Zero or sub-second delays causing retry storms on the subscriber
- Same backoff for all subscribers regardless of their capacity
- No jitter in high-volume systems (thundering herd on recovery)
- Confusing attempt numbering: attempt 1 is initial try; attempt 2+ are retries

## Related Topics
- **Prerequisites**: Exponential backoff, HTTP status codes
- **Closely Related**: Dispatching webhooks (ku-01), circuit breaker (resilience)
- **Advanced**: Standard Webhooks retry schedule, subscriber health-based retry
- **Cross-Domain**: Job scheduling, delivery guarantees

## Verification
- [ ] Backoff strategy configured with exponential + jitter
- [ ] Max attempts set (5-10 typical)
- [ ] Error-aware delays: 429 follows Retry-After, 5xx uses exponential
- [ ] FinalFailureEvent triggers business logic fallback
- [ ] Circuit breaker stops retry when subscriber is down
- [ ] Retry behavior tested under simulated failures
