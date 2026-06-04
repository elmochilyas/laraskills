# ECC Anti-Patterns — Concurrency Control with Pools and Async Requests

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Concurrency Control with Pools and Async Requests |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Pooling Sequential-Dependent Requests
2. Excessive Concurrency for Rate-Limited Upstream APIs
3. Unhandled Individual Pool Request Errors
4. Assuming Pool Response Order Matches Request Order
5. Shared Connection Pool Across Different Upstream Services

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Shared Mutable State
- Hidden Database Queries

---

## Anti-Pattern 1: Pooling Sequential-Dependent Requests

### Category
Architecture | Performance

### Description
Using concurrent request pools for HTTP calls that have data dependencies on each other. Request B needs data from Request A's response, but both are dispatched simultaneously, causing indeterminate ordering bugs.

### Why It Happens
Developers see an opportunity to "parallelize" all requests without analyzing data flow dependencies. The code appears faster locally due to cache effects.

### Warning Signs
- Pool results where one response is used as input to another request
- Intermittent "undefined index" or null reference errors
- Race conditions that pass tests but fail in production

### Why It Is Harmful
Amdahl's law: the sequential-dependent portion cannot be parallelized. Pooling these requests wastes resources and introduces non-deterministic bugs that are hard to reproduce.

### Real-World Consequences
Order list shows customer names from a different API call because response ordering was assumed. Data corruption in reports. Hours lost debugging race conditions.

### Preferred Alternative
Execute sequential-dependent requests in order. Only pool truly independent requests that have no data dependencies between them.

### Refactoring Strategy
1. Map request dependency graph before applying pools
2. Execute dependent requests sequentially with proper data flow
3. Only pool requests at the same dependency depth
4. Test with varied response timing to surface race conditions

### Detection Checklist
- [ ] Pooled requests share data dependencies
- [ ] Response data is fed into subsequent request parameters
- [ ] Tests pass consistently but production fails intermittently

### Related Rules
Reuse Same Connector Instance for Connection Pooling (05-rules.md)

### Related Skills
Execute Concurrent HTTP Requests with Pools (06-skills.md)

### Related Decision Trees
Concurrency Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Excessive Concurrency for Rate-Limited Upstream APIs

### Category
Performance | Scalability

### Description
Setting high concurrency (25-50) on pools targeting external APIs with strict rate limits. The upstream returns 429 errors for most requests, triggering retries that worsen throughput.

### Why It Happens
Developers benchmark locally against mock servers that have no rate limits. Higher concurrency looks faster in dev, so the setting is deployed to production.

### Warning Signs
- Concurrency >10 for external third-party APIs
- High 429 error rate correlated with pool usage
- Throughput degrades as concurrency increases (inverse scaling)

### Why It Is Harmful
Excessive concurrency triggers rate limits, causing retries that consume additional rate limit budget. Effective throughput drops below sequential execution. API provider may temporarily ban the integration.

### Real-World Consequences
Stripe returns 429 for 80% of batch charge lookups. Retry storm exhausts rate limit entirely for 5 minutes. Integration is effectively down for 10 minutes every hour.

### Preferred Alternative
Limit concurrency to 5-10 for rate-limited external APIs. Use 25-50 only for internal services with guaranteed capacity. Monitor 429 rate and reduce concurrency if >1%.

### Refactoring Strategy
1. Identify upstream API rate limits (check docs or test)
2. Set initial concurrency to 5 for external APIs
3. Monitor 429 rate and gradually increase if 0%
4. Implement batch processing with `array_chunk` for large datasets

### Detection Checklist
- [ ] Concurrency >10 for external third-party APIs
- [ ] No rate limit awareness in pool configuration
- [ ] 429 errors correlated with pool requests

### Related Rules
Set Conservative Concurrency for Rate-Limited APIs (05-rules.md)

### Related Skills
Execute Concurrent HTTP Requests with Pools (06-skills.md)

### Related Decision Trees
Concurrency Limit Configuration (07-decision-trees.md)

---

## Anti-Pattern 3: Unhandled Individual Pool Request Errors

### Category
Reliability | Testing

### Description
Dispatching pool requests without per-request error handling, allowing a single failed request to throw an exception that aborts the entire pool operation and discards all successful responses.

### Why It Happens
Developers treat the pool as a single atomic operation. The simpler code path (no error handling per request) is written first and never revisited.

### Warning Signs
- Pool code without `->catch()` or try-catch per request
- One failed request prevents using successfully fetched data
- Pool wrapped in a single try-catch block

### Why It Is Harmful
A single transient failure (DNS timeout, 503) discards all successful responses from the pool, reducing availability below that of sequential requests.

### Real-World Consequences
Dashboard shows errors because one of 10 API calls failed. Users see a blank page even though 9 of 10 data sources responded correctly. MTBF effectively decreases.

### Preferred Alternative
Use `->catch()` on each pool entry to handle individual failures gracefully. Aggregate successful responses and log failures separately.

### Refactoring Strategy
1. Add `->catch(fn ($e) => null)` to each pool entry
2. Filter null responses from results
3. Log individual failures with context
4. For critical failures, implement per-request retry within the catch

### Detection Checklist
- [ ] No per-request catch handler on pool entries
- [ ] Single try-catch wrapping the entire pool
- [ ] Successful responses discarded on partial failure

### Related Rules
Handle Individual Pool Request Errors (05-rules.md)

### Related Skills
Execute Concurrent HTTP Requests with Pools (06-skills.md)

### Related Decision Trees
Pool Error Handling Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Assuming Pool Response Order Matches Request Order

### Category
Testing | Reliability

### Description
Relying on array index (e.g., `$responses[0]`, `$responses[1]`) to access pool results, assuming responses arrive in the same order requests were submitted.

### Why It Happens
Pool responses often arrive in request order during local development and testing due to low latency, creating a false assumption of deterministic ordering.

### Warning Signs
- Pool results accessed by numeric index
- Tests pass locally but intermittently fail in staging
- Data misalignment bugs (user data mixed with order data)

### Why It Is Harmful
Responses from concurrent requests complete in indeterminate order. Numeric indexing maps responses to the wrong requests, causing data corruption that is hard to detect and debug.

### Real-World Consequences
User profile page shows order data in the "user" section and user data in the "orders" section. Customer support tickets about incorrect information. Bug reproduces only under load.

### Preferred Alternative
Use named keys with `Http::pool()` and access results by name: `$responses['users']`, `$responses['orders']`.

### Refactoring Strategy
1. Replace numeric array entries with named keys
2. Update all response access to use named keys
3. Add static analysis to prevent numeric indexing of pool results
4. Test with artificial latency to vary response ordering

### Detection Checklist
- [ ] Pool results accessed by numeric index
- [ ] No named keys used in pool definition
- [ ] Tests pass consistently but production fails intermittently

### Related Rules
Use Named Keys with Http::pool() for Response Correlation (05-rules.md)

### Related Skills
Execute Concurrent HTTP Requests with Pools (06-skills.md)

### Related Decision Trees
Concurrency Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Shared Connection Pool Across Different Upstream Services

### Category
Reliability | Scalability

### Description
Using a single Guzzle client instance (and hence a single connection pool) for requests to multiple different upstream services. A slow or failing service occupies connections in the shared pool, starving other services.

### Why It Happens
Developers create one `Http::fake()` or `new Client()` for simplicity, not anticipating how a single slow service can block all integrations.

### Warning Signs
- Single `$client` instance passed to all service classes
- When one upstream API is slow, all other integrations also slow down
- Connection pool metrics show connections waiting for a single host

### Why It Is Harmful
One degraded upstream service exhausts the shared connection pool, causing cascading failures across all integrations. The bulkhead principle is violated.

### Real-World Consequences
Mailgun API is slow (5s response time). Its connections occupy the shared pool, blocking Stripe API calls. Payment processing is delayed because of an email delivery issue.

### Preferred Alternative
Use separate client instances (and connection pools) per upstream service. Configure timeouts per service.

### Refactoring Strategy
1. Create separate Guzzle client singletons per service
2. Configure per-service timeouts and connection limits
3. Register each client in the service container with a named binding
4. Update service classes to inject their specific client

### Detection Checklist
- [ ] Single Guzzle client used for multiple services
- [ ] One slow upstream affects other integrations
- [ ] No per-service connection pool isolation

### Related Rules
Separate Pools Per Upstream for Failure Isolation (05-rules.md)

### Related Skills
Execute Concurrent HTTP Requests with Pools (06-skills.md)

### Related Decision Trees
Pool Isolation Approach (07-decision-trees.md)
