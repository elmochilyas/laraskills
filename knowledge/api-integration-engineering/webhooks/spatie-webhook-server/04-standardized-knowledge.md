# ECC Standardized Knowledge — Spatie Laravel Webhook Server Package

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | outgoing-webhooks |
| Knowledge Unit ID | ku-13 |
| Knowledge Unit | Spatie Laravel Webhook Server Package |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K003, K005, K015 |

## Overview (Engineering Value)
Spatie's laravel-webhook-server package provides a configurable, standardized way to dispatch webhooks from your Laravel application to external subscribers. It manages webhook signing, payload formatting, delivery, and retry logic, ensuring subscribers receive authenticated, consistent webhook calls.

## Core Concepts
- **Webhook Call**: HTTP POST request to subscriber with signed JSON payload
- **Webhook Model**: Stores outgoing webhook attempts, status, and response
- **Signing**: Automatic HMAC signature header on each outbound call
- **Tags**: Categorization for grouping webhooks (e.g., "payment", "user")
- **Queue**: Webhook calls dispatched asynchronously via Laravel queues
- **Retry**: Automatic retry on failure with configurable attempts

## When To Use
- Your Laravel app needs to notify external systems of events
- Standardized webhook format across subscribers
- Audit trail of outgoing webhook deliveries
- Multiple subscriber types (webhook, Slack, custom)

## When NOT To Use
- Single subscriber with custom delivery logic
- Real-time delivery requirements (queue adds latency)
- Non-HTTP delivery mechanisms (websockets, server-sent events)

## Best Practices
- One webhook model per event type for clear audit trail
- Configure per-subscriber signing secrets
- Use tags for subscriber-grouped notifications
- Monitor webhook delivery failure rates
- Implement subscriber URL verification for security

## Architecture Guidelines
- Webhook calls dispatched from domain events/event subscribers
- Webhook model cleanup strategy for old records
- Config per environment (different subscribers per env)
- Monitoring on successful vs failed delivery ratios
- Logging of all delivery attempts for debugging

## Performance Considerations
- Package overhead ~2ms per webhook beyond HTTP call
- Eloquent insert/update for each attempt
- Queue dispatch default (database sync adds latency)
- Multiple subscribers per event multiply total time

## Common Mistakes
- Dispatching webhooks synchronously in request lifecycle
- Not handling subscriber URL changes (delivery to dead endpoints)
- Using same secret for all subscribers (no isolation)
- Not cleaning up webhook model records (table growth)
- Skipping tagging for subscriber-specific webhook sets

## Related Topics
- **Prerequisites**: CSRF exclusion, webhook basics
- **Closely Related**: Webhook dispatching, delivery retry
- **Advanced**: Subscriber management, webhook event sourcing
- **Cross-Domain**: Package management, event-driven architecture

## Verification
- [ ] Webhook calls dispatched asynchronously via queue
- [ ] Per-subscriber signing secrets configured
- [ ] Tags used for subscriber grouping
- [ ] Delivery failure monitoring implemented
- [ ] Webhook model cleanup strategy defined
- [ ] Subscriber URL verification in place
