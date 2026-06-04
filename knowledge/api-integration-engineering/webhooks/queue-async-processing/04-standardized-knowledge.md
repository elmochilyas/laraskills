# ECC Standardized Knowledge — Queue and Async Processing for Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | incoming-webhooks |
| Knowledge Unit ID | ku-10 |
| Knowledge Unit | Queue and Async Processing for Webhooks |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K004, K008, K010, K011 |

## Overview (Engineering Value)
Webhook handlers must respond quickly (typically <5s) to avoid sender timeouts and retries. Queuing webhook processing via Laravel jobs ensures the HTTP response is sent immediately while work happens asynchronously, providing resilience against upstream timeouts and enabling retry on failure.

## Core Concepts
- **Job Dispatching**: Dispatching a Laravel job from the controller
- **Unique Jobs**: Preventing duplicate processing for the same event
- **Job Batching**: Grouping related async work with completion callbacks
- **Rate Limiting**: Controlling queue consumption to match downstream capacity
- **Middleware on Jobs**: Rate limiter, throttle, and retry middleware for jobs
- **Database Transactions**: Dispatch jobs after commit to prevent uncommitted data processing

## When To Use
- Any webhook handler doing non-trivial work
- Processing that involves external API calls, DB writes, or email
- High-throughput webhooks where response time matters
- Dispatchers needing guaranteed delivery

## When NOT To Use
- Simple idempotent writes (cache update, counter increment)
- Webhooks where latency matters (respond in <100ms from job dispatch)
- When synchronous processing is fast and reliable
- When queue infrastructure isn't available

## Best Practices
- Dispatch job from controller, return 200 immediately
- Use unique jobs with `ShouldBeUnique` for deduplication
- Dispatch after DB commit with `dispatchIfCommitted()`
- Implement job middleware for rate limiting
- Use `ShouldBeEncrypted` for jobs containing sensitive data
- Use job batching for fan-out processing

## Architecture Guidelines
- Controller dispatches job only (thin controller)
- Job classes in `Jobs/Integrations/{ServiceName}/`
- Queue connection config per service for isolation
- Failed jobs table for manual retry visibility
- Alert on job failure rate spikes

## Performance Considerations
- Job dispatch adds ~1ms to response time
- Queue worker processing overhead negligible
- Database writes from jobs extend response time from user perspective
- Job serialization time for large payloads (compress large payloads before dispatch)

## Common Mistakes
- Processing webhook synchronously in controller (upstream timeout)
- Dispatching job before DB commit (processing uncommitted data)
- Not handling job failures (silent data loss)
- Sending large payloads directly as job data (use storage reference)
- Missing unique job implementation (duplicate processing on retries)

## Related Topics
- **Prerequisites**: Laravel queues, job dispatching
- **Closely Related**: Webhook receiving, retry strategies
- **Advanced**: Job batching, unique jobs, job rate limiting
- **Cross-Domain**: Queue infrastructure, worker scaling

## Verification
- [ ] Job dispatched from webhook controller, no sync processing
- [ ] `dispatchIfCommitted()` used after DB writes
- [ ] Unique jobs for deduplication when appropriate
- [ ] Job failure handling (failed_jobs table, alerts)
- [ ] Rate limiting on job consumption as needed
- [ ] Queue connection isolated per service when needed
