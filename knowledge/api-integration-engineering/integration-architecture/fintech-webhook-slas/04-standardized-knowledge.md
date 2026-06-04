# ECC Standardized Knowledge — Fintech-Grade Webhook SLAs and SLOs (Stripe, Adyen Patterns)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Fintech-Grade Webhook SLAs and SLOs (Stripe, Adyen Patterns) |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K037, K003, K006, K011, K012 |

## Overview (Engineering Value)
Fintech-grade webhook delivery requires strict SLAs and SLOs for latency, reliability, and ordering. Stripe guarantees delivery with a 3-day retry window and idempotency; Adyen offers customizable settings with HMAC signing. Key metrics include p99 delivery latency, success rate, duplicate rate, and max retry duration. Fintech integrations must implement compensating logic for late delivery, idempotency for safe retry, and reconciliation processes.

## Core Concepts
- **SLA**: Contractual guarantee (e.g., 99.9% delivered within 5 minutes)
- **SLO**: Internal target (e.g., p99 delivery latency < 60s)
- **SLI**: Measured metric (e.g., delivery success rate = 99.95%)
- **Delivery Latency**: Event creation to successful delivery receipt
- **Retry Window**: Total retry duration before final failure (Stripe: 3 days)
- **Reconciliation**: Matching payment events with webhook deliveries

## When To Use
- Payment processing and financial transaction integrations
- Compliance-regulated applications requiring delivery guarantees
- Multi-provider fintech platforms (payment gateways, banking APIs)
- Any integration where data loss has direct financial impact

## When NOT To Use
- Non-financial webhook delivery (notification emails, activity feeds)
- Internal service webhooks with casual delivery requirements
- Prototyping or low-volume non-critical integrations

## Best Practices
- Design for at-least-once delivery with idempotent processing
- Never assume ordering guarantees; process by event timestamp not arrival order
- Set reconciliation window to match max retry horizon (Stripe: 3 days)
- Implement compensating transactions for late or duplicate delivery
- Monitor delivery SLIs per provider in real-time

## Architecture Guidelines
- Idempotent processing: webhook ID as idempotency key
- Queue-first architecture for all fintech webhooks
- Reconciliation job matching webhook events with local records
- Escalation ladder: retry → on-call alert → manual reconciliation
- Business continuity plan for provider-level outages

## Performance Considerations
- Webhook delivery latency: provider → verification → queue → processing
- Reconciliation throughput: batch job for 100K+ transactions may run 30-60 min
- Idempotency store must handle peak traffic (potentially thousands/sec)
- SLI collection adds overhead; use sampled or batched collection

## Security Considerations
- Payment data in webhook payloads requires encryption at rest and in transit
- Reconciliation logs contain sensitive financial data; restrict access
- Webhook signatures prevent tampering with financial events
- Never log raw credit card or PII data from webhook payloads
- Implement audit trails for all reconciliation actions

## Common Mistakes
- Assuming webhooks arrive in order (out-of-order is common under retry)
- Not implementing reconciliation (unreconciled transactions accumulate silently)
- Processing webhooks synchronously in HTTP request
- Same idempotency store for all providers (different TTL requirements)
- Not testing failure scenarios: outage, duplicate storms, delayed delivery

## Anti-Patterns
- At-most-once delivery for financial events (data loss risk)
- No reconciliation process (relies entirely on webhook delivery)
- Single idempotency TTL for all providers
- Ignoring Retry-After on 429 responses from fintech APIs

## Related Topics
- **Prerequisites**: Idempotency keys, webhook signatures, queue-first processing
- **Closely Related**: Event sourcing, reconciliation patterns, business continuity
- **Advanced**: Payment reconciliation automation, multi-provider failover
- **Cross-Domain**: Fintech compliance, payment processing, financial reconciliation

## AI Agent Notes
- Always implement idempotent processing for fintech webhooks
- Generate reconciliation job alongside webhook processing code
- Default to at-least-once delivery semantics

## Verification
- [ ] Idempotent processing implemented for all fintech webhooks
- [ ] Reconciliation job running per provider
- [ ] SLIs monitored per provider (latency, success rate, duplicate rate)
- [ ] Queue-first architecture for all fintech processing
- [ ] Business continuity plan documented and tested
- [ ] Provider outage escalation procedures defined
