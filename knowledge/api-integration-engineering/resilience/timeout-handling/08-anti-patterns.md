# ECC Anti-Patterns — Timeout Handling

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Timeout Handling |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. No Timeout Configured (Infinite Wait, Worker Hangs)
2. Only Request Timeout Without Connect Timeout
3. Queue Job Timeout Shorter Than API Call Time
4. Same Timeout for All Retry Attempts
5. Timeout Exceptions Not Logged
6. Timeout Without Retry (Transient Becomes Permanent)

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

## Anti-Pattern 1: No Timeout Configured (Infinite Wait, Worker Hangs)

### Category
Reliability | Performance

### Description
Making HTTP calls without setting any timeout. Default is 0 — infinite wait.

### Why It Happens
Http::get('/endpoint') works in development where APIs respond instantly.

### Warning Signs
- Http::get() without ->timeout() or ->connectTimeout()
- Workers hang indefinitely on slow API responses

### Why It Is Harmful
A DNS resolution hangs for 3 minutes. No connect timeout is set. The worker waits indefinitely. If the DNS never resolves, the worker hangs forever.

### Preferred Alternative
Always set both connect and request timeouts.

### Refactoring Strategy
1. Add Http::connectTimeout(5)->timeout(30) to all outbound calls
2. Audit all HTTP calls for missing timeouts

### Related Rules
Always Configure Both Connect and Request Timeouts (05-rules.md)

### Related Skills
Configure Timeout Handling for Outbound API Calls (06-skills.md)

---

## Anti-Pattern 2: Only Request Timeout Without Connect Timeout

### Category
Reliability

### Description
Setting ->timeout() but not ->connectTimeout(). A hung TCP connection blocks the worker for the full request timeout.

### Why It Happens
->timeout() is well-known. ->connectTimeout() is less common.

### Warning Signs
- Http::timeout(30) without connectTimeout()
- Connection errors take as long as timeout errors to surface

### Why It Is Harmful
A TCP connection to a non-existent IP hangs for 30 seconds before failing. Connect timeout should be 5 seconds. 25 seconds of worker time wasted per connection failure.

### Preferred Alternative
Set both connectTimeout(5) and 	imeout(30).

### Refactoring Strategy
1. Add ->connectTimeout(5) before ->timeout(30)
2. Test connection failures surface in <5s

### Related Rules
Always Configure Both Connect and Request Timeouts (05-rules.md)

---

## Anti-Pattern 3: Queue Job Timeout Shorter Than API Call Time

### Category
Reliability

### Description
Setting queue job $timeout shorter than max expected API processing time.

### Why It Happens
Developers guess a timeout without measuring actual API response times.

### Warning Signs
- public  = 30 on API-calling jobs
- Jobs force-failed with "execution time exceeded"

### Why It Is Harmful
API responds in 25s. Processing adds 4s. With 1s overhead: 30s total. Job times out and is killed. API call succeeded but result was never saved.

### Preferred Alternative
Set job timeout > max expected API call time + processing + buffer.

### Refactoring Strategy
1. Measure API p99 response time
2. Add processing time + 50% buffer
3. Set job timeout accordingly

### Related Rules
Configure Queue Job Timeout to Exceed Max API Time (05-rules.md)

---

## Anti-Pattern 4: Same Timeout for All Retry Attempts

### Category
Performance | Reliability

### Description
Using identical timeout (e.g., 30s) for all retry attempts. Later attempts likely to fail again.

### Why It Happens
Default retry config uses the same timeout for every attempt.

### Warning Signs
- Same ->timeout(30) on all retries
- Retry sequence lasts minutes

### Why It Is Harmful
3 retries × 30s timeout = 90s total. If the API is timing out, it will probably time out again. Each retry wastes 30s. The total operation takes 90s when it could have failed in 10s.

### Preferred Alternative
Decrease timeout on each retry attempt.

### Refactoring Strategy
1. Use shorter timeout for each retry (30s, 15s, 5s)
2. Fail fast on persistently slow responses

### Related Rules
Combine Timeout with Retry (05-rules.md)

---

## Anti-Pattern 5: Timeout Exceptions Not Logged

### Category
Observability

### Description
Timeout exceptions thrown without logging. No data for debugging slow services.

### Why It Happens
Default error handling logs the exception, but not service/endpoint/context.

### Warning Signs
- No custom timeout logging
- Timeout rate unknown

### Why It Is Harmful
Timeout rate increases from 0.1% to 5%. No one notices. The upstream API is degrading. Without timeout metrics, the degradation goes undetected until complete failure.

### Preferred Alternative
Log every timeout with service, endpoint, and configured timeout values.

### Refactoring Strategy
1. Catch timeout exceptions in service layer
2. Log with service name, endpoint, timeout values
3. Add timeout rate metrics

### Related Rules
Log Timeout Exceptions with Context (05-rules.md)

---

## Anti-Pattern 6: Timeout Without Retry (Transient Becomes Permanent)

### Category
Reliability

### Description
A single timeout causes permanent failure. No retry for transient blips.

### Why It Happens
Developers don't combine timeout with retry logic.

### Warning Signs
- Http::timeout(30)->get() without etry()
- Transient network blips cause permanent failures

### Why It Is Harmful
A 2-second network blip causes a timeout. The request is permanently failed. 2 seconds of network issue causes 2 hours of delayed processing (manual retry). The operation was idempotent and could have been retried in 1 second.

### Preferred Alternative
Combine timeout with retry.

### Refactoring Strategy
1. Add Http::retry(3, 1000) to all timeout-configured calls
2. Ensure idempotency for write operations
3. Set shorter timeout per retry attempt

### Related Rules
Combine Timeout with Retry (05-rules.md)
