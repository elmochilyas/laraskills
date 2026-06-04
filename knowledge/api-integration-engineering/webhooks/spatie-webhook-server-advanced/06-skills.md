# Skill: Use Spatie Webhook Server for Outgoing Webhook Delivery

## Purpose
Leverage the Spatie Laravel Webhook Server package for standardized outgoing webhook dispatch with signing, delivery tracking, and retry management.

## When To Use
- Any Laravel app sending webhooks to external subscribers
- Need for structured webhook dispatch with built-in retry
- Multiple subscriber types with different delivery requirements

## When NOT To Use
- Simple HTTP POST notifications
- When the package adds unnecessary abstraction

## Prerequisites
- `composer require spatie/laravel-webhook-server`
- Subscriber endpoints and shared secrets

## Workflow
1. Install, migrate, publish config
2. Dispatch: `WebhookCall::create()->url($url)->payload($data)->dispatch()`
3. Configure signing secret per subscriber
4. Configure delivery retry schedule
5. Track delivery status: pending, successful, failed
6. Handle delivery failures in event handler
7. Monitor delivery logs and failure rates
8. Prune old webhook delivery records

## Validation Checklist
- [ ] Package installed, migrated, configured
- [ ] Webhook dispatched with correct URL and payload
- [ ] Signing secret configured per subscriber
- [ ] Retry schedule configured
- [ ] Delivery status tracked and observable
- [ ] Failure events handled appropriately
- [ ] Delivery rates monitored
