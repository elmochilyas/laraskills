# Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Webhook Distribution
- **Knowledge Unit ID:** K067
- **Knowledge Unit:** Spatie Laravel Webhook Client
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

# Overview
Spatie's `laravel-webhook-client` package provides the receiving counterpart to the webhook server. It validates incoming webhook requests by verifying HMAC signatures, prevents replay attacks via timestamp checks, stores incoming calls in the database, and dispatches configurable handling jobs. This formalizes webhook ingestion from a raw request handler into a secure, auditable, and extensible pipeline with signature verification, payload storage, and asynchronous processing.

# Core Concepts
- **Incoming webhook request**: An HTTP POST from a remote system with a JSON payload, `Signature` header, and optionally a `Timestamp` header.
- **Signature validation**: The client recomputes HMAC-SHA256 using the shared secret and compares it to the `Signature` header. Mismatches are rejected with 401.
- **Replay attack prevention**: The client checks the `Timestamp` header against a configurable tolerance window (default: 5 minutes). Requests outside the window are rejected.
- **Webhook call storage**: Every valid incoming webhook is stored as a `WebhookCall` Eloquent model with payload, headers, and processing status.
- **Profile-based processing**: A webhook profile class maps incoming webhooks to processing jobs or event handlers based on payload type or endpoint.
- **Async processing**: After validation and storage, the client dispatches a queued job to process the payload. The HTTP response returns immediately.
- **Signature calculation**: Uses `hash_hmac('sha256', payload, secret)` — same algorithm as the server. The signature is base64-encoded.

# When To Use
- Your application receives webhooks from external systems and needs to verify authenticity.
- You need an audit trail of all incoming webhook payloads for compliance or debugging.
- Multiple external services send webhooks to your application, each with different processing requirements.
- You need replay attack prevention for sensitive webhook events (payments, account changes, destructive operations).

# When NOT To Use
- Your webhook sender does not support HMAC signing and uses a different authentication mechanism (API keys, OAuth, mutual TLS).
- All incoming webhooks are from trusted internal systems on a private network where transport-layer security is sufficient.
- Webhook volume is very low and processing inline in the controller is acceptable — the package adds unnecessary complexity.
- You need real-time processing with no queue delay — the package always dispatches processing asynchronously.

# Best Practices
- **Always enable timestamp-based replay attack prevention in production.** HMAC alone proves authenticity but not freshness. Set the tolerance window to the maximum expected clock drift (typically 5-15 minutes).
- **Use `hash_equals()` for signature comparison.** Regular `==` comparison leaks timing information, enabling timing side-channel attacks. Spatie uses this by default — never override with a non-constant-time comparison.
- **Use dedicated queue workers for webhook processing.** Separate workers prevent webhook processing from starving application job capacity and isolate processing latency.
- **Store the full incoming payload and headers.** This creates a complete audit trail for debugging and compliance. Implement pruning for records older than your retention policy.
- **Assign a unique config key per external service.** Each key maps to its own signing secret. A compromised secret for one service does not affect others, and rotation schedules remain independent.

# Performance Considerations
- Signature verification (HMAC computation) is CPU-bound but negligible for typical payload sizes (~1μs per 1KB).
- Database writes for `WebhookCall` creation add latency to the HTTP response. For high-throughput ingestion, consider queueing the storage operation or using a write-optimized store.
- The incoming webhook route is synchronous — the HTTP response waits for validation and database storage. Keep validation logic minimal and fast.
- Storage growth: each webhook stores the full payload as JSON. Large payloads consume significant database storage quickly. Implement retention pruning.

# Security Considerations
- HMAC signature verification prevents unauthorized calls but requires secure distribution of the shared secret.
- Timestamp-based replay prevention requires accurate clocks on both sender and receiver. Use NTP synchronization on all systems.
- Signature comparison must use `hash_equals()` (constant-time) to prevent timing attacks. Never use `==` or `===`.
- Webhook signing secrets must be stored in environment configuration, never in the database.
- Without timestamp validation, captured webhook requests can be replayed indefinitely. Always enable it.
- Implement rate limiting on the webhook endpoint to prevent abuse. The package does not include built-in rate limiting.

# Common Mistakes
| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not configuring timestamp tolerance | Timestamp validation disabled or tolerance set too wide | Captured webhooks can be replayed within the tolerance window; too wide a window increases attack surface | Enable timestamp validation with a 5-minute tolerance; adjust for known clock drift |
| Using `==` for signature comparison | Developer uses loose or strict equality instead of `hash_equals()` | Timing side-channel leaks information about the correct signature, enabling forged signatures | Always use `hash_equals()` for HMAC comparison |
| Storing secrets in the database | Signing secret saved in the `webhook_calls` table or config model | Database compromise exposes secrets for all external services | Store secrets in environment config or a secrets manager |
| Processing webhooks synchronously in the controller | Custom handler processes the payload inline instead of dispatching a job | HTTP response time includes full processing time, increasing latency and risk of timeouts | Always dispatch a queued job for processing; return 200 immediately after validation |

# Anti-Patterns
- **Single global webhook config key**: All external services share one config key and secret. A compromised secret on any integration exposes all others. Use one config key per service.
- **Infinite tolerance window**: Setting timestamp tolerance to a very large value (hours or days) to avoid legitimate rejections. Circumvents replay protection entirely. Fix clock drift instead.
- **Ignoring rejected webhooks**: Not logging or monitoring signature mismatches and timestamp expirations. Missing configuration errors, attacks, or clock drift signals. Monitor rejection rates.
- **Re-encoding request body before verification**: Parsing JSON, modifying it, then re-encoding changes the byte sequence and invalidates the signature. Verify against the raw request body.

# Examples
```php
// config/webhook-client.php
return [
    'configs' => [
        [
            'name' => 'stripe',
            'signing_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'webhook_profile' => App\WebhookProfiles\StripeProfile::class,
            'webhook_model' => Spatie\WebhookClient\Models\WebhookCall::class,
            'process_webhook_job' => App\Jobs\ProcessStripeWebhook::class,
            'verify_timestamp' => true,
            'tolerance' => 5, // minutes
        ],
    ],
];

// Define a webhook profile
class StripeProfile implements WebhookProfile
{
    public function shouldProcess(WebhookCall $call): bool
    {
        return $call->payload['type'] === 'payment_intent.succeeded';
    }
}

// Process the webhook
class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        $event = $call->payload['type'];
        $data = $call->payload['data']['object'];

        match ($event) {
            'payment_intent.succeeded' => $this->handlePaymentSucceeded($data),
            'payment_intent.payment_failed' => $this->handlePaymentFailed($data),
        };
    }
}
```

# Related Topics
- K066 — Spatie Webhook Server (sending side)
- K068 — Exponential Backoff in Webhook Server (retry on sender side)
- K069 — Replay Attack Prevention (deep dive on timestamp header)
- K030-K035 — Broadcasting Real-Time (real-time vs webhook delivery)
