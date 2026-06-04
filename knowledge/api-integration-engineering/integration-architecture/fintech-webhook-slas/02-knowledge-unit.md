# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: Fintech-Grade Webhook SLAs and SLOs (Stripe, Adyen Patterns)
Difficulty Level: Expert
Last Updated: 2026-06-02

## Executive Summary
Fintech-grade webhook delivery requires strict Service Level Agreements (SLAs) and Objectives (SLOs) governing delivery latency, reliability, and ordering guarantees. Stripe and Adyen define industry benchmarks: Stripe guarantees delivery with 3-day retry window and idempotency; Adyen offers customizable webhook settings with HMAC signing and delivery reports. Key metrics include p99 delivery latency, delivery success rate, duplicate rate, and maximum retry duration. Fintech integrations must implement compensating logic for late delivery, idempotency for safe retry, and reconciliation processes for payment events.

## Core Concepts
- **SLA (Service Level Agreement)**: Contractual delivery guarantee (e.g., 99.9% of webhooks delivered within 5 minutes)
- **SLO (Service Level Objective)**: Internal target (e.g., p99 delivery latency < 60s)
- **SLI (Service Level Indicator)**: Measured metric (e.g., delivery success rate = 99.95%)
- **Delivery Latency**: Time from event creation to successful delivery receipt
- **Retry Window**: Total duration the provider retries delivery before final failure (Stripe: 3 days, Adyen: configurable)
- **Delivery Ordering**: Sequential vs at-least-once ordering guarantees per event type
- **Reconciliation**: Process that matches payment events with corresponding webhook deliveries
- **Business Continuity**: Processes for extended provider outages (alternative payment processing paths)

## Mental Models
- **Postal Service Guarantee**: Like registered mail with delivery confirmation and defined delivery windows
- **Bank Ledger Reconciliation**: Like matching bank statements (provider webhooks) against internal records (transaction logs)
- **Insurance Policy**: SLAs are like insurance; they specify what happens when delivery fails and how gaps are addressed

## Internal Mechanics
- Stripe: Webhook delivery starts immediately, retries at increasing intervals up to 3 days; p99 delivery within minutes
- Stripe idempotency: `Idempotency-Key` header for safe retry; same key = same response for 24 hours
- Stripe signature: `Stripe-Signature` header with `t=timestamp,v1=signature` format
- Adyen: Configurable webhook settings (HMAC key, populator fields, event types); delivery via SOAP or JSON
- Adyen retry: Exponential backoff with configurable max attempts; delivery reports via `REPORT_AVAILABLE` notification
- Fintech best practice: webhook delivery SLA of 99.99% success within 1 hour (p99), 99.9% within 5 minutes (p50)
- Reconciliation window: 24-72 hour window for matching webhooks with internal transaction records

## Patterns
- **Idempotent Processing**: Every webhook handler must be idempotent (use Stripe's `Idempotency-Key` or event ID)
- **Ordering Compensation**: Handle out-of-order delivery by recording event timestamps and applying events in sequence
- **Reconciliation Job**: Scheduled job (daily) that matches webhook events with local transaction records; flags mismatches
- **Escalation Ladder**: Automated retry → on-call alert → manual reconciliation for failed payment webhooks
- **Late Delivery Handling**: System must handle webhooks arriving after reconciliation window (update, don't fail)
- **Business Continuity Playbook**: Document procedures for when webhook delivery fails completely (manual payment reconciliation, alternative provider fallback)

## Architectural Decisions
- Design webhook processing for at-least-once delivery (expect duplicates, implement idempotency)
- Never assume ordering guarantees; process webhooks based on event timestamp, not arrival order
- Set reconciliation window to match provider's max retry horizon (Stripe: 3 days, Adyen: configurable)
- Implement compensating transactions for late or duplicate webhook delivery
- Monitor delivery SLIs (latency, success rate, duplicate rate) per provider in real-time
- Maintain a business continuity plan for provider-level outages (manual processing, alternative providers)

## Tradeoffs
- Longer reconciliation windows reduce false positives but delay final settlement
- At-least-once delivery is simpler but requires idempotent processing
- Provider redundancy (multiple payment gateways) increases complexity but improves reliability
- Strict ordering guarantees add latency (must wait for all previous events) but simplify processing
- Real-time reconciliation is expensive; batch reconciliation is cost-effective but introduces settlement delays

## Performance Considerations
- Webhook delivery latency: provider → application (network) + signature verification + queue + processing
- Reconciliation throughput: depends on transaction volume; batch job for 100K+ transactions may run 30-60 minutes
- Idempotency store performance: Redis lookups must handle peak webhook traffic (potentially thousands/sec)
- Delivery monitoring: SLI collection adds overhead (metrics write per webhook); use sampled or batched collection
- Business continuity invocation: manual processes are slow (hours to days) by design (rare, non-automated path)

## Production Considerations
- Define and publish webhook SLAs/SLOs for your own outgoing webhooks if you're a fintech platform
- Monitor provider webhook SLIs and alert on SLA breaches (increasing delivery latency, decreasing success rate)
- Implement reconciliation automation: daily jobs that match provider webhooks with local state
- Document business continuity procedures and test them regularly (quarterly)
- Maintain communication channels with provider support for webhook delivery issues
- Log reconciliation results for audit and compliance reporting
- Ensure webhook delivery monitoring itself is monitored (alert if monitoring stops reporting)

## Common Mistakes
- Assuming webhooks arrive in order (real-world: out-of-order delivery is common under retry)
- Not implementing reconciliation (unreconciled transactions accumulate silently)
- Processing webhooks immediately in the HTTP request (queue-first is critical for fintech reliability)
- Using the same idempotency store for all providers (TLS mismatch between Stripe's 24h and Adyen's configurable TTL)
- Not testing failure scenarios: provider webhook outage, duplicate storms, delayed delivery
- Ignoring retry-After on 429 responses (fintech APIs are strict about rate limits)

## Failure Modes
- Provider outage: all webhook delivery suspended for hours to days
- Duplicate delivery: provider delivers the same webhook multiple times (idempotency must handle this)
- Late delivery: webhook arrives hours/days after the event (reconciliation window must accommodate)
- Out-of-order delivery: event 2 arrives before event 1 (ordering compensation must handle this)
- Reconciliation failure: webhook never arrives; manual reconciliation required
- Provider format change: webhook schema changes without notice (handler fails)

## Ecosystem Usage
- Stripe: Industry benchmark for webhook reliability; 3-day retry, Idempotency-Key, idempotent event processing
- Adyen: Configurable webhook delivery with HMAC signing, batch reports, and customizable retry settings
- Braintree: Webhook notification system with verification tokens and idempotency
- Square: Webhook delivery with signature verification and retry up to 5 times
- PayPal: Webhook delivery with HTTP signature verification and manual retry capability
- Paddle: Webhook delivery with signature verification and configurable retry settings
- Fintech industry standard: at-least-once delivery, idempotent processing, reconciliation within 72 hours

## Related Knowledge Units
- K003: HMAC-SHA256 Signature (fintech webhook signing)
- K006: Idempotency Key Pattern (fintech safe retry)
- K011: Spatie laravel-webhook-client (receiving fintech webhooks)
- K012: Spatie laravel-webhook-server (sending fintech webhooks)
- K034: Event Sourcing for Integrations (fintech audit trail)
- K018: Webhook Payload Storage (fintech compliance)
- K035: Standard Webhooks Specification (evolving toward fintech-grade standard)

## Research Notes
- Domain analysis rates fintech webhook SLAs as "Emerging" with low confidence
- Stripe's webhook documentation defines the de facto standard for fintech webhook best practices
- Adyen's webhook documentation provides the enterprise/multi-currency alternative pattern
- Fintech webhook reliability is critical: payment events cannot be lost or processed incorrectly
- The Standard Webhooks specification is converging with fintech requirements for signature, idempotency, and retry
- Industry trend: fintech providers moving toward Standard Webhooks for interoperability
- Business continuity for webhook failures is an under-documented area; most providers lack detailed BC guidance
- Reconciliation is the safety net for all webhook delivery failures; its design is as important as delivery reliability itself
