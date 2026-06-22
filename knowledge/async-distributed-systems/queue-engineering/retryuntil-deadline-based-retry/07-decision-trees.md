# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** retryuntil-deadline-based-retry
**Generated:** 2026-06-22

---

# Decision Inventory

* Retry Strategy: Deadline-Based vs Attempt-Count-Based
* Deadline Type: Fixed vs Dynamic
* Backoff Strategy With Deadline Constraints

---

# Architecture-Level Decision Trees

---

## Retry Strategy: Deadline-Based vs Attempt-Count-Based

---

### Decision Context

Choose whether to use `retryUntil()` (deadline-based) or `$tries` (attempt-count-based) for job retry logic.

---

### Decision Criteria

* Nature of the retry constraint (time vs attempts)
* Business requirements around retry windows
* Predictability of failure resolution
* External dependency on time-based SLAs
* Queue capacity and resource constraints

---

### Decision Tree

Is the retry limit defined by a business time window (e.g., "stop at 5 PM", "payment cutoff is 15 minutes")?
YES → Is there also a practical maximum attempt limit?
    YES → Use retryUntil() + $tries cap (deadline with attempt backstop)
    NO → Use retryUntil() only (pure deadline-based)
NO → Is the failure transient and expected to resolve after N attempts?
    YES → Use $tries only (simple, proven)
    NO → Do failures need to be distinguished (retryable vs terminal)?
        YES → Use $tries + $maxExceptions
        NO → Use $tries with escalating backoff

---

### Rationale

`retryUntil()` provides business-aligned retry that adapts to real-world constraints (time windows, SLAs, cutoff times). `$tries` provides simple, predictable retry for transient failures. The choice depends on whether the "should I retry?" decision is time-based or attempt-based.

---

### Recommended Default

**Default:** Use `$tries = 3` with escalating backoff for most jobs. Use `retryUntil()` + `$tries` cap only when a business time window is the retry constraint.

**Reason:** Most job failures are transient (network blips, deadlocks) and resolve within 3-5 retries. Time-based retry adds cognitive overhead — only use it when the business requires it.

---

### Risks Of Wrong Choice

- Using `$tries` for time-sensitive operations: retries exhaust before the window closes, or retries continue past the cutoff.
- Using `retryUntil()` for transient failures: unnecessary complexity, timezone bugs, clock skew issues.
- No `$tries` cap with `retryUntil()`: resource exhaustion from thousands of retries.

---

### Related Rules

- pair-retryuntil-with-tries-cap
- use-immutable-carbon-for-deadline

---

### Related Skills

- Implement Deadline-Based Job Retry with retryUntil
- Configure Job Retry Logic with $tries and $maxExceptions

---

## Deadline Type: Fixed vs Dynamic

---

### Decision Context

Choose between a fixed deadline (calculated once) or a dynamic deadline (recalculated before each retry, Laravel 10+).

---

### Decision Criteria

* Does the deadline depend on external state that may change?
* Can the business window shift during processing?
* Is the deadline based on job creation time or current time?
* Performance impact of recalculating on every retry

---

### Decision Tree

Does the deadline depend on external state (database, cache, API)?
YES → Is the external state likely to change during the retry window?
    YES → Use dynamic deadline (closure re-evaluated on each retry, Laravel 10+)
    NO → Use fixed deadline (calculate once, store as property)
NO → Is the deadline based on current time (e.g., "now + 15 minutes") vs creation time?
    NOW + DURATION → Use fixed deadline with CarbonImmutable::now()->addMinutes(15)
    CREATION + DURATION → Store deadline at construction, return stored value
    SPECIFIC CLOCK TIME → Use CarbonImmutable::now()->setTime(17, 0, 0)

---

### Rationale

Fixed deadlines are simpler and faster (no recalculation overhead). Dynamic deadlines enable adaptive behavior where the cutoff changes based on evolving conditions. Laravel 10+ re-evaluates the `retryUntil()` closure before each retry, making dynamic deadlines feasible.

---

### Recommended Default

**Default:** Fixed deadline with `CarbonImmutable::now()->addMinutes(N)` for most cases.

**Reason:** Fixed deadlines are predictable, testable, and have no external dependencies. Dynamic deadlines should only be used when the deadline genuinely depends on changing external state (e.g., a campaign end time stored in cache that can be updated).

---

### Risks Of Wrong Choice

- Dynamic deadline when not needed: unnecessary external calls, performance overhead, potential failures from dependency outages.
- Fixed deadline when state changes: job keeps retrying past the business-appropriate cutoff because the stored deadline is stale.

---

### Related Rules

- use-immutable-carbon-for-deadline
- match-backoff-to-deadline-window

---

### Related Skills

- Implement Deadline-Based Job Retry with retryUntil
- Implement Job Backoff Strategies

---

## Backoff Strategy With Deadline Constraints

---

### Decision Context

Choose the `$backoff` configuration when a deadline constraint is active via `retryUntil()`.

---

### Decision Criteria

* Total remaining time until deadline
* Number of retries expected within the deadline
* Nature of the failure (immediate transient vs slow resolution)
* Risk of the next backoff exceeding the deadline

---

### Decision Tree

Is the deadline window long (>10 minutes)?
YES → Use escalating backoff ([5, 15, 45, 135]) — fewer early retries, more space later
NO → Is the deadline window short (<2 minutes)?
    YES → Use short fixed backoff (5-10 seconds) — maximize retry attempts within the window
    NO → Use moderate escalating backoff ([10, 30, 90]) for medium windows
    ↓
    Can the backoff delay exceed the remaining deadline?
    YES → Implement a dynamic backoff closure that caps at (deadline - now - 1 second)
    NO → Fixed or escalating backoff is safe

---

### Rationale

Backoff must be tuned against the deadline. Escalating backoff reserves early retries for the most likely resolution window while preventing resource waste on later attempts. When backoff exceeds the remaining deadline, the job is pointlessly re-queued only to fail immediately on pickup.

---

### Recommended Default

**Default:** Escalating backoff `[5, 15, 45, 135, 405]` for deadlines >10 minutes. Fixed backoff `[5]` for deadlines <2 minutes.

**Reason:** Escalating backoff provides rapid early retries when fixes may be applied quickly, then backs off to conserve resources. Short windows need aggressive retrying.

---

### Risks Of Wrong Choice

- Long backoff with short deadline: only 1-2 retries within the window, job likely fails.
- Short backoff with long deadline: thousands of retries, queue exhaustion.
- Backoff exceeding deadline: re-queued jobs fail immediately, misleading failure logs.

---

### Related Rules

- match-backoff-to-deadline-window

---

### Related Skills

- Implement Deadline-Based Job Retry with retryUntil
- Implement Job Backoff Strategies
