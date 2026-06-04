# ECC Standardized Knowledge — Spatie laravel-webhook-server Dispatch and Retry Customization

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Spatie laravel-webhook-server Dispatch and Retry Customization |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K012, K019, K005 |

## Overview (Engineering Value)
Spatie's laravel-webhook-server is the de facto standard for sending webhooks from Laravel applications. It provides a complete dispatch pipeline: payload formatting, HMAC signing, HTTP POST delivery, retry with exponential backoff, and event dispatching for delivery outcomes. The `WebhookCall` model tracks each dispatch attempt, stores the payload and response, and enables manual or automated retry. Customization points include signing, backoff strategy, and delivery event handling.

## Core Concepts
- **WebhookCall Model**: Eloquent model tracking each webhook dispatch, payload, response, and attempt count
- **Dispatch Call**: `WebhookCall::create()->url()->payload()->dispatch()` fluent API
- **HMAC Signing**: Default signing with secret; signs raw payload with SHA256
- **Retry Mechanism**: Automatic retry with exponential backoff on delivery failure
- **Delivery Events**: `WebhookCallSucceededEvent`, `WebhookCallFailedEvent`, `FinalWebhookCallFailedEvent`
- **Custom Signer**: Implement `Signer` interface for non-standard signing schemes

## When To Use
- Sending webhooks to subscriber endpoints from your Laravel application
- Building B2B platforms that notify subscribers of events
- Self-hosted webhook delivery without managed gateway services
- Applications requiring delivery tracking and audit trails

## When NOT To Use
- Very low-volume manual webhook sending (Http facade POST suffices)
- Webhook sending through managed gateways (gateway handles delivery)
- High-volume (>100K/day) where gateway's managed infrastructure is more cost-effective

## Best Practices
- Use queue connection for dispatch to avoid blocking HTTP requests
- Configure `max_attempts` based on subscriber criticality (10-15 typical)
- Implement `FinalWebhookCallFailedEvent` listener for alerting
- Store subscriber health data to disable dead endpoints early
- Log all delivery attempts with response status and duration

## Architecture Guidelines
- Create `WebhookCall` from service classes, not controllers
- Use dedicated queue for webhook dispatch (`webhook-dispatches`)
- Configure per-endpoint webhook secrets, never share across subscribers
- Implement webhook endpoint health monitoring to skip dead subscribers
- Use signed payloads so subscribers can verify authenticity

## Performance Considerations
- WebhookCall creation: ~5-10ms (database write)
- Signing: <1ms per webhook
- HTTP dispatch time: depends on subscriber response time
- Retry backoff: sum of all delays before final failure
- Cleanup strategy needed: old WebhookCall records grow indefinitely

## Security Considerations
- Sign all outgoing webhooks so subscribers can verify authenticity
- Never log raw signing secrets or subscriber webhook URLs
- Use HTTPS for all webhook delivery endpoints
- Implement subscriber endpoint verification before adding to system
- Rotate webhook signing secrets regularly

## Common Mistakes
- Dispatching webhooks synchronously from HTTP requests
- Not handling `FinalWebhookCallFailedEvent` (silent delivery failures)
- Storing subscriber webhook URLs without encryption at rest
- Not cleaning up old WebhookCall records (unbounded database growth)
- Using same signing secret for all subscribers

## Anti-Patterns
- Synchronous dispatch in controller
- Fire-and-forget without retry or tracking
- No event listeners for delivery outcomes
- Unlimited WebhookCall table growth

## Examples
```php
WebhookCall::create()
    ->url($subscriber->webhook_url)
    ->payload(['event' => 'order.placed', 'data' => $order->toArray()])
    ->useSecret($subscriber->webhook_secret)
    ->dispatch();
```

```php
// Final failure alerting
Event::listen(FinalWebhookCallFailedEvent::class, function ($event) {
    Notification::send($admin, new WebhookDeliveryFailed($event->webhookCall));
});
```

## Related Topics
- **Prerequisites**: Queue fundamentals, HMAC signing
- **Closely Related**: Exponential backoff, delivery tracking, webhook gateways
- **Advanced**: Webhook endpoint health monitoring, multi-tenant webhook dispatch
- **Cross-Domain**: Spatie package ecosystem, webhook subscriber management

## AI Agent Notes
- Generate WebhookCall::create() dispatch in service classes, not controllers
- Include FinalWebhookCallFailedEvent listener for alerting
- Add cleanup schedule for old WebhookCall records

## Verification
- [ ] Webhook dispatch on queue, not synchronous
- [ ] max_attempts configured for retry behavior
- [ ] FinalWebhookCallFailedEvent listener implemented
- [ ] Webhook URLs encrypted at rest
- [ ] Old WebhookCall records cleaned up via scheduled job
- [ ] Signing secrets unique per subscriber
