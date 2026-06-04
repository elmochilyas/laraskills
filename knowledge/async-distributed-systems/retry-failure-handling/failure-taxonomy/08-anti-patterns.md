# Anti-Patterns: Failure Taxonomy — Release / Exception / Fail

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K016 — Failure Taxonomy |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Throwing Exception When release() Is Appropriate | Performance | High |
| 2 | Calling fail() for Transient Errors | Reliability | High |
| 3 | Not Distinguishing Failure Types in try/catch | Design | High |
| 4 | Not Monitoring Release Ratio | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| All Errors Treated as Exceptions (No Type Mapping) | failure-taxonomy, retry-workflow | Critical |
| release() Without Explicit Delay (Immediate Re-Queue) | failure-taxonomy, backoff-strategies | High |

---

## Anti-Pattern 1: Throwing Exception When release() Is Appropriate

### Category
Performance — Wasted Retry Attempts

### Description
Throwing an exception when `release()` is the correct response (e.g., rate limit hit). Throwing consumes a retry attempt — `release()` re-queues without decrementing the retry budget, using a controlled delay instead.

### Why It Happens
Developers use one-size-fits-all error handling: `try { ... } catch (Throwable $e) { throw $e; }`. They don't distinguish between "error that should consume a retry" and "error that should release with backoff."

### Warning Signs
- Rate-limit responses (HTTP 429) handled by throwing exceptions
- Job retries for rate limits consume `$tries` budget
- Job permanently fails after exhausting retries due to rate limits
- `release()` never explicitly called in `handle()`
- No try/catch for specific exception types

### Why Harmful
Each rate-limit throw counts as a failed attempt. With `$tries = 3` and a rate limit that persists for 2 minutes, the job exhausts all 3 retries in 3 seconds and permanently fails — even though `release(60)` would have returned successfully after the rate limit window.

### Real-World Consequences
An API job has `$tries = 5`. The external API rate-limits at 10 requests/minute. The job receives 429 for 6 consecutive seconds. Each 429 is thrown as an exception — 5 retries consumed in 5 seconds. The job permanently fails. The operator retries from `failed_jobs` — same 429, same 5 quick failures. The cycle continues until someone implements `release()`.

### Preferred Alternative
Catch specific exception types and call `$this->release($delay)` for controlled backoff without consuming retries.

### Refactoring Strategy
1. Add try/catch in `handle()` for exception types that indicate rate limits
2. For rate limits: extract `Retry-After` header and call `$this->release($retryAfter)`
3. For 429 without `Retry-After`: call `$this->release(60)` with reasonable default
4. Log when release is used vs exception for monitoring
5. Verify that release doesn't consume `$tries` budget

### Detection Checklist
- [ ] Rate-limit exceptions thrown instead of release
- [ ] Retries consumed by rate limits
- [ ] No explicit release() call in handle()
- [ ] Permanent failures from transient rate limits

### Related Rules/Skills/Decision Trees
- **Rule 3**: no-exception-when-release-appropriate (`05-rules.md`)
- **Skill**: Use Failure Taxonomy (`06-skills.md`)
- **Decision**: Retryable vs Non-Retryable Exception Handling (`07-decision-trees.md`)

---

## Anti-Pattern 2: Calling fail() for Transient Errors

### Category
Reliability — Premature Termination

### Description
Calling `$this->fail()` for errors that are transient (network timeouts, 503s). `fail()` immediately moves the job to permanent failure state — no retries, no backoff, even if the condition would have resolved with time.

### Why It Happens
Developers confuse "the job failed this attempt" with "the job will never succeed." They call `fail()` as a generic error handler without considering whether the condition is recoverable.

### Warning Signs
- `$this->fail()` called for connection timeouts or network errors
- Jobs permanently fail on transient conditions that would self-resolve
- Operator frequently re-dispatches jobs from `failed_jobs` (they always succeed on retry)
- Network blips cause permanent failures
- No distinction between 4xx and 5xx in error handling

### Why Harmful
Transient errors are treated as permanent — jobs that would succeed on retry are instead permanently failed. Every such failure requires manual intervention (operator retry) or automated reprocessing from DLQ. The system is fragile to short-lived disruptions.

### Real-World Consequences
A job calls `$this->fail()` when any exception occurs, including connection timeouts. The database has a 2-second failover event. The connection timeout exception triggers `fail()` — the job is permanently failed. The failover completes in 1 second. The job would have succeeded if it had retried. Instead, the operator must manually retry 500 jobs from `failed_jobs`.

### Preferred Alternative
Use `fail()` only for known permanent conditions (invalid data, auth failure, 400 errors). Let transient errors throw exceptions and use the retry mechanism.

### Refactoring Strategy
1. Map exception types: 5xx, timeouts → throw (retry); 4xx (except 429) → fail; 429 → release
2. Remove `$this->fail()` from catch blocks that handle transient errors
3. Add specific catch blocks for permanent error types
4. For unknown exception types: let the default throw/retry behavior handle them
5. Monitor types of failures in `failed_jobs` — transient errors should not appear there

### Detection Checklist
- [ ] `fail()` called for network timeouts or 5xx errors
- [ ] Frequent manual retries from `failed_jobs`
- [ ] Jobs that always succeed on second attempt
- [ ] No exception type mapping

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-fail-for-unrecoverable (`05-rules.md`)
- **Decision**: Transient vs Permanent Failure Classification (`07-decision-trees.md`)

---

## Anti-Pattern 3: Not Distinguishing Failure Types in try/catch

### Category
Design — One-Size-Fits-All Error Handling

### Description
A single try/catch block in `handle()` that treats all exceptions identically — throwing or calling `fail()` regardless of the error type. Different errors require different responses (release, retry, fail), and a single path cannot handle all correctly.

### Why It Happens
Simplicity. A single `catch (Throwable $e)` is the easiest pattern. Developers don't think about the downstream service's error semantics — they see "something went wrong" and handle it uniformly.

### Warning Signs
- Single `catch (Throwable $e)` block with uniform handling
- No type-specific catch blocks for different HTTP status codes
- All errors produce the same retry behavior
- Monitoring cannot distinguish error types
- Team can't tell if failures are transient or permanent

### Why Harmful
All errors are treated equally — permanent 400 errors get retried (wasting attempts), transient 503 errors may be failed (premature termination), and rate-limit 429 errors are not distinguished. The system is simultaneously too aggressive (retrying permanent errors) and too conservative (failing transient errors).

### Real-World Consequences
A job makes an HTTP API call. The try/catch handles all exceptions with `throw $e`. A 400 (bad request) is retried 3 times — each attempt returns 400. Wasted 3 retries. A 429 (rate limit) is retried with default backoff instead of `Retry-After` header — the job permanently fails. A 503 (server error) is retried with backoff, which is correct. Two out of three error types are handled suboptimally.

### Preferred Alternative
Implement type-specific catch blocks: 4xx (except 429) → fail, 429 → release, 5xx/timeout → throw.

### Refactoring Strategy
1. Refactor single catch block into multiple type-specific blocks
2. Order: specific exceptions first, generic last
3. For HTTP calls: catch `ClientException` (4xx), `ServerException` (5xx), `ConnectException` (timeout)
4. Map each to: `$this->fail()`, `throw $e` (retry), or `$this->release()`
5. Log the error type and response for monitoring

### Detection Checklist
- [ ] Single catch block handling all exception types
- [ ] No type-specific failure handling
- [ ] Error types not distinguishable in monitoring
- [ ] Both transient and permanent errors handled the same way

### Related Rules/Skills/Decision Trees
- **Rule 1**: map-exceptions-to-retry-behavior (`05-rules.md`)
- **Skill**: Use Failure Taxonomy (`06-skills.md`)

---

## Anti-Pattern 4: Not Monitoring Release Ratio

### Category
Observability — Blind to Reliability Issues

### Description
Not tracking how often jobs release (re-queue) instead of succeeding immediately. Releases are invisible in standard failure monitoring — they don't appear in `failed_jobs` or failure alerts. A job that releases 10 times before succeeding looks "successful" but consumed 10x the expected resources.

### Why It Happens
Standard queue monitoring focuses on failures (permanent) and throughput (successes). Releases are an in-between state that doesn't trigger either. Teams don't think to monitor "how many times did this job requeue before succeeding?"

### Warning Signs
- No metric for release count or release ratio
- Jobs appear successful but take 10x normal time (many releases)
- No visibility into retry attempts that aren't permanent failures
- Team is surprised by "slow" jobs that have high release counts
- Release-related log entries exist but aren't aggregated

### Why Harmful
A job that releases 10 times before succeeding is a reliability issue — it indicates the downstream service or data is unreliable. Without release monitoring, the reliability issue is invisible. The job looks successful, but it consumed 10x worker time and queue capacity.

### Real-World Consequences
A third-party API is intermittently slow — 30% of calls time out and release. The job succeeds on retry (2nd or 3rd attempt). Standard monitoring shows 100% success rate. The API's reliability degrades over 3 months — now 80% of calls release before succeeding. The job still shows 100% success. Worker capacity is 5x normal, but no one knows why. The team only discovers the issue when they need to scale workers and investigate.

### Preferred Alternative
Track and monitor the release ratio: what percentage of jobs required multiple attempts to succeed.

### Refactoring Strategy
1. Add `$this->attempts()` logging in `handle()` after successful processing
2. Create metric: release ratio = (total executions - unique jobs) / total executions
3. Alert if release ratio > 20% for any job class
4. Dashboard: show release count per job class over time
5. Investigate high-release jobs — the underlying service may have reliability issues

### Detection Checklist
- [ ] No release ratio monitoring
- [ ] Jobs appear successful but require many attempts
- [ ] Worker capacity inflated by retry processing
- [ ] No visibility into non-permanent failures

### Related Rules/Skills/Decision Trees
- **Rule 4**: monitor-release-ratio (`05-rules.md`)
- **Decision**: Transient vs Permanent Failure Classification (`07-decision-trees.md`)
