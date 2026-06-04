# ECC Standardized Knowledge — Exponential Backoff Customization in Spatie webhook-server

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Exponential Backoff Customization in Spatie webhook-server |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K019, K012, K005 |

## Overview (Engineering Value)
Spatie's laravel-webhook-server dispatches webhook calls with built-in retry on failure, using configurable backoff strategies. The default exponential backoff increases delay between retry attempts, preventing retry storms against downstream endpoints. Custom backoff strategies (linear, custom exponential, jitter) can be implemented by extending the base strategy class. This customization is essential for matching subscriber capacity, respecting subscriber rate limits, and optimizing delivery reliability.

## Core Concepts
- **Exponential Backoff**: Delay doubles with each retry: 2^n seconds (default: 1, 2, 4, 8, 16...)
- **BackoffStrategy Interface**: `wait(int $attempt): int` returns seconds to wait before next attempt
- **Jitter**: Random variation added to backoff to prevent thundering herd
- **Max Attempts**: Total retry count before final failure (configurable per webhook)
- **Retry Schedule**: Default exponential; can be customized per webhook call
- **FinalWebhookCallFailedEvent**: Fired when all retry attempts exhausted

## When To Use
- All outgoing webhook dispatches requiring reliable delivery
- Integrations where subscriber endpoints have rate limits
- High-volume webhook sending with potential for retry storms
- When default Spatie backoff doesn't match subscriber capacity

## When NOT To Use
- Fire-and-forget webhooks where retry is not needed
- Internal service webhooks with guaranteed availability
- Webhooks sent through managed gateways (gateway handles retry)

## Best Practices
- Set max attempts based on business requirements (10-15 typical for critical webhooks)
- Add jitter (±25%) to prevent thundering herd when many webhooks fail simultaneously
- Customize backoff per event type (critical events retry more aggressively)
- Monitor retry rates and final failure events as key delivery metrics
- Implement webhook endpoint health checks to skip retries for dead endpoints

## Architecture Guidelines
- Extend `BackoffStrategy` class for custom schedules
- Configure per-webhook-call backoff via `$webhookCall->useStrategy()`
- Store retry attempt count in webhook_calls table for tracking
- Log final failures with full context for manual retry or reconciliation
- Use jitter-based exponential backoff as the production default

## Performance Considerations
- Backoff computation: negligible (in-memory calculation)
- Retry attempts add total delivery latency equal to sum of all backoff delays
- Jitter randomization adds no computational overhead
- Database storage of retry state adds trivial overhead per webhook call

## Security Considerations
- Never include sensitive data in retry logs or failure events
- Implement idempotency at receiver so retries are safe
- Set maximum retry horizon (time limit) to prevent infinite retry loops
- Monitor for retry abuse (subscriber causing repeated retries intentionally)

## Common Mistakes
- Using default backoff without considering subscriber rate limits
- Not adding jitter (retry storms when service recovers)
- Setting max attempts too high (delays final failure detection)
- Setting max attempts too low (premature failure on transient blips)
- Not logging final failures with sufficient debugging context

## Anti-Patterns
- Infinite retries without circuit breaker
- No jitter on exponential backoff
- Same backoff for all event types regardless of criticality
- Fire-and-forget without any retry for critical webhooks

## Examples
```php
class JitterExponentialBackoff implements BackoffStrategy
{
    public function wait(int $attempt): int
    {
        $seconds = min(3600, pow(2, $attempt));
        $jitter = $seconds * (0.75 + mt_rand(0, 5000) / 10000); // ±25%
        return (int) ceil($jitter);
    }
}
```

## Related Topics
- **Prerequisites**: Spatie webhook-server, retry fundamentals
- **Closely Related**: Delivery tracking, webhook signing, webhook gateways
- **Advanced**: Adaptive backoff based on subscriber health, circuit breaker integration
- **Cross-Domain**: Retry theory, distributed systems reliability

## AI Agent Notes
- Use jitter-based exponential backoff as the default strategy
- Set max_attempts to 10-15 for production webhooks
- Override backoff per webhook call only for specific requirements

## Verification
- [ ] Backoff strategy configured with jitter
- [ ] Max attempts set based on business criticality
- [ ] FinalWebhookCallFailedEvent handled for alerting
- [ ] Retry rate monitored as delivery metric
- [ ] Custom strategy tested with expected subscriber load
