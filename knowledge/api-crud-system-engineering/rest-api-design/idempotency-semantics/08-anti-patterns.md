# Idempotency Semantics: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | idempotency-semantics |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Idempotency on GET** — Implementing idempotency keys for GET endpoints that are already idempotent by definition
2. **Server-Generated Keys Only** — Deriving idempotency keys from request body hash instead of client-generated UUIDs
3. **Idempotency Without Expiry** — Storing idempotency keys indefinitely with no TTL
4. **Per-Controller Idempotency** — Each controller implementing idempotency checks independently
5. **Accepting Key but Ignoring It** — Accepting `Idempotency-Key` header but not actually checking for duplicates

## Repository-Wide Anti-Patterns

- Not caching error responses for idempotency key reuse (only caching 2xx responses)
- Missing atomic cache operations (`Cache::add()`), leading to race conditions on first request
- Confusing safe and idempotent — treating all safe methods as always safe in implementation
- Implementing idempotency keys for low-risk endpoints where cost exceeds benefit

---

## 1. Idempotency on GET

### Category
Redundant Implementation

### Description
Implementing idempotency key support for GET endpoints. GET is already idempotent and safe by HTTP definition — there is no need for additional idempotency mechanisms.

### Why It Happens
Blanket middleware that applies to all methods without excluding GET. Or misunderstanding that idempotency is an HTTP-level guarantee, not something that needs application-level implementation for safe methods.

### Warning Signs
- Idempotency middleware or logic applied to GET routes
- `Idempotency-Key` header accepted on GET requests
- Cache storage consumed by idempotency keys for GET requests
- GET endpoints processing idempotency key validation

### Why Harmful
Unnecessary cache storage consumption — every GET request generates an idempotency key entry that is never needed. Additional processing overhead for header parsing and cache lookups on every GET request.

### Real-World Consequences
An API handles 10,000 GET requests/second. Idempotency middleware runs on every request, performing a Redis lookup for each one. 10,000 unnecessary cache lookups per second add 50ms latency and significant Redis load.

### Preferred Alternative
Apply idempotency middleware only to POST and PATCH endpoints. GET, PUT, DELETE, HEAD, and OPTIONS are already idempotent by HTTP definition.

### Refactoring Strategy
1. Update middleware to skip GET, PUT, DELETE, HEAD, OPTIONS methods
2. Remove idempotency key handling from GET controllers
3. Reduce Redis storage consumption by removing unnecessary key entries
4. Add test verifying GET endpoints don't require idempotency keys

### Detection Checklist
- [ ] Idempotency middleware processes GET requests
- [ ] GET controllers check for `Idempotency-Key` header
- [ ] Redis contains idempotency keys from GET requests
- [ ] GET request latency includes idempotency check

### Related Rules/Skills/Trees
- Rule: API-IDEMP-001 (Method-Appropriate Idempotency)
- Skill: http-method-semantics
- Tree: http-semantics

---

## 2. Server-Generated Keys Only

### Category
Design Flaw

### Description
Deriving idempotency keys from the request body hash rather than accepting a client-generated UUID via the `Idempotency-Key` header. The server computes `md5($request->getContent())` and uses that as the key.

### Why It Happens
Eliminating the "client responsibility" — the server handles everything, and clients don't need to generate UUIDs. The developer assumes identical bodies mean identical intents.

### Warning Signs
- No `Idempotency-Key` header handling in middleware
- Idempotency key derived from `md5(request body)`
- Same request body always produces same key regardless of context
- Server generates keys without client input

### Why Harmful
Body-hash keys produce false positives — the same request body sent for different intents (e.g., two separate orders with the same items) is incorrectly treated as a duplicate. Clients cannot control idempotency boundaries.

### Real-World Consequences
A user places two orders: one for "Widget A" and another for "Widget A" with the same address. Both have identical request bodies. The server treats the second as a duplicate and returns the cached response for the first order. The second order is never created.

### Preferred Alternative
Accept a client-generated `Idempotency-Key` header (UUID). Let the client control which requests are idempotent and define the idempotency scope.

### Refactoring Strategy
1. Replace body-hash key generation with client-supplied `Idempotency-Key` header
2. Implement middleware to read and validate the header
3. Store keys in Redis with TTL
4. Return 400 if key format is invalid (not a UUID)
5. Return 409 if same key used with different request body

### Detection Checklist
- [ ] No `Idempotency-Key` header accepted
- [ ] Keys derived from request body hash
- [ ] Same body always returns same cached response
- [ ] Clients cannot control idempotency boundaries
- [ ] False duplicate detection occurs for identical bodies

### Related Rules/Skills/Trees
- Rule: API-IDEMP-002 (Client-Generated Keys)
- Skill: idempotency-semantics
- Tree: api-reliability

---

## 3. Idempotency Without Expiry

### Category
Storage Management Failure

### Description
Storing idempotency keys indefinitely with no TTL or expiry mechanism. The storage grows unbounded as every idempotency-protected request adds a permanent entry.

### Why It Happens
"We need them for audit" — the fear of deleting keys that might be needed later. Or the assumption that storage is cheap and unbounded.

### Warning Signs
- Idempotency key storage has infinite TTL
- Storage size grows continuously with request volume
- No cleanup or archiving mechanism exists
- Redis memory fills up due to idempotency keys
- Key lookup performance degrades as storage grows

### Why Harmful
Unbounded storage growth — at 1000 requests/second, a simple key-value store grows by 86M entries/day. Redis memory fills up, database tables bloat, and lookup performance degrades. The cost of storage and maintenance grows linearly with request volume.

### Real-World Consequences
An API processes 5000 idempotency-protected requests/second. After three months, Redis has 38 billion key entries consuming 200GB of memory. Redis performance degrades, and the ops team is paged weekly for OOM errors.

### Preferred Alternative
Set TTL on idempotency keys to match the maximum retry window (24 hours is standard). Archive keys to a database for audit purposes after TTL expiry.

### Refactoring Strategy
1. Add TTL to all new idempotency key storage (24 hours default)
2. Implement cleanup job for existing keys without TTL
3. Archive expired keys to the database for audit trail
4. Monitor storage size and set alerts for unexpected growth
5. Document TTL policy in API documentation

### Detection Checklist
- [ ] Idempotency keys stored without TTL
- [ ] Storage size grows unbounded
- [ ] No cleanup or archiving process exists
- [ ] Redis/database memory usage increasing
- [ ] Key lookup performance degrading

### Related Rules/Skills/Trees
- Rule: API-IDEMP-003 (Idempotency Key Expiry)
- Skill: idempotency-key-ttl-expiration
- Tree: storage-management

---

## 4. Per-Controller Idempotency

### Category
Code Duplication

### Description
Each controller implements idempotency checking independently — duplicate cache lookup code, duplicate key validation, and duplicate response caching logic across multiple controllers.

### Why It Happens
Idempotency is added incrementally to individual endpoints as needed. The first controller implements it, then another controller copies the code.

### Warning Signs
- Same idempotency check code appears in multiple controllers
- Inconsistent idempotency behavior across endpoints
- Some endpoints check keys, others don't
- Bug fixes applied to one controller but not others
- No shared middleware for idempotency

### Why Harmful
Code duplication increases maintenance burden. A bug fix or improvement must be applied to every controller individually. Inconsistent behavior confuses clients — some endpoints accept keys, others ignore them.

### Real-World Consequences
A race condition bug in the idempotency check is found in one controller. The developer fixes it, but six other controllers have the same bug. Over the next month, each causes a duplicate order before the identical fix is applied.

### Preferred Alternative
Implement idempotency as middleware. It's cross-cutting — applies consistently to all endpoints without controller modification.

### Refactoring Strategy
1. Create idempotency middleware
2. Remove duplicate idempotency logic from all controllers
3. Apply middleware to route groups or specific endpoints
4. Add test for middleware behavior independent of controllers
5. Verify consistent behavior across all idempotency-protected endpoints

### Detection Checklist
- [ ] Idempotency code duplicated across controllers
- [ ] No shared middleware for idempotency
- [ ] Inconsistent idempotency behavior
- [ ] Some endpoints support keys, others don't without reason
- [ ] Bug fixes need application to multiple files

### Related Rules/Skills/Trees
- Rule: API-IDEMP-004 (Middleware-Based Idempotency)
- Skill: idempotency-key-design
- Tree: code-organization

---

## 5. Accepting Key but Ignoring It

### Category
Broken Contract

### Description
The API accepts the `Idempotency-Key` header in the request but does not actually check for duplicates or cache responses. Every request is processed fully regardless of whether a key was already used.

### Why It Happens
The header is documented as supported in the OpenAPI spec, but the implementation is incomplete. Or idempotency was partially implemented (key stored but never checked before processing).

### Warning Signs
- `Idempotency-Key` header is documented but not enforced
- Duplicate requests with the same key create duplicate resources
- No cache lookup happens before request processing
- Idempotency tests pass but don't actually verify duplicate prevention
- Middleware is registered but does nothing

### Why Harmful
Clients implement retry logic using the documented `Idempotency-Key` header, believing they have exactly-once guarantees. In reality, every retry creates a new resource, causing duplicates, double charges, and data corruption.

### Real-World Consequences
A payment integration sends a charge request with an `Idempotency-Key`. The server accepts the header but processes the request as usual. A network timeout causes the client to retry with the same key. The second request is also processed fully. The customer is charged twice.

### Preferred Alternative
Implement full idempotency: check for existing key before processing, cache response after processing, and return cached response for duplicate keys.

### Refactoring Strategy
1. Add cache lookup before request processing
2. Cache response (including errors) after processing
3. Handle race conditions with `Cache::add()` for atomicity
4. Test scenario: same key, two requests, only first processes
5. Remove the header from documentation until fully implemented

### Detection Checklist
- [ ] Duplicate requests with same key create duplicates
- [ ] No cache lookup before request processing
- [ ] Header documented but not enforced
- [ ] Idempotency tests don't cover duplicate prevention
- [ ] Middleware registered but ineffective

### Related Rules/Skills/Trees
- Rule: API-IDEMP-005 (Idempotency Enforcement)
- Skill: idempotency-key-design
- Tree: api-reliability
