# Metadata
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: Spatie Laravel Webhook Client
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Spatie's `laravel-webhook-client` package provides the receiving counterpart to the webhook server. It validates incoming webhook requests by verifying HMAC signatures, prevents replay attacks via timestamp checks, stores incoming calls in the database, and dispatches configurable handling jobs. This formalizes webhook ingestion from a raw request handler into a secure, auditable, and extensible pipeline with signature verification, payload storage, and asynchronous processing.

# Core Concepts
- **Incoming webhook request**: An HTTP POST from a remote system, expected to contain a JSON payload, a `Signature` header, and optionally a `Timestamp` header.
- **Signature validation**: The client recomputes the HMAC-SHA256 signature using the shared secret and compares it to the `Signature` header. Mismatched signatures are rejected with 401.
- **Replay attack prevention**: The client checks the `Timestamp` header against a configurable tolerance window (default: 5 minutes). Requests outside the window are rejected.
- **Webhook call storage**: Every valid incoming webhook is stored as a `WebhookCall` Eloquent model with payload, headers, and processing status.
- **Profile-based processing**: A webhook profile class maps incoming webhooks to processing jobs or event handlers based on the payload type or endpoint.
- **Async processing**: After validation and storage, the client dispatches a queued job to process the webhook payload. The HTTP response returns immediately.
- **Signature calculation**: Uses the same `hash_hmac('sha256', payload, secret)` algorithm as the server. The signature is the base64-encoded HMAC.

# Mental Models
- **Bouncer with guest list**: The webhook client is a bouncer checking IDs at the door. Only guests with valid, current IDs (signatures within time window) are let in. Everyone else is turned away at the door.
- **Tamper-evident seal**: Each webhook comes with a tamper-evident seal (signature). The client checks that the seal is intact before opening the package.
- **Registered mail clerk**: The client signs for every delivery, logs it in the ledger, stamps it with the time, and then forwards it to the right department for processing.

# Internal Mechanics
- The package registers a route `POST /webhook/{configKey}` that captures incoming webhook requests.
- The `WebhookController` validates the config key, deserializes the payload, and passes it to the `WebhookProcessor`.
- The processor retrieves the signing secret from config, computes the expected signature using `hash_hmac('sha256', $payload, $secret)`, and compares it to the `Signature` header using timing-safe comparison (`hash_equals()`).
- If a `Timestamp` header is present, the processor computes the age and compares it to the configured tolerance. Requests older than the tolerance are rejected.
- On successful validation, a `WebhookCall` record is created with `pending` status. A configurable job class is dispatched to process the stored webhook.
- The processing job receives the `WebhookCall` ID, retrieves it from the database, and invokes the configured handler.
- The handler can be an invocable class, a Laravel event, or a custom job — determined by the webhook profile configuration.
- Webhook profiles implement `WebhookProfile` interface with `shouldProcess($webhookCall)` to filter which webhooks to process.

# Patterns
## Unified Webhook Ingestion Endpoint
- **Purpose**: Single endpoint for all incoming webhooks, routed by profile based on payload type.
- **Benefits**: Simplified network configuration (one URL for firewall, DNS, load balancer).
- **Tradeoffs**: Payload introspection required for routing — adds processing overhead per request.

## Per-Service Secret Rotation
- **Purpose**: Each external service gets a different webhook config key with its own signing secret.
- **Benefits**: Compromised secret for one service does not affect others. Independent rotation schedules.
- **Tradeoffs**: More config keys to manage. Secret rotation requires coordination with the external service provider.

## Webhook Replay from Database
- **Purpose**: Manually reprocess a stored webhook that failed during handling.
- **Benefits**: No data loss when a processing bug is fixed or a downstream dependency recovers.
- **Tradeoffs**: Replaying a webhook may cause duplicate side effects if the handler is not idempotent.

# Architectural Decisions
- Always enable timestamp-based replay attack prevention in production. Set the tolerance window to the maximum expected clock drift between systems (typically 5-15 minutes).
- Use a dedicated route prefix for webhooks (`/webhooks/{configKey}`) to avoid conflicts with application routes.
- Configure different queue connections for webhook processing jobs — isolate from application job queues.
- Store the full incoming payload and headers in the database for audit trails. Implement pruning for old records.

# Tradeoffs
HMAC signature verification prevents unauthorized calls | Requires shared secret distribution — not suitable for anonymous webhooks
Database storage provides full audit trail | Write amplification — every valid webhook creates a database record
Profile-based routing is extensible | Configuration overhead for each webhook type
Async processing returns fast HTTP response | Webhook handling is delayed by queue latency

# Performance Considerations
- Signature verification is CPU-bound (HMAC computation) but negligible for typical payload sizes.
- Database writes for `WebhookCall` creation add latency to the HTTP response. For high-throughput webhook ingestion, consider batching or async writes.
- The incoming webhook route is synchronous — the HTTP response waits for validation and database storage, not for processing job dispatch. Keep validation fast.
- Storage growth: each webhook stores the full payload as JSON. Large payloads (webhook bodies with embedded files) consume significant database storage quickly.

# Production Considerations
- Monitor rejected webhooks (signature mismatch, timestamp expired). A sudden increase may indicate an attack or a misconfigured sender.
- Implement rate limiting on the webhook endpoint to prevent abuse. Spatie webhook-client does not include built-in rate limiting.
- Configure a reasonable retention policy for `webhook_calls`. Processing logs are valuable for debugging but accumulate fast.
- Use a dedicated queue worker for webhook processing jobs. Separate workers prevent webhook processing from starving application job capacity.

# Common Mistakes
- **Not configuring timestamp tolerance**: Without timestamp validation, captured webhook requests can be replayed indefinitely.
- **Using `==` for signature comparison**: Signature comparison must use `hash_equals()` or a timing-safe comparison to prevent timing attacks.
- **Storing secrets in the database**: Webhook signing secrets should be in environment config, never in the database.
- **Processing webhooks synchronously in the controller**: The package defers processing by default, but custom controllers that bypass the package may process inline, extending response time.

# Failure Modes
- **Clock drift between systems**: The sender's clock is more than `tolerance` minutes off from the receiver's clock. Valid webhooks are rejected as expired. Mitigation: use NTP on all systems, set tolerance to accommodate worst-case drift.
- **Secret key mismatch after rotation**: The sender rotates the signing key but the receiver's config is not updated. All webhooks fail signature validation. Mitigation: support a grace period where both old and new secrets are accepted.
- **Database write failure during validation**: The signature is valid but the `WebhookCall` record cannot be created. The request returns an error, and the sender retries. Mitigation: ensure database availability is monitored.

# Ecosystem Usage
- **Spatie laravel-webhook-server**: The sending counterpart. The two packages share the same signing algorithm and can be used together for internal service-to-service communication.
- **Laravel Horizon**: Processing jobs dispatched by the client appear in Horizon. Tag them with the webhook profile name for filtering.

# Related Knowledge Units
- K066 Spatie Webhook Server (sending side) | K068 Exponential Backoff in Webhook Server (retry on sender side) | K069 Replay Attack Prevention (deep dive on timestamp header)

# Research Notes
The Spatie webhook-client provides a secure, opinionated webhook ingestion pipeline. Its most important feature is the combination of HMAC signature verification with timestamp-based replay prevention — this covers the two primary attack vectors for webhook endpoints. The storage of all incoming webhooks in the database creates a powerful audit trail but requires active management to prevent unbounded storage growth. The profile-based architecture makes it suitable for multi-tenant and multi-service integrations.

## Research Notes
- Spatie's webhook-server package dispatches webhooks as queued jobs with configurable queue, backoff, and failure behavior — each webhook call is a job instance that can be monitored through Horizon or Pulse.
- Webhook replay attack prevention requires idempotency keys (sent as Idempotency-Key header) and a sliding window timestamp validation — the receiving service checks if a request with the same key was already processed within the window.
- Exponential backoff for webhooks must consider the total retry window (e.g., 24 hours) and the risk of thundering herd when all failed webhooks retry simultaneously — jitter is essential to avoid synchronized retries.
- The spatie/webhook-client package validates incoming webhooks via signature verification (HMAC with shared secret) and provides middleware for custom validation logic.
- Webhook delivery guarantees in Laravel follow the queue's at-least-once semantics — webhook receivers must implement idempotency to handle duplicate deliveries.
- Community webhook patterns include: event-based webhook triggers (using Laravel events), webhook delivery logs (for audit and debugging), and webhook health monitoring (success rate, latency percentiles).
- Webhook payload versioning is handled by the webhook provider — versioned endpoints or payload version headers enable backward-compatible webhook schema evolution.
- The spatie/laravel-webhook-server package supports webhook signing with SHA256 HMAC, configurable headers, and conditional dispatch based on webhook status.
