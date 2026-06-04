# ECC Anti-Patterns — Fallback Strategies

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Fallback Strategies |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Silent Fallback Without Logging
2. Falling Back on Single Failures (Not Circuit Breaker Aware)
3. No Stale Cache Fallback for Read Operations
4. Silently Falling Back on Write Operations
5. No Fallback Response Headers (Degraded Mode Invisible)

## Repository-Wide Anti-Patterns

- Silent Failure
- Overengineering

---

## Anti-Pattern 1: Silent Fallback Without Logging

### Category
Observability

### Description
Serving fallback data without logging the fallback event. Operators cannot distinguish degraded responses from normal ones.

### Why It Happens
The catch block returns fallback data and continues. Developers don't add logging.

### Warning Signs
- `catch` block returns fallback with no log statement
- Degraded responses visible in metrics but not in logs
- Operators unaware of fallback activation

### Why It Is Harmful
Payment API is down. Fallback returns cached rates. No log entry. Operations dashboards show normal traffic. Users see "rates as of yesterday" without knowing. Support tickets roll in: "exchange rates are wrong." Ops investigates for hours before finding the upstream outage.

### Preferred Alternative
Log every fallback invocation with service, reason, and fallback type.

### Refactoring Strategy
1. Add `Log::warning()` before every fallback return
2. Include service name, exception class, fallback type
3. Add metrics counter for fallback rate

### Related Rules
Never Fallback Silently — Always Log (05-rules.md)

### Related Skills
Implement Fallback Strategies for Failed API Calls (06-skills.md)

### Related Decision Trees
Fallback Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Falling Back on Single Failures (Not Circuit Breaker Aware)

### Category
Reliability

### Description
Triggering fallback on every individual API failure instead of checking circuit breaker state.

### Why It Happens
Error handling catches exceptions and immediately calls fallback. Circuit breaker awareness requires an extra check.

### Warning Signs
- `catch (Exception $e) { return $this->fallback(); }` pattern
- Provider failover on every transient timeout
- Expensive fallback operations triggered on minor blips

### Why It Is Harmful
A single timeout (0.1% of requests) triggers provider failover. The backup provider is called unnecessarily. The backup provider bill includes charges for failover traffic that was never needed. The primary provider was healthy 99.9% of the time.

### Preferred Alternative
Check circuit breaker state before falling back.

### Refactoring Strategy
1. Before API call, check `if ($this->breaker->isOpen('stripe'))`
2. If open: go directly to fallback (fail-fast)
3. If closed: attempt primary; let retry handle transient errors
4. Only fallback after retries exhausted

### Related Rules
Fallback Based on Circuit Breaker State, Not Single Failures (05-rules.md)

---

## Anti-Pattern 3: No Stale Cache Fallback for Read Operations

### Category
Reliability

### Description
Read endpoints that fail completely when the upstream API is unavailable, even though stale cached data exists.

### Why It Happens
The read path only tries the remote API. The developer doesn't consider cache-as-fallback.

### Warning Signs
- `Cache::remember()` used without `Cache::get()` fallback on miss
- API failure returns error page instead of cached data
- Complete feature outage during upstream blip

### Why It Is Harmful
Exchange rate API is down for 2 minutes. The exchange rate widget returns an error. Users see a broken widget. The cache still has rates from 5 minutes ago that are perfectly usable. The application chose to show an error instead of slightly stale data.

### Preferred Alternative
Use stale cache as fallback when fresh data is unavailable.

### Refactoring Strategy
1. Use `Cache::get()` to check for any cached data (even expired)
2. If fresh cache miss, try API
3. If API fails, serve stale cache from `Cache::get()`
4. Add `X-Fallback: stale-cache` header

### Related Rules
Use Stale Cache as Primary Fallback for Reads (05-rules.md)

---

## Anti-Pattern 4: Silently Falling Back on Write Operations

### Category
Data Integrity

### Description
Writing to a backup provider when the primary is down, without idempotency or reconciliation.

### Why It Happens
"Just write to the backup" seems like a good availability pattern.

### Warning Signs
- `catch` on write operations writes to backup provider
- Duplicate records in primary and backup after recovery
- Data inconsistency between providers

### Why It Is Harmful
Primary order API fails. Code falls back to backup order API. Order is created in backup. Primary recovers. The order doesn't exist in primary. Reconciliation is needed to sync both systems. If both succeed (primary didn't actually fail), the order is created twice.

### Preferred Alternative
Queue writes for retry instead of failing over.

### Refactoring Strategy
1. On write failure, dispatch a retry job
2. Do not silently switch providers for writes
3. If provider failover is needed, implement with idempotency keys
4. Add reconciliation process for write operations

### Related Rules
Design Fallbacks for Reads, Not Writes (05-rules.md)

---

## Anti-Pattern 5: No Fallback Response Headers (Degraded Mode Invisible)

### Category
Observability

### Description
Serving fallback data without any HTTP headers indicating degraded mode. Consumers don't know the data quality.

### Why It Happens
The response body is correct (albeit stale). Developers don't think about response metadata.

### Warning Signs
- No `X-Fallback`, `X-Degraded-Mode`, or `X-Data-Age` headers
- API consumers cannot distinguish fresh from stale data
- Monitoring cannot track fallback frequency from response headers

### Why It Is Harmful
An API consumer caches the response. The stale fallback data is cached as fresh data. The consumer uses old exchange rates for financial calculations. No header indicates staleness. The consumer has no way to know the data is degraded.

### Preferred Alternative
Add `X-Fallback` and `X-Degraded-Mode` headers to fallback responses.

### Refactoring Strategy
1. Add `->header('X-Fallback', 'stale-cache')` on fallback responses
2. Add `->header('X-Data-Age', $ageInSeconds)`
3. Monitor header presence in API gateway or logging

### Related Rules
Indicate Degraded Mode in Response Headers (05-rules.md)
