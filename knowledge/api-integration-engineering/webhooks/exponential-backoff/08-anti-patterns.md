# ECC Anti-Patterns — Exponential Backoff for Webhook Delivery

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Exponential Backoff for Webhook Delivery |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Pure Exponential Backoff Without Jitter (Thundering Herd)
2. No Maximum Delay Cap (Infinite Retry Horizon)
3. Ignoring Retry-After Header on 429 Responses
4. Sub-Second Initial Delay (Wasted Attempt Budget)
5. No Attempt Counter Reset on Success (Inherited Inflated Delay)
6. Maximum Attempts Set Arbitrarily (SLA Mismatch)

## Repository-Wide Anti-Patterns

- Magic Numbers
- Silent Failure

---

## Anti-Pattern 1: Pure Exponential Backoff Without Jitter (Thundering Herd)

### Category
Reliability | Scalability

### Description
Using pure exponential backoff where all failing webhooks retry at identical intervals. When the downstream recovers, it receives a synchronized burst of all pending retries simultaneously.

### Why It Happens
Pure exponential backoff is the simplest implementation. Jitter adds complexity that seems unnecessary.

### Warning Signs
- `delay = base * (2 ^ attempt)` with no randomization
- Downstream system fails again immediately after recovery window

### Why It Is Harmful
If 1000 webhooks to the same subscriber fail simultaneously, they all retry at exactly 10s, 20s, 40s, etc. When the subscriber recovers at 35s, all 1000 retries fire at 40s. The burst overwhelms the subscriber, causing it to fail again. The cycle repeats indefinitely.

### Preferred Alternative
Add full jitter: `delay = random(0, base * 2^attempt)`.

### Refactoring Strategy
1. Replace `return base * (2 ** ($attempt - 1))` with `return rand(0, min(base * (2 ** ($attempt - 1)), maxDelay))`

### Related Rules
Always Add Jitter to Backoff Delays (05-rules.md)

### Related Skills
Implement Exponential Backoff for Webhook Delivery Retries (06-skills.md)

### Related Decision Trees
Jitter Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 2: No Maximum Delay Cap (Infinite Retry Horizon)

### Category
Reliability | Maintainability

### Description
Exponential backoff without a maximum delay cap. The delay between retries grows exponentially without bound.

### Why It Happens
The formula `base * 2^attempt` seems reasonable for small attempt numbers. The developer doesn't consider attempt 15 or 20.

### Warning Signs
- `delay = base * (2 ^ attempt)` with no `min()` wrapping
- Webhook delivery records in "pending" state for weeks

### Why It Is Harmful
At attempt 15 with 10s base: `10 * 2^14 = 163,840s = ~45 hours`. The next retry is 45 hours later. Webhook delivery SLAs are measured in hours, not days. The pending webhook occupies database storage until the retry. Final failure notification is delayed by days.

### Preferred Alternative
Cap maximum delay: `min(base * 2^attempt, 3600)`.

### Refactoring Strategy
1. Wrap delay calculation with `min(delay, 3600)`
2. Set cap based on delivery SLA (1 hour default)
3. Add monitoring for retries approaching 90% of cap

### Related Rules
Cap Maximum Backoff Delay (05-rules.md)

### Related Skills
Implement Exponential Backoff for Webhook Delivery Retries (06-skills.md)

### Related Decision Trees
Delay Cap and Attempt Limit Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Ignoring Retry-After Header on 429 Responses

### Category
Reliability | Performance

### Description
Using the same exponential backoff delay for both 429 (rate-limited) and 5xx (server error) responses, ignoring the `Retry-After` header.

### Why It Happens
The backoff logic is centralized. The HTTP response status code is not passed to the delay function.

### Warning Signs
- Same delay calculation for all error codes
- Subscriber continues returning 429 on retry
- Multiple retries fail with 429 before backoff catches up

### Why It Is Harmful
On 429, the subscriber explicitly says "wait X seconds." Ignoring this and using standard backoff may retry too early (before the rate limit window expires) or too late (wasting the retry budget on 429s that could have succeeded sooner).

### Preferred Alternative
Use `Retry-After` for 429 responses, exponential backoff for 5xx.

### Refactoring Strategy
1. Pass response status code and `Retry-After` header to delay function
2. On 429 with `Retry-After`, use that value directly
3. On 5xx, use standard exponential backoff

### Related Rules
Use Different Delays for 429 vs 5xx Responses (05-rules.md)

### Related Skills
Implement Exponential Backoff for Webhook Delivery Retries (06-skills.md)

---

## Anti-Pattern 4: Sub-Second Initial Delay (Wasted Attempt Budget)

### Category
Performance | Reliability

### Description
Using a sub-second initial delay (e.g., 100ms) that retries before any transient issue has time to resolve.

### Why It Happens
Developers want webhooks delivered as fast as possible. 100ms seems like a reasonable initial delay.

### Warning Signs
- Initial delay < 1 second
- First 3-4 retry attempts all fail with the same error
- Attempt budget consumed on non-recovered endpoints

### Why It Is Harmful
At 100ms initial delay: attempt 1 at 100ms, attempt 2 at 200ms, attempt 3 at 400ms, attempt 4 at 800ms. All four fail because the transient issue (e.g., database restart, DNS failover) takes 5+ seconds to resolve. 4 of the 10 attempt budget is wasted on essentially instant retries. Only 6 meaningful retries remain after recovery.

### Preferred Alternative
Start with at least 1 second initial delay (10s recommended).

### Refactoring Strategy
1. Set base delay to >= 1 second (10s default)
2. Adjust based on observed recovery times in metrics

### Related Rules
Start with a Reasonable Initial Delay (>= 1 Second) (05-rules.md)

---

## Anti-Pattern 5: No Attempt Counter Reset on Success (Inherited Inflated Delay)

### Category
Reliability | Performance

### Description
The attempt counter never resets after a successful delivery. A subsequent failure inherits the inflated delay from the previous failure sequence.

### Why It Happens
The attempt counter is only incremented, never reset. Developers don't differentiate between consecutive and non-consecutive failures.

### Warning Signs
- Attempt counter monotonically increasing
- Subsequent failure after success uses delay of attempt 5+ instead of attempt 1
- Delays longer than expected given failure history

### Why It Is Harmful
A webhook fails at attempt 1 and 2 (10s, 20s delays), succeeds at attempt 3. Next week, it fails again. Instead of starting at 10s, it starts at 40s (attempt 4) because the counter was never reset. Over time, the effective delay for single failures grows to hours.

### Preferred Alternative
Reset the attempt counter on every successful delivery.

### Refactoring Strategy
1. On success: `$attempt = 0`
2. On failure: `$attempt++`
3. Base next delay on current attempt value

### Related Rules
Reset Backoff Count on First Successful Delivery (05-rules.md)

---

## Anti-Pattern 6: Maximum Attempts Set Arbitrarily (SLA Mismatch)

### Category
Reliability

### Description
Setting `max_attempts` to an arbitrary number (5, 10, 15) without calculating the total delivery horizon against the business SLA.

### Why It Happens
Developers pick a "reasonable number" without understanding the relationship between attempt count, backoff schedule, and total delivery time.

### Warning Signs
- `max_attempts` configured without documented reasoning
- Webhooks fail on transient outages within SLA window
- Retry horizon far exceeds or falls short of business requirements

### Why It Is Harmful
10 attempts with 10s base delay and 3600s cap: total horizon ~6 hours. If the SLA is "deliver within 1 hour," this is too many attempts (delayed failure notification). If the SLA is "deliver within 24 hours," this may be too few for long outages.

### Preferred Alternative
Calculate `max_attempts` from the backoff schedule and delivery SLA.

### Refactoring Strategy
1. Document the delivery SLA for each webhook type
2. Calculate: sum of backoff delays for N attempts <= SLA
3. Set `max_attempts` to the N that fits within SLA
4. Add monitoring for attempts approaching the limit

### Related Rules
Set Maximum Attempts Based on Business SLA (05-rules.md)

### Related Decision Trees
Retry Budget Configuration (07-decision-trees.md)
