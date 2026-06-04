# ECC Standardized Knowledge — Spatie laravel-webhook-client Configuration and Customization

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | Spatie laravel-webhook-client Configuration and Customization |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K011, K013, K020, K021, K022 |

## Overview (Engineering Value)
Spatie's laravel-webhook-client is the de facto standard package for receiving webhooks in Laravel. It provides a complete pipeline: signature verification, payload storage, configurable event filtering via webhook profiles, and queued job processing. Its multi-config architecture supports receiving webhooks from multiple providers simultaneously, each with independent secrets, validators, and processing jobs.

## Core Concepts
- **WebhookConfig**: Per-provider configuration array with signing secret, header name, validator class, profile, response class, model, and processing job
- **WebhookProcessor**: Core class orchestrating validation, storage, and job dispatch
- **SignatureValidator**: Interface verifying webhook signature; default uses HMAC-SHA256
- **WebhookProfile**: Decides whether to accept and store an incoming webhook payload
- **WebhookCall Model**: Stores payload, headers, and processing status
- **ProcessWebhookJob**: Queued job class that receives and processes the validated webhook

## When To Use
- Receiving webhooks from any external provider (Stripe, GitHub, Slack, etc.)
- Multi-provider webhook reception in a single application
- Any Laravel application requiring queue-first webhook processing

## When NOT To Use
- Very simple single-provider webhook (direct controller may suffice)
- Non-HTTP webhook-like integrations (message queues, pub/sub)
- Custom webhook gateway managed externally (Convoy, Svix)

## Best Practices
- Create unique ProcessWebhookJob per provider to isolate processing logic
- Configure short TTL for `delete_after_days` (30 days default) to control database growth
- Use provider-specific signing secrets, never reuse across providers
- Implement idempotency in ProcessWebhookJob to handle duplicate delivery
- Alert on `InvalidWebhookSignatureEvent` to detect attacks or misconfiguration

## Architecture Guidelines
- One WebhookConfig per external provider in `config/webhook-client.php`
- Extend WebhookCall model for provider-specific relationships and methods
- Use separate queue connection for webhook processing to avoid blocking application jobs
- Route webhooks to provider-specific event handlers via job dispatch
- Store provider-relevant headers in `store_headers` config for audit

## Performance Considerations
- Signature verification: <1ms; main bottleneck is database write
- Storing large payloads grows database; consider compression or archival
- Queue job dispatch adds ~1-5ms to response time
- Index `name` and `created_at` columns on `webhook_calls` for cleanup queries

## Security Considerations
- Add webhook URLs to CSRF exception list (419 errors otherwise)
- Use timing-safe comparison in all signature validators
- Never expose raw signing secrets in logs or error responses
- Rotate signing secrets regularly using multi-config transition
- Implement rate limiting on webhook endpoints regardless of package

## Common Mistakes
- Forgetting CSRF exception (causes 419 errors on all webhooks)
- Not configuring `process_webhook_job` (webhooks stored but never processed)
- Same signing secret across multiple providers
- Modifying WebhookCall payload after creation (payload is write-once)
- Processing webhooks synchronously in controller

## Anti-Patterns
- Single ProcessWebhookJob for all providers (mixing concerns)
- Synchronous webhook processing
- Storing raw request without signature verification
- Unlimited webhook_calls table growth without cleanup

## Examples
```php
// config/webhook-client.php
return [
    'configs' => [
        'stripe' => [
            'signing_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'signature_header_name' => 'Stripe-Signature',
            'signature_validator' => StripeSignatureValidator::class,
            'webhook_profile' => StripeWebhookProfile::class,
            'webhook_model' => WebhookCall::class,
            'process_webhook_job' => ProcessStripeWebhook::class,
        ],
    ],
];
```

## Related Topics
- **Prerequisites**: CSRF bypass, Laravel queues, signature verification
- **Closely Related**: Custom validators, replay protection, webhook profiles
- **Advanced**: Event sourcing for webhooks, webhook gateways
- **Cross-Domain**: Spatie package ecosystem, webhook provider documentation

## AI Agent Notes
- When integrating a new webhook provider, generate complete WebhookConfig entry
- Include all config keys: signing_secret, signature_header_name, signature_validator, webhook_profile, process_webhook_job
- Generate provider-specific ProcessWebhookJob with idempotency check

## Verification
- [ ] WebhookConfig configured per provider in config/webhook-client.php
- [ ] CSRF exception configured for webhook URLs
- [ ] ProcessWebhookJob defined and dispatched
- [ ] `delete_after_days` set to control database growth
- [ ] InvalidWebhookSignatureEvent monitored for alerting
- [ ] Webhook routes cached after deployment
