# Metadata
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: Spatie Laravel Webhook Server
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Spatie's `laravel-webhook-server` package provides a formalized webhook dispatch system that queues HTTP calls to external endpoints, signs each payload, manages retry logic, and stores delivery attempts. Unlike ad-hoc `Http::post()` calls in jobs, the webhook server enforces a consistent envelope format, signature verification protocol, and configurable retry strategy — turning webhook delivery from a fire-and-forget HTTP call into a traceable, resumable process with delivery guarantees.

# Core Concepts
- **Webhook call**: A single HTTP POST to a configured endpoint with a JSON payload. The call is always dispatched through Laravel's queue system.
- **Webhook signature**: Each payload is signed using SHA-256 HMAC with a secret key. The signature is sent in the `Signature` header, computed over the JSON body.
- **Webhook profile**: A class that defines metadata stored alongside each webhook call — typically the payload type or event name. Profiles control payload serialization.
- **Webhook call storage**: Every webhook call attempt is persisted to the database (`webhook_calls` table), recording endpoint, payload, headers, response status, and error details.
- **Queued dispatch**: Webhook calls are dispatched as Laravel jobs. The queue connection and queue name are configurable per webhook profile.
- **Retry management**: Failed webhook calls are automatically retried based on configurable `retry_until` timestamp and backoff strategy.

# Mental Models
- **Certified mail with return receipt**: The webhook server is like sending a registered letter — you sign it (HMAC), send it tracked (database record), and get a delivery receipt (response status). If undelivered, you retry at intervals.
- **Sealed envelope**: The webhook server puts the payload in a sealed envelope (signature). The recipient can verify the envelope hasn't been tampered with before opening it.
- **Courier dispatch log**: Every package (webhook) is logged with sender, recipient, delivery time, and status. Failed deliveries are rescheduled automatically.

# Internal Mechanics
- The webhook server uses a `WebhookCall` Eloquent model to represent each delivery attempt.
- When `dispatch()` is called, the server creates a `WebhookCall` record in `pending` status, serializes the payload, computes the HMAC signature, and dispatches a `ProcessWebhookJob` to the queue.
- The `ProcessWebhookJob` performs the HTTP POST with the signature header, captures the response status and body, and updates the `WebhookCall` record.
- On success (2xx status), the record is marked `completed`. On failure (non-2xx or connection error), the record is marked `failed` and scheduled for retry.
- The server checks `retry_until` — if the current time exceeds this timestamp, the webhook is marked `permanently_failed` and no further retries are attempted.
- The signature is generated as `hash_hmac('sha256', $payloadJson, $secret)` and base64-encoded. Recipients recompute the HMAC using their shared secret.
- Webhook profiles implement `WebhookProfile` interface and define `shouldCall($webhookCallUrl)` to filter endpoints and `getPayload()` for payload content.

# Patterns
## Event-Based Webhook Dispatch
- **Purpose**: Automatically dispatch webhooks when domain events occur.
- **Benefits**: Decouples webhook delivery from business logic. One event can trigger webhooks to multiple endpoints.
- **Tradeoffs**: Event-to-webhook mapping adds indirection. Harder to trace which event caused which webhook.

## Webhook per Tenant
- **Purpose**: Each tenant configures their own webhook endpoint for receiving event notifications.
- **Benefits**: Multi-tenant SaaS platforms can offer webhook integrations without per-tenant code changes.
- **Tradeoffs**: Webhook profile configuration must be tenant-aware. Secret key management per tenant adds operational complexity.

## Replay Failed Webhooks
- **Purpose**: Manually retry permanently failed webhooks after fixing the recipient endpoint.
- **Benefits**: No data loss when downstream systems are temporarily unavailable.
- **Tradeoffs**: Manual intervention required. Automated replay can cause duplicate processing on the receiving end.

# Architectural Decisions
- Use the webhook server instead of raw `Http::post()` in jobs when you need delivery tracking, automatic retry, signature verification, and audit trails.
- Configure `retry_until` as an absolute future timestamp, not a retry count. This caps retry effort and prevents infinite retries on permanently dead endpoints.
- Store the webhook secret in environment config per endpoint or profile. Never hardcode secrets in payload construction.
- Set the queue to a dedicated `webhooks` queue with a separate worker to isolate webhook delivery latency from application job processing.

# Tradeoffs
Formal delivery tracking and retry | Database writes for every webhook attempt — adds latency and storage
HMAC-signed payloads prevent tampering | Signature scheme requires shared secret — not suitable for public endpoints
Configurable per-profile behavior | Profile abstraction adds complexity for simple use cases
Queue-based dispatch prevents blocking | Webhook delivery is delayed by queue latency

# Performance Considerations
- Each webhook call writes to the database twice (create + update). For high-throughput webhook delivery, the `webhook_calls` table can become a write bottleneck.
- The queue worker performing webhook calls ties up a worker slot for the duration of the HTTP call. Use a dedicated webhook queue with sufficient workers.
- Payload serialization and HMAC computation are CPU-bound but negligible for typical payload sizes. Large payloads (> 1MB) add measurable overhead.

# Production Considerations
- Monitor `webhook_calls` table size. Implement a pruning strategy for completed and permanently failed records.
- Set a reasonable `retry_until` — too short and transient failures become permanent; too long and you accumulate retries for dead endpoints.
- Log signature mismatches separately from general webhook failures. Signature errors indicate configuration drift or tampering attempts.
- Use a dedicated queue worker for webhook delivery with `--max-time` to recycle workers periodically, preventing memory leaks from long HTTP connections.

# Common Mistakes
- **Not configuring retry_until**: Without this, the server retries indefinitely based on the job's `$tries` property, eventually filling the failed_jobs table.
- **Using the same secret for all endpoints**: A compromised secret on one endpoint exposes all webhook deliveries. Use per-endpoint secrets.
- **Blocking on queue in tests**: The webhook server dispatches a job. Tests that do not run the queue will never execute the webhook call. Use `Bus::fake()` or configure sync queue for tests.
- **Assuming synchronous delivery**: The webhook server always dispatches through the queue. `dispatch()` returns immediately. The actual HTTP call happens asynchronously.

# Failure Modes
- **Permanently failed webhooks with no alert**: Webhooks that exceed `retry_until` are marked permanently failed but no notification is sent. Mitigation: monitor `failed` status in `webhook_calls` and alert on threshold.
- **Secret key rotation without migration**: Changing the secret invalidates all pending webhook calls. Mitigation: queue webhook dispatch after secret rotation completes, or support key rotation windows.
- **Database connection lost during webhook record update**: The HTTP call succeeded but the database update to mark it `completed` fails. The webhook appears as `pending` or `failed`. Mitigation: implement idempotency on the recipient side.

# Ecosystem Usage
- **Spatie laravel-webhook-client**: The companion package for receiving webhooks sent by this server. Handles signature validation and storage.
- **Laravel Horizon**: Webhook dispatch jobs appear in Horizon with their job class. Tag them for filtering: `->tags(['webhook', 'profile:'.$profile])`.

# Related Knowledge Units
- K067 Spatie Webhook Client (receiving side) | K068 Exponential Backoff in Webhook Server (retry strategy) | K069 Replay Attack Prevention (signature timestamp)

# Research Notes
The Spatie webhook server is the de facto standard for outbound webhook delivery in Laravel. Its database-backed delivery tracking makes it suitable for production systems that require audit trails. The key architectural insight is that webhook delivery is fundamentally different from internal job processing — external endpoints are unreliable, may be slow, and require authentication. Treating webhooks as a separate concern with dedicated infrastructure (queue, workers, storage) is essential for reliability.

## Research Notes
- Spatie's webhook-server package dispatches webhooks as queued jobs with configurable queue, backoff, and failure behavior — each webhook call is a job instance that can be monitored through Horizon or Pulse.
- Webhook replay attack prevention requires idempotency keys (sent as Idempotency-Key header) and a sliding window timestamp validation — the receiving service checks if a request with the same key was already processed within the window.
- Exponential backoff for webhooks must consider the total retry window (e.g., 24 hours) and the risk of thundering herd when all failed webhooks retry simultaneously — jitter is essential to avoid synchronized retries.
- The spatie/webhook-client package validates incoming webhooks via signature verification (HMAC with shared secret) and provides middleware for custom validation logic.
- Webhook delivery guarantees in Laravel follow the queue's at-least-once semantics — webhook receivers must implement idempotency to handle duplicate deliveries.
- Community webhook patterns include: event-based webhook triggers (using Laravel events), webhook delivery logs (for audit and debugging), and webhook health monitoring (success rate, latency percentiles).
- Webhook payload versioning is handled by the webhook provider — versioned endpoints or payload version headers enable backward-compatible webhook schema evolution.
- The spatie/laravel-webhook-server package supports webhook signing with SHA256 HMAC, configurable headers, and conditional dispatch based on webhook status.
