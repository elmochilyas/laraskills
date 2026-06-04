# ECC Standardized Knowledge — Laravel Queue Integration for Async Webhook Processing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Laravel Queue Integration for Async Webhook Processing |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K013, K011, K028 |

## Overview (Engineering Value)
Queue-first processing is the architectural cornerstone of production webhook receiving: the HTTP endpoint responds 200 quickly to acknowledge receipt, then dispatches a queue job for actual processing. This prevents upstream provider timeouts, protects the application from processing delays, and enables retry with backoff. Laravel's queue system provides the job dispatch, retry, and failure infrastructure that makes this pattern practical.

## Core Concepts
- **Dual-Phase Architecture**: Phase 1 (HTTP) validates + stores + responds; Phase 2 (Queue) processes business logic
- **Job Dispatch**: `dispatch()->onQueue()` from the webhook receiver
- **Job Retry**: `$tries`, `backoff`, `maxExceptions` properties control retry behavior
- **Failed Jobs**: Exceeded retries go to `failed_jobs` table for manual review
- **Queue Selection**: Dedicated queues for webhook processing isolation
- **Job Middleware**: RateLimited, circuit breaker middleware wrap job execution

## When To Use
- All incoming webhook processing in production applications
- Any integration where webhook volume or processing time is unpredictable
- Multi-provider webhook reception with different processing requirements

## When NOT To Use
- Health check endpoints that must respond synchronously
- Very low-volume webhooks where queue overhead exceeds processing time
- Requests requiring immediate synchronous response (rare for webhooks)

## Best Practices
- Route webhook jobs to a dedicated queue (`webhooks`) for isolation
- Set `$tries` and `backoff` to match provider retry schedules
- Apply `RateLimited` middleware to prevent downstream processing storms
- Use `$maxExceptions` to allow occasional failures without immediate retry
- Implement idempotency check at start of `handle()` before processing

## Architecture Guidelines
- Dedicated queue worker per webhook queue for resource isolation
- Job timeout > expected API call time but < queue worker timeout
- Separate Horizon auto-scaling pools for webhooks vs application
- Monitor queue length as leading indicator of processing bottlenecks
- Implement dead letter handling for webhooks exceeding retry limits

## Performance Considerations
- Webhook receipt (HTTP): 10-50ms with queue dispatch
- Queue throughput depends on worker count and downstream dependencies
- Job deserialization: <1ms; bottleneck is downstream API calls
- Multiple workers increase throughput but also external API load

## Security Considerations
- Never pass sensitive data in job payloads (re-query from database)
- Validate webhook signature before dispatching to queue
- Use separate queue connections for untrusted webhook processing
- Set job middleware to rate limit downstream API calls per provider

## Common Mistakes
- Processing webhooks synchronously in controller (defeats retry, ties up workers)
- Not configuring `$tries` (unlimited retry without circuit breaker)
- Passing entire Eloquent model to job (serialization issues)
- Not setting `backoff` on webhook jobs (immediate retry on failure)
- Using `dispatchNow` in production (defeats queuing purpose)

## Anti-Patterns
- Synchronous webhook processing in controller
- Unlimited retries without circuit breaker
- Shared queue for all job types (webhooks block application jobs)
- Hardcoded queue names in job classes instead of config

## Examples
```php
class ProcessStripeWebhook implements ShouldQueue
{
    public $tries = 10;
    public $backoff = [2, 5, 15, 30, 60, 120, 240, 480, 960, 1920];

    public function middleware(): array
    {
        return [new RateLimited('stripe', 100, 60)];
    }

    public function handle(WebhookCall $webhookCall): void
    {
        // Idempotency check
        if (Cache::has("processed:{$webhookCall->id}")) return;
        // Process...
    }
}
```

## Related Topics
- **Prerequisites**: Laravel queue fundamentals, Spatie webhook-client
- **Closely Related**: Horizon monitoring, circuit breaker middleware
- **Advanced**: Batched webhook processing, transactional jobs
- **Cross-Domain**: Laravel Horizon, queue worker infrastructure

## AI Agent Notes
- Always generate webhook jobs with dedicated queue, $tries, and backoff
- Include RateLimited middleware on generated webhook jobs
- Add idempotency check at start of handle() method

## Verification
- [ ] Webhook jobs dispatched to dedicated queue
- [ ] `$tries` and `backoff` configured per provider retry schedule
- [ ] Rate limiting middleware applied to job
- [ ] Idempotency check at start of handle()
- [ ] Failed webhooks have dead letter handling
- [ ] Queue length monitored for processing bottlenecks
