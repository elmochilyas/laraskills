# ECC Anti-Patterns — Guzzle HTTP Client Internals and Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Guzzle HTTP Client Internals and Configuration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Global Handler Stack Mutation Across Services
2. Wrong Middleware Order (Auth After Retry)
3. Mutable State Inside Middleware Closures
4. Per-Request Timeout Instead of Client-Level Default
5. Overwriting Default cURL Options Instead of Merging

---

## Repository-Wide Anti-Patterns

- Shared Mutable State
- Premature Optimization

---

## Anti-Pattern 1: Global Handler Stack Mutation Across Services

### Category
Code Organization | Maintainability

### Description
Mutating the global default Guzzle handler stack instead of creating per-service stacks. Middleware added for one service leaks into all other HTTP clients.

### Why It Happens
Developers call `HandlerStack::create()` and push middleware without realizing the stack is shared. The default stack is modified in-place.

### Warning Signs
- Mysterious middleware behavior: logging appears on services that didn't configure it
- Duplicate retry attempts across unrelated API calls
- No `clone` or per-service stack creation

### Why It Is Harmful
Middleware intended for one service (e.g., Stripe auth headers) is applied to all HTTP calls. Retry middleware for a slow API is triggered on fast internal calls.

### Real-World Consequences
Stripe authentication headers sent to Mailgun API. Internal service calls log to the external monitoring pipeline. Debugging takes hours to trace cross-service middleware leak.

### Preferred Alternative
Clone the handler stack or create a fresh `HandlerStack::create()` per service.

### Refactoring Strategy
1. Identify all places where `HandlerStack` is created
2. Create a factory per service that returns a fresh stack
3. Ensure stacks are not stored in a single shared variable
4. Verify isolation with middleware logging

### Detection Checklist
- [ ] Single handler stack shared across services
- [ ] Middleware appears on HTTP calls where it wasn't configured
- [ ] No isolation mechanism (clone or per-service factory)

### Related Rules
Create Handler Stack Per Service (05-rules.md)

### Related Skills
Configure Guzzle HTTP Client Middleware and Handlers (06-skills.md)

### Related Decision Trees
Handler Stack Architecture (07-decision-trees.md)

---

## Anti-Pattern 2: Wrong Middleware Order (Auth After Retry)

### Category
Architecture | Security

### Description
Pushing auth middleware outside (before) retry middleware, causing authentication to run on every retry attempt or, worse, retries happening without authentication.

### Why It Happens
Developers don't understand the handler stack deque semantics: middleware pushed last executes first (closest to the HTTP call). The intuitive assumption that "first pushed = first executed" is wrong.

### Warning Signs
- Auth tokens sent on every retry attempt (visible in logs)
- 401 errors on retry attempts
- `$stack->push($retryMiddleware)` listed before `$stack->push($authMiddleware)`

### Why It Is Harmful
Retry without auth always gets 401. Auth on every retry wastes API calls and leaks tokens in logs. Debugging time lost to confusing middleware order.

### Real-World Consequences
API returns 401 on every retry because auth middleware runs after retry. All 5 retry attempts fail. The integration is effectively down after initial 401.

### Preferred Alternative
Push monitoring (outermost) → retry → auth (innermost, closest to handler).

### Refactoring Strategy
1. Review middleware push order in all handler stacks
2. Ensure auth middleware is pushed last (innermost)
3. Retry middleware pushed before auth
4. Monitoring/telemetry pushed first (outermost)
5. Verify with a test that exercises the middleware chain

### Detection Checklist
- [ ] Auth middleware not pushed last
- [ ] Retry middleware not between monitoring and auth
- [ ] 401 errors on retry attempts

### Related Rules
Order Middleware Correctly (Auth Inside Retry) (05-rules.md)

### Related Skills
Configure Guzzle HTTP Client Middleware and Handlers (06-skills.md)

### Related Decision Trees
Middleware Order Decision (07-decision-trees.md)

---

## Anti-Pattern 3: Mutable State Inside Middleware Closures

### Category
Testing | Reliability

### Description
Maintaining mutable state (counters, accumulators) inside Guzzle middleware closures. Concurrent requests race on the shared mutable state, causing non-deterministic behavior.

### Why It Happens
Middleware seems like a convenient place to track metrics (request counts, timing totals). Developers reach for shared variables before considering thread safety.

### Warning Signs
- `use (&$counter)` or similar mutable references in middleware
- Request counters showing incorrect totals under load
- Non-deterministic middleware behavior

### Why It Is Harmful
Race conditions produce incorrect metrics. Debugging based on middleware state leads to wrong conclusions. Hard-to-reproduce production bugs.

### Real-World Consequences
Monitoring shows 50% of requests as "slow" due to a racing counter. Alert fires, on-call investigates for hours, finds nothing. Trust in monitoring erodes.

### Preferred Alternative
Keep middleware stateless. If state is needed, use lock-protected storage or dedicated metric systems (Prometheus counters).

### Refactoring Strategy
1. Identify all mutable state in middleware closures
2. Move state to external storage (Redis counters, Prometheus)
3. Replace shared variables with atomic operations or lock-protected access
4. Add concurrency tests to verify middleware behavior

### Detection Checklist
- [ ] `use (&$var)` references in middleware
- [ ] Mutable variables shared across middleware invocations
- [ ] Non-deterministic middleware output under load

### Related Rules
Avoid Mutable State Inside Middleware Closures (05-rules.md)

### Related Skills
Configure Guzzle HTTP Client Middleware and Handlers (06-skills.md)

### Related Decision Trees
Handler Stack Architecture (07-decision-trees.md)

---

## Anti-Pattern 4: Per-Request Timeout Instead of Client-Level Default

### Category
Reliability | Maintainability

### Description
Setting timeout on each individual request instead of configuring it at the Guzzle client constructor level. Leads to inconsistent behavior and forgotten timeouts on some calls.

### Why It Happens
Developers copy-paste request patterns with inline timeout configuration. Client-level config is seen as optional or is simply unknown.

### Warning Signs
- `['timeout' => 5]` passed as request option on every call
- No client-level default timeout configured
- Some requests missing timeout configuration

### Why It Is Harmful
Forgotten timeouts on some requests cause indefinite hangs. Worker threads are blocked, queue backpressure builds, and the application degrades slowly.

### Real-World Consequences
One request path without a timeout hangs on a slow API response. The queue worker is stuck for 30 minutes. Payment processing jobs backlog. Revenue impact.

### Preferred Alternative
Configure `connect_timeout` and `timeout` at the Guzzle client constructor; override per-request only for specific exceptions.

### Refactoring Strategy
1. Add `timeout` and `connect_timeout` to all Guzzle client constructors
2. Remove inline timeout from individual requests unless different from default
3. Add static analysis rule to enforce client-level timeout

### Detection Checklist
- [ ] No client-level timeout in Guzzle constructor
- [ ] Inline timeout on most but not all requests
- [ ] Workers blocked for >30s on HTTP calls

### Related Rules
Configure Timeouts via Guzzle Client, Not Each Request (05-rules.md)

### Related Skills
Configure Guzzle HTTP Client Middleware and Handlers (06-skills.md)

### Related Decision Trees
cURL Option Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Overwriting Default cURL Options Instead of Merging

### Category
Performance | Maintainability

### Description
Replacing the entire cURL options array when configuring Guzzle, overwriting connection pooling and keep-alive defaults instead of merging with them.

### Why It Happens
Developers use `new Client(['curl' => [CURLOPT_... => ...]])` without understanding that this replaces the default curl options entirely.

### Warning Signs
- Connection pool not functioning (new TCP connections per request)
- `CURLOPT_*` options set as a complete replacement array
- Performance degradation after adding custom cURL options

### Why It Is Harmful
Connection pooling stops working. TCP_NODELAY and Keep-Alive defaults are lost. Each request opens a new TCP connection, adding 50-200ms overhead.

### Real-World Consequences
After adding CURLOPT_TIMEOUT, all requests became significantly slower because connection pooling was disabled. 500ms API calls became 700ms due to TCP handshake overhead.

### Preferred Alternative
Merge custom cURL options with defaults: `array_merge($defaultOptions, $customOptions)`.

### Refactoring Strategy
1. Identify all Guzzle client configurations with `curl` array
2. Replace array assignment with merge: `'curl' => array_merge($defaults, $overrides)`
3. Test that connection pooling still functions (reuse TCP connections)
4. Verify performance metrics

### Detection Checklist
- [ ] `curl` config array replaces rather than merges defaults
- [ ] TCP connections not being reused after config change
- [ ] Performance regression correlated with cURL config change

### Related Rules
Configure Timeouts via Guzzle Client, Not Each Request (05-rules.md)

### Related Skills
Configure Guzzle HTTP Client Middleware and Handlers (06-skills.md)

### Related Decision Trees
cURL Option Selection (07-decision-trees.md)
