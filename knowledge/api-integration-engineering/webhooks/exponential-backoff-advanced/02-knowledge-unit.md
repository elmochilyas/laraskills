# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Outgoing)
Knowledge Unit: Exponential Backoff Customization in Spatie Webhook-Server
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Spatie's laravel-webhook-server supports configurable backoff strategies controlling the timing of delivery retries after failures. The default exponential backoff implementation doubles the delay between each attempt with base interval, maximum delay, and jitter support. Custom strategies can be implemented to match subscriber requirements, retry schedules, or industry standards like the Standard Webhooks specification.

## Core Concepts
- **Backoff Strategy**: Determines the delay before each retry attempt; defined as a callable or class
- **Exponential Backoff**: Delay increases exponentially: `base * (multiplier ^ attempt)` with optional jitter
- **Jitter**: Random variation added to prevent thundering herd when multiple senders retry simultaneously
- **Maximum Delay**: Upper bound on retry interval (e.g., 12 hours); prevents unbounded wait times
- **Attempt Count**: Number of delivery attempts before marking permanently failed
- **Backoff Strategy Configuration**: `backoff_strategy` key in `laravel-webhook-server` config with custom class

## Mental Models
- **Cooling Curve**: Like a hot surface cooling exponentially; initial cooldown (delay) is short, then progressively longer
- **Courteous Wait**: Each retry waits longer to avoid pounding a potentially overwhelmed subscriber
- **Jitter as Randomness**: Like adding random shaking to a timer so multiple alarms don't fire simultaneously

## Internal Mechanics
- Default strategy: `$delay = min($base * (2 ** ($attempt - 1)), $maxDelay)`
- Base delay default: 30 seconds; Multiplier default: 2 (doubles each attempt)
- Jitter implementation: `$delay = $delay * (1 + $jitter * (random_float() - 0.5) * 2)` or similar fractional adjustment
- The strategy receives attempt number and exception, returns delay in seconds
- Custom strategy implements `Spatie\WebhookServer\BackoffStrategy` interface with `calculateDelay(int $attempt, ?Throwable $exception): int`
- Attempt count = 1 is the initial attempt; attempt 2+ are retries
- Package stores attempt information in `webhook_calls` table for audit

## Patterns
- **Custom Backoff Class**: Implement `BackoffStrategy` interface for provider-specific retry schedules
- **Error-Aware Backoff**: Different retry delays based on HTTP status code (429 = longer delay, 5xx = standard exponential)
- **Standard Webhooks Schedule**: Implement the recommended schedule: 5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h
- **Linear Backoff**: Fixed interval (e.g., 5 minutes) for predictable retry spacing
- **Thundering Herd Prevention**: Always add jitter (±25% of delay) to prevent synchronized retry storms

## Architectural Decisions
- Use exponential backoff for most webhook senders; linear for internal services with known capacity
- Implement error-aware strategies: 429 responses trigger longer delays, 5xx trigger standard exponential
- Set max attempts to 5-10 balancing delivery probability vs resource consumption
- Use jitter (±25%) universally to prevent thundering herd on subscriber recovery
- Add subscriber-specific backoff strategies via configuration when subscribers have documented retry preferences

## Tradeoffs
- Aggressive retry (short delays, many attempts) delivers faster but risks overwhelming subscribers
- Conservative retry protects subscribers but delays time-sensitive webhook delivery
- Fixed backoff is predictable but wastes resources on transient failures; exponential is more efficient
- Jitter improves distribution but adds nondeterministic delivery timing

## Performance Considerations
- Backoff strategy execution is negligible CPU cost (<1µs per call)
- Long retry delays mean the `WebhookCall` record stays in pending state longer
- Queue worker memory holds retry-metadata for active retry chains
- High-volume webhook failure scenarios create many delayed job records in the queue
- Database cleanup of completed webhook calls should account for max retry horizon

## Production Considerations
- Monitor retry rates per subscriber to detect endpoint degradation trends
- Configure `max_attempts` to respect subscriber maintenance windows (avoid retrying during known downtime)
- Use `FinalWebhookCallFailedEvent` to trigger alternative delivery paths (email, SMS fallback)
- Implement monitoring on the ratio of successful deliveries on retry 1 vs 2+ (indicates subscriber health)
- Set up alerting for webhooks that exhaust all retry attempts (final failure)
- Log each attempt with delay and response for debugging retry behavior

## Common Mistakes
- Not configuring a backoff strategy, using default exponential (may be too aggressive for some subscribers)
- Setting zero or sub-second delays causing retry storms on the subscriber
- Using the same backoff strategy for all subscribers regardless of their capacity
- Not adding jitter in high-volume webhook systems (thundering herd on recovery)
- Confusing attempt numbering: attempt 1 is the initial try, subsequent attempts are retries

## Failure Modes
- Subscriber permanently down: all retries exhaust, webhook enters `final_failed` state
- Retry storm: aggressive backoff overwhelms already-stressed subscriber, compounding the problem
- Jitter misconfiguration: negative jitter causing zero-delay retries (immediate retry loops)
- Strategy exception: custom backoff class throws an exception, aborting the retry pipeline
- Maximum delay exceeded by cumulative backoff: large delays may exceed queue timeout configuration

## Ecosystem Usage
- Spatie laravel-webhook-server default backoff: exponential with ~30s base, 2x multiplier, ~12h max
- Standard Webhooks spec defines a retry schedule: starting at 5s, ending at 24h, with exponential backoff and jitter
- Stripe webhook retry schedule: immediate, then progressively longer up to 3 days
- GitHub webhook retry: immediate, 1s, 5s, 30s, 1m, 5m, 30m, 1h, 12h
- Custom strategies implement subscriber-specific SLA requirements

## Related Knowledge Units
- K005: Retry Strategies (general retry patterns including exponential backoff)
- K012: Spatie laravel-webhook-server (hosts the backoff configuration)
- K035: Standard Webhooks Specification (defines recommended retry schedule)
- K007: Circuit Breaker Pattern (complementary to retry; prevents retry when service is down)

## Research Notes
- Spatie package uses a `BackoffStrategy` interface for pluggable implementations
- The default strategy is defined in `Spatie\WebhookServer\BackoffStrategy\ExponentialBackoffStrategy`
- Standard Webhooks recommends jitter of ±25% of the current delay
- AWS and Stripe documentation both emphasize jitter as critical for large-scale webhook systems
- Custom strategies can access the exception to implement error-code-specific delays
