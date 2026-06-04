# ECC Standardized Knowledge — Queued Processing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Queued Processing |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K013, K011 |

## Overview (Engineering Value)
Queue-first processing is the architectural cornerstone of production webhook receiving: the HTTP endpoint responds 200 quickly to acknowledge receipt, then dispatches a queue job for actual processing. This prevents upstream providers from timing out, protects the application from processing delays, and enables retry with backoff when processing fails. In Laravel, Spatie's `ProcessWebhookJob` handles this automatically, dispatching to a configurable queue with full job lifecycle management (retry, failure handling, middleware).

## Core Concepts
- **Dual-Phase Architecture**: Phase 1 (HTTP) validates + stores + responds 200; Phase 2 (Queue) processes business logic
- **ProcessWebhookJob**: Spatie's queued job that receives and processes validated webhooks
- **Job Retry**: `$tries`, `backoff`, `maxExceptions` control retry behavior on processing failure
- **Queue Selection**: Route webhook jobs to dedicated queues for isolation
- **Job Middleware**: Rate limiting, circuit breaker middleware wraps job execution
- **Failed Job Handling**: Jobs exceeding retry limits go to `failed_jobs` table for manual review

## When To Use
- All incoming webhooks in production (queue-first is the standard)
- Any webhook processing that involves API calls, database writes, or side effects

## When NOT To Use
- Health check endpoints that must respond with specific processing results
- Real-time processing requirements where async delay is unacceptable (rare)

## Best Practices
- Always use queue-first for incoming webhooks; synchronous defeats retry and blocks HTTP response
- Use dedicated queue workers for webhook processing (separate from application queues)
- Configure job timeout to exceed expected processing time but not queue supervisor timeout
- Apply circuit breaker middleware to webhook jobs to protect downstream services
- Implement idempotency checks at the start of job processing for safe retry

## Architecture Guidelines
- Spatie's `ProcessWebhookJob` dispatched to `webhooks` queue by default
- Dedicated Horizon worker pool for webhook queue
- Job middleware for rate limiting, circuit breaker, and idempotency
- `$tries` configured with circuit breaker for unlimited retry during outage
- Failed job notification for manual review (webhooks that exhaust retries)

## Performance Considerations
- HTTP receipt: 10-50ms with queue dispatch; processing is asynchronous
- Queue throughput depends on worker count and job complexity
- Job deserialization is fast (<1ms); bottleneck is downstream processing
- Multiple workers increase throughput but also increase load on external APIs

## Common Mistakes
- Processing webhooks synchronously in the controller (defeats retry, ties up workers)
- Not configuring `$tries` or using `$tries = 0` without circuit breaker protection
- Not setting `backoff` on webhook jobs (immediate retry on failure floods logs)
- Passing entire `WebhookCall` model to job (model serialization issues; pass ID instead)

## Related Topics
- **Prerequisites**: Laravel queues, job lifecycle
- **Closely Related**: Receiving endpoints (ku-01), retry/failure (ku-04)
- **Advanced**: Circuit breaker middleware for queue jobs, rate-limited job processing
- **Cross-Domain**: Queue architecture, worker management

## Verification
- [ ] Webhook processing dispatched to queue, not handled in HTTP request
- [ ] Dedicated queue configured for webhook processing
- [ ] Job timeout configured exceeding expected processing time
- [ ] Circuit breaker middleware applied to webhook jobs
- [ ] Failed webhooks logged and notified for manual review
