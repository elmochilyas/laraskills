# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 10-case-studies
**Knowledge Unit:** real-world-integration-case-studies
**Generated:** 2026-06-03

---

# Decision Inventory

1. Payment Integration Approach (Vendor SDK vs Direct API vs Aggregator)
2. Webhook Processing Architecture (Per-Provider vs Unified Endpoint)
3. Multi-Tenant Integration Architecture (Per-Tenant vs Shared vs Hybrid)

---

# Architecture-Level Decision Trees

---

## Payment Integration Approach

---

## Decision Context

Choosing the architecture for processing payment operations.

---

## Decision Criteria

* number of providers
* idempotency requirements
* webhook complexity
* future provider changes

---

## Decision Tree

Single payment provider (e.g., Stripe only)?
↓
YES → Use vendor SDK directly — no abstraction layer needed
  ↓
  Idempotent operations required (charge, refund)?
  ↓
  YES → Use provider's idempotency key mechanism (Stripe works)
  ↓
    Idempotency key storage during provider outage?
    ↓
    YES → Persist idempotency keys in DB with retry logic
    NO → In-memory only — retry may produce duplicate charges
  NO → Standard API calls without idempotency keys
  ↓
  Webhook processing via vendor SDK or Spatie?
  ↓
  Spatie → Better integration with Laravel queuing and event system
  Vendor SDK → Works but less integrated with Laravel patterns
NO → Multiple providers (aggregator pattern)?
  ↓
  YES → Build provider abstraction with per-provider circuit breakers
    ↓
  Abstraction approach:
  Single Connector per provider (Saloon) → Unified PaymentResponse DTO
  ↓
  Failover required if primary provider fails?
  ↓
  YES → Failover chain: try primary, if circuit open → try secondary
    ↓
    Regional routing needed?
    ↓
    YES → Route based on customer region (EU → Adyen, US → Stripe)
    NO → Simple failover order (stripe → adyen → braintree)
  NO → No failover — single provider at a time, switch via config
↓
  Webhook normalization across providers?
  ↓
  YES → Unified webhook event schema with provider-agnostic event types
  NO → Raw provider webhooks — application handles provider-specific logic

---

## Rationale

Vendor SDK is simplest for single provider. Aggregator pattern with per-provider circuit breakers is essential for multi-provider redundancy. Failover chain prevents total payment processing failure. Unified webhook schema simplifies downstream processing.

---

## Recommended Default

**Default:** Stripe SDK for single-provider; Saloon Connector per provider + CircuitManager + Unified PaymentResponse for multi-provider
**Reason:** Appropriate complexity — no over-engineering for single provider, sufficient resilience for multi-provider

---

## Risks Of Wrong Choice

Abstraction for single provider adds unnecessary complexity. No circuit breakers in aggregator causes cascading failure across all providers. No idempotency keys cause duplicate charges on retry.

---

## Related Rules/Skills

* 08-sdk-generation: sdk-generation (SDK building patterns)
* 04-resilience: circuit-breaker (per-provider circuit breaker implementation)

---

---

## Webhook Processing Architecture

---

## Decision Context

Designing how webhook endpoints are organized and how events are processed.

---

## Decision Criteria

* number of providers
* event type diversity
* processing patterns
* failure isolation

---

## Decision Tree

Multiple providers sending webhooks?
↓
YES → Per-provider endpoint strategy: `/webhooks/stripe`, `/webhooks/github`
  ↓
  Each provider has unique signature verification?
  ↓
  YES → Separate route + middleware per provider (isolated verification logic)
  ↓
  Share common middleware (rate limiting, logging)?
  ↓
  YES → Global middleware group with per-provider config overrides
  NO → Each route has its own middleware stack (duplication)
  NO → Unified endpoint with routing based on provider identifier
  ↓
  Unified endpoint approach:
  Provider identification via route prefix or header
  Dynamic dispatcher maps provider to handler class
NO → Single provider → Single endpoint is simpler
  ↓
  Multiple event types from the provider?
  ↓
  YES → Router within handler: map event type to dedicated job class
  ↓
  Unknown event types?
  ↓
  YES → Log + ignore unknown event types (non-breaking)
  NO → Validate against known event type list; reject unknown
  NO → Single job class handles all events (simpler but less modular)
↓
  Queue-first or synchronous processing?
  ↓
  Queue-first (recommended) → Dispatch job, return 200, process async
  Synchronous (not recommended) → Risk of provider timeout on retry
↓
  Dead-letter queue for failed events?
  ↓
  YES → Store failed events in separate table for manual reprocess
  NO → Failed events lost on final retry — unrecoverable

---

## Rationale

Per-provider endpoints isolate failure and simplify signature verification. Event-type routing within handlers enables modular processing. Queue-first processing prevents provider timeouts. Dead-letter queue makes failed events recoverable.

---

## Recommended Default

**Default:** Per-provider endpoints (`/webhooks/{provider}`) with Spatie client, queue-first processing, dead-letter queue, and unknown event type logging
**Reason:** Maximum isolation, modularity, and recoverability

---

## Risks Of Wrong Choice

Unified endpoint couples all providers to same failure domain. Sync processing causes provider timeouts on slow operations. No dead-letter queue means silent data loss on processing failures.

---

## Related Rules/Skills

* 03-webhooks: incoming/webhook-receiving (endpoint configuration)
* 03-webhooks: queue-async-processing (job dispatching patterns)

---

---

## Multi-Tenant Integration Architecture

---

## Decision Context

Designing integration architecture for multi-tenant SaaS applications.

---

## Decision Criteria

* tenant isolation requirements
* credential management
* rate limit strategy
* operational complexity

---

## Decision Tree

Do tenants have their own API credentials (OAuth2 tokens, API keys)?
↓
YES → Per-tenant credential storage with encryption
  ↓
  Storage approach: single table vs tenant-scoped?
  ↓
  Single `integration_credentials` table with `tenant_id` column
    ↓
    Encryption at rest? (Required)
    ↓
    YES → Laravel `encrypt()` for credential column; decrypt in service provider
    NO → Unencrypted storage = critical security violation
  ↓
  Credential refresh strategy?
  ↓
  Refresh on first use → Cache until expiry, refresh in background
  Proactive refresh → Scheduled job refreshes tokens before expiry
NO → Shared credentials for all tenants (e.g., Stripe Connect platform key)
  ↓
  Tenant identification in API calls?
  ↓
  Headers: `X-Tenant-ID` in outbound API calls
  Payload: Include tenant_id in webhook event metadata
↓
  Tenant-isolated rate limiting?
  ↓
  YES → Per-tenant Redis rate limit buckets (`rate:{tenant}:{service}`)
  ↓
  Bursty tenants can exhaust shared limits?
  ↓
  YES → Hard per-tenant caps + burst allowance (2x base cap)
  NO → Shared pool with fair queuing
  NO → Global rate limit across all tenants (simpler but unfair)
↓
  Per-tenant webhook endpoints?
  ↓
  YES → Subdomain-based routing: `{tenant}.yourapp.com/webhooks/{provider}`
  ↓
  DNS management overhead acceptable?
  ↓
  YES → Wildcard subdomain + tenant resolver middleware
  NO → Single endpoint with tenant context derived from credential
  NO → Single endpoint with tenant context in request payload

---

## Rationale

Per-tenant credentials enable true isolation — one tenant's expired token doesn't affect others. Encrypted storage is non-negotiable for OAuth2 tokens. Per-tenant rate limiting prevents noisy tenants from starving others. Subdomain webhook routing provides clean tenant separation.

---

## Recommended Default

**Default:** Per-tenant encrypted credential storage, per-tenant Redis rate limiting, single webhook endpoint with tenant context from credential lookup
**Reason:** Balances isolation and complexity — subdomain routing adds DNS overhead without proportional benefit for most applications

---

## Risks Of Wrong Choice

Shared credentials mean all tenants affected by one token expiry. No encryption exposes tokens in database. Shared rate limiting allows one tenant to exhaust capacity. No tenant context in webhooks makes event routing ambiguous.

---

## Related Rules/Skills

* 03-webhooks: incoming/webhook-receiving (multi-tenant webhook routing)
* 04-resilience: rate-limiting-algorithms (per-tenant rate limit implementation)
