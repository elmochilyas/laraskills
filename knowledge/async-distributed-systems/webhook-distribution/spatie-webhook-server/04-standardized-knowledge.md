# Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Webhook Distribution
- **Knowledge Unit ID:** K066
- **Knowledge Unit:** Spatie Laravel Webhook Server
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

# Overview
Spatie's `laravel-webhook-server` package provides a formalized webhook dispatch system that queues HTTP calls to external endpoints, signs each payload, manages retry logic, and stores delivery attempts. Unlike ad-hoc `Http::post()` calls in jobs, it enforces a consistent envelope format, signature verification protocol, and configurable retry strategy — turning webhook delivery from a fire-and-forget HTTP call into a traceable, resumable process with delivery guarantees.

# Core Concepts
- **Webhook call**: A single HTTP POST to a configured endpoint with a JSON payload, always dispatched through Laravel's queue system.
- **Webhook signature**: Each payload is signed using SHA-256 HMAC with a secret key, sent in the `Signature` header.
- **Webhook profile**: A class that defines metadata — payload type, event name, serialization, and queue configuration.
- **Webhook call storage**: Every attempt is persisted to the `webhook_calls` table with endpoint, payload, headers, response status, and error details.
- **Queued dispatch**: Webhook calls are Laravel jobs; queue connection and name are configurable per profile.
- **Retry management**: Failed calls are retried based on `retry_until` timestamp and backoff strategy.

# When To Use
- You need delivery tracking, automatic retry, signature verification, and audit trails for outbound HTTP calls.
- Multiple external endpoints receive event notifications from your system.
- Compliance or SLAs require proof of delivery (timestamps, response codes, attempt history).
- Multi-tenant SaaS platforms where each tenant configures their own webhook endpoint.

# When NOT To Use
- Simple fire-and-forget HTTP calls with no retry or audit requirements — raw `Http::post()` suffices.
- Internal service-to-service calls within the same network where a message queue or RPC is more appropriate.
- High-throughput scenarios where database writes per webhook call create unacceptable latency.
- Endpoints that cannot accept HMAC-signed payloads or require a different authentication scheme.

# Best Practices
- **Use dedicated queue workers for webhook delivery.** Webhook HTTP calls are I/O-bound and can stall workers. A dedicated `webhooks` queue with sufficient workers isolates delivery latency from application job processing.
- **Set `retry_until` to an absolute future timestamp, not a retry count.** This caps retry effort and prevents infinite retries on permanently dead endpoints. Align it with business SLAs (e.g., 1 hour for notifications, 24 hours for orders).
- **Use per-endpoint secrets, not a shared secret for all endpoints.** A compromised secret on one endpoint exposes all webhook deliveries. Store secrets in environment config per endpoint or profile.
- **Implement a pruning strategy for `webhook_calls`.** The table accumulates completed and permanently failed records rapidly. Prune or archive records older than your audit retention policy.
- **Add webhook-specific tags in Horizon.** Use `->tags(['webhook', 'profile:'.$profile])` for filtering and monitoring in the dashboard.

# Performance Considerations
- Each webhook call writes to the database twice (create + update). The `webhook_calls` table can become a write bottleneck under high throughput.
- Queue workers performing HTTP calls tie up a worker slot for the duration of the request. A dedicated webhook queue with sufficient workers prevents head-of-line blocking.
- Payload serialization and HMAC computation are CPU-bound but negligible for typical payload sizes (< 1 MB). Larger payloads add measurable overhead.
- Database writes add latency to the `dispatch()` call. For throughput-sensitive paths, dispatch webhook calls asynchronously from a job rather than inline.

# Security Considerations
- HMAC-SHA256 signing prevents payload tampering but requires secure distribution and storage of shared secrets.
- Signature verification alone does not prevent replay attacks — the companion webhook client adds timestamp-based freshness checks.
- Secrets must never be stored in the database or committed to version control. Use environment variables or a secrets manager.
- Log signature mismatches separately from general webhook failures. Signature errors indicate configuration drift or tampering attempts.
- Secret rotation invalidates pending webhook calls. Support a rotation window where both old and new secrets are accepted.

# Common Mistakes
| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not configuring retry_until | Profile omits the retry_until timestamp | Server retries indefinitely based on `$tries`, filling the failed_jobs table | Always set `retry_until` to an absolute timestamp aligned with business SLAs |
| Using the same secret for all endpoints | Single secret stored in a global config | Compromised secret on one endpoint exposes all webhook deliveries | Use per-endpoint secrets stored in environment config |
| Assuming synchronous delivery | Expecting `dispatch()` to perform the HTTP call | Tests pass without actually sending webhooks; logic assumes immediate delivery | Use `Bus::fake()` or configure sync queue for tests; design handlers to expect async delivery |
| Blocking on queue in tests | Tests do not run the queue worker | Webhook calls are never executed during testing | Use `Queue::fake()` and assert jobs dispatched, or configure sync driver for test environment |

# Anti-Patterns
- **Monolithic webhook profile**: A single profile handling all webhook types with conditionals for different endpoints. Results in tight coupling and reduced testability. Define one profile per webhook type.
- **Inline webhook dispatch in request lifecycle**: Calling `dispatch()` directly in a controller or event listener adds synchronous database write latency to the HTTP response. Use queued event listeners or command bus handlers to decouple dispatch from the request path.
- **Infinite retry without deadline**: Relying solely on job `$tries` without `retry_until`. Failed endpoints cause indefinite retries, wasting worker capacity and filling storage. Always set a delivery deadline.
- **Global secret for retry fallback**: Using a single fallback secret when per-endpoint secrets fail validation. Subverts the security model and introduces a shared vulnerability. Fix the secret configuration instead.

# Examples
```php
// Define a webhook profile
class OrderWebhookProfile implements WebhookProfile
{
    public function shouldCall(WebhookCallUrl $url): bool
    {
        return $url->isActive();
    }

    public function getPayload(): array
    {
        return [
            'event' => 'order.placed',
            'data' => $this->order->toArray(),
        ];
    }

    public function getRetryUntil(): Carbon
    {
        return now()->addHours(24);
    }
}

// Dispatch a webhook
WebhookCall::create()
    ->profile(new OrderWebhookProfile($order))
    ->toUrl($tenant->webhook_url)
    ->dispatch();
```

# Related Topics
- K067 — Spatie Webhook Client (receiving side)
- K068 — Exponential Backoff in Webhook Server (retry strategy)
- K069 — Replay Attack Prevention (signature + timestamp)
- K018 — Backoff Strategies (general job backoff patterns)
