# ECC Standardized Knowledge — Exponential Backoff for Webhook Delivery

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | outgoing-webhooks |
| Knowledge Unit ID | ku-14 |
| Knowledge Unit | Exponential Backoff for Webhook Delivery |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009 |

## Overview (Engineering Value)
Exponential backoff increases the delay between consecutive webhook delivery attempts, preventing retry storms and allowing downstream systems time to recover. Jitter is added to avoid thundering herd problems. Combined with a maximum retry limit, exponential backoff is the standard pattern for resilient webhook delivery.

## Core Concepts
- **Backoff Delay**: Delay doubles with each attempt: 1s, 2s, 4s, 8s, 16s
- **Exponential Backoff**: `delay = initial_delay * (2 ^ attempt_number)`
- **Jitter**: Random variance added to avoid synchronized retries
- **Maximum Attempts**: Hard limit on retry count (typically 3-10)
- **Cap Delay**: Maximum delay ceiling (e.g., 1 hour) to prevent infinite waits
- **Full Jitter**: Random delay between 0 and current backoff value
- **Equal Jitter**: Split delay between base and random portion

## When To Use
- Outgoing webhook delivery with retry requirements
- Any retry scenario where downstream may be overloaded
- Batch job processing with potential resource contention

## When NOT To Use
- Real-time delivery requiring immediate retry
- Downstream explicitly requests fixed-interval retries
- Rate-limited APIs with specific retry-after headers

## Best Practices
- Always add jitter to prevent thundering herd
- Cap maximum delay at a reasonable value (e.g., 1 hour)
- Use full jitter for simplest implementation
- Log backoff state for each retry sequence
- Configure max attempts based on business SLA (e.g., 24h delivery window)

## Architecture Guidelines
- Backoff config per webhook type based on delivery urgency
- Retry state stored in webhook delivery model
- Queue worker processes retries based on available_at
- Monitoring on retry rate and max attempts reached
- Dead-letter queue for permanently failed deliveries

## Performance Considerations
- Backoff computation is sub-millisecond
- Queue-based retry uses available_at column for efficient polling
- No additional resource consumption during backoff delay
- Full jitter causes ~50% expected delay vs pure exponential

## Common Mistakes
- Not adding jitter (thundering herd on recovery)
- No maximum delay cap (retries after days for transient issue)
- Starting with too-small initial delay (<1s)
- Implementing backoff in database (expensive) instead of queue
- Not resetting backoff count on first successful delivery

## Related Topics
- **Prerequisites**: Queue workers, retry patterns
- **Closely Related**: Webhook delivery, retry strategies
- **Advanced**: Circuit breaker, bulkhead pattern
- **Cross-Domain**: Distributed systems, reliability engineering

## Verification
- [ ] Jitter implemented (full jitter recommended)
- [ ] Maximum delay cap configured
- [ ] Maximum attempts configured based on SLA
- [ ] Retry state persisted for visibility
- [ ] Dead-letter queue for final failures
- [ ] Backoff reset on successful delivery
