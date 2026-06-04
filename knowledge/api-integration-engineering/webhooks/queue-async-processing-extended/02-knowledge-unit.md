# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Incoming)
Knowledge Unit: Laravel Queue Integration for Async Webhook Processing
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Queue-first processing is the architectural cornerstone of production webhook receiving: the HTTP endpoint responds 200 quickly to acknowledge receipt, then dispatches a queue job for actual processing. This pattern prevents upstream providers from timing out, protects the application from processing delays, and enables retry with backoff when processing fails. Laravel's queue system provides the job dispatch, retry, and failure infrastructure.

## Core Concepts
- **Dual-Phase Architecture**: Phase 1 (HTTP) validates signature + stores payload + responds 200; Phase 2 (Queue) processes business logic
- **Job Dispatch**: Laravel's `dispatch()` or `dispatch()->onQueue()` from the webhook receiver
- **Job Retry**: `$tries`, `backoff`, `maxExceptions` properties control failed job retry behavior
- **Failed Jobs**: Jobs exceeding retry limits go to `failed_jobs` table for manual review
- **Queue Selection**: Route webhook processing to dedicated queues for isolation
- **Job Middleware**: Middleware like `RateLimited` or circuit breakers wrap job execution

## Mental Models
- **Fire and Forget**: HTTP layer fires; queue layer forgets (when successful)
- **Buffer Pattern**: Queue absorbs processing spikes, smoothing load over time
- **Circuit Breaker Isolation**: If processing fails repeatedly, the queue buffers, the circuit opens, and no new processing attempts occur

## Internal Mechanics
- Spatie's `ProcessWebhookJob` is dispatched with `dispatch()->onQueue($queueName)`
- The job receives the `WebhookCall` model ID and re-queries it from the database
- Laravel's queue worker picks up the job, deserializes it, and calls `handle()`
- If `handle()` throws, the job is released back to the queue with backoff (or failed per configuration)
- `$maxExceptions` allows a threshold of exceptions before failing (not every exception counts as a retry)
- Job middleware runs before `handle()` and can delay, fail, or skip execution

## Patterns
- **Dedicated Queue**: Route webhook jobs to a dedicated queue (e.g., `webhooks`) to prevent blocking other work
- **Prioritized Processing**: Use queue priority (high/medium/low) for different webhook event types
- **Rate Limited Middleware**: Apply `RateLimited` middleware to prevent processing storms
- **Circuit Breaker Middleware**: Apply fuse/circuit-breaker middleware to stop processing when downstream is failing
- **Idempotency Check**: Check idempotency key at the start of `handle()` before any processing
- **Transactional Processing**: Combine webhook processing with database transactions for consistency

## Architectural Decisions
- Always use queue-first for incoming webhooks unless real-time response is required (rare)
- Choose a dedicated queue worker per queue for resource isolation
- Configure job timeout to exceed the expected maximum API call time but not queue timeout
- Set `$tries` carefully: too few causes premature failure, too many delays failure detection
- Use the `failed` method on jobs for cleanup logic (mark webhook as failed, notify)

## Tradeoffs
- Queue-first adds latency between webhook receipt and processing (seconds to minutes)
- Job serialization limits what can be passed to the job (Eloquent models must be reloaded)
- Dedicated queue workers increase infrastructure costs
- Queue backpressure can delay processing during traffic spikes

## Performance Considerations
- Webhook receipt (HTTP) completes in 10-50ms with queue dispatch; processing happens asynchronously
- Queue throughput depends on worker count, job complexity, and downstream dependencies
- Database writes for webhook storage add latency to the HTTP response path
- Job deserialization is fast (<1ms); the bottleneck is downstream API calls
- Multiple workers increase throughput but also increase load on external APIs

## Production Considerations
- Monitor queue length for webhook queues; rising length indicates processing bottlenecks
- Set up Horizon or similar for queue monitoring and worker management
- Configure proper `backoff` strategy: exponential with jitter for webhook processing
- Use separate Horizon auto-scaling pools for webhook queues vs application queues
- Implement dead letter handling: webhooks that fail all retries need manual review or automated alternative paths

## Common Mistakes
- Processing webhooks synchronously in the controller (defeats retry, ties up workers)
- Not configuring `$tries` or using `$tries = 0` (unlimited) without circuit breaker protection
- Passing the entire `WebhookCall` model to the job (model serialization issues)
- Not setting `backoff` on webhook jobs (immediate retry on failure)
- Using `dispatchNow` in production (defeats the purpose of queuing)

## Failure Modes
- Queue worker crash during processing loses the in-flight job (Laravel re-queues with attempt count)
- Job timeout exceeded causes forced job failure even if logic could succeed with more time
- Queue backlog grows because workers are slower than webhook arrival rate
- Database connection pool exhaustion from many concurrent webhook jobs
- Memory leak in webhook job handler gradually consumes worker resources

## Ecosystem Usage
- Spatie laravel-webhook-client dispatches to queue by default
- Laravel Horizon manages webhook queue workers with monitoring dashboards
- Laravel Pulse tracks queue throughput and job duration metrics
- Community standard: push webhook processing to `$job->onQueue('webhooks')`

## Related Knowledge Units
- K011: Spatie laravel-webhook-client (jobs are dispatched by this package)
- K020: CSRF Bypass and Route Configuration (prerequisite for receiving webhooks)
- K028: Laravel Horizon Monitoring (monitoring webhook queue workers)
- K024: Circuit Breaker Integration (protecting webhook jobs from downstream failures)

## Research Notes
- Laravel 13.x queue documentation covers job middleware, retry strategies, and failure handling
- Industry practice: webhook processing is almost always async; synchronous is for health checks only
- Spatie packages use queue-first by design; the `ProcessWebhookJob` is dispatched via `dispatch()->onQueue()`
- Horizon's `balance` setting (auto, simple, false) affects how webhook queue workers are allocated
