# Skill: Send Outgoing Webhooks with Spatie Laravel Webhook Server

## Purpose
Use the Spatie Laravel Webhook Server package to send webhooks to external subscribers with signature generation, retry logic, and delivery tracking.

## When To Use
- Your Laravel app needs to notify external services of events
- Outgoing webhooks with signature-based verification
- Webhook delivery tracking and retry management

## When NOT To Use
- Simple HTTP POST notifications (use Http facade)
- Event broadcasting to internal services

## Prerequisites
- `composer require spatie/laravel-webhook-server`
- Subscriber endpoints and shared secrets

## Workflow
1. Install package and publish config/migration
2. Run migration: `php artisan migrate`
3. Dispatch webhook: `WebhookCall::create()->url($url)->payload($data)->doNotSign()->dispatch()`
4. Configure signing secret for each subscriber
5. Handle delivery failures with retry callbacks
6. Track delivery status: pending, successful, failed
7. Monitor webhook delivery logs
8. Implement automatic retry for failed deliveries

## Validation Checklist
- [ ] Package installed, migrated, configured
- [ ] Webhook dispatch with correct URL and payload
- [ ] Signing secret configured per subscriber
- [ ] Delivery failures handled with retry
- [ ] Delivery status tracked and observable
- [ ] Retry logic for failed deliveries implemented
