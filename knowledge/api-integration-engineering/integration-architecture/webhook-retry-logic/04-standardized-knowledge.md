# ECC Standardized Knowledge — Webhook Retry Logic (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Webhook Retry Logic |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K005, K019 |

## Overview (Engineering Value)
Event-sourced webhook retry logic records every retry attempt as an immutable event in the event store, providing a complete audit trail of delivery efforts. Retry events include attempt number, delay applied, response status, error details, and backoff strategy used. This enables replay of retry logic against historical failures, analysis of retry effectiveness, and temporal queries of delivery attempts over the entire retry lifecycle.

## Core Concepts
- **Retry Attempt Events**: Immutable records per delivery attempt with timestamp, delay, response, and error
- **Backoff Strategy Events**: Records which backoff algorithm was applied per attempt
- **Final Failure Event**: Terminal event with all attempt history when retries exhausted
- **Retry Projector**: Read model of current retry state and effectiveness per subscriber
- **Replay from Retry Events**: Reprocess failed webhooks from the event store

## When To Use
- Critical webhook delivery routes with retry requirements
- Systems needing audit trail of every delivery attempt
- Compliance environments requiring evidence of retry efforts
- Multiple retry strategies per provider

## When NOT To Use
- Simple one-shot delivery with no retry
- Non-critical webhooks where failed delivery logging suffices

## Best Practices
- Record retry attempt event BEFORE executing the retry HTTP call
- Include full context: attempt number, scheduled delay, actual delay, subscriber URL (redacted)
- Track backoff strategy decisions per provider for optimization analytics
- Use projectors for retry effectiveness dashboards

## Architecture Guidelines
- Integrate with Spatie webhook-server retry pipeline as event source
- Emit events: `WebhookDeliveryAttempted`, `WebhookDeliverySucceeded`, `WebhookDeliveryFailed`, `WebhookRetriesExhausted`
- Reactors for final failure notifications and alternative delivery paths
- Backoff strategy analytics from retry event projector

## Performance Considerations
- Each retry adds one event store write (~5ms) plus the HTTP call latency
- Retry history projector updates per event; batch for high-volume webhooks
- Event store cleanup for retry events after retention period

## Related Topics
- **Prerequisites**: Retry strategies (exponential backoff, jitter), Spatie webhook-server
- **Closely Related**: Delivering webhooks (outgoing), outbox pattern (ku-04)
- **Advanced**: Custom backoff strategies, retry budget management
- **Cross-Domain**: Job scheduling, queue management

## Verification
- [ ] Each retry attempt recorded as immutable event
- [ ] Final failure event contains complete attempt history
- [ ] Replay from retry events successfully re-delivers webhooks
- [ ] Retry effectiveness metrics available from projector
