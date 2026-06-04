# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Outgoing)
Knowledge Unit: Spatie laravel-webhook-server Dispatch and Retry Customization
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Spatie's laravel-webhook-server is the standard package for sending webhooks from Laravel applications to external subscribers. It handles dispatch, HMAC signing, HTTP delivery with configurable backoff, and event-driven lifecycle with success and failure events. The package manages delivery attempt tracking, final failure notification, and supports per-webhook URL and payload customization.

## Core Concepts
- **WebhookCall**: Model representing a single webhook dispatch attempt with URL, payload, status, and attempt tracking
- **WebhookDispatcher**: Core class that creates, signs, and sends webhook requests via Guzzle
- **HMAC Signing**: Automatic payload signing with configurable secret and signature header name
- **Retry/Backoff**: Configurable retry attempts with exponential backoff strategy
- **Events**: `WebhookCallSuccessEvent`, `WebhookCallFailedEvent`, `FinalWebhookCallFailedEvent` for lifecycle hooks
- **Dispatch Method**: `dispatch()` creates and sends synchronously; queue-based dispatch via `dispatch()->onQueue()`

## Mental Models
- **Outbox Pattern**: The webhook_call record acts as an outbox; the package ensures delivery, logs attempts
- **Delivery as State Machine**: Each WebhookCall progresses through states: pending → sending → success/failed → final_failed
- **Fire-and-Forget with Accountability**: The package forgets (sends) but records everything for audit

## Internal Mechanics
- `WebhookCall::create()->url($url)->payload($data)->dispatch()` triggers the delivery pipeline
- The package signs the payload with `hash_hmac('sha256', json_encode($payload), $secret)` and adds a signature header
- `dispatch()` sends synchronously via Guzzle; to queue, call `->onQueue()` and dispatch the WebhookCall job
- Response status determines success (2xx) or failure (everything else)
- Failed deliveries are retried according to the `backoff_strategy` configuration (default: exponential with 30s base, 12h max)
- After all attempts exhausted, the `FinalWebhookCallFailedEvent` fires and the webhook is marked permanently failed
- The `WebhookCall` model records each attempt with timestamp and response status

## Patterns
- **Queue Dispatch**: Always use `->onQueue('webhooks')` for async delivery to avoid blocking the caller
- **Event-Driven Processing**: Listen to `WebhookCallFailedEvent` for alerting and `FinalWebhookCallFailedEvent` for business logic fallback
- **Dashboard Retry**: Use an admin UI to retry failed webhook calls (re-dispatch with same ID)
- **Per-Webhook URL**: Pass dynamic URLs from subscriber configuration stored in the database
- **Payload Versioning**: Include a version field in the webhook payload for subscriber compatibility

## Architectural Decisions
- Use queue-based dispatch for production (synchronous dispatch blocks the caller for the entire HTTP request duration)
- Configure separate queue for outgoing webhooks to isolate delivery from application processing
- Set reasonable retry limits: 5-10 attempts with exponential backoff (30s → 12h max)
- Use the `FinalWebhookCallFailedEvent` to send notifications and implement fallback logic
- Store webhook URLs in the database (subscriber preferences) rather than configuration files

## Tradeoffs
- Queue dispatch adds latency (webhook not sent until worker picks it up) but provides retry infrastructure
- Synchronous dispatch is simpler but blocks the caller on slow endpoints
- Per-webhook URL flexibility increases database queries; cached subscriber config mitigates this
- Payload versioning increases complexity but enables backward-compatible changes

## Performance Considerations
- Webhook delivery latency is dominated by the subscriber's response time (100ms-30s)
- Queue workers sending webhooks should monitor outbound connection limits
- Large payloads increase network transfer time; consider payload size limits
- Database writes for `WebhookCall` tracking add small overhead (<5ms per operation)
- Concurrent webhook delivery requires sufficient queue workers and connection pool capacity

## Production Considerations
- Monitor failed webhook delivery rates per subscriber endpoint
- Implement subscriber endpoint health checking (remove unhealthy subscribers from delivery rotation)
- Store webhook delivery logs for compliance and audit requirements
- Set up alerting on `FinalWebhookCallFailedEvent` for critical notification channels
- Use separate signing secrets per subscriber or per webhook type for security isolation
- Implement subscriber-side idempotency via `webhook-id` in payload (follow Standard Webhooks pattern)

## Common Mistakes
- Dispatching webhooks synchronously in the HTTP request lifecycle (slows response time)
- Not handling `FinalWebhookCallFailedEvent`, leaving failed deliveries unattended
- Using mutable payload data that changes between retry attempts (inconsistent payload per attempt)
- Not setting `backoff_strategy` for high-volume webhooks (aggressive retry causes subscriber overload)
- Modifying `WebhookCall` properties after initial creation, causing inconsistent state

## Failure Modes
- Subscriber endpoint is permanently down; all retries fail and webhook enters `final_failed` state
- Network timeout: delivery fails if subscriber doesn't respond within Guzzle timeout
- Signature mismatch on subscriber side: delivery succeeds (200) but subscriber rejects; package doesn't detect this
- Database failure: `WebhookCall` records lost if DB is unavailable during creation
- Queue worker saturation: webhook delivery delays grow as queue backs up

## Ecosystem Usage
- Standard outgoing webhook package in the Laravel ecosystem, maintained by Spatie
- Used alongside spatie/laravel-webhook-client for complete webhook send/receive capability
- Integrates with Laravel queue, Horizon, and event system for production delivery management
- Community uses it for B2B webhook delivery, notification systems, and event-driven architecture
- Often paired with custom dashboard UIs for manual retry and delivery monitoring

## Related Knowledge Units
- K019: Exponential Backoff Customization (detailed backoff configuration)
- K003: HMAC-SHA256 Signature Generation (signing mechanism)
- K012: Spatie laravel-webhook-server (this document)
- K028: Laravel Horizon Monitoring (queue monitoring for webhook delivery)
- K018: Webhook Payload Storage (audit trail for delivered webhooks)

## Research Notes
- Package supports Laravel 10-13 with PHP 8.2+
- `dispatch()` in recent versions supports both sync and queue-based dispatch
- The `WebhookCall` model uses a `result` JSON column to store per-attempt delivery details
- Spatie recommends queue-based dispatch in production documentation
- Source: github.com/spatie/laravel-webhook-server README and configuration
