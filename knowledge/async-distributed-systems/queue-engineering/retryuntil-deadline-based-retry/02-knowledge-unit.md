# Metadata

Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: retryUntil — Dynamic Deadline-Based Retry
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

`retryUntil()` provides dynamic, deadline-based retry logic for Laravel queue jobs — fundamentally different from the static `$tries` property. While `$tries` sets a fixed attempt cap and `$maxExceptions` limits failure handling, `retryUntil()` evaluates a closure that returns a `DateTime` or `Carbon` instance. The job continues retrying as long as the current time is before the deadline. This enables business-aware retry strategies: "retry until 5 PM", "retry until the payment cutoff window closes", "retry until the webhook timeout expires". Combined with configurable `$backoff`, this provides time-bounded resilience that adapts to real-world business constraints rather than arbitrary attempt counts.

---

# Core Concepts

- **`retryUntil()`**: Returns a `DateTime` or `Carbon` deadline. The job retries as long as `now() < deadline`. Returns `null` to disable.
- **`$tries`**: Fixed maximum attempts. `retryUntil()` overrides `$tries` — the job retries until the earlier of: deadline reached OR tries exhausted.
- **`$maxExceptions`**: Maximum unhandled exception count. Separate dimension — limits failures not retries.
- **`$backoff`**: Delay between retries. Can be static (int), array (escalating), or closure (dynamic). Works alongside `retryUntil()`.
- **Deadline evaluation**: `retryUntil()` is called once at job construction and again before each retry (Laravel 10+). Dynamic deadlines are recalculated.
- **Job lifecycle with retryUntil**: dispatch → attempt → fail → retryUntil() → (before deadline) → backoff delay → re-queue → attempt → ... → (after deadline) → fail.
- **Carbon integration**: Use `Carbon::now()->addMinutes(5)`, `Carbon::today()->endOfDay()`, etc.

---

# Mental Models

- **Pizza delivery guarantee**: "We'll keep trying to deliver until 30 minutes after the order. After that, we cancel." — `retryUntil(now()->addMinutes(30))`.
- **Package delivery cutoff**: "FedEx picks up at 6 PM. We retry packaging until then, but at 6:01 it's too late." — `retryUntil(now()->endOfHour())`.
- **Concert ticket sale**: "We'll retry payment for 15 minutes. After that, the seat is released." — `retryUntil(now()->addMinutes(15))`.

---

# Internal Mechanics

- `retryUntil()` is called by the queue worker before releasing a failed job back to the queue.
- If the closure returns a deadline in the past, the job is marked as failed immediately.
- If the closure returns a deadline in the future, the job is released with the configured `backoff` delay.
- The `retryUntil()` closure is also checked at dispatch time. If the deadline is already passed, the job fails immediately.
- In Laravel 10+, the closure is re-evaluated before each retry, allowing dynamic deadline recalculation (e.g., based on external state).
- When combined with `$tries`, the effective limit is `min(tries, deadline)` — the first to trigger ends the retry loop.
- The worker compares `Carbon::now()` against the returned deadline on every retry evaluation.

---

# Patterns

## Business-Hours Retry
- **Purpose**: Retry only during business hours. Stop at close of business.
- **Benefit**: Avoids overnight retries that generate alerts or hit unmonitored services.
- **Tradeoff**: Jobs may expire at COB without completing — needs monitoring.

## Payment Window Retry
- **Purpose**: Retry payment processing until the gateway's cutoff window closes.
- **Benefit**: Maximizes payment success within the window without futile attempts after.
- **Tradeoff**: Deadline must be synchronized with gateway SLA.

## Webhook Timeout Retry
- **Purpose**: Retry webhook delivery until the provider's retry window expires.
- **Benefit**: Mirrors the provider's retry policy on the consumer side.
- **Tradeoff**: May waste resources if the provider has already given up.

## Dynamic Deadline with External State
- **Purpose**: Recalculate deadline based on external state (database, cache, API) at each retry.
- **Benefit**: Adaptive retry that responds to changing conditions.
- **Tradeoff**: External call on every retry evaluation — adds latency.

---

# Architectural Decisions

- **Use `retryUntil` when**: The decision to retry depends on time, not attempt count. Business windows, SLA deadlines, cutoff times.
- **Use `$tries` when**: The decision to retry depends on attempt count. Transient failures (network, deadlocks) that resolve after 3-5 tries.
- **Use both when**: You want a maximum attempt cap even within the deadline window. E.g., "retry until 5 PM, but never more than 10 times."
- **Use `$maxExceptions` when**: You need to distinguish between retryable failures and hard errors. A `PaymentFailedException` might be retryable; a `ValidationException` is not.

---

# Tradeoffs

| Approach | Benefit | Cost |
|----------|---------|------|
| `retryUntil` with Carbon deadline | Business-aligned retry windows | Timezone sensitivity, clock skew |
| `retryUntil` + `$tries` | Hard cap prevents infinite loops | Two dimensions to tune |
| `retryUntil` only | Simple, time-based | May retry too many times in tight windows |
| `$tries` only | Simple, count-based | Ignores business time windows |
| Dynamic `retryUntil` closure | Adaptive to changing conditions | External dependency on every retry |

---

# Performance Considerations

- Closure evaluation: `retryUntil()` closure runs on every retry evaluation (~microseconds for Carbon, ~milliseconds if checking external state).
- Backoff interaction: short backoff + long deadline = many retries, high queue throughput.
- Long deadline + no tries cap: job could retry thousands of times, consuming queue storage.
- Dynamic external-state closures: each evaluation adds cache/DB latency.
- Horizon metrics: retried jobs increment `attempts` in Horizon — monitor for tight retry loops.

---

# Production Considerations

- Server timezone: `retryUntil()` uses the application's timezone. Ensure consistency across workers and dispatchers.
- Clock skew: Worker servers with skewed clocks may evaluate deadlines differently. Use `Carbon::now()` which reads server time.
- Redis restart: Backoff and retry state is tracked in the job payload, not Redis — safe across cache restarts.
- Horizon balancing: Long-running retry loops can starve other queues if priorities aren't configured.
- Failed job storage: All retried jobs that eventually fail are stored in `failed_jobs` with full exception context.
- `retryUntil()` returning `null` disables the deadline check entirely — equivalent to not implementing the method.

---

# Failure Modes

- **Deadline too tight**: Job retries once, deadline passes, job fails. Business operation never completes.
- **Deadline too loose**: Job retries for hours, consuming queue resources when it should have failed fast.
- **No `$tries` cap**: Deadline is 24 hours away, backoff is 1 second — job could retry 86,400 times.
- **Stale deadline**: `retryUntil()` closure captured the deadline at construction time but isn't re-evaluated (pre-Laravel 10). Deadline passes but job keeps retrying because the closure wasn't called again.
- **Clock skew between retry evaluations**: Worker A evaluates deadline (OK). Worker B picks up retry and evaluates (late). Job fails on Worker B but would have succeeded on Worker A.

---

# Ecosystem Usage

- **Laravel framework**: `retryUntil()` method on `ShouldQueue` jobs (Laravel 8+). Re-evaluated before each retry in Laravel 10+.
- **Horizon**: Displays `retryUntil` deadline in job detail view. Tracks attempts under deadline.
- **Spatie packages**: `spatie/laravel-webhook-client` uses retry strategies with deadline-based retry for webhook processing.
- **Cashier/Spark**: Subscription payment retries use deadline-based logic for payment windows.

---

# Related Knowledge Units

- K046 `$tries` and `$maxExceptions` — Contrast: fixed counts vs deadline-based retry
- K055 `ShouldBeUnique` — Complementary: prevents duplicate dispatch during retry windows
- K051 `ThrottlesExceptions` — Related: reactive rate limiting vs proactive deadline limiting
- K076 RateLimiter Facade — Related: rate-based throttling alongside time-based retry

## Research Notes

- `retryUntil()` is evaluated at job population time AND before each retry in Laravel 10+. Pre-10, the method was called only once, meaning dynamic recalculations were not possible.
- When both `$tries` and `retryUntil()` are set, the worker checks both conditions — the first to terminate ends the retry loop. The check order is: maxExceptions first, then tries, then retryUntil.
- Combined with `$backoff`, the effective retry frequency is: `backoff(n)` delay between attempts, bounded by `retryUntil()` deadline. If `backoff` pushes the next attempt past the deadline, the job is released but immediately fails when picked up.
- The `retryUntil()` method signature: `public function retryUntil(): ?DateTime`. Returning `null` disables deadline-based retry and falls back to `$tries` behavior.
- For testing with time travel: Use `Carbon::setTestNow()` or Pest's `travelTo()` to control the clock during retryUntil evaluation.
- Horizon reports jobs with `retryUntil` deadlines differently — the "Max Tries" column shows "deadline" instead of a number.
