# Skill: Implement Delivery Retry Logic for Outgoing Webhooks

## Purpose
Configure automatic retry with exponential backoff for failed webhook deliveries, ensuring reliable event delivery to subscribers while respecting their availability.

## When To Use
- Outgoing webhook delivery reliability is critical
- Subscriber endpoints may be temporarily unavailable
- Ensuring at-least-once delivery semantics

## When NOT To Use
- Fire-and-forget notifications where delivery is not critical
- Synchronous-only notification delivery

## Prerequisites
- Queue system for delayed retry jobs
- Webhook delivery tracking (database)

## Workflow
1. Categorize failures: 5xx/timeout → retry; 4xx → no retry (subscriber error)
2. Configure retry schedule with exponential backoff: 1min, 5min, 15min, 1hr, 6hr
3. Add jitter to prevent thundering herd on subscriber recovery
4. Set maximum retry attempts (e.g., 6-10)
5. Implement dead-letter webhook: notify admin after max retries
6. Store retry history per delivery
7. Provide manual retry via admin UI
8. Monitor delivery success rate and retry count

## Validation Checklist
- [ ] Failure categorization: retryable vs non-retryable
- [ ] Exponential backoff with jitter configured
- [ ] Maximum retry attempts set
- [ ] Dead-letter handling after max retries
- [ ] Retry history stored per delivery
- [ ] Manual retry available
- [ ] Delivery success rate monitored
