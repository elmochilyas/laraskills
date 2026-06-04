# Skill: Receive Incoming Webhooks with Spatie Laravel Webhook Client

## Purpose
Use the Spatie Laravel Webhook Client package to receive, verify, and process incoming webhooks with signature validation and configurable event handling.

## When To Use
- Receiving incoming webhooks from external services
- Need for structured webhook verification and dispatching
- Multiple webhook sources with different verification schemes

## When NOT To Use
- Simple single-source webhook (manual validation is simpler)
- Outgoing webhooks (use Spatie Webhook Server)

## Prerequisites
- `composer require spatie/laravel-webhook-client`
- Shared secret from webhook provider

## Workflow
1. Install package and publish config: `php artisan vendor:publish --provider="Spatie\WebhookClient\WebhookClientServiceProvider"`
2. Create a `WebhookProfile` class to decide which requests to process
3. Create a `WebhookSignatureValidator` class for signature verification
4. Create a `WebhookModel` (or use default) for storing webhook data
5. Create a `WebhookProcessor` to handle successful verifications
6. Register the route: `Route::webhooks('webhook-url', 'profile-class')`
7. Configure profile in `config/webhook-client.php`
8. Test webhook endpoint with valid and invalid signatures

## Validation Checklist
- [ ] Package installed and config published
- [ ] WebhookProfile created with request selection logic
- [ ] Signature validator configured for provider's scheme
- [ ] Webhook model stores incoming webhook data
- [ ] Processor dispatches appropriate jobs
- [ ] Route registered using `Route::webhooks()`
- [ ] Valid and invalid signature scenarios tested
