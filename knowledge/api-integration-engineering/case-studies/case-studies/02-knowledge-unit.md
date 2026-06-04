---
id: ku-aie-010
title: "Real-World Integration Case Studies"
subdomain: "case-studies"
ku-type: "practice"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "draft"
file-path: "research/workspaces/api-integration-engineering/10-case-studies/02-knowledge-unit.md"
---

# Real-World Integration Case Studies

## Executive Summary

Real-world integration case studies demonstrate how the patterns, packages, and resilience strategies documented across this domain come together in production systems. This KU covers four canonical examples: Stripe payment integration (idempotency + webhooks), GitHub webhook processing (event-driven + signature verification), multi-provider payment gateway aggregator (circuit breaker + abstraction), and SaaS integration marketplace (multi-tenant + OAuth2 installation flows).

## Core Concepts

- **Stripe Integration:** Idempotency keys for payment creation, webhook signature verification (v2 HMAC-SHA256), event-driven processing (charge.succeeded, payment_intent.succeeded), retry handling for failed payments.
- **GitHub Webhooks:** HMAC-SHA1/SHA256 dual verification, event type routing (push, pull_request, issues), rate limit awareness, event deduplication via delivery ID.
- **Payment Gateway Aggregator:** Provider abstraction layer (Stripe, Adyen, Braintree), per-provider circuit breakers, rate limit buckets per gateway, unified webhook event format.
- **SaaS Integration Marketplace:** OAuth2 installation flows per tenant, tenant-aware webhook endpoint routing, per-tenant API credential encryption, webhook delivery logs per tenant.

## Mental Models

- **Anti-Corruption Layer:** Each case study is an anti-corruption layer between your domain and an external system's domain. The integration translates between the external provider's model and your application's ubiquitous language.
- **Strangler Fig Pattern:** Migrations (e.g., from one payment provider to another) use the strangler fig — route new traffic to new provider while old provider handles existing subscriptions, then sunset.
- **Bulkhead Analogy:** Each provider integration has its own bulkhead (connection pool, rate limit bucket, circuit breaker) so one provider's failure doesn't sink all integrations.

## Internal Mechanics

- Stripe webhook signature uses `stripe-signature` header with timestamp + signature scheme (v1 HMAC-SHA256). Verify using raw body, strip prefix, compare with `hash_equals`.
- GitHub webhooks support both SHA1 and SHA256 signatures via `x-hub-signature-256` header. Delivery ID in `x-github-delivery` header is the idempotency key.
- Payment gateway aggregator maintains a provider registry with health status, rate limit state, and circuit breaker state per provider. Routing is configurable: primary/fallback or weighted round-robin.
- SaaS marketplace uses tenant-scoped OAuth2 tokens stored encrypted in the database. Webhook endpoints include tenant subdomain in URL, and the receiver middleware resolves the tenant before processing.

## Patterns

- **Idempotent Payment Creation:** Generate Idempotency-Key (UUID v4) for each payment creation call. Retry with same key for idempotent outcome. Store key in database transactionally.
- **Event-Driven Webhook Processing:** Map webhook event type to Laravel event. Dispatch queued listener per event type. Handle events idempotently via delivery ID deduplication.
- **Provider Failover Chain:** Primary payment provider with circuit breaker -> secondary provider on timeout/error -> tertiary on both failures. "Unavailable" response only when all providers are down.
- **Tenant-Aware OAuth2:** Each tenant installs the integration via OAuth2 flow. Credentials stored encrypted per tenant. Webhooks received at tenant-specific URL. Rate limits and circuit breakers scoped per tenant.

## Architectural Decisions

| Case Study | Key Decision | Alternative Considered | Rationale |
|------------|-------------|----------------------|-----------|
| Stripe | Queue-first webhook processing | Sync processing | Payment webhooks must return 200 fast; queue for business logic |
| GitHub | Delivery ID as idempotency key | Custom key | GitHub provides reliable unique delivery ID per event |
| Payment Aggregator | Per-provider circuit breakers | Global circuit breaker | One provider failing shouldn't block others |
| SaaS Marketplace | Encrypted DB-stored tokens | Redis-only tokens | Tokens must survive cache flush; encryption for compliance |

## Tradeoffs

- **Queue Processing Depth:** Shallow queue (immediate retry) means faster feedback but more failed jobs. Deep queue (delayed retry with backoff) gives resilience but delayed processing.
- **Provider Abstraction Depth:** Thin abstraction (pass through provider-specific types) is simpler but leaks provider concepts. Thick abstraction (unified types) adds complexity but protects domain.
- **Webhook Verification Strictness:** Strict (fail on any signature mismatch) is secure but rigid — provider may have edge cases. Lenient (log mismatch, still process) is flexible but risky.
- **Tenant Isolation:** Full isolation (separate DB per tenant, separate queue) is most secure but operationally expensive. Logical isolation (tenant_id column, shared queue) is simpler but has cross-tenant contamination risk.

## Performance Considerations

- Stripe API call latency: ~200-500ms per payment operation
- Stripe webhook processing (queued): ~50-100ms to return 200, business logic added async
- Payment gateway aggregator overhead: ~5-15ms for circuit breaker check + rate limit check + provider selection
- OAuth2 token refresh: ~500-1000ms per refresh (one extra HTTP call per token expiry)
- SaaS marketplace webhook routing: ~10-30ms for tenant resolution + credential decryption + provider dispatch

## Production Considerations

- Monitor Stripe API latency and error rates per endpoint — alert on >1% error rate.
- Implement dead-letter queue for webhook events that fail processing after max retries.
- Test circuit breaker behavior with chaos engineering — simulate provider failure and verify graceful degradation.
- Encrypt OAuth2 tokens at rest (Laravel's `encrypt()` for DB storage) — never store raw tokens.
- Document incident response for each integration: what to do when Stripe is down, GitHub is slow, etc.
- Use feature flags for provider routing — canary a new provider with 5% traffic before full rollout.

## Common Mistakes

- Not storing the original Stripe event ID for reconciliation — audit trail is incomplete.
- Processing GitHub webhooks synchronously — 30s+ operations block the webhook endpoint.
- Shared circuit breaker across all payment providers — one provider's failure blocks all payments.
- Storing OAuth2 tokens in plaintext in the database — compliance violation.
- No dead-letter queue for webhooks — events that fail processing are lost permanently.

## Failure Modes

- **Stripe Idempotency Key Collision:** Reusing a key across different request payloads results in 409 Conflict. Always tie key to request payload hash.
- **GitHub Webhook Replay:** Without delivery ID deduplication, the same push event can be processed multiple times (GitHub "at least once" delivery).
- **Payment Aggregator Cascade:** Primary provider circuit breaker opens -> all traffic shifts to secondary -> secondary rate-limits or fails -> all payments fail.
- **OAuth2 Token Revocation:** External provider revokes tenant's access token without notice — silent failures until next API call.

## Ecosystem Usage

- **Stripe:** `stripe/stripe-php` (vendor SDK), Spatie `laravel-webhook-client` with custom `StripeSignatureValidator`, Saloon for Stripe API calls (refunds, charges).
- **GitHub:** `saloonphp/saloon` for GitHub API client, Spatie `laravel-webhook-client` with GitHub-specific `SignatureValidator`.
- **Payment Aggregator:** Custom Connector/Request per provider (Saloon), `algoyounes/circuit-breaker` per provider, unified `PaymentResponse` DTO.
- **SaaS Marketplace:** Tenant-scoped Saloon connectors, encrypted credential storage, per-tenant webhook route registration.

## Related Knowledge Units

- ku-aie-005: Package Landscape (packages used in case studies)
- ku-aie-001: SDK Generation (SDK design patterns in case studies)
- ku-http-001: HTTP Client Patterns (underlying HTTP patterns)
- ku-res-001: Circuit Breaker Patterns (applied in aggregator case study)
- ku-web-001: Webhook Patterns (applied in Stripe/GitHub case studies)

## Research Notes

- Stripe's idempotency key pattern has become the industry standard, adopted by most payment providers and now formalized in IETF drafts.
- The payment gateway aggregator pattern has been well-documented since the "Release It!" era but remains challenging because each provider has unique failure modes and rate limits.
- SaaS multi-tenant integration marketplace is the least-documented pattern in the community; most implementations are proprietary and not shared.
- GitHub webhook delivery guarantees are "at least once" — deduplication via delivery ID is mandatory for correct event processing.
- OAuth2 token refresh race conditions (multiple concurrent refreshes) are a common source of silent auth failures in SaaS integrations.
