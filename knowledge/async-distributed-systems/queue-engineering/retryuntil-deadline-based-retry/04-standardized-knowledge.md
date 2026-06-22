# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** retryUntil — Dynamic Deadline-Based Retry
- **Knowledge ID:** KXXX-retryuntil-deadline-based-retry
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-22
- **Source References:**
  - Laravel Docs — Queues: Job Expiration (retryUntil)
  - Laravel Source — `Illuminate\Queue\Worker`, `Illuminate\Bus\Queueable`

---

# Overview

`retryUntil()` provides dynamic, deadline-based retry logic for Laravel queue jobs. Unlike the static `$tries` property (fixed attempt count) or `$maxExceptions` (failure threshold), `retryUntil()` evaluates a closure that returns a `Carbon`/`DateTime` deadline. The job retries as long as `now() < deadline`. This enables business-aware retry windows for time-sensitive operations — webhook delivery windows, payment processing cutoffs, SLA-bounded workloads. In Laravel 10+, the closure is re-evaluated before each retry, allowing adaptive deadline recalculation.

---

# Core Concepts

- **`retryUntil()`:** Returns a `DateTime` or `Carbon` instance. Job retries while `now() < deadline`. Returns `null` to disable.
- **`$tries`:** Fixed maximum attempt count. `retryUntil()` can override/extend this (the earlier trigger ends retries).
- **`$maxExceptions`:** Maximum unhandled exception count. Separate dimension — limits failure types, not retry count.
- **`$backoff`:** Delay between retries (int, array, or closure). Works alongside `retryUntil()`.
- **Deadline re-evaluation:** In Laravel 10+, the `retryUntil()` closure is called at construction AND before each retry. Dynamic deadlines recalculate.
- **Carbon integration:** Use `Carbon::now()->addMinutes(5)`, `CarbonImmutable::now()->endOfDay()`, etc.

---

# When To Use

- Business-hours-bound retry: "retry until 5 PM, then give up"
- Payment windows: "retry payment for 15 minutes, within the gateway's hold window"
- Webhook delivery: "retry until the sender's timeout expires"
- SLA-bounded operations: "retry until the SLA deadline, then escalate"
- Time-sensitive data processing: "retry until the data becomes stale"
- Any scenario where the "should I retry?" decision depends on current time, not attempt count

---

# When NOT To Use

- Transient failures (network blips, deadlocks) where 3-5 retries always succeeds — use `$tries`
- When the deadline is always the same — consider `$tries` + `$backoff` for simplicity
- When retry logic depends on attempt count, not time — use `$tries`
- When you need to distinguish failure types (retryable vs not) — use `$maxExceptions`

---

# Best Practices

- **Always set a `$tries` cap alongside `retryUntil()`.** A deadline without a cap can lead to thousands of retries. *Why: A 24-hour deadline with 1-second backoff = 86,400 potential retries. The `$tries` cap prevents resource exhaustion.*
- **Use `CarbonImmutable` for deadline calculations.** Avoid mutable Carbon side effects when the closure is called multiple times. *Why: `Carbon::now()->addMinutes(5)` mutates the instance — if called multiple times (Laravel 10+ re-evaluation), the deadline shifts unpredictably.*
- **Match `$backoff` to the deadline window.** Short deadline + long backoff = few retries. Long deadline + short backoff = many retries. *Why: If backoff pushes the next attempt past the deadline, the job is re-queued but fails immediately when picked up — wasteful.*
- **Account for clock skew in multi-server deployments.** Worker servers may have different clock times. *Why: Worker A evaluates the deadline and releases the job. Worker B picks it up and evaluates — with skewed clocks, B may see a different deadline.*
- **Test deadlines with time travel.** Use `Carbon::setTestNow()` or Pest's `travelTo()` to verify retryUntil behavior without waiting real time. *Why: A 15-minute deadline can be tested in milliseconds with time travel.*

---

# Performance Considerations

- Closure evaluation: ~microseconds for Carbon operations, ~milliseconds if checking external state (DB, cache, API).
- Short backoff + long deadline = many retries. Monitor `attempts` count in Horizon.
- External-state closures: each retry evaluation makes a DB/cache call. For 1000 retries, that's 1000 extra queries.
- Failed job storage: all retried jobs that fail are stored in `failed_jobs` — large payloads accumulate.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not setting `$tries` with `retryUntil()` | Long deadline, no cap | Thousands of retries, queue exhaustion | Always pair `retryUntil()` with a `$tries` cap |
| Using mutable Carbon in closure | `Carbon::now()->addMinutes(5)` mutates | Deadline shifts on re-evaluation (Laravel 10+) | Use `CarbonImmutable` or `now()->copy()->addMinutes(5)` |
| Backoff > remaining deadline time | Long backoff with short remaining deadline | Job released but immediately fails on pickup | Check: `backoff < (deadline - now)` |
| Not resetting `retryUntil` for long-running jobs | Closure captures stale deadline | Job retries indefinitely past intended cutoff | Use dynamic closure recalculated on each evaluation |
| Ignoring timezone configuration | Server timezone differs from business timezone | Deadline evaluated in UTC but business rule is EST | Use `Carbon::now('America/New_York')` for business deadlines |

---

# Examples

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\CarbonImmutable;

class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 10;
    public $backoff = [5, 10, 30, 60];

    public function __construct(
        public string $paymentId,
    ) {}

    public function retryUntil(): \DateTime
    {
        // Retry for 15 minutes from job creation
        return CarbonImmutable::now()->addMinutes(15);
    }

    public function handle(PaymentGateway $gateway): void
    {
        $gateway->capture($this->paymentId);
    }
}
```

```php
// Business-hours retry: stop at 5 PM today
class ProcessWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 20;
    public $backoff = 30;

    public function retryUntil(): \DateTime
    {
        return CarbonImmutable::now('America/New_York')
            ->setTime(17, 0, 0);
    }

    public function handle(): void
    {
        // Process webhook — only during business hours
    }
}
```

```php
// Dynamic deadline based on external state (Laravel 10+)
class SendNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 5;
    public $backoff = 60;

    public function __construct(
        public string $campaignId,
    ) {}

    public function retryUntil(): ?\DateTime
    {
        $campaign = Cache::get("campaign:{$this->campaignId}:deadline");

        if (!$campaign) {
            // Campaign was cancelled — stop retrying
            return CarbonImmutable::now(); // Immediately past
        }

        return CarbonImmutable::parse($campaign);
    }

    public function handle(): void
    {
        // Send notification if campaign is still active
    }
}
```

---

# Related Topics

- **K046 `$tries` and `$maxExceptions`** — Contrast: fixed counts vs deadline-based retry
- **K051 `ThrottlesExceptions` Middleware** — Related: reactive rate limiting
- **K055 `ShouldBeUnique`** — Complementary: prevents re-dispatch during retry windows
- **K050 `RateLimited` Job Middleware** — Related: proactive rate control
- **Carbon Documentation** — `CarbonImmutable` best practices for deadline calculations
