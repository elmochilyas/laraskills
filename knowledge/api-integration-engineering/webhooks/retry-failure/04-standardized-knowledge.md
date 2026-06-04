# ECC Standardized Knowledge — Retry & Failure

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Retry & Failure |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K013, K011, K005, K024 |

## Overview (Engineering Value)
Webhook processing retry and failure handling ensures that transient processing failures are retried with backoff, persistent failures are properly escalated, and no webhook event is silently lost. The queue-first architecture naturally supports retry via Laravel's job retry system (`$tries`, `backoff`, `maxExceptions`). Circuit breaker integration prevents retries from hammering downstream services during outages. Failed webhooks produce events for alerting, logging, and manual retry workflows.

## Core Concepts
- **Job Retry**: Laravel queue retry with `$tries` and `backoff` for transient processing failures
- **Backoff Strategy**: Exponential backoff between retry attempts (30s base, 12h max typical)
- **Circuit Breaker Integration**: Fuse stops retry when downstream service is degraded
- **Max Exceptions**: Allow a threshold of exceptions before failing (not every exception triggers retry)
- **Failed Job Dashboard**: Horizon/Telescope UI for reviewing and retrying failed webhooks
- **Final Failure Event**: `FinalWebhookCallFailedEvent` or equivalent for business logic fallback

## When To Use
- All webhook processing with side effects (processing failures must be retried)
- Integrations with downstream services that may have transient failures
- Critical webhooks where zero events can be lost

## When NOT To Use
- Idempotent webhooks where skipping is acceptable
- Non-critical logging webhooks where retry creates more problems than it solves

## Best Practices
- Configure exponential backoff with jitter for webhook retry (30s base, 12h max)
- Apply circuit breaker (Fuse) middleware to stop retry when downstream is down
- Set `$maxExceptions` to 3 to tolerate occasional failures without exhausting retries
- Log each retry attempt with attempt number, delay, and error details
- Implement manual retry UI for failed webhooks that exhausted all retries

## Architecture Guidelines
- Spatie's `ProcessWebhookJob` with `$tries` and `backoff` configured
- Fuse `CircuitBreakerMiddleware` for queue job circuit breaking
- Event listener on `FinalWebhookCallFailedEvent` for escalation
- Dashboard for manual retry of failed webhooks
- Dead letter queue for webhooks that exhaust all retry paths

## Performance Considerations
- Retry delay calculation is negligible CPU cost
- Long backoff delays keep webhook in pending state longer
- Circuit breaker check adds ~1-5ms cache read per job
- Failed webhook dashboard queries: monitor performance with many failed records

## Common Mistakes
- Not configuring `backoff` (immediate retry on failure — wastes resources)
- Counting all exceptions as failures for retry (some exceptions shouldn't trigger retry)
- No circuit breaker around downstream calls (retries hammer a failing service)
- No manual retry capability (failed webhooks are lost forever)
- Not monitoring failed webhook rates (silent processing failures accumulate)

## Related Topics
- **Prerequisites**: Laravel queue retry, exponential backoff
- **Closely Related**: Queued processing (ku-03), circuit breaker, rate limiting per source (ku-05)
- **Advanced**: Custom backoff strategies, dead letter queues
- **Cross-Domain**: Incident management, job monitoring

## Verification
- [ ] Retry with exponential backoff configured on webhook jobs
- [ ] Circuit breaker middleware applied to stop retry during outages
- [ ] Final failure event triggers alerting/notification
- [ ] Manual retry UI available for failed webhooks
- [ ] Failed webhook rates monitored and alerted
