# ECC Standardized Knowledge — Dispatching Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Dispatching Webhooks |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K012 |

## Overview (Engineering Value)
Webhook dispatching is the process of sending HTTP requests to subscriber endpoints with signed payloads, managing delivery attempts, and tracking delivery state. Spatie's laravel-webhook-server provides the standard Laravel toolchain for dispatching webhooks with HMAC signing, configurable backoff, delivery attempt tracking, and lifecycle events. The dispatcher creates a `WebhookCall` record, signs the payload, sends via Guzzle, and fires success/failure events — enabling full auditability and automated delivery management.

## Core Concepts
- **WebhookCall Model**: Database record per webhook dispatch storing URL, payload, status, and attempt history
- **WebhookDispatcher**: Creates, signs, and sends webhook requests via Guzzle
- **HMAC Signing**: Automatic payload signing with configured secret and custom signature header name
- **Dispatch Methods**: `dispatch()` for synchronous; `->onQueue()` for async queue-based dispatch
- **Lifecycle Events**: `WebhookCallSuccessEvent`, `WebhookCallFailedEvent`, `FinalWebhookCallFailedEvent`
- **Delivery Attempt Tracking**: Each attempt recorded with timestamp, HTTP status, and response

## When To Use
- Sending webhooks to external subscribers (B2B integrations, event notifications)
- Building a webhook delivery system that needs retry, audit, and monitoring
- Any outgoing event notification via HTTP POST

## When NOT To Use
- Internal event processing (use Laravel events)
- Push notifications to mobile devices (use push notification services)
- Real-time streaming (use WebSockets or Server-Sent Events)

## Best Practices
- Always use queue-based dispatch in production (synchronous blocks the caller for the entire HTTP delivery)
- Configure signing secrets per subscriber for security isolation
- Listen to `WebhookCallFailedEvent` for alerting and `FinalWebhookCallFailedEvent` for business logic fallback
- Store subscriber webhook URLs in database for dynamic endpoint management
- Implement subscriber-side idempotency via `webhook-id` in payload

## Architecture Guidelines
- Spatie laravel-webhook-server for dispatch and delivery management
- Queue-based dispatch to `webhooks` queue with dedicated workers
- Payload versioning: include version field for subscriber compatibility
- Event listeners for delivery lifecycle (success/failure/final failure)
- Dashboard for manual retry of failed webhook dispatches

## Performance Considerations
- Webhook delivery latency dominated by subscriber response time (100ms-30s)
- Queue dispatch adds negligible overhead (~1-5ms)
- Database writes for WebhookCall tracking: ~2-5ms per operation
- Concurrent delivery requires sufficient queue workers and connection pool

## Common Mistakes
- Dispatching webhooks synchronously in the HTTP request lifecycle (slows response time)
- Not handling `FinalWebhookCallFailedEvent` (failed deliveries go unnoticed)
- Using mutable payload data that changes between retry attempts (inconsistent payload per retry)
- Not setting `backoff_strategy` for high-volume webhooks (aggressive retry overloads subscribers)

## Related Topics
- **Prerequisites**: HTTP POST, queue basics
- **Closely Related**: Delivery retry (ku-02), outbox pattern, webhook signing
- **Advanced**: Subscriber health checking, webhook gateway services
- **Cross-Domain**: Event-driven architecture, B2B integration

## Verification
- [ ] Webhooks dispatched via queue in production
- [ ] Payload signed with HMAC using subscriber-specific secret
- [ ] Lifecycle events (success/failure/final) handled
- [ ] Failed webhook retries tracked and dashboard-accessible
- [ ] Subscriber URLs stored in database, not config files
