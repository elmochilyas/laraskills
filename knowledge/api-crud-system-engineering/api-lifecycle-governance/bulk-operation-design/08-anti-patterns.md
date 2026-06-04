# Anti-Patterns: Bulk Operation Design

## AP-1: Atomic Transaction for Entire Batch
**Category**: Reliability

**Description**: Wrapping all operations in a single database transaction. One invalid operation causes the entire batch to fail, wasting all other operations and defeating the primary benefit of bulk endpoints — partial success.

**Warning Signs**:
- All operations commit together or roll back together
- A single validation error returns 422 for the entire batch
- Consumer must retry all operations (including valid ones) after a partial failure
- Batch processing time grows with each failed operation (rollback overhead)

**Harms**:
- One bad item blocks 499 good ones
- Consumers retry entire batch unnecessarily
- Throughput collapses for batches with frequent validation errors
- Bulk endpoint provides no benefit over individual requests

**Real-World Consequence**: A bulk user creation endpoint wraps all 500 operations in a single transaction. Consumer sends 500 users where one has an invalid email format. All 500 users are rejected. Consumer retries the full batch 3 times with the same error before debugging the single invalid email.

**Preferred Alternative**: Process each operation in its own transaction. One failure returns an error for that operation only, while other operations succeed. Return per-operation status in the response.

**Refactoring Strategy**: Replace the single `DB::transaction()` wrapper with per-operation try/catch blocks with individual `DB::beginTransaction()`/`DB::commit()`/`DB::rollBack()` for each operation.

**Detection Checklist**:
- `[ ]` Are operations wrapped in a single atomic transaction?
- `[ ]` Does one validation failure block all other operations?
- `[ ]` Can consumers retry only failed operations?
- `[ ]` Is partial success clearly indicated in the response?

**Related**: 05-rules.md (Rule 3: Use Per-Operation Transactions), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-2: No Correlation Identifiers in Response
**Category**: Design

**Description**: Returning bulk operation results without per-operation correlation identifiers or request-order preservation, making it impossible for consumers to determine which operations succeeded or failed.

**Warning Signs**:
- Bulk response contains array of results with no request_id or correlation_id
- Response order does not match request order
- Consumer must guess which result corresponds to which operation
- Support tickets about "which operation failed" ambiguity

**Harms**:
- Consumer cannot determine which operations succeeded/failed
- Support burden when consumers struggle to map results
- Retry logic is impossible (which operations to retry?)
- Consumer blames API for "unclear errors"

**Real-World Consequence**: POST /users/bulk returns `[{ "status": 201 }, { "status": 422, "errors": {"email":["Invalid"]} }]` with no correlation IDs. The consumer sent 500 operations and cannot tell which specific email was invalid. They must scan all 500 operations to find the one with the invalid email.

**Preferred Alternative**: Require per-operation correlation identifiers (`request_id` or `correlation_id`) in requests and echo them back in responses. Always preserve request order in response.

**Refactoring Strategy**: Add `request_id` field requirement to bulk request schema, update response to include `request_id` from request, implement order-preserving response construction, add documentation examples showing correlation mapping.

**Detection Checklist**:
- `[ ]` Does each operation in the request have a unique identifier?
- `[ ]` Are identifiers echoed back in the response?
- `[ ]` Does response order match request order?
- `[ ]` Can a consumer unambiguously map results to requests?

**Related**: 05-rules.md (Rule 6: Provide Per-Operation Correlation Identifiers, Rule 1: Preserve Request Order in Response), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Unbounded Batch Sizes
**Category**: Scalability

**Description**: Allowing consumers to send unlimited operations per bulk request. Large batches cause memory exhaustion, request timeouts, and DoS vectors as attackers exploit the endpoint to overwhelm server resources.

**Warning Signs**:
- No batch size validation at middleware or controller level
- Memory usage spikes proportionally to batch size
- Bulk requests with thousands of operations cause production incidents
- No documented maximum batch size
- Different consumers send wildly different batch sizes

**Harms**:
- Memory exhaustion on server (OOM kills)
- HTTP 504 timeouts for large batches
- DoS vulnerability — attacker sends 100K operations
- Unfair resource consumption across consumers
- Database connection pool exhaustion

**Real-World Consequence**: A bulk endpoint with no size limit receives 50,000 operations in a single request. The server attempts to load all 50,000 into memory, hits the PHP memory limit (256MB), and crashes. All concurrent requests to the same server are also lost.

**Preferred Alternative**: Enforce a maximum of 500 operations per bulk request at middleware or gateway level. Return 413 Payload Too Large when exceeded. Document limits in API reference.

**Refactoring Strategy**: Add size validation in middleware before controller processing, return structured error with limit information, add monitoring for batch size distribution, implement consumer-tier based limits (500 standard, 2000 enterprise with approval).

**Detection Checklist**:
- `[ ]` Is there a batch size limit enforcement at middleware level?
- `[ ]` Is the limit documented in API reference?
- `[ ]` Does the server handle 500+ operations within timeout?
- `[ ]` Are batch sizes monitored for abuse patterns?

**Related**: 05-rules.md (Rule 2: Limit Batch Size to 500 Operations), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: Batch-Level Validation Only
**Category**: Security

**Description**: Validating only the batch envelope (structure, format) without validating each individual operation. A malicious operation can pass through unchecked within an otherwise valid bulk request.

**Warning Signs**:
- Validation logic checks only the outer request structure
- Individual operations within the batch are not validated
- Authorization check is performed once at batch level, not per operation
- One malicious operation can compromise data for the entire batch

**Harms**:
- Invalid data committed through valid batch envelope
- Privilege escalation — unauthorized operation passes batch-level auth
- Cross-tenant data access if authorization is not per-operation
- Compliance violations from unvalidated data

**Real-World Consequence**: A bulk user creation endpoint validates only `operations` is an array. A malicious actor sends an operation creating a user with elevated privileges. The batch-level check passes (array is valid), but per-operation validation would have caught the privilege escalation.

**Preferred Alternative**: Validate and authorize each operation independently within the bulk request. Each operation should pass the same validation and authorization checks as an individual request.

**Refactoring Strategy**: Move individual request validation logic into a reusable validator applied per operation in the bulk handler, add per-operation authorization checks, ensure error responses indicate which operation failed and why.

**Detection Checklist**:
- `[ ]` Is each operation individually validated?
- `[ ]` Is authorization checked per operation, not just batch-level?
- `[ ]` Can a malicious operation within a valid batch cause harm?
- `[ ]` Do validation errors include which operation failed?

**Related**: 05-rules.md (Rule 4: Validate Each Operation Independently), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Rate Limiting Per Operation Instead of Per Batch
**Category**: Scalability

**Description**: Counting each operation within a bulk request against the consumer's rate limit, making bulk endpoints useless for their primary purpose. Consumers revert to sending individual requests, increasing network overhead and server load.

**Warning Signs**:
- Rate limit counter is incremented per operation in bulk handler
- Consumers hit rate limits faster on bulk endpoints than individual endpoints
- Bulk endpoints provide no rate limit benefit over individual requests
- Consumers switch from bulk to individual requests to "avoid rate limits"

**Harms**:
- Primary benefit of bulk endpoints (reduced network overhead) is nullified
- Consumers abandon bulk endpoints, increasing total request volume
- Rate limit configuration becomes needlessly complex
- Consumer frustration with inconsistent rate limit behavior

**Real-World Consequence**: A bulk endpoint increments rate limit counter for each of 500 operations. Consumer's rate limit is 1000 requests/hour. One bulk request of 500 operations consumes 500 rate limit units. After 2 bulk requests, the consumer is rate limited and must wait to process valid operations.

**Preferred Alternative**: Count one bulk request as a single unit against the consumer's rate limit, regardless of how many operations it contains.

**Refactoring Strategy**: Move rate limit check before the operation processing loop, ensure rate limit middleware executes before batch processing begins, update rate limit documentation to clarify bulk endpoint behavior.

**Detection Checklist**:
- `[ ]` Is rate limit consumed once per bulk request (not per operation)?
- `[ ]` Do bulk requests provide rate limit benefit over individual requests?
- `[ ]` Is rate limit documentation clear about bulk endpoint behavior?
- `[ ]` Do consumers use bulk endpoints as intended?

**Related**: 05-rules.md (Rule 5: Count Bulk Requests as Single Rate Limit Unit), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Synchronous Processing of Huge Batches
**Category**: Performance

**Description**: Processing batches near the 500-limit synchronously within the HTTP request/response cycle without chunking or limiting concurrency. The server holds connections open, memory grows, and timeouts are frequent.

**Warning Signs**:
- Bulk requests with 500 operations take > 30 seconds
- HTTP timeouts occur on large batches
- Memory spikes correlate with bulk request processing
- Database connection pool is exhausted during bulk processing
- Other consumers experience latency during bulk operations

**Harms**:
- HTTP connection timeouts leave consumers uncertain about completion
- Memory exhaustion from holding all operations in memory
- Database connection pool starvation affects other consumers
- Poor consumer experience (long wait for response)

**Real-World Consequence**: A bulk endpoint processes 500 operations sequentially in a single HTTP request. At 200ms per operation (database write + validation), the total response time is 100 seconds. The load balancer terminates the connection at 30 seconds. The consumer retries, creating duplicate operations.

**Preferred Alternative**: Process large batches in internal chunks (50 per chunk) with configurable parallel concurrency (max 10 threads). Maintain response order matching request order.

**Refactoring Strategy**: Implement chunking (50 operations per chunk), limit parallel processing to 10 concurrent operations, add progress tracking for long-running batches, use queue processing for batches exceeding synchronous timeout threshold.

**Detection Checklist**:
- `[ ]` Does bulk processing use internal chunking?
- `[ ]` Is parallel processing limited to 10 concurrent operations?
- `[ ]` Do 500-operation batches complete within HTTP timeout limits?
- `[ ]` Is memory usage stable during large batch processing?

**Related**: 05-rules.md (Rule 7: Use Chunked Internal Processing for Large Batches), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
