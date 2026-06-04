# ECC Standardized Knowledge — Spatie Laravel Webhook Client Package

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | incoming-webhooks |
| Knowledge Unit ID | ku-12 |
| Knowledge Unit | Spatie Laravel Webhook Client Package |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K003, K015, K005 |

## Overview (Engineering Value)
Spatie's laravel-webhook-client package provides a configurable, reusable webhook receiver with built-in signature verification, queue handling, and storage of incoming webhooks. It standardizes webhook processing across providers, reducing boilerplate and ensuring consistent security practices.

## Core Concepts
- **Webhook Config**: Per-provider configuration (signing secret, header name, queue connection)
- **Signature Validation**: Automatic HMAC verification against secret
- **Webhook Model**: Eloquent model storing incoming webhooks with metadata
- **WebhookProcessor**: Core class orchestrating validation, storage, and job dispatch
- **Profile Classes**: Per-provider configuration classes defining how webhooks are handled
- **Job Handling**: Automatic job dispatch per provider

## When To Use
- Receiving webhooks from multiple providers
- Teams wanting standardized webhook handling
- Requirements for webhook persistence (audit trail)
- Multiple signing mechanisms across providers

## When NOT To Use
- Single webhook endpoint with custom handling
- Real-time processing requiring no persistence
- When minimal dependencies are preferred
- Non-standard webhook authentication (OAuth, JWT)

## Best Practices
- One profile class per external provider
- Store signing secrets in vault/config, not hardcoded
- Use queue connection in config for async processing
- Leverage webhook model for audit and replay
- Configure response codes per provider expectations

## Architecture Guidelines
- Package config in `config/webhook-client.php`
- Profile classes in `Webhooks/Profiles/`
- Job classes for each provider's processing logic
- Signed webhooks stored for reprocessing capability
- Monitoring on failed webhook processing

## Performance Considerations
- Package overhead ~1ms per webhook beyond underlying HTTP handling
- Eloquent insert for webhook model adds ~5ms
- Queue dispatch overhead negligible
- Config caching improves profile class resolution

## Common Mistakes
- Using global secret for all providers (no isolation)
- Not configuring queue connection (sync processing in webhook controller)
- Missing profile class per provider (all treated identically)
- Not handling webhook model cleanup (table growth)
- Ignoring package version updates for security patches

## Related Topics
- **Prerequisites**: CSRF exclusion, signature validation
- **Closely Related**: Queue processing, webhook receiving
- **Advanced**: Custom profiles, provider-specific handling
- **Cross-Domain**: Package management, Laravel package development

## Verification
- [ ] Provider-specific profile classes defined
- [ ] Secrets stored per provider in config/vault
- [ ] Queue connection configured for async processing
- [ ] Webhook model cleanup strategy implemented
- [ ] Failed processing monitored and alerted
- [ ] Package updated for security patches
