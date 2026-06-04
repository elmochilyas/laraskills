# Skill: Implement Robust Webhook Retry Logic for Delivery Failures

## Purpose
Design webhook retry logic with exponential backoff, jitter, max attempts, and dead-letter queues to ensure reliable delivery while respecting subscriber capacity.

## When To Use
- Any webhook delivery system
- Ensuring at-least-once delivery guarantees
- Handling subscriber unavailability gracefully

## When NOT To Use
- Fire-and-forget notifications
- Subscribers that handle their own retry logic

## Prerequisites
- Queue system for scheduled retries
- Delivery tracking database

## Workflow
1. Categorize failures: 5xx/timeout → retry; 4xx → no retry
2. Configure retry schedule with exponential backoff + jitter
3. Set maximum retry attempts (6-10)
4. Implement dead-letter webhook after max retries
5. Store retry history per webhook delivery
6. Provide manual retry via Artisan command or admin UI
7. Notify on-call engineer after sustained retry loops
8. Monitor retry rate and delivery success rate

## Validation Checklist
- [ ] Failure categorization (retryable vs non-retryable)
- [ ] Exponential backoff with jitter
- [ ] Maximum retry attempts configured
- [ ] Dead-letter after max retries
- [ ] Retry history stored per delivery
- [ ] Manual retry available
- [ ] Alerts for sustained retry loops
- [ ] Delivery success rate monitored
