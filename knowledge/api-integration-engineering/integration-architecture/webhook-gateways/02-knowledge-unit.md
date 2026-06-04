# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns
Difficulty Level: Expert
Last Updated: 2026-06-02

## Executive Summary
Webhook gateway services (Convoy, Svix) provide managed webhook infrastructure handling fan-out delivery, retry with backoff, signature signing, delivery tracking, and endpoint management. They replace the need for self-hosted webhook sender implementations (Spatie's webhook-server, custom dispatchers) with a managed API layer. The decision between gateway and self-hosted depends on scale, reliability requirements, compliance needs, and operational maturity. Gateway services are gaining traction for B2B SaaS platforms that send webhooks to many subscribers.

## Core Concepts
- **Webhook Gateway**: Managed service that accepts webhook events via API and handles delivery to subscribers
- **Fan-Out Delivery**: Single event dispatched to multiple subscriber endpoints simultaneously
- **Managed Retry**: Gateway handles retry scheduling, backoff, and final failure determination
- **Endpoint Management**: Subscriber endpoint CRUD, health monitoring, and secret rotation
- **Delivery Logs**: Searchable delivery attempt history through gateway dashboard
- **Webhook Gateways vs Self-Hosted**: Gateway = managed infrastructure (Convoy, Svix); Self-hosted = Spatie packages or custom implementation
- **Adoption Considerations**: Pricing, latency, compliance, data residency, and vendor lock-in

## Mental Models
- **Email Service Analogy**: Like using SendGrid/Mailgun for email vs running your own SMTP server
- **Delivery as a Service**: Outsource the complexity of reliable webhook delivery to a specialist provider
- **Event Router**: The gateway is a smart router that ensures events reach their destination reliably

## Internal Mechanics
- Gateway receives webhook event via REST API: `POST https://api.svix.io/api/v1/msg/` with event payload
- Gateway fans out to all registered endpoints for the event type
- Each delivery attempt: signs payload (Standard Webhooks format), sends HTTP POST, records result
- Retry schedule: managed by gateway (Standard Webhooks schedule or configurable)
- Endpoint health: gateway monitors endpoint response rates and can auto-disable unhealthy endpoints
- Webhook secret management: gateway generates and rotates secrets per endpoint
- Delivery logs: stored in gateway with search, filtering, and replay capability

## Patterns
- **Gateway-First Delivery**: Send all webhooks through gateway; gateway handles delivery complexity
- **Hybrid Pattern**: Use gateway for external subscriber delivery; self-hosted for internal service webhooks
- **Fallback to Self-Hosted**: Gateway as primary; self-hosted as backup during gateway outages
- **Idempotent Event Design**: Always include `webhook-id` for deduplication regardless of delivery method
- **Signed Payloads**: Standard Webhooks signing through gateway; receiver verifies without gateway dependency
- **Local Audit + Gateway**: Store event in local database AND send to gateway; use local for replay, gateway for delivery

## Architectural Decisions
- Choose gateway service if sending webhooks to 50+ subscribers (management overhead justifies managed service)
- Choose self-hosted if: <20 subscribers, strict data residency requirements, limited budget, or full control needed
- Use Convoy (open-source, self-hostable) for hybrid: gateway flexibility with self-hosting option
- Use Svix for fully managed, high-reliability delivery with global presence
- Design events as Standard Webhooks compliant for portability between gateway providers
- Maintain local event store as source of truth; gateway is delivery mechanism (not source of truth)

## Tradeoffs
- Gateway services reduce operational burden but add per-event cost (variable vs fixed self-hosted)
- Self-hosted is cheaper at scale (incremental cost per event is free) but requires DevOps investment
- Gateway provides better delivery guarantees (global infrastructure, SLA-backed) than typical self-hosted
- Data residency: gateway may route through specific regions; self-hosted keeps data within own infrastructure
- Vendor lock-in: gateway-specific APIs require migration effort to switch; Standard Webhooks spec reduces this
- Latency: gateway adds network hop (app → gateway → subscriber) vs direct self-hosted delivery

## Performance Considerations
- Gateway adds 10-50ms latency per event (post to gateway + gateway to subscriber)
- Gateway fan-out: concurrent delivery to all subscribers, total time = slowest subscriber
- Self-hosted: delivery time depends on queue worker throughput and connection pool capacity
- Gateway horizontally scales delivery infrastructure automatically
- Self-hosted requires scaling queue workers and outbound connection capacity
- Gateway typically provides higher delivery throughput than typical self-hosted setups

## Production Considerations
- Evaluate gateway SLAs: Svix 99.99%+ uptime, Convoy depends on deployment
- Monitor gateway delivery latency and failure rates as part of overall integration monitoring
- Implement circuit breaker at the application level for gateway API calls (gateway could be a dependency)
- Negotiate data processing agreements (DPA) with gateway provider for compliance
- Plan for gateway outage: maintain local queue of undelivered events for replay after recovery
- Test gateway migration: document all gateway-specific configurations for future migration

## Common Mistakes
- Sending all events through gateway including low-value or internal events (unnecessary cost)
- Not storing events locally before sending to gateway (losing events if gateway is down)
- Depending on gateway for event source of truth (gateway is delivery mechanism, not event store)
- Ignoring data residency requirements (gateway may process events in non-compliant regions)
- Assuming gateway eliminates need for idempotency at receiver (gateway may deliver duplicates during failover)
- Not testing gateway failover and recovery behavior before production deployment

## Failure Modes
- Gateway outage: all webhook delivery stops; events queued locally until gateway recovers
- Gateway rate limits: high-volume events may be throttled by gateway API limits
- Gateway latency spike: events delivered significantly later than expected
- Provider deprecation: gateway provider goes out of business or deprecates the service
- Configuration drift: endpoint configurations in gateway out of sync with application
- Secret compromise: gateway signing secrets leaked; requires full secret rotation across all subscribers

## Ecosystem Usage
- Svix (svix.com): YC-backed, fully managed, 99.99% uptime SLA, Standard Webhooks compliant
- Convoy (getconvoy.io): Open-source, self-hostable, enterprise features, YC-backed
- Kong Webhook Gateway: Kong's webhook functionality via plugins and transformation
- Custom self-hosted: Spatie laravel-webhook-server + custom dashboard for delivery management
- Industry trend: companies moving from self-hosted to managed webhook gateways as subscriber base grows
- Standard Webhooks specification enables easier migration between gateway providers

## Related Knowledge Units
- K012: Spatie laravel-webhook-server (self-hosted alternative)
- K019: Exponential Backoff Customization (self-hosted retry vs gateway managed retry)
- K035: Standard Webhooks Specification (gateway-compatible webhook format)
- K032: Webhook Gateway Services (this document)

## Research Notes
- Domain analysis rates webhook gateways as "Emerging" with low confidence
- Convoy and Svix both support the Standard Webhooks specification for interoperability
- Webhook gateways are most valuable for B2B SaaS companies sending webhooks to customer endpoints
- Self-hosted webhook management (custom dashboard, delivery tracking) is still viable for small-scale
- The Standard Webhooks spec aims to reduce vendor lock-in by standardizing the webhook interface
- Gartner predicts 60% of SaaS companies will use webhook gateways by 2028 (from ~20% in 2025)
