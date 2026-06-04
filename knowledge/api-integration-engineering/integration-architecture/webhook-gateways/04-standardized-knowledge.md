# ECC Standardized Knowledge — Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-07 |
| Knowledge Unit | Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K032, K012, K035 |

## Overview (Engineering Value)
Webhook gateway services (Convoy, Svix) provide managed webhook infrastructure: fan-out delivery, retry with backoff, signing, delivery tracking, and endpoint management. They replace self-hosted implementations (Spatie webhook-server, custom dispatchers) with a managed API layer. The gateway vs self-hosted decision depends on scale, reliability requirements, compliance needs, and operational maturity.

## Core Concepts
- **Webhook Gateway**: Managed service receiving events via API and handling delivery to subscribers
- **Fan-Out Delivery**: Single event dispatched to multiple endpoints simultaneously
- **Managed Retry**: Gateway handles retry scheduling, backoff, final failure
- **Endpoint Management**: Subscriber endpoint CRUD, health monitoring, secret rotation
- **Hybrid Pattern**: Gateway for external subscribers, self-hosted for internal services

## When To Use
- Sending webhooks to 50+ subscribers (management overhead justifies managed service)
- B2B SaaS platforms where webhook delivery reliability is critical
- Teams without dedicated DevOps for webhook infrastructure
- When Standard Webhooks compliance is desired without manual implementation

## When NOT To Use
- <20 subscribers with simple delivery needs (self-hosted more economical)
- Strict data residency requirements (gateway may route through specific regions)
- Limited budget for per-event costs (self-hosted cheaper at scale)
- Full control required over delivery infrastructure

## Best Practices
- Choose gateway if sending to 50+ subscribers; self-hosted for <20
- Use Convoy (open-source, self-hostable) for hybrid flexibility
- Design events as Standard Webhooks compliant for portability
- Maintain local event store as source of truth; gateway is delivery mechanism
- Implement circuit breaker for gateway API calls (gateway is a dependency)

## Architecture Guidelines
- Send events to gateway via REST API; gateway handles subscriber delivery
- Store events locally BEFORE sending to gateway (backup if gateway is down)
- Use gateway for external subscriber delivery; self-hosted for internal services
- Standard Webhooks format for gateway portability between providers
- Monitor gateway delivery latency and failure rates as integration metrics

## Performance Considerations
- Gateway adds 10-50ms latency per event (app → gateway → subscriber)
- Gateway fan-out: total time = slowest subscriber response
- Self-hosted: depends on queue worker throughput and connection pool capacity
- Gateway auto-scales delivery infrastructure; self-hosted requires manual scaling

## Security Considerations
- Gateway handles signing; use Standard Webhooks so receivers verify independently
- Data processing agreements (DPA) required with gateway provider for compliance
- Never send sensitive data through gateway without encryption
- Rotate gateway API keys and webhook secrets regularly
- Test gateway failover and recovery before production

## Common Mistakes
- Sending all events through gateway including low-value internal ones (unnecessary cost)
- Not storing events locally before sending to gateway (losing events if gateway is down)
- Gateway as event source of truth (gateway is delivery mechanism, not event store)
- Ignoring data residency (gateway may process in non-compliant regions)
- Assuming gateway eliminates need for receiver-side idempotency

## Anti-Patterns
- Gateway dependency without local event backup
- Single gateway provider without fallback plan
- Sending raw internal data structures through gateway
- No monitoring of gateway delivery performance

## Examples
```php
// Gateway-first delivery pattern
$event = WebhookEvent::create($payload); // local store first
$gateway->sendMessage($event->toStandardPayload()); // then gateway
```

## Related Topics
- **Prerequisites**: Spatie webhook-server, Standard Webhooks spec
- **Closely Related**: Standard Webhooks, exponential backoff, delivery tracking
- **Advanced**: Multi-gateway strategy, gateway migration, vendor lock-in mitigation
- **Cross-Domain**: SaaS infrastructure, managed services evaluation

## AI Agent Notes
- Default to self-hosted for <20 subscribers, gateway for 50+
- Always store events locally before sending to gateway
- Use Standard Webhooks format for gateway portability

## Verification
- [ ] Gateway vs self-hosted decision documented with rationale
- [ ] Events stored locally before gateway dispatch
- [ ] Standard Webhooks format used for portability
- [ ] Gateway delivery latency and failure rates monitored
- [ ] Gateway outage recovery procedures documented
- [ ] Circuit breaker implemented for gateway API calls
