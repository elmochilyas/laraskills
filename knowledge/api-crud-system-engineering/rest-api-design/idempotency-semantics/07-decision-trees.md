# Idempotency Semantics — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: idempotency-semantics
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which endpoints need idempotency key support | POST/PATCH endpoint design |
| D2 | How to implement idempotency key checking | Idempotency middleware design |
| D3 | How to handle race conditions on first request | Concurrent request scenarios |
| D4 | What TTL to set for idempotency keys | Key storage configuration |
| D5 | How to handle key collision with different body | Security and integrity scenarios |
| D6 | Whether to accept idempotency keys for all methods | Middleware implementation |

## Architecture-Level Decision Trees

### D1: Which endpoints need idempotency key support

**Decision Context:**
Not all POST endpoints need idempotency. The decision depends on the cost of duplicate execution versus the cost of implementing idempotency support.

**Criteria:**
- Does the endpoint create a billable or identity-impacting resource?
- What is the cost of a duplicate (financial, data integrity)?
- Is network retry likely (unreliable client infrastructure)?
- Does the database already prevent duplicates via unique constraints?

**Decision Tree:**

```
Is the endpoint a GET, PUT, HEAD, OPTIONS, or DELETE?
├── YES → Already idempotent by HTTP definition — no key needed
├── NO → POST or PATCH
│
│   Does the endpoint create billable resources (payments, orders, invoices)?
│   ├── YES → Implement idempotency key — duplicate charge is unacceptable
│   └── NO
│
│       Does the endpoint create identity-impacting resources (accounts, registrations)?
│       ├── YES → Implement idempotency key — duplicate account is a data integrity issue
│       └── NO
│
│           Is duplicate execution harmful or just wasteful?
│           ├── Harmful (duplicate notifications, duplicate locks) → Implement idempotency key
│           └── Harmless (append-only logs, analytics) → Idempotency optional
│
│           Does a database unique constraint already prevent duplicates?
│           ├── YES → Database-level idempotency may suffice (use unique key column)
│           └── NO → Consider middleware-based idempotency
```

**Rationale:**
Network failures cause clients to retry. Without idempotency, a retry creates duplicate orders, payments, or accounts. The cost of idempotency middleware is far less than handling duplicate charges.

**Default Decision:**
Implement `Idempotency-Key` for all POST endpoints that create billable or identity-impacting resources. Skip for safe methods (already idempotent) and harmless endpoints.

**Risks:**
- Missing idempotency on critical endpoints leads to duplicate financial transactions
- Implementing idempotency on every endpoint adds unnecessary complexity
- Database unique constraints alone don't prevent all duplicate scenarios

**Related Rules:**
- Implement Idempotency Keys For Critical POST Endpoints
- Accept Idempotency-Key Only On POST And PATCH

**Related Skills:**
- HTTP Method Semantics
- HTTP Status Code Selection

---

### D2: How to implement idempotency key checking

**Decision Context:**
Idempotency checking should be consistent across endpoints. Per-controller implementation leads to inconsistency and duplication.

**Criteria:**
- Does the endpoint accept POST or PATCH?
- Is there an `Idempotency-Key` header present?
- Does a cached response exist for this key?
- Should the response be cached for future retries?

**Decision Tree:**

```
Is the endpoint POST or PATCH?
├── NO → Skip idempotency processing (already idempotent)
└── YES
    ├── Does the request include Idempotency-Key header?
    │   ├── NO → Process normally (no idempotency guarantee)
    │   └── YES
    │       ├── Is the client authenticated?
    │       │   ├── NO → Skip idempotency (security — prevent pre-seeding)
    │       │   └── YES → Proceed with check
    │       │
    │       ├── Does a cached response exist for this key?
    │       │   ├── YES → Return cached response (status, body, headers)
    │       │   └── NO → Continue processing
    │       │
    │       └── After processing:
    │           ├── Status < 500 (not server error)?
    │           │   ├── YES → Cache response with TTL
    │           │   └── NO → Don't cache (client can retry)
    │           └── Return response
    │
    └── Implementation: Middleware — cross-cutting, not per-controller
```

**Rationale:**
Idempotency is a cross-cutting concern that applies uniformly across endpoints. Middleware ensures consistent behavior, single configuration, and easy auditing.

**Default Decision:**
Implement idempotency as middleware, applied to route groups.

**Risks:**
- Middleware must run after authentication to prevent key pre-seeding
- Error responses (4xx) should be cached; server errors (5xx) should not
- Key collision with different body must return 409

**Related Rules:**
- Implement Idempotency As Middleware
- Cache All Responses Including Errors
- Return 409 For Key Collision With Different Request Body

**Related Skills:**
- Middleware Design
- Caching Strategies

---

### D3: How to handle race conditions on first request

**Decision Context:**
Two identical requests arriving simultaneously both check the cache, find nothing, and both proceed. Without atomic operations, both create the resource.

**Criteria:**
- Is the cache backend atomic (Redis, Memcached)?
- Can the database enforce uniqueness instead?
- What is the throughput of duplicate requests?

**Decision Tree:**

```
Does the cache backend support atomic operations (Cache::add, Cache::lock)?
├── YES
│   ├── Use Cache::add() — atomic set-if-not-exists
│   │   ├── Returns true → first request, proceed
│   │   └── Returns false → duplicate, return cached or queued
│   └── OR use Cache::lock() — mutex-based synchronization
│       ├── Acquires lock → first request, proceed
│       └── Fails to acquire → 409 Conflict or wait
│
└── NO (file cache, database cache without atomic support)
    ├── Does the database table have a unique constraint on idempotency_key?
    │   ├── YES → Let DB handle the race condition (insert → catch unique violation)
    │   └── NO → Risk of duplicate — upgrade cache backend or add unique constraint
    └── Outcome: Prefer Redis/Memcached for atomic support
```

**Rationale:**
A non-atomic check-then-set pattern lets two simultaneous requests both pass the check and both create the resource. `Cache::add()` atomically ensures only one request can register the key first.

**Default Decision:**
Use `Cache::add()` or `Cache::lock()` for atomic idempotency key checks.

**Risks:**
- `Cache::lock()` requires lock cleanup in finally block
- Without atomic support, race condition duplicates are timing-dependent — hard to detect and reproduce
- Database unique constraints handle races but not network-level duplicate prevention

**Related Rules:**
- Use Atomic Cache Operations To Prevent Race Conditions

**Related Skills:**
- Caching Architecture
- Concurrent Request Handling

---

### D4: What TTL to set for idempotency keys

**Decision Context:**
Idempotency keys must persist long enough to cover the maximum retry window but not so long that storage grows unbounded.

**Criteria:**
- What is the client's maximum expected retry window (including exponential backoff)?
- What is the storage cost of retaining keys for this duration?
- What is the industry standard for similar operations?

**Decision Tree:**

```
What is the maximum expected retry window for clients?
├── Minutes (real-time payments, immediate processing)
│   ├── TTL: 1 hour — covers retry with exponential backoff
│   └── Risk: Clients with long backoff may exceed TTL
│
├── Hours (standard API consumers)
│   ├── TTL: 24 hours — industry standard (Stripe)
│   └── Covers nearly all retry scenarios
│
└── Days (offline processing, batch operations)
    ├── TTL: 7 days — for special cases with delayed retry
    └── Risk: Larger storage footprint
```

**Rationale:**
24 hours is the industry standard (used by Stripe). Too-short TTL: clients with slow retry may exceed it and re-process. Too-long TTL: storage grows unbounded and clients cannot retry with new keys.

**Default Decision:**
24-hour TTL for idempotency keys.

**Risks:**
- TTL expired keys may cause duplicate processing on very delayed retries
- Long TTLs accumulate storage for high-traffic endpoints
- Audit requirements may need permanent key storage (archive to DB after TTL)

**Related Rules:**
- Set TTL Based On Maximum Retry Window

**Related Skills:**
- Caching Architecture
- Data Retention Policies

---

### D5: How to handle key collision with different body

**Decision Context:**
The same idempotency key used with a different request body indicates a client bug or a replay attack. The server must detect and reject this.

**Criteria:**
- Does the request body differ from the original request for this key?
- Is the difference intentional (retry with corrected data)?
- Is it an attack (replay with modified payload)?

**Decision Tree:**

```
Does a cached response exist for this idempotency key?
├── NO → First request, proceed
└── YES
    ├── Does the current request body match the cached body hash?
    │   ├── YES → Return cached response (safe retry)
    │   └── NO → Body differs
    │       ├── Return 409 Conflict — "key reused with different body"
    │       ├── Log collision (key, user, path, timestamp)
    │       └── Monitor collision rate — spikes indicate bugs or attacks
    │
    └── Key collision may indicate:
        ├── Client bug: same key generated for different requests
        ├── Client misconfiguration: not generating unique keys
        └── Replay attack: captured key reused with modified payload
```

**Rationale:**
An idempotency key uniquely binds to a specific request. Reusing the same key with different data indicates a bug or attack. 409 forces the client to recognize the misuse and generate a new key.

**Default Decision:**
Return 409 Conflict when same key used with different request body. Log all collisions.

**Risks:**
- Client bugs go undetected if collisions are silently ignored
- 409 without clear error message confuses client developers
- Collision rate spikes may indicate automated attacks

**Related Rules:**
- Return 409 For Key Collision With Different Request Body
- Monitor Idempotency Key Collision Rate

**Related Skills:**
- Security Monitoring
- Error Response Design

---

### D6: Whether to accept idempotency keys for all methods

**Decision Context:**
Some methods (GET, PUT, DELETE) are already idempotent by HTTP definition. Accepting idempotency keys on these methods implies they are not, confusing clients.

**Criteria:**
- Is the method inherently idempotent per HTTP spec?
- Does the method need additional idempotency guarantees beyond HTTP?
- Would accepting the key on safe methods confuse clients?

**Decision Tree:**

```
Is the HTTP method inherently idempotent?
├── YES (GET, HEAD, PUT, DELETE, OPTIONS)
│   └── Do not accept or process Idempotency-Key header
│       Reason: Method is already idempotent per HTTP definition
│       Exception: PUT that is used for non-idempotent operations (fix this instead)
│
└── NO (POST, PATCH)
    └── Accept and process Idempotency-Key header
        POST: Not idempotent — key provides exactly-once semantics
        PATCH: Conditionally idempotent — key provides safety guarantee
```

**Rationale:**
Accepting idempotency keys on already-idempotent methods confuses clients about HTTP semantics. PUT and DELETE are guaranteed idempotent — no additional mechanism is needed.

**Default Decision:**
Restrict `Idempotency-Key` header acceptance to POST and PATCH endpoints only.

**Risks:**
- Custom PUT implementations that are not truly idempotent (bad practice — fix the implementation, not the header)
- Some clients may send headers on all requests — middleware must silently skip non-POST/PATCH

**Related Rules:**
- Accept Idempotency-Key Only On POST And PATCH
- Never Accept Idempotency Keys From Unauthenticated Requests

**Related Skills:**
- HTTP Method Semantics
- Security Patterns
