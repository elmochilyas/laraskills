# ECC Anti-Patterns — Retry Strategies

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Retry Strategies |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Retrying 4xx Client Errors (Wasted Resources, Account Lockout)
2. Pure Exponential Backoff Without Jitter (Thundering Herd)
3. No Maximum Retry Cap (Infinite Resource Exhaustion)
4. No Overall Deadline for Retry Sequence
5. Retrying Write Operations Without Idempotency Keys

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

## Anti-Pattern 1: Retrying 4xx Client Errors (Wasted Resources, Account Lockout)

### Category
Reliability | Security

### Description
Retrying HTTP 4xx responses (400, 401, 403, 404). The same request will produce the same client error.

### Why It Happens
Default retry middleware retries all non-2xx responses. No status code filtering.

### Warning Signs
- `Http::retry(3, 1000)` without `when()` callback
- Retry logs show 401, 403 attempts
- API account locked due to repeated failed auth attempts

### Why It Is Harmful
A revoked API token returns 401. Default retry attempts 3 more times with the same token. Each attempt fails with 401. The API provider sees 4 rapid authentication failures and locks the account for security. Now even a valid token won't work. Manual account recovery required.

### Preferred Alternative
Only retry on 5xx, 429, and network errors.

### Refactoring Strategy
1. Add `when()` callback to `Http::retry()`
2. Check status code >= 500 or === 429
3. Never retry on 4xx

### Related Rules
Only Retry on Retryable Status Codes (05-rules.md)

### Related Skills
Apply Retry Strategies for Transient API Failures (06-skills.md)

### Related Decision Trees
Retryable Failure Classification (07-decision-trees.md)

---

## Anti-Pattern 2: Pure Exponential Backoff Without Jitter (Thundering Herd)

### Category
Reliability

### Description
Using `delay = base * 2^attempt` with no randomization. All retries fire at synchronized intervals.

### Why It Happens
Pure exponential backoff is the simplest formula. Jitter seems like unnecessary complexity.

### Warning Signs
- `delay = pow(2, $attempt)` with no rand() or mt_rand()
- Downstream sees synchronized request spikes after recovery
- Multiple services fail simultaneously after upstream recovery

### Why It Is Harmful
100 requests time out simultaneously. All retry at exactly 1s, 2s, 4s. When the upstream recovers at 3.5s, all 100 retries fire at exactly 4s. The synchronized burst overwhelms the upstream, causing it to fail again. The cycle repeats indefinitely.

### Preferred Alternative
Add full jitter: `rand(0, base * 2^attempt)`.

### Refactoring Strategy
1. Replace pure exponential with `$delay = rand(0, min($base * (2 ** $attempt), $max))`
2. Test that retry timings are spread across the window

### Related Rules
Use Exponential Backoff with Jitter (05-rules.md)

### Related Decision Trees
Backoff Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 3: No Maximum Retry Cap (Infinite Resource Exhaustion)

### Category
Reliability

### Description
Retrying indefinitely without a maximum attempt limit. A permanently failing request retries forever.

### Why It Happens
Developers set retries to a very high number "to be safe." `Http::retry(100, 1000)`.

### Warning Signs
- `Http::retry(100, ...)` or similar high retry count
- Queue jobs with `public $tries = 0` (infinite) without circuit breaker
- Resources exhausted by endless retry loop

### Why It Is Harmful
A downstream API is permanently down (503). A queue job retries 100 times. Each retry takes 30s timeout. Total: 50 minutes of worker time on one job. Meanwhile, 1000 other jobs are queued behind it. All processing is blocked for 50 minutes because of one permanently failing request.

### Preferred Alternative
Cap retries at 3-5 for most use cases.

### Refactoring Strategy
1. Set `$tries = 3` on queue jobs
2. Use `Http::retry(3, ...)` for HTTP calls
3. Let circuit breaker handle sustained outages

### Related Rules
Cap Maximum Retries (05-rules.md)

---

## Anti-Pattern 4: No Overall Deadline for Retry Sequence

### Category
Reliability

### Description
Setting per-attempt timeouts but no total deadline for the retry sequence. Retries can extend the operation to hours.

### Why It Happens
Each retry has a timeout, but the sum of all retries is not bounded.

### Warning Signs
- `Http::retry(5, 1000)->timeout(30)` — up to 150s total
- Total operation time equals retries × timeout
- No deadline parameter in retry configuration

### Why It Is Harmful
A user-facing checkout creates a charge. API is slow (28s per attempt). 5 retries × 28s = 140s. The user sees a loading spinner for 2 minutes and 20 seconds before finally getting an error. The PHP worker is held for 140 seconds. 10 concurrent checkouts exhaust all workers.

### Preferred Alternative
Set an overall deadline for the retry sequence.

### Refactoring Strategy
1. Calculate deadline = max acceptable total time
2. Stop retrying if `microtime(true) > $deadline`
3. Return failure early instead of exhausting retries

### Related Rules
Set Overall Deadline for Retry Sequence (05-rules.md)

---

## Anti-Pattern 5: Retrying Write Operations Without Idempotency Keys

### Category
Data Integrity

### Description
Retrying POST/PUT/PATCH requests without an idempotency key. Each retry creates a new side effect.

### Why It Happens
Developers add retry to all requests without considering idempotency.

### Warning Signs
- `Http::retry(3)->post('/charges', $data)` without `Idempotency-Key` header
- Duplicate charges in payment system
- Duplicate order records in database

### Why It Is Harmful
A charge request times out. Retry fires. Both the original and the retry actually succeeded at the API. Two charges are created. The customer is charged twice. Without an idempotency key, the payment gateway treats each request as a new charge.

### Preferred Alternative
Include `Idempotency-Key` header on all retryable write operations.

### Refactoring Strategy
1. Generate UUID v4 for each write operation
2. Add `->withHeader('Idempotency-Key', $key)` before retry
3. Only then enable retry on the request

### Related Rules
Verify Idempotency Before Retrying Writes (05-rules.md)
