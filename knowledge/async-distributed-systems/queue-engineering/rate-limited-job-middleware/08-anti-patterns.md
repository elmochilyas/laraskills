# Anti-Patterns — `RateLimited` Job Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | `RateLimited` Job Middleware |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Global Key Without Scoping
2. Mismatched Decay Window
3. Tight Release Delay Override
4. Confusing Proactive vs Reactive Rate Limiting

---

## 1. Global Key Without Scoping

### Category
Reliability

### Description
Using `RateLimited` without scoping the rate limit key per resource, causing one job instance to exhaust the rate limit for all instances of that class.

### Why It Happens
The default key is the job class name alone. The developer adds `RateLimited` without using the `->key()` callback — one rate limit counter for all instances. In testing with a single API key, the issue is invisible. In production with hundreds of API keys, one high-volume tenant exhausts the rate limit for every other tenant, blocking all their API calls.

### Warning Signs
- `RateLimited` without `->key()` callback
- One user's API activity causes throttling for all other users
- Rate limit errors scattered across unrelated job instances
- Support tickets about "API calls blocked for no reason"

### Why Harmful
Tenant A with 10 workers processes 200 API calls per minute against a 100-calls-per-minute limit. The global counter hits the limit within 30 seconds. Tenant B, Tenant C, and all other tenants are blocked for the remaining 30 seconds even though none of them have made any API calls. Tenant A's activity causes a denial of service for all other tenants.

### Consequences
- Cross-tenant rate limit starvation
- One tenant's activity blocks all others
- Throttling unrelated to actual per-resource usage
- Production incidents from unexpected throttling

### Alternative
Always scope rate limit keys per resource using `->key(fn($job) => $job->apiKey)` or similar.

### Refactoring Strategy
1. Add `->key(fn($job) => $job->apiKey)` to all `RateLimited` middleware
2. Scope by the job property that identifies the resource (API key, user ID, tenant ID)
3. Verify the scoped key uniquely identifies the resource
4. Test: run two jobs with different keys — they should have separate counters

### Detection Checklist
- [ ] `->key()` callback present on all `RateLimited` usage
- [ ] Key scoped to resource identifier (API key, user ID)
- [ ] Different resources have independent counters
- [ ] No cross-resource starvation

### Related Rules
scope-rate-limit-keys-per-resource

### Related Skills
Add RateLimited Middleware to Jobs

### Related Decision Trees
Per-Job vs Global Rate Limiter Selection

---

## 2. Mismatched Decay Window

### Category
Reliability

### Description
Setting `decayMinutes` (window size) that doesn't match the external API's rate limit reset period, causing either aggressive throttling (too short window) or insufficient protection (too long window).

### Why It Happens
The developer sets a convenient window (1 minute, 5 minutes) without checking the external API's documented rate limit reset period. The API resets hourly (3600 requests/hour). The developer sets `Limit::perMinute(60)`. Over 60 minutes, this allows 3600 requests — matching the hourly limit. But the minute window means counter resets every minute, allowing 60 requests in the first second of each minute.

### Warning Signs
- `Limit::perMinute()` for APIs with hourly resets
- `Limit::perHour()` for APIs with daily resets
- Burst of requests at window boundaries observed
- API returns 429 despite local counter showing headroom

### Why Harmful
With `perMinute(60)` for a 3600/hour API, the counter resets every 60 seconds. A burst of 60 requests in the first second of each minute is within the minute window but may trigger the API's own burst protection. Conversely, 60 requests spread across the first 30 seconds, then 60 more in the next 30 seconds — 120 requests in one minute, which the minute window allows but violates the API's intent.

### Consequences
- Throttling prevents legitimate usage (window too short)
- API rate limit violations despite local limiting (window mismatch)
- Confusing behavior where limiting doesn't match API's actual limits
- Tuning difficulty without understanding API's reset behavior

### Alternative
Match the decay window to the external API's documented reset period exactly.

### Refactoring Strategy
1. Document each external API's rate limit parameters
2. Set `Limit::perMinutesN(x, y)` matching the API's window
3. For unknown windows, use a conservative hourly rate with observed tuning
4. Monitor 429 responses to validate window matching
5. Adjust windows based on observed upstream behavior

### Detection Checklist
- [ ] Decay window matches API's documented reset period
- [ ] No 429 responses despite local headroom
- [ ] Burst rate at window boundaries is acceptable to upstream
- [ ] Window documented per external API

### Related Rules
match-decay-to-api-reset

### Related Skills
Add RateLimited Middleware to Jobs

### Related Decision Trees
Rate-Limited vs WithoutOverlapping for Job Throttling

---

## 3. Tight Release Delay Override

### Category
Performance

### Description
Overriding the default release delay in `RateLimited` middleware with a fixed shorter delay, causing the job to retry before the window resets and immediately hit the rate limit again.

### Why It Happens
The developer wants faster retries and sets `->releaseAfterSeconds(5)` — the job retries every 5 seconds. But the rate limit window resets in 45 seconds. The job retries at 5s, 10s, 15s, 20s... each time hitting the rate limit, incrementing the counter, and being released again. This creates a tight retry loop that burns retry attempts and worker CPU with no progress.

### Warning Signs
- `releaseAfterSeconds()` or `releaseAfter()` set on `RateLimited` middleware
- Jobs retry rapidly without making progress
- Rate limit counter hit/exceeded repeatedly in logs
- Retry attempts consumed without successful execution

### Why Harmful
The default release delay equals the time until the window resets — the only delay that makes sense. Overriding to 5 seconds means the job retries 9 times in 45 seconds before the window finally resets. Each retry consumes a queue retry attempt. If the job has 10 max attempts, it's permanently failed before the window ever resets. The rate limiting intended to protect downstream throughput instead causes premature permanent failure.

### Consequences
- Retry attempts burned in tight loop before window reset
- Permanent job failure from exhausted retries
- Worker CPU wasted on pointless re-execution
- Rate limiting counter inflated by botched retries

### Alternative
Do not override the default release delay — it correctly matches the time until window reset.

### Refactoring Strategy
1. Remove any `releaseAfterSeconds()` or `releaseAfter()` from `RateLimited` middleware
2. Trust the default behavior: `release($secondsUntilReset)`
3. If custom delay is needed, ensure it's always >= time until reset
4. Test: verify released job runs after window reset, not before

### Detection Checklist
- [ ] No `releaseAfterSeconds()` override on `RateLimited`
- [ ] Jobs wait for full window reset before retrying
- [ ] No tight retry loop observed
- [ ] Retry attempts not wasted on pre-window retries

### Related Rules
dont-override-release-delay

### Related Skills
Add RateLimited Middleware to Jobs

### Related Decision Trees
Rate-Limited vs WithoutOverlapping for Job Throttling

---

## 4. Confusing Proactive vs Reactive Rate Limiting

### Category
Architecture

### Description
Using `RateLimited` (proactive, prevents execution based on attempt count) when `ThrottlesExceptions` (reactive, backs off after failures) is appropriate, or vice versa, applying the wrong pattern to the job's needs.

### Why It Happens
Both middleware involve "limiting" and "throttling" terminology. The developer sees the need to "slow down jobs that fail" and reaches for `RateLimited`. But `RateLimited` limits based on attempt count, not failure count. `ThrottlesExceptions` is the reactive counterpart that backs off after repeated exceptions.

### Warning Signs
- `RateLimited` applied to jobs that don't call external APIs
- `ThrottlesExceptions` expected to prevent execution (it only reacts to failures)
- Jobs fail once, rate-limited, but the single failure shouldn't trigger a limit
- Developer expects "allow 10 executions then block" behavior (that's `RateLimited`)

### Why Harmful
Using `RateLimited` for failure backoff: the job calls an API, gets a 503, and you want to slow down retries. `RateLimited` doesn't track failures — it tracks executions. The job would need to execute to determine failure, but `RateLimited` prevents execution proactively. The pattern is wrong. Conversely, using `ThrottlesExceptions` for proactive rate limiting: the job must fail first before the middleware reacts, consuming API quota on each failure before backing off.

### Consequences
- Wrong protection pattern for the job's needs
- RateLimited prevents healthy execution when only failures should be throttled
- ThrottlesExceptions wastes API quota reacting to failures that could have been prevented
- Confusing debugging when middleware behavior doesn't match expectations

### Alternative
Use `RateLimited` for proactive rate limiting (prevent execution when limit hit, based on attempt count). Use `ThrottlesExceptions` for reactive backoff (slow down after repeated failures). Use both for comprehensive protection.

### Refactoring Strategy
1. Identify the job's failure pattern: deterministic (fix the bug), transient failure (ThrottlesExceptions), or rate-limited API (RateLimited)
2. Apply the correct middleware: RateLimited for API limit enforcement, ThrottlesExceptions for failure backoff
3. For full protection: apply RateLimited first (proactive), then ThrottlesExceptions (reactive)
4. Test both scenarios: rate-limited (prevented) and failure burst (backoff)

### Detection Checklist
- [ ] RateLimited used for API rate limit proactive prevention
- [ ] ThrottlesExceptions used for failure-reactive backoff
- [ ] Both applied when both patterns are needed
- [ ] Middleware behavior matches documented intent

### Related Rules
scope-rate-limit-keys-per-resource

### Related Skills
Add RateLimited Middleware to Jobs, Back Off Job Execution After Repeated Failures with ThrottlesExceptions

### Related Decision Trees
Rate-Limited vs WithoutOverlapping for Job Throttling
