# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Incoming)
Knowledge Unit: Spatie laravel-webhook-client Configuration and Customization
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Spatie's laravel-webhook-client is the de facto standard package for receiving webhooks in Laravel applications. It provides a complete pipeline: signature verification, payload storage, configurable event filtering via webhook profiles, and queued job processing. Its multi-config architecture supports receiving webhooks from multiple providers in a single application, each with independent signing secrets, signature validators, and processing jobs.

## Core Concepts
- **WebhookConfig**: Per-provider configuration array with signing secret, header name, validator class, profile, response class, model, and processing job
- **WebhookProcessor**: Core class orchestrating validation, storage, and job dispatch
- **SignatureValidator**: Interface for verifying webhook signature; default uses `hash_hmac('sha256', ...)`
- **WebhookProfile**: Decides whether to accept and store an incoming webhook payload
- **WebhookCall Model**: Eloquent model storing the webhook payload, headers, and processing status
- **ProcessWebhookJob**: Queued job class that receives and processes the validated webhook
- **Delete After Days**: Automatic cleanup of old webhook call records from database

## Mental Models
- **Assembly Line**: Webhook arrives → signature check → profile filter → store → queue job → process
- **Firewall Analogy**: SignatureValidator is the first gate (cryptographic check), WebhookProfile is the second gate (business logic filter)
- **Provider as Config**: Each webhook sender is a separate configuration entry with own pipeline

## Internal Mechanics
- The package registers a route that receives POST requests and passes them to `WebhookProcessor`
- `WebhookProcessor::process()` calls `SignatureValidator::isValid()`; returns 500 on failure and fires `InvalidWebhookSignatureEvent`
- On valid signature, `WebhookProfile::shouldProcess()` determines if payload should be stored
- Stored `WebhookCall` model receives payload JSON, selected headers, and status `pending`
- The configured `ProcessWebhookJob` is dispatched to the queue with the `WebhookCall` ID
- Dynamic properties on `WebhookCall` allow accessing payload fields as object properties
- Cleanup via Artisan command or schedule deletes records older than `delete_after_days` config

## Patterns
- **Per-Provider Profile**: Create separate webhook profiles for each provider to filter by event type
- **Custom Response**: Implement custom `WebhookResponse` class to return provider-specific response formats
- **Signature Override**: Replace `DefaultSignatureValidator` per config for non-standard signature schemes
- **Header Storage**: Configure `store_headers` to capture specific headers (e.g., `Stripe-Signature`, `webhook-id`)
- **Multiple Endpoints**: Run multiple configs from the same endpoint, dispatched based on URL/header matching
- **Job Failure Handling**: Catch exceptions in `ProcessWebhookJob::handle()` and fire domain events for alerting

## Architectural Decisions
- Use queue-first architecture: respond 200 immediately, process payload asynchronously
- Create unique `ProcessWebhookJob` per provider to isolate processing logic
- Configure short TTL for `delete_after_days` (30 days default) to control database growth
- Use provider-specific signing secrets, never reuse across providers
- Extend `WebhookCall` model for provider-specific relationships and methods

## Tradeoffs
- Queue-first means near-instant response but delayed processing; latency-sensitive operations may need synchronous path
- Storing all webhooks increases database usage but provides audit trail and replay capability
- Multiple configs increase complexity but support multi-provider webhook reception
- Default `ProcessEverythingWebhookProfile` accepts all events; filtering adds security but can miss events

## Performance Considerations
- Signature verification is CPU-bound but fast (<1ms); the main bottleneck is the database write
- Storing large payloads in the `payload` column can grow the database; consider compression or external storage
- Queue job dispatch overhead adds ~1-5ms to response time
- Database cleanup (`delete_after_days`) should be scheduled during low-traffic periods
- Index the `name` and `created_at` columns on `webhook_calls` table for efficient cleanup queries

## Production Considerations
- Alert on `InvalidWebhookSignatureEvent` to detect potential attacks or misconfigured senders
- Set proper `delete_after_days` to prevent unbounded table growth (30-90 days typical)
- Monitor webhook volume per provider and set up rate limiting on receiving endpoints
- Use separate queue connection for webhook processing to avoid blocking application jobs
- Implement idempotency in `ProcessWebhookJob` to handle duplicate delivery
- Rotate signing secrets regularly using the multi-config transition capability

## Common Mistakes
- Forgetting to add webhook route to CSRF exception list (causes 419 errors on all webhooks)
- Not configuring `process_webhook_job`, causing the job to be empty and webhooks to be stored but never processed
- Using the same signing secret across multiple providers (reduces security per provider)
- Modifying the `WebhookCall` model's `payload` after creation (payload is write-once)
- Not handling `FinalWebhookCallFailedEvent` equivalents for incoming webhooks (sentinel for monitoring)
- Processing webhooks synchronously in the controller, defeating the queue-first pattern

## Failure Modes
- Misconfigured signing secret causes all webhooks to fail verification and be discarded
- Queue worker down means webhooks are stored but never processed (stuck in `pending` status)
- Database connection failure during webhook receipt causes data loss (payload unrecoverable)
- Clock skew > tolerance causes signature verification failures if timestamp-bound
- Provider changes signature format without notice, requiring custom SignatureValidator

## Ecosystem Usage
- Standard for receiving Stripe, GitHub, Slack, and custom webhooks in Laravel applications
- Works alongside spatie/laravel-webhook-server for complete webhook send/receive pipeline
- Community uses it with Stripe payment webhooks, GitHub event hooks, Slack slash commands, and custom B2B webhooks
- Often paired with spatie/laravel-event-sourcing for webhook event sourcing patterns

## Related Knowledge Units
- K003: HMAC-SHA256 Webhook Signature (used by default SignatureValidator)
- K013: Laravel Queue Integration (processing layer for webhooks)
- K020: CSRF Bypass and Route Configuration (prerequisite for webhook endpoints)
- K021: Custom Signature Validator Implementation (for non-standard providers)
- K022: Replay Attack Prevention (timestamp + nonce protection)

## Research Notes
- Package maintained by Spatie (Freek Van der Herten), widely used in production Laravel apps
- Configuration-driven design enables zero-code additions for new webhook providers
- The `WebhookProcessor` class can be used directly outside HTTP context for testing
- Package supports Laravel 10-13 with PHP 8.2+
- Source: github.com/spatie/laravel-webhook-client README and configuration documentation
