---
id: ku-aie-005
title: "Package Landscape & Decision Framework"
subdomain: "package-landscape"
ku-type: "reference"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/api-integration-engineering/09-package-landscape/04-standardized-knowledge.md"
---

# API Integration Package Landscape & Decision Framework

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Package Landscape (09-package-landscape)
- **KU Type:** Reference
- **Maturity:** Mature
- **Status:** Standardized
- **Created:** 2026-06-02

## Overview

A structured decision framework for selecting packages across the Laravel API Integration Engineering ecosystem: HTTP clients (SaloonPHP, Guzzle, Http facade), webhooks (Spatie, managed gateways), circuit breakers (algoyounes, Fuse), idempotency (square1, infinitypaul), and versioning (laravel-apiroute).

## Core Concepts

- **Structured HTTP Client:** SaloonPHP v4 — Connector/Request/Response pattern with plugin ecosystem
- **Webhook Toolchain:** Spatie (client + server) — HMAC signing, queue-first processing, retry/backoff
- **Circuit Breaker:** algoyounes/circuit-breaker (sync), harris21/laravel-fuse (queue jobs)
- **Idempotency:** square1-io/laravel-idempotency (cache+lock), infinitypaul/idempotency-laravel (with telemetry)
- **API Versioning:** Grazulex/laravel-apiroute (multi-strategy, lifecycle management)

## When To Use Each Package

| Concern | Recommended Package | When To Use |
|---------|-------------------|-------------|
| HTTP client | SaloonPHP v4 | Multi-endpoint APIs, need auth/pagination/caching/rate limiting |
| HTTP client | Laravel Http facade | Simple single-endpoint calls, prototyping |
| HTTP client | Vendor SDK | Official PHP SDK exists (Stripe, Twilio) |
| Webhooks | Spatie client + server | Default for most Laravel apps |
| Webhooks | Convoy/Svix | High volume (10K+/day), need managed infrastructure |
| Circuit breaker (sync) | algoyounes/circuit-breaker | HTTP calls in controllers/services |
| Circuit breaker (queue) | harris21/laravel-fuse | Queue job execution on failing services |
| Idempotency | square1-io/laravel-idempotency | Standard idempotency-key pattern |
| Idempotency | infinitypaul/idempotency-laravel | High-throughput, multi-region, need telemetry |
| Versioning | Grazulex/laravel-apiroute | Multi-version API with deprecation lifecycle |

## When NOT To Use Each Package

| Concern | Package | When NOT To Use |
|---------|---------|-----------------|
| HTTP client | Saloon | One GET endpoint, no auth needed |
| HTTP client | Vendor SDK | Bloated transitive dependencies |
| Webhooks | Managed gateway | <1K webhooks/day, self-hosted is cheaper |
| Circuit breaker | Any | Single external service, no scaling concerns |
| Versioning | laravel-apiroute | Single-version API, no deprecation planned |

## Best Practices

- Default to Saloon + Spatie for new integrations; add other packages only for specific gaps
- Pin package versions: `"saloonphp/saloon": "^4.0"`, `"spatie/laravel-webhook-client": "^3.0"`
- Run `composer audit` weekly to detect dependency vulnerabilities
- Test package upgrades in CI before deploying
- Document package choices with justification in your project's architecture decision records
- Monitor package GitHub for deprecation warnings and migration announcements
- Prefer packages with explicit Laravel 13 support in composer.json

## Architecture Guidelines

1. **Layered package strategy:** Use Http facade for simple calls, Saloon for structured integrations, Spatie for webhooks
2. **Consistent middleware:** Apply circuit breaker, logging, and retry at the HTTP client layer (Guzzle middleware or Saloon plugin)
3. **Testability via faking:** Use `Http::fake()` for facade, Saloon `MockClient` for Saloon, `Http::fake()` for underlying Guzzle
4. **Separation of concerns:** HTTP transport (Saloon/facade), business logic (service class), error handling (exception taxonomy)
5. **Audit trail:** Log all integration calls with request ID, endpoint, status, timing, and response summary

## Performance Considerations

- Saloon overhead: ~1-3ms per request vs Http facade
- Circuit breaker state check: ~1-5ms (Redis)
- Idempotency check: ~2-5ms (cache + lock)
- Spatie webhook processing: ~5-10ms before queue job
- Each added middleware layer: ~0.5-2ms
- Vendor SDK overhead varies widely (2-20ms)

## Security Considerations

- Webhook signature verification prevents spoofed events — always verify, never skip in dev mode
- Circuit breaker state is security-sensitive — prevent reset via unauthenticated endpoints
- Idempotency keys can be brute-forced if predictable — use UUID v4 or secure random
- Package transitive dependencies can introduce vulnerabilities — audit regularly
- API keys stored in packages must use Laravel config + .env, never hardcoded

## Common Mistakes

- Using five packages when three suffice — evaluate overlap before installing
- Not pinning versions — automatic minor updates can introduce breaking changes
- Ignoring composer.json conflicts — test `composer update` before merging
- Vendor SDK wrapper overkill — wrapping Stripe PHP SDK in Saloon adds no value
- No circuit breaker on queue jobs — workers grind to a halt on external failure
- Choosing managed webhook gateway too early — self-hosted Spatie handles 10K/day easily

## Anti-Patterns

- **Package Sprawl:** 10+ integration packages when 3-4 cover all needs
- **Abandonware Dependence:** Critical integration relying on unmaintained package
- **Over-Abstraction:** Wrapping every vendor SDK in custom connector (cost without benefit)
- **Vendor SDK Lock-in:** Using vendor SDK that doesn't support Laravel patterns (queues, config, service container)
- **Migration Aversion:** Staying on outdated package version due to fear of breaking changes

## Examples

### Package Selection Decision
```php
// Simple external API (use Http facade)
$response = Http::get('https://api.example.com/health');

// Structured multi-endpoint API (use Saloon)
$connector = new GitHubConnector();
$response = $connector->send(new GetUserRequest('username'));

// Webhook receiver (use Spatie)
WebhookConfig::make()
    ->name('stripe')
    ->signingSecret(config('services.stripe.webhook_secret'))
    ->signatureValidator(new StripeSignatureValidator())
    ->processWebhookJob(StripeWebhookJob::class);
```

### composer.json
```json
{
    "require": {
        "saloonphp/saloon": "^4.0",
        "saloonphp/laravel-plugin": "^4.0",
        "spatie/laravel-webhook-client": "^3.0",
        "spatie/laravel-webhook-server": "^3.0",
        "algoyounes/circuit-breaker": "^1.0",
        "square1-io/laravel-idempotency": "^1.0"
    }
}
```

## Related Topics

- ku-aie-001: SDK Generation (SDK packages and OpenAPI generation tools)
- ku-aie-010: Case Studies (real-world package usage)
- ku-http-001: HTTP Client Foundations (underlying Http facade details)
- ku-res-001: Circuit Breaker Patterns (sync and queue breaker patterns)
- ku-ver-001: API Versioning Strategies (versioning decision framework)

## AI Agent Notes

- When starting a new integration project, default recommendation: Saloon + Spatie (webhooks) + square1-io (idempotency) + algoyounes (circuit breaker)
- Evaluate package health before recommending: check last commit, stars, test CI status, Laravel 13 support
- For migration projects, always read the target package's upgrade guide before planning the migration
- When investigating integration failures, first check: package version, Laravel version compatibility, and middleware configuration order
- Avoid recommending managed webhook gateways for <10K daily webhooks — self-hosted Spatie is more cost-effective

## Verification

- [ ] Package selection documented with rationale (architecture decision record)
- [ ] composer.json has appropriate version constraints (pinned, not floating)
- [ ] `composer audit` shows zero vulnerabilities
- [ ] All package versions are compatible with the project's Laravel version
- [ ] Test suite covers package integrations with fakes/mocks
- [ ] Circuit breaker implemented for all external API calls (sync and queue)
- [ ] Webhook signature verification enabled in all environments
- [ ] Idempotency applied to all non-idempotent HTTP methods (POST, PATCH)
- [ ] Migration path documented for each critical package
- [ ] Package health has been verified (recent commits, active maintenance)
