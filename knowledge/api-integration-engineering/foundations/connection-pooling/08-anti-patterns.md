# ECC Anti-Patterns — Connection Pooling

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Connection Pooling |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Creating New Client Instance Per Request
2. Unbounded Connection Pools Without Limits
3. Shared Connection Pool Across Services (No Bulkhead)
4. Missing Pool-Level Timeout
5. Ignoring Response Order Indeterminacy in Pooled Requests

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Hidden Database Queries
- Shared Mutable State

---

## Anti-Pattern 1: Creating New Client Instance Per Request

### Category
Performance | Architecture

### Description
Instantiating a new Guzzle client for every HTTP request instead of reusing a single instance. Each new client starts with an empty connection pool, losing TCP connection reuse benefits.

### Why It Happens
The simplest code path is `new Client()->get(...)` in-line. Service classes default to creating clients in their constructor or method without considering reuse.

### Warning Signs
- `new Client()` or `new Http::...()` inside a loop or frequently called method
- No singleton binding for Guzzle clients in the service container
- High TCP connection rate (SYN packets) per upstream host

### Why It Is Harmful
Each request incurs a full TCP handshake (1 round trip) and TLS negotiation (1-2 round trips), adding 50-200ms overhead per request. File descriptor usage spikes unnecessarily.

### Real-World Consequences
500ms API calls become 700ms due to repeated TLS handshakes. Queue workers exhaust file descriptors after processing 1000 jobs. API provider sees connection storms from your integration.

### Preferred Alternative
Register a singleton Guzzle client per service in the service container. Reuse the same instance across all requests.

### Refactoring Strategy
1. Create a service provider that registers Guzzle clients as singletons
2. Inject the client via constructor dependency injection
3. Remove all `new Client()` calls from service classes
4. Verify connection reuse via TCP socket metrics

### Detection Checklist
- [ ] `new Client()` created per request or per loop iteration
- [ ] No singleton binding in service container
- [ ] High TCP connection rate to upstream hosts

### Related Rules
Reuse Same Client Instance for Connection Pooling (05-rules.md)

### Related Skills
Configure HTTP Connection Pooling for High-Throughput Integrations (06-skills.md)

### Related Decision Trees
Client Instance Management (07-decision-trees.md)

---

## Anti-Pattern 2: Unbounded Connection Pools Without Limits

### Category
Reliability | Performance

### Description
Using Guzzle's default configuration without setting maximum connection limits (`CURLMOPT_MAX_TOTAL_CONNECTIONS`). The connection pool grows unbounded under load, exhausting system file descriptors.

### Why It Happens
Developers are unaware of connection pool limits or assume Guzzle's defaults are safe. Connection limits only become relevant under production load.

### Warning Signs
- `EMFILE` (too many open files) errors in production logs
- No `max_handles` or connection limit configuration anywhere
- Socket count grows proportionally with request volume

### Why It Is Harmful
Unbounded pools exhaust file descriptors, causing the application (not just HTTP calls) to fail with `EMFILE`. The operating system limit (typically 1024-4096) is reached under moderate load.

### Real-World Consequences
Queue worker crashes with "Too many open files" after processing 500 concurrent API calls. Application becomes completely unresponsive. Requires process restart.

### Preferred Alternative
Configure `CURLMOPT_MAX_TOTAL_CONNECTIONS` and per-host limits. Monitor connection pool size and set limits based on available file descriptors.

### Refactoring Strategy
1. Calculate available file descriptors (`ulimit -n`)
2. Reserve descriptors for database, cache, and application needs
3. Set connection pool limit to (available_fds / 3)
4. Configure per-host limits to prevent one host from exhausting the pool
5. Monitor pool utilization and adjust limits

### Detection Checklist
- [ ] No connection pool limit configured
- [ ] `EMFILE` errors in logs
- [ ] Socket usage grows linearly with concurrency

### Related Rules
Set Connection Pool Limits (05-rules.md)

### Related Skills
Configure HTTP Connection Pooling for High-Throughput Integrations (06-skills.md)

### Related Decision Trees
Connection Pooling Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Shared Connection Pool Across Services (No Bulkhead)

### Category
Reliability | Architecture

### Description
Using a single Guzzle client for requests to multiple different upstream services. A slow or failing service occupies connections in the shared pool, starving all other services.

### Why It Happens
Developers create one global HTTP client for simplicity. The impact of cross-service contention is not visible until one upstream API degrades.

### Warning Signs
- One `$http` client injected into all service classes
- When Stripe is slow, Mailgun and Twilio also slow down
- No per-service timeout configuration

### Why It Is Harmful
A single slow upstream can consume all available connections in the shared pool, blocking requests to all other services. This violates the bulkhead pattern and causes cascading failures.

### Real-World Consequences
Mailgun API responds slowly (3s). All 25 pool connections are occupied waiting for Mailgun responses. Payment processing (Stripe) is blocked, causing order failures. Revenue loss because of an email delay.

### Preferred Alternative
Create separate Guzzle client instances per upstream service, each with its own connection pool and timeout configuration.

### Refactoring Strategy
1. Identify all distinct upstream services
2. Create a dedicated client singleton per service
3. Configure per-service connection limits and timeouts
4. Inject the appropriate client into each service class
5. Remove the shared client

### Detection Checklist
- [ ] Single HTTP client used for multiple services
- [ ] One slow service degrades all integrations
- [ ] No per-service pool isolation

### Related Rules
Separate Pools Per Service for Failure Isolation (05-rules.md)

### Related Skills
Configure HTTP Connection Pooling for High-Throughput Integrations (06-skills.md)

### Related Decision Trees
Pool Isolation Approach (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Pool-Level Timeout

### Category
Reliability | Performance

### Description
Dispatching concurrent request pools without setting a total timeout for the entire pool operation. A single hanging request keeps all other responses waiting indefinitely.

### Why It Happens
Developers configure per-request timeouts but forget that the pool's total wall time is the maximum of all individual request times, plus waiting time.

### Warning Signs
- Pool code without `->timeout()` or pool-level timeout
- Worker threads blocked on pools for minutes
- Queue jobs taking much longer than expected

### Why It Is Harmful
A single hanging HTTP request blocks the entire pool indefinitely, keeping the worker process occupied. Queue backpressure builds, job throughput collapses.

### Real-World Consequences
One upstream API endpoint hangs (no response, no timeout). The pool never completes. Queue worker is stuck for 30 minutes until supervisor kills it. Hundreds of jobs backlog.

### Preferred Alternative
Set per-request timeouts on each pool entry and consider pool-level timeout bounds.

### Refactoring Strategy
1. Add `withOptions(['timeout' => 5])` to each pooled request
2. Set a maximum pool completion time expectation
3. Use per-request timeouts rather than a single pool timeout
4. Implement fallback for timed-out requests

### Detection Checklist
- [ ] Pool requests have no timeout configuration
- [ ] Worker threads blocked on pools for >30s
- [ ] No timeout handling for hung connections

### Related Rules
Implement Timeout for the Entire Pool (05-rules.md)

### Related Skills
Configure HTTP Connection Pooling for High-Throughput Integrations (06-skills.md)

### Related Decision Trees
Connection Pooling Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Ignoring Response Order Indeterminacy in Pooled Requests

### Category
Testing | Reliability

### Description
Accessing pool results by numeric index (positional assumption) instead of named keys, assuming responses arrive in the same order requests were submitted.

### Why It Happens
During local development with low latency, responses often complete in request order. Developers rely on this apparent determinism.

### Warning Signs
- `$responses[0]`, `$responses[1]` used to access pool results
- No named keys in pool definitions
- Intermittent data misalignment bugs

### Why It Is Harmful
Responses complete in indeterminate order. Numeric indexing maps response data to the wrong logical request, causing data corruption that is hard to detect and reproduce.

### Real-World Consequences
Dashboard shows user names in the "recent orders" section and order IDs in the "user profile" section. Bug reproduces only under production traffic patterns.

### Preferred Alternative
Use named keys in pool definitions and access results by their logical name.

### Refactoring Strategy
1. Add named keys to all pool definitions
2. Replace `$responses[0]` with `$responses['users']`
3. Add static analysis rules to prevent numeric indexing of pool results
4. Write tests that verify correct response mapping under varied timing

### Detection Checklist
- [ ] Pool results accessed by numeric index
- [ ] No named keys used
- [ ] Intermittent data misalignment in pooled response handling

### Related Rules
Use Named Pool Keys for Response Correlation (05-rules.md)

### Related Skills
Configure HTTP Connection Pooling for High-Throughput Integrations (06-skills.md)

### Related Decision Trees
Connection Pooling Strategy (07-decision-trees.md)
