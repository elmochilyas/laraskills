# Skill: Use Spatie Webhook Client for Structured Incoming Webhooks

## Purpose
Leverage the Spatie Laravel Webhook Client package for standardized incoming webhook handling with configurable profiles, validators, and processors.

## When To Use
- Multiple webhook sources with different verification needs
- Structured, extensible webhook processing
- When manual webhook handling becomes complex

## When NOT To Use
- Single-source, simple webhook integration
- When the Spatie package adds unnecessary abstraction

## Prerequisites
- `composer require spatie/laravel-webhook-client`
- Shared secrets for each webhook source

## Workflow
1. Install and publish config/migration
2. Create `WebhookProfile` to determine which requests to accept
3. Create `WebhookSignatureValidator` per provider
4. Create `WebhookModel` (or use default) with payload storage
5. Create `WebhookProcessor` for successful webhook handling
6. Register routes: `Route::webhooks('path', 'profile')`
7. Test valid and invalid signature scenarios
8. Monitor webhook receipt and processing stats

## Validation Checklist
- [ ] Package installed and configured
- [ ] WebhookProfile created with selection logic
- [ ] Signature validator per webhook source
- [ ] Webhook model stores incoming data
- [ ] Processor dispatches jobs for business logic
- [ ] Routes registered with `Route::webhooks()`
- [ ] Valid and invalid signatures tested
