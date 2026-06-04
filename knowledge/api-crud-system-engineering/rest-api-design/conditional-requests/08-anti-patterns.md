# Conditional Requests: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | conditional-requests |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **ETag as Security Token** — Using ETags for authorization instead of cache validation
2. **Stateless ETag Without Cache** — Recomputing expensive ETags on every request without caching the result
3. **Stale ETag After Write** — Setting ETag on write responses before refreshing the model
4. **If-Match on Every Endpoint** — Requiring conditional headers even for low-contention resources
5. **Ignoring If-None-Match for Conditional GET** — Generating ETags but never checking incoming conditional headers

## Repository-Wide Anti-Patterns

- Copy-pasting ETag logic across every controller instead of using middleware or a trait
- Mixing weak and strong ETags inconsistently across the same API surface
- Setting `Cache-Control` headers that conflict with conditional request semantics

---

## 1. ETag as Security Token

### Category
Security Misuse

### Description
Using ETags as an authorization mechanism — embedding user身份 or permission claims in the ETag value, or checking ETags to determine if a client should have access to a resource. ETags are cache validators, not access controls.

### Why It Happens
Developers see that ETags are unique per resource version and assume they can serve double duty as security tokens. The "it's a hash, so it's secure" fallacy.

### Warning Signs
- ETag computation includes user IDs, roles, or permissions
- Authorization logic lives inside ETag computation code
- Conditional request handling that returns 403 based on ETag comparison

### Why Harmful
Security and caching are fundamentally different concerns. Using ETags for authorization bypasses proper authentication middleware, creates security holes when ETag logic changes, and makes cache invalidation security-sensitive.

### Real-World Consequences
A developer changes the ETag computation algorithm and inadvertently breaks authorization for all cached responses. Or worse, a client with a valid ETag from an authorized session reuses it after deauthorization and gains access.

### Preferred Alternative
Use proper middleware-based authorization (Laravel Gates, Policies, middleware) for access control. Use ETags exclusively for cache validation and conditional requests.

### Refactoring Strategy
1. Separate authorization logic into middleware or policy classes
2. Simplify ETag computation to use only content-based or timestamp-based hashing
3. Remove any user-identity-dependent data from ETag computation
4. Verify that authorization is enforced independently of ETag logic

### Detection Checklist
- [ ] ETag computation includes user identity or role data
- [ ] Authorization is checked during ETag generation
- [ ] Removing ETag logic would change authorization behavior
- [ ] 403 responses are returned from ETag comparison code

### Related Rules/Skills/Trees
- Rule: API-ERROR-002 (Sensitive Data Leak Prevention)
- Skill: api-security-headers
- Tree: security-concerns

---

## 2. Stateless ETag Without Cache

### Category
Performance Waste

### Description
Computing ETags for every request using an expensive operation (full response serialization, complex hash computation) without caching the computed ETag value. Each request pays the full cost even when the resource hasn't changed.

### Why It Happens
The ETag computation appears cheap in development with small datasets. Performance degradation only surfaces under production load.

### Warning Signs
- ETag computed from `md5(json_encode($response->getData()))` on every request
- Response time for conditional requests is identical to non-conditional requests
- High CPU usage correlated with ETag computation

### Why Harmful
The purpose of conditional requests is to save server resources. If computing the ETag costs nearly as much as generating the full response, conditional requests provide no net benefit and may degrade performance.

### Real-World Consequences
An API serving 1000 requests/second spends 30% of CPU computing ETags from full response serialization. After caching ETags in Redis, CPU drops to 5% for the same task.

### Preferred Alternative
Compute ETags from lightweight model data (`md5($model->updated_at->timestamp)`) or cache computed ETags in Redis with the same TTL as the response cache.

### Refactoring Strategy
1. Identify ETag computation cost using profiling
2. Replace full-content hashing with model-timestamp hashing where possible
3. For expensive ETags, cache in Redis with `Cache::remember()`
4. Set ETag cache TTL to match response cache TTL

### Detection Checklist
- [ ] ETag is computed from full response content
- [ ] No caching layer exists between ETag computation and response
- [ ] CPU profiling shows ETag computation as a hot path
- [ ] Removing ETag logic measurably improves response time

### Related Rules/Skills/Trees
- Rule: API-PERF-003 (Response Optimization)
- Skill: response-caching-headers
- Tree: performance-optimization

---

## 3. Stale ETag After Write

### Category
Data Integrity

### Description
Setting an ETag on write responses (PUT, PATCH, POST) using the model state before it was refreshed. The returned ETag matches the old state, so the client's next conditional request incorrectly detects a match when the resource has actually changed.

### Why It Happens
The controller updates the model, then sets the ETag from `$model->updated_at` without calling `$model->fresh()`. The `updated_at` timestamp reflects the pre-update value because the model instance hasn't been refreshed from the database.

### Warning Signs
- Write responses include ETags but the controller doesn't call `fresh()` after save
- Clients report 304 Not Modified after a write when they expect updated content
- ETag value after update matches the pre-update value

### Why Harmful
Clients rely on ETags to detect changes. A stale ETag causes clients to skip fetching updated content, leading to stale data display, lost optimistic concurrency protection, and data integrity bugs.

### Real-World Consequences
A client updates their profile, receives a response with the old ETag, then uses `If-None-Match` on the next GET. The server returns 304 (not modified), and the client displays the old profile data.

### Preferred Alternative
Always call `$model->fresh()` before setting ETag on write responses. Alternatively, construct the ETag from the freshly-saved model.

### Refactoring Strategy
1. Find all write endpoints that set ETags
2. Add `$model->fresh()` before ETag computation
3. Verify ETag changes after update in test assertions
4. Assert that `$response->headers->get('ETag')` doesn't match the pre-update value

### Detection Checklist
- [ ] Write endpoints set ETag without calling `fresh()`
- [ ] Integration test shows ETag unchanged after update
- [ ] Client-side stale data issues reported
- [ ] Optimistic concurrency failures on subsequent writes

### Related Rules/Skills/Trees
- Rule: API-DATA-003 (Write Integrity)
- Skill: http-method-semantics
- Tree: data-integrity

---

## 4. If-Match on Every Endpoint

### Category
Over-Engineering

### Description
Requiring `If-Match` headers on every write endpoint regardless of contention probability. Low-contention resources (settings, static content, append-only logs) still force clients to read before writing.

### Why It Happens
A developer implements optimistic concurrency for one high-value endpoint and applies the same pattern everywhere "for consistency." The cost-benefit analysis is skipped.

### Warning Signs
- Every PUT/PATCH/DELETE endpoint requires `If-Match`
- Error logs show frequent 412 responses for low-contention resources
- Client code always does GET-before-write even for simple operations

### Why Harmful
Doubles the request count for simple updates (GET to fetch ETag, then write with If-Match). Adds client complexity without proportional benefit for resources where concurrent modification is rare.

### Real-World Consequences
An API with 1000 write operations/second requires 2000 requests/second (1000 GET + 1000 write) because every write needs a preceding GET. Server load doubles, client code is more complex, and 99% of the conditional checks never trigger a conflict.

### Preferred Alternative
Require `If-Match` only for high-contention resources with business impact (orders, payments, inventory). Use last-write-wins for low-contention resources.

### Refactoring Strategy
1. Classify endpoints by contention probability and business impact
2. Remove `If-Match` requirement for low-contention, low-impact endpoints
3. Document which endpoints require conditional headers
4. Add monitoring to detect unexpected contention on previously-low resources

### Detection Checklist
- [ ] Every write endpoint requires `If-Match`
- [ ] No contention data exists to justify universal requirement
- [ ] Client code shows GET-before-write pattern for all resources
- [ ] Rate of 412 responses is near-zero
- [ ] Business impact of lost update on this resource is low

### Related Rules/Skills/Trees
- Rule: API-ARCH-004 (Appropriate Abstraction)
- Skill: rest-purity-vs-pragmatic
- Tree: pragmatic-design

---

## 5. Ignoring If-None-Match for Conditional GET

### Category
Broken Contract

### Description
The server generates and returns ETags on GET responses but never checks the incoming `If-None-Match` header. Clients send `If-None-Match` expecting 304 on unchanged resources, but always receive the full 200 response.

### Why It Happens
The ETag is set via `SetCacheHeaders` middleware for cache headers but the conditional request handling is not implemented on the controller or middleware level. The server advertises ETags but doesn't honor the conditional protocol.

### Warning Signs
- `ETag` header is present in responses but `If-None-Match` header is never checked
- All GET responses return 200 regardless of `If-None-Match` value
- `SetCacheHeaders` middleware is configured but no explicit `If-None-Match` handling exists
- Bandwidth usage is identical for all requests regardless of caching headers

### Why Harmful
Clients that implement conditional request logic receive no benefit. Bandwidth is wasted on full responses when 304 would suffice. Clients may implement inefficient polling strategies because conditional requests don't work.

### Real-World Consequences
A mobile app sends `If-None-Match` with every request to minimize data usage, but the server ignores it and returns full 200 responses every time. Users on slow connections experience long load times, and data usage is 10x what it should be.

### Preferred Alternative
Implement proper conditional GET handling. Use Laravel's `SetCacheHeaders` middleware or custom middleware that checks `If-None-Match` and returns 304 when the resource hasn't changed.

### Refactoring Strategy
1. Add middleware that checks `If-None-Match` against current ETag
2. Return 304 with empty body when ETag matches
3. Ensure HEAD requests also honor conditional logic
4. Test that conditional GET returns 304 for unchanged resources and 200 for changed

### Detection Checklist
- [ ] ETag is present in GET responses
- [ ] `If-None-Match` header is never read or checked
- [ ] All GET requests return 200, never 304
- [ ] `SetCacheHeaders` middleware is misconfigured or incomplete
- [ ] Client code sends conditional headers but receives full responses

### Related Rules/Skills/Trees
- Rule: API-CACHE-002 (Conditional Response Handling)
- Skill: response-caching-headers
- Tree: caching-strategy
