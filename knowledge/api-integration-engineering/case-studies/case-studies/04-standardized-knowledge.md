---
id: ku-aie-010
title: "Real-World Integration Case Studies"
subdomain: "case-studies"
ku-type: "practice"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/api-integration-engineering/10-case-studies/04-standardized-knowledge.md"
---

# Real-World Integration Case Studies

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Case Studies (10-case-studies)
- **KU Type:** Practice
- **Maturity:** Mature
- **Status:** Standardized
- **Created:** 2026-06-02

## Overview

Four canonical Laravel integration case studies demonstrating production-proven patterns: Stripe payment integration (idempotency + webhooks), GitHub webhook processing (event-driven + HMAC verification), multi-provider payment gateway aggregator (circuit breaker + abstraction), and SaaS integration marketplace (multi-tenant + OAuth2).

## Core Concepts

- **Stripe Pattern:** Idempotent payment creation via Idempotency-Key header; webhook signature verification via HMAC-SHA256; event-driven processing via Laravel events; queue-first webhook processing.
- **GitHub Pattern:** SHA256 HMAC signature verification; event-type routing (push, pull_request); delivery ID deduplication; rate limit aware client.
- **Payment Aggregator Pattern:** Provider abstraction via Connector/Request (Saloon); per-provider circuit breakers; unified webhook event schema; failover chain configuration.
- **SaaS Marketplace Pattern:** Tenant-scoped OAuth2 installation; encrypted credential storage; per-tenant webhook URL routing; tenant-isolated rate limit buckets.

## When To Use Each Pattern

- **Stripe Pattern:** Any payment integration requiring idempotent operations and webhook event processing
- **GitHub Pattern:** Any provider webhook with HMAC signature and reliable delivery ID
- **Payment Aggregator:** Multi-gateway payment systems; redundancy requirements; regional provider routing
- **SaaS Marketplace:** Multi-tenant platforms allowing third-party integrations; app marketplace products

## When NOT To Use

- **Stripe Pattern:** One-time non-recurring payments without webhooks (use Checkout, not API)
- **GitHub Pattern:** Receiving webhooks from internal services without HMAC support
- **Payment Aggregator:** Single-provider payment system (abstraction is premature)
- **SaaS Marketplace:** Single-tenant applications (multi-tenancy overhead is unjustified)

## Best Practices

- Always verify webhook signatures in production — never skip verification for any environment
- Use queue-first webhook processing for all payment events (respond 200 fast, process async)
- Store idempotency keys with a TTL matching the API provider's retention window (Stripe: 24h)
- Implement per-provider circuit breakers in aggregator patterns — never global
- Encrypt all OAuth2 tokens at rest — use Laravel's `encrypt()` for database storage
- Log full request/response payload for debugging (redact sensitive fields)

## Architecture Guidelines

1. **Stripe:** Use vendor SDK for payment operations (idempotent), Spatie webhook client for incoming events. Store event ID + type for reconciliation audit.
2. **GitHub:** Use Saloon for GitHub API calls, Spatie webhook client for GitHub webhooks with custom HMAC validator. Deduplicate via delivery ID.
3. **Payment Aggregator:** One Saloon Connector per provider, CircuitManager per provider, unified PaymentResponse DTO, webhook normalization layer.
4. **SaaS Marketplace:** Tenant-aware Connector factory, encrypted credential store (app/Integrations/EncryptedStore.php), per-tenant webhook routing via subdomain.

## Performance Considerations

- Stripe API operations: 200-500ms per call
- GitHub API with rate limit remaining check: 100-300ms
- Circuit breaker state check per provider: ~1-5ms
- OAuth2 token refresh: ~500-1000ms (cache refresh token)
- Webhook signature verification: <1ms (hash_equals is timing-safe)
- Encrypted credential decryption: ~0.5-1ms per operation

## Security Considerations

- Webhook signature verification is non-negotiable — prevents spoofed event injection
- OAuth2 tokens must be encrypted at rest and decrypted only for the current request's tenant
- Idempotency keys should be unpredictable (UUID v4) to prevent key-guessing attacks
- Webhook endpoints should be rate-limited to prevent replay abuse
- Log all authentication failures (signature mismatch, invalid token, expired key) for audit
- Never log raw API responses containing PII, payment data, or tokens

## Common Mistakes

- Processing payment webhooks synchronously (blocks Quick HTTP 200 response, provider retries)
- Using same circuit breaker for all providers (one provider failure blocks all payments)
- Storing OAuth2 tokens in plaintext in the database (GDPR/HIPAA risk)
- Not deduplicating GitHub webhooks via delivery ID (duplicate event processing)
- Reusing idempotency keys across different payment payloads (409 Conflict errors)

## Anti-Patterns

- **All-in-One Webhook Endpoint:** Single endpoint processing all provider events — violates separation of concerns
- **No Dead-Letter Queue:** Failed webhook events lost permanently — unrecoverable data loss
- **Hardcoded Provider Credentials:** Token in config files committed to version control
- **Synchronous Provider Calls in Controllers:** HTTP client calls blocking response to user
- **No Audit Trail:** Cannot reconstruct what happened during an integration incident

## Examples

### Stripe Webhook Verification
```php
class StripeSignatureValidator implements SignatureValidator
{
    public function isValid(Request $request, WebhookConfig $config): bool
    {
        $signature = $request->header('Stripe-Signature');
        $payload = $request->getContent();
        try {
            \Stripe\Webhook::constructEvent($payload, $signature, $config->signingSecret);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
```

### Payment Aggregator Failover
```php
class PaymentRouter
{
    public function charge(PaymentRequest $request): PaymentResponse
    {
        $providers = config('payments.providers');
        foreach ($providers as $name => $config) {
            if (CircuitManager::isAvailable($name)) {
                try {
                    return $this->providers[$name]->charge($request);
                } catch (ProviderException $e) {
                    CircuitManager::recordFailure($name);
                    continue; // Try next provider
                }
            }
        }
        throw new AllProvidersUnavailableException();
    }
}
```

## Related Topics

- ku-aie-005: Package Landscape (packages used across case studies)
- ku-aie-001: SDK Generation (SDK patterns used in aggregator)
- ku-web-001: Webhook Patterns (incoming/outgoing patterns)
- ku-res-001: Circuit Breaker Patterns (applied in aggregator)
- ku-http-001: HTTP Client Patterns (underlying transport)

## AI Agent Notes

- When asked about payment integration, start with Stripe — it's the most mature, well-documented pattern
- For new aggregation projects, recommend building a thin provider abstraction with per-provider circuit breakers from day one
- Always recommend storing the original webhook event payload in the database for replay/reconciliation
- When debugging webhook failures, first check: signature verification, queue connection, and idempotency deduplication
- For multi-tenant integrations, recommend tenant-scoped webhook URLs (subdomain routing) for isolation

## Verification

- [ ] Webhook signature verification enabled for all incoming webhooks in all environments
- [ ] Idempotency keys used for all non-idempotent payment operations (POST, PATCH)
- [ ] Queue-first processing for all webhook events (respond 200, process async)
- [ ] Per-provider circuit breakers in aggregator patterns
- [ ] OAuth2 tokens encrypted at rest (Laravel encrypt()) for SaaS marketplace
- [ ] Dead-letter queue configured for failed webhook processing
- [ ] Audit trail stored for all integration events (request, response, status, timing)
- [ ] Incident response runbook documented for each integration
- [ ] Chaos test passes — simulate provider failure, verify graceful degradation
- [ ] Rate limiting on all webhook receiving endpoints
