# Anti-Patterns: Idempotency Key Design

## AP-1: Race Condition in Idempotency Check (Non-Atomic Check-Then-Set)
**Category**: Reliability

**Description**: Implementing idempotency key check and storage as separate operations (check then set) instead of an atomic operation. Two concurrent requests with the same key both pass the check before either sets the key, resulting in duplicate processing.

**Warning Signs**:
- Idempotency code uses `if (!exists) { set() }` pattern
- Duplicate operations reported under high concurrency
- Same idempotency key results in multiple side effects
- Production incidents involve "exactly once" violations
- Concurrency testing reveals duplicate processing

**Harms**:
- Double charges, duplicate orders, or duplicate records
- Financial reconciliation issues
- Data integrity violations
- Consumer trust erosion when retries cause duplicates

**Real-World Consequence**: A payment API with non-atomic idempotency receives two simultaneous POST requests with the same idempotency key (network retry). Both requests pass the `if (!$redis->exists($key))` check before either calls `$redis->set($key)`. Both process the payment. The consumer is charged twice for a single order.

**Preferred Alternative**: Use Redis `SET key value NX EX ttl` (or equivalent atomic create-with-expiry) which guarantees only one request successfully creates the key. The second request receives the stored response.

**Refactoring Strategy**: Replace `exists()` + `set()` with a single `set()` using `NX` flag, add distributed lock for the key during processing, test with concurrent requests of the same key to verify exactly-once behavior.

**Detection Checklist**:
- `[ ]` Is idempotency check-and-set an atomic operation?
- `[ ]` Are Redis `NX` or `SETNX` flags used?
- `[ ]` Do concurrent requests with the same key produce duplicates?
- `[ ]` Is there a distributed lock during key processing?

**Related**: 05-rules.md (Rule 3: Use Redis SET NX EX for Atomic Lock), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: Idempotency on Read Operations Only
**Category**: Reliability

**Description**: Implementing idempotency keys only on GET endpoints (which are already idempotent by HTTP spec) while leaving POST, PATCH, PUT, and DELETE endpoints unprotected against duplicate processing.

**Warning Signs**:
- Idempotency middleware is applied to GET routes only
- POST endpoints have no idempotency key requirement
- "Why do we need idempotency on POST?" discussions arise
- Production incidents involve duplicate resource creation
- Documentation shows idempotency only for read endpoints

**Harms**:
- Mutating endpoints have no retry safety
- Network timeouts cause duplicate orders, payments, or records
- Financial reconciliation issues
- Consumer must implement their own deduplication

**Real-World Consequence**: A team implements idempotency middleware on all routes but only checks the header on GET requests (which are already idempotent). A POST /orders endpoint with no idempotency receives a network timeout. The consumer retries, creating two orders. The team spends a week reconciling the duplicate.

**Preferred Alternative**: Require `Idempotency-Key` header on all mutating endpoints (POST, PUT, PATCH, DELETE). Return 422 when missing. GET and HEAD are idempotent by HTTP spec and do not require it.

**Refactoring Strategy**: Update middleware to apply idempotency enforcement to POST/PUT/PATCH/DELETE routes, add 422 response for missing header on mutating endpoints, create route group for mutating endpoints with idempotency middleware applied.

**Detection Checklist**:
- `[ ]` Are idempotency keys required on POST/PUT/PATCH/DELETE?
- `[ ]` Do mutating endpoints return 422 when header is missing?
- `[ ]` Is idempotency middleware applied to the correct route group?
- `[ ]` Can network retries cause duplicate side effects?

**Related**: 05-rules.md (Rule 1: Require Idempotency-Key Header for All Mutating Endpoints), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Inconsistent Replay Response
**Category**: Design

**Description**: Returning a different response on idempotency replay than the original request (e.g., returning 200 instead of 201, or returning different data). Consumers relying on consistent responses break when replays produce different results.

**Warning Signs**:
- Original request returns 201 Created but replay returns 200 OK
- Response body differs between first request and replay
- Timestamps in replay response show replay time, not original time
- Consumer code breaks when idempotency replays occur
- Support tickets about "changing API responses"

**Harms**:
- Consumer retry logic breaks (expecting 201, gets 200)
- Consumers cannot distinguish first-time operations from replays
- Debugging complexity increases
- Integration tests fail nondeterministically

**Real-World Consequence**: A payment API stores only success/failure status for idempotency. First request returns `201 { "id": "order_123", "status": "paid" }`. Replay with the same key returns `200 { "success": true }`. The consumer's callback handler expects the order ID and crashes on null reference.

**Preferred Alternative**: Store the full response (status code, headers, body) in the idempotency store and return the exact same response on replay. Include `Idempotency-Key-Status: replay` header to indicate it's a replay.

**Refactoring Strategy**: Store complete response serialization including status code, headers, and body. On replay, deserialize and return the exact same response. Add `Idempotency-Key-Status` header distinction between `new` and `replay`.

**Detection Checklist**:
- `[ ]` Does replay return the exact same status code as original?
- `[ ]` Does replay return the exact same body as original?
- `[ ]` Is the full response (not just success/failure) stored?
- `[ ]` Is there a header indicating replay vs first-time?

**Related**: 05-rules.md (Rule 2: Store Full Response for Exact Replay, Rule 5: Include Idempotency-Key-Status Header), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Consumer Key Prefixing (Collision Risk)
**Category**: Security

**Description**: Storing idempotency keys without consumer-scoping the key. Two different consumers who happen to generate the same UUID will experience collisions where one consumer's request is blocked because the other consumer used the same key.

**Warning Signs**:
- Idempotency keys stored as raw UUID without consumer prefix
- Cross-consumer "duplicate key" errors reported
- Consumer A's requests rejected because Consumer B used the same key
- Idempotency key collisions are possible with random UUID generation
- No consumer identification in idempotency store lookup

**Harms**:
- False replay detection (Consumer A's valid request rejected)
- Data leakage (Consumer A gets Consumer B's cached response)
- Cross-consumer interference
- Consumer frustration with idempotency "bugs"

**Real-World Consequence**: Two different consumers both generate UUID `550e8400-e29b-41d4-a716-446655440000` for unrelated operations. Consumer A's order creation succeeds and stores the key. Consumer B's request arrives 5 minutes later with the same key and receives Consumer A's order response. Consumer B believes their order was created but it wasn't.

**Preferred Alternative**: Prefix idempotency keys with consumer identifier: `idempotency:{consumer_id}:{key}`. Always scope key storage and lookup to the authenticated consumer.

**Refactoring Strategy**: Add consumer ID prefix to key construction in middleware, update all idempotency store lookups to use scoped key, verify that replay detection scopes to the correct consumer, add test for cross-consumer collision scenarios.

**Detection Checklist**:
- `[ ]` Are idempotency keys prefixed with consumer ID?
- `[ ]` Can two different consumers use the same UUID without collision?
- `[ ]` Is key lookup scoped to the authenticated consumer?
- `[ ]` Are there reported "idempotency collision" incidents?

**Related**: 05-rules.md (Rule 4: Prefix Keys with Consumer ID), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Redis as Critical Path (No Circuit Breaker)
**Category**: Reliability

**Description**: Making idempotency enforcement a critical path dependency — if Redis is unavailable, all mutating endpoints fail. A Redis outage causes a complete API outage for write operations, even though idempotency is a safety guarantee, not a functional requirement.

**Warning Signs**:
- Redis failure causes 500 errors on all POST/PUT/PATCH/DELETE endpoints
- No fallback behavior when idempotency store is unavailable
- Idempotency store exception is not caught gracefully
- PagerDuty alerts for Redis also block all API mutations
- No monitoring distinguishing idempotency store health from API health

**Harms**:
- Complete outage for all write operations during Redis incidents
- Cascading failures (Redis down → API down → consumers retry → more load)
- Violation of availability SLA due to non-critical dependency
- Emergency workarounds require deployment changes

**Real-World Consequence**: Redis cluster experiences a brief network partition. All mutating API endpoints return 500 errors because the idempotency middleware throws an exception when it cannot connect to Redis. A 30-second Redis blip causes a 15-minute API outage as the team investigates. No write operations were processed during the entire period.

**Preferred Alternative**: Implement a circuit breaker that falls back to "process without idempotency guarantee" when the idempotency store is unavailable. Log a warning but allow mutations to proceed.

**Refactoring Strategy**: Wrap idempotency store operations in try/catch, implement health check with fallback, add circuit breaker pattern with automatic recovery, log warnings when operating without idempotency, alert on degraded mode (not total failure).

**Detection Checklist**:
- `[ ]` Does Redis failure block all mutating endpoints?
- `[ ]` Is there a fallback mode when idempotency store is unavailable?
- `[ ]` Are idempotency store exceptions caught gracefully?
- `[ ]` Is there monitoring distinguishing idempotency health from API health?

**Related**: 05-rules.md (Rule 6: Implement Circuit Breaker for Redis Unavailability), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: In-Memory Only Idempotency Storage
**Category**: Reliability

**Description**: Storing idempotency keys and cached responses in local memory (array, in-memory cache) without persistence. Server restart or deployment loses all keys, causing duplicate processing for retried requests sent after restart.

**Warning Signs**:
- Idempotency keys stored in `$_SESSION`, local arrays, or in-memory cache
- Server restart/reset causes duplicate processing
- Deployments during business hours cause idempotency loss
- No Redis, database, or persistent store for idempotency
- Retried requests after restart are processed as new

**Harms**:
- Duplicate processing after any server restart or deployment
- Cannot guarantee exactly-once semantics across restarts
- Zero-downtime deployments are impossible (idempotency lost on each pod rotation)
- Production incidents after every deployment

**Real-World Consequence**: A Laravel app stores idempotency keys in the local file cache (file driver). During a deployment with rolling restarts, each new pod starts with an empty cache. A consumer retrying a payment request from 5 minutes ago gets processed as a new request because the key was in the old pod's cache. Duplicate charge occurs.

**Preferred Alternative**: Use Redis (or another shared persistent store) with RDB/AOF persistence for idempotency key storage. Ensure TTL-based cleanup handles storage growth.

**Refactoring Strategy**: Replace in-memory/file cache store with Redis, configure RDB snapshots (every 5 minutes) or AOF persistence, verify key survival across server restarts, set appropriate TTL (24 hours default) for automatic cleanup.

**Detection Checklist**:
- `[ ]` Is idempotency storage in a shared persistent store (Redis/DB)?
- `[ ]` Do keys survive server restarts and deployments?
- `[ ]` Is the storage backend configured with persistence?
- `[ ]` Are duplicate processing incidents correlated with deployments?

**Related**: 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
