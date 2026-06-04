# Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Webhook Distribution
- **Knowledge Unit ID:** K068
- **Knowledge Unit:** Exponential Backoff in Webhook Server
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

# Overview
Exponential backoff in the Spatie webhook server is the retry strategy governing how failed webhook deliveries are retried over time. Unlike linear retry intervals that hammer a failing endpoint at fixed intervals, exponential backoff doubles the wait time between each attempt, providing graduated pressure on the receiving system while preventing self-inflicted DDoS. The webhook server implements this through a combination of `retry_until` timestamp and Laravel's job backoff system.

# Core Concepts
- **Exponential backoff formula**: Delay grows exponentially: `baseDelay * (2^attempt)` with optional jitter. Example: 10s, 20s, 40s, 80s, 160s.
- **retry_until**: An absolute `Carbon` timestamp on the webhook profile. The server stops delivery attempts after this time, regardless of retry count. Caps the total retry window.
- **Attempt tracking**: The `WebhookCall` model tracks `attempts` count. Backoff delay is computed from this count.
- **Job backoff integration**: `ProcessWebhookJob` uses Laravel's `backoff()` method to define the delay between retries.
- **Jitter**: Random noise added to the delay to prevent thundering herd when multiple webhooks target the same recovering endpoint.
- **Max attempts ceiling**: Job `$tries` or `retryUntil()` provides a hard cap within the `retry_until` window.

# When To Use
- Webhook delivery failures are expected to be transient (network blips, rate limits, temporary outages).
- Multiple webhooks target the same third-party endpoint — jitter prevents synchronized retry storms.
- You need to balance delivery reliability with responsible load on the receiving system.
- SLA requirements specify a delivery window (e.g., "retry for up to 24 hours").

# When NOT To Use
- The receiving endpoint is known to be permanently unavailable — backoff wastes resources. Use a dead-letter queue instead.
- Webhook delivery must happen at fixed, predictable intervals for compliance reasons — use linear retry with fixed delay.
- The total retry window is very short (seconds) — exponential backoff provides negligible benefit over linear.
- The receiving system requires constant retry pressure to trigger its own recovery mechanisms — linear or constant retry may be preferred.

# Best Practices
- **Set `retry_until` to `now()->addMinutes(60)` for non-critical webhooks, `now()->addHours(24)` for critical webhooks.** This aligns retry effort with business impact. Non-critical notifications can expire quickly; financial transactions need extended delivery windows.
- **Always add jitter to prevent thundering herd.** When a third-party endpoint recovers after an outage, all pending webhooks retry simultaneously. Jitter spreads retries across a window, avoiding synchronized load spikes.
- **Cap maximum delay at 300-600 seconds (5-10 minutes).** Exponential growth without a cap produces absurd delays (2+ hours after 10 attempts at 10s base). A cap ensures at least some retry frequency during long outages.
- **Store backoff configuration in the webhook profile, not globally.** Different endpoints have different reliability characteristics. A Stripe API endpoint tolerates different retry patterns than a small SaaS endpoint.
- **Coordinate backoff strategy with the receiving system's rate limits.** A backoff that retries faster than the recipient's rate limit window will never succeed. Align the backoff schedule with documented rate limits.

# Performance Considerations
- Backoff delays are implemented by Laravel's job scheduler — the job is released back to the queue with a delay. The job does not block a worker during the backoff period.
- Each retry attempt consumes queue worker capacity. A backlog of webhooks in backoff occupies queue space even when not actively processing.
- Database writes: each retry attempt updates the `WebhookCall` record. At scale, the `webhook_calls` table experiences write amplification proportional to retry count.
- Jobs in backoff appear in Horizon with a future `retry_at` timestamp. Monitor the count of delayed jobs as a leading indicator of webhook delivery health.

# Security Considerations
- No direct security implications of backoff itself, but the `retry_until` mechanism prevents indefinite retry loops that could be exploited for resource exhaustion.
- An attacker who triggers many webhook deliveries (e.g., by creating many orders) can amplify retry-related database writes. Implement rate limiting on webhook-triggering actions.
- Backoff delays are deterministic in the absence of jitter. An attacker can predict retry timing. Jitter adds unpredictability but is not a security control.

# Common Mistakes
| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No maximum delay cap | Exponential backoff grows without limit | After 10 attempts at 2x growth from 10s, the delay exceeds 2 hours — impractical for most SLAs | Cap maximum delay at 300-600 seconds |
| Identical backoff for all endpoints | Single backoff configuration applied globally | Backoff suitable for a resilient API like Stripe is too aggressive for a small SaaS endpoint | Configure backoff per webhook profile based on endpoint reliability |
| Forgetting jitter | Backoff uses purely exponential delays | All failed webhooks retry simultaneously when the endpoint recovers, causing a thundering herd | Add `rand(0, 0.5 * delay)` of jitter to each computed delay |
| Confusing job retries with webhook retries | Treating Laravel's `$tries` as the webhook retry limit | Job retry count may exhaust before `retry_until` is reached, or vice versa | Use `retryUntil()` for the time-based deadline and `backoff()` for delay control — they serve different purposes |
| Backoff faster than rate limits | Retry schedule ignores the receiving system's rate limits | Every retry attempt hits a rate limit response, wasting resources and failing permanently | Align backoff delays with documented rate limit reset intervals |

# Anti-Patterns
- **Linear retry for webhooks**: Fixed-interval retries (e.g., every 60s) hammer the failing endpoint and provide no graduated pressure. Always use exponential backoff with jitter for external HTTP integrations.
- **Infinite retry window**: Setting no `retry_until` or setting it years in the future. Failed webhooks retry indefinitely, consuming queue capacity and database storage. Always set a business-aligned deadline.
- **Jitter-only, no exponential growth**: Adding randomness without increasing delay over time. Early retries are too aggressive, late retries too frequent. Exponential growth is the core mechanism; jitter is additive.
- **Hardcoded backoff array in job class**: Backoff values baked into `ProcessWebhookJob` cannot vary by endpoint. Store backoff parameters in the webhook profile for per-endpoint customization.

# Examples
```php
// Webhook profile with exponential backoff
class OrderWebhookProfile implements WebhookProfile
{
    public function getRetryUntil(): Carbon
    {
        return now()->addHours(24);
    }
}

// ProcessWebhookJob backoff configuration
class ProcessWebhookJob implements ShouldQueue
{
    public function backoff(): array
    {
        // Base delays: 10s, 20s, 40s, 80s, 160s, cap at 300s
        $delays = [10, 20, 40, 80, 160, 300];

        // Add jitter: ±50% random variation
        return array_map(fn($d) => $d + rand(0, (int)($d * 0.5)), $delays);
    }

    public function retryUntil(): Carbon
    {
        return $this->webhookCall->retry_until;
    }

    public function handle(): void
    {
        $response = Http::withHeaders([
            'Signature' => $this->signature(),
        ])->post($this->webhookCall->endpoint, $this->webhookCall->payload);

        if ($response->successful()) {
            $this->webhookCall->markAsCompleted();
        } else {
            $this->fail($response->toException());
        }
    }
}
```

# Related Topics
- K066 — Spatie Webhook Server (base architecture)
- K069 — Replay Attack Prevention (security-focused webhook concerns)
- K018 — Backoff Strategies (general job backoff vs webhook-specific)
- K016-K024 — Retry & Failure Handling (comprehensive retry patterns)
