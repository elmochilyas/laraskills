# Bulk Operation Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Bulk operation design covers the patterns, formats, and error handling strategies for batch endpoints that operate on multiple resources in a single request. Well-designed bulk operations reduce network overhead, improve throughput, and provide predictable partial-failure semantics compared to sequential individual requests.

## Core Concepts
- **Bulk Request Format:** A JSON body containing an array of operations, each with its own payload and optional identifier.
- **Bulk Response Format:** A JSON body containing an array of individual results, each with status, data, and optional errors.
- **Partial Failure:** Some operations succeed while others fail; the response must clearly indicate which is which.
- **Atomicity Level:** Whether the entire batch is all-or-nothing or allows partial completion.
- **Idempotency for Bulk:** A single idempotency key for the entire batch, or per-operation keys.
- **Batch Size Limits:** Maximum number of operations per request to prevent server overload.

## Mental Models
- **Assembly Line:** Each item on the conveyor belt (request array) goes through the same process independently. A defective item (failed operation) is flagged and removed without stopping the line.
- **Shopping Cart Checkout:** You can add, remove, or update multiple items in your cart before checking out once. Each item operation may succeed or fail independently.

## Internal Mechanics
1. **Request Validation:** Validate the batch envelope (size limit, format) before processing any operations.
2. **Operation Dispatching:** Each operation is dispatched to its handler — sequentially or in parallel depending on design.
3. **Result Collection:** Each handler returns a result object with status, data, and error fields.
4. **Partial Failure Assembly:** Results are assembled into a response array maintaining the same order as the request.
5. **Error Aggregation:** Duplicate or related errors are aggregated for cleaner responses.
6. **Transaction Management:** Each operation runs in its own transaction (non-atomic batch) or all in one transaction (atomic batch).

## Patterns
- **Bulk Endpoint Pattern:** `POST /resources/bulk` for mixed operations; `POST /resources/bulk-create` for single-operation batches.
- **Request Order Preservation:** Response order must match request order so consumers can correlate results.
- **Per-Operation Identifiers:** Each operation includes a `request_id` or `correlation_id` for unambiguous result mapping.
- **Operation-Level Errors:** Each result includes an `errors` array, not just a top-level success flag.
- **Chunked Processing:** Large batches are processed in chunks internally to manage memory and transaction log size.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Atomicity | Atomic / Per-operation / Configurable | Per-operation (non-atomic) | Maximizes throughput; one failed item should not block 99 successful ones |
| Concurrency | Sequential / Parallel / Configurable | Configurable (default parallel, max 10) | Parallel for speed; sequential option for ordered operations |
| Batch size limit | 100 / 500 / 1000 | 500 operations per request | Balances throughput with server memory |
| Response format | Array / Map / Stream | Array (index-correlated) | Simple, predictable, easy to parse |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Atomic vs per-operation | Atomic is safer for financial operations; per-operation maximizes success rate |
| Sequential vs parallel processing | Sequential is slower but predictable; parallel is faster but may hit rate limits |
| Synchronous vs async bulk | Sync is simpler for consumers; async allows much larger batches with status polling |

## Performance Considerations
- Parallel processing within a batch should be limited (10 goroutines/threads max) to avoid resource exhaustion.
- Large batches (500+ operations) should use chunked processing (50 per chunk internally).
- Memory usage grows linearly with batch size — monitor and enforce limits.
- Database connections per batch should be pooled; each operation should share the same connection pool.

## Production Considerations
- **Monitoring:** Track batch size distribution, processing time, and partial-failure rate.
- **Logging:** Log each batch as a single entry with summary counts (total, succeeded, failed).
- **Backup:** No special backup — bulk operations use the same data storage as single operations.
- **Rollback:** For non-atomic batches, rollback requires individual compensating operations.
- **Testing:** Test with every batch size from 1 to the limit; test partial failure scenarios extensively.

## Common Mistakes
- Using atomic transactions for non-related operations (one failure blocks all).
- Not preserving request order in the response (consumer cannot map results).
- Returning only a top-level error for partial failures ("Partially failed" without details).
- Setting batch size limits too high (memory exhaustion) or too low (defeats purpose).
- Not handling idempotency for the entire batch vs per-operation.

## Failure Modes
- **Timeout on Large Batches:** A 500-operation batch exceeds the request timeout. Mitigation: async processing for large batches; enforce reasonable timeouts.
- **Partial Failure Cascade:** One operation fails in a way that corrupts subsequent operations. Mitigation: proper transaction isolation per operation.
- **Memory Exhaustion:** Batch loads all 500 resources into memory simultaneously. Mitigation: streaming or chunked processing.
- **Consumer Confusion:** Consumer cannot parse the response format for partial failures. Mitigation: clear documentation and consistent error schema.

## Ecosystem Usage
- **Stripe:** Bulk operations via API lists with configurable batch sizes; clear partial-failure documentation.
- **Shopify:** Bulk mutations with status polling for large datasets.
- **AWS DynamoDB:** `BatchWriteItem` and `BatchGetItem` with per-item error reporting.

## Related Knowledge Units

### Prerequisites
- [Idempotency Key Design](ku-10-idempotency-key-design)
- [Request Size Limits](ku-14-request-size-limits)

### Related Topics
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)
- [API Usage Tracking](ku-16-api-usage-tracking)

### Advanced Follow-up Topics
- Async bulk operation with webhook callbacks
- Streaming bulk responses for very large batches
- Bulk operation pricing and quota management

## Research Notes

### Source Analysis
Stripe's API patterns for list and batch operations are industry-standard. Their approach to partial failures — returning per-item status in the same order as the request — is the most widely adopted pattern.

### Key Insight
The most important design choice in bulk operations is **atomicity level**. Non-atomic (per-operation) batches maximize throughput and are appropriate for most CRUD scenarios. Atomic batches should be reserved for operations where consistency across items is critical (e.g., financial transfers).

### Version-Specific Notes
- Laravel 11.x: Use `DB::transaction()` per operation for non-atomic batches; queue jobs for async bulk processing.
- PHP 8.4: Parallel processing in PHP requires `pthreads` or process forking — Laravel's job batching is more practical.
