# ECC Standardized Knowledge — Bulk Operation Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Bulk Operation Design |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Bulk operation design covers the patterns, formats, and error handling strategies for batch endpoints that operate on multiple resources in a single request. Well-designed bulk operations reduce network overhead, improve throughput, and provide predictable partial-failure semantics. Each bulk endpoint handles one resource type with a maximum of 500 operations per request, per-operation identifiers for result mapping, and response order matching request order.

## Core Concepts

- **Bulk request format**: JSON body containing array of operations, each with its own payload and optional correlation identifier.
- **Bulk response format**: JSON body containing array of individual results maintaining request order, each with status, data, and errors.
- **Partial failure**: Some operations succeed while others fail; response must clearly indicate which is which.
- **Atomicity level**: Per-operation (non-atomic) by default — one failed item does not block 99 successful ones.
- **Idempotency**: Per-operation idempotency keys recommended over single batch key.
- **Batch size limits**: Maximum 500 operations per request to prevent server overload.

## When To Use

- Creating/updating/deleting many resources of the same type
- Reducing network overhead compared to N individual requests
- Operations where partial success is acceptable
- Bulk data imports or migrations

## When NOT To Use

- Operations requiring full atomicity across items (use individual requests with transactions)
- Mixed resource types in same request (use separate bulk endpoints)
- Very large datasets (>500 operations — use async processing with status polling)
- Read-only batch operations (use individual GET or list endpoints with filters)

## Best Practices

- **Preserve request order in response**: Response array index matches request array index for unambiguous correlation.
- **Per-operation identifiers**: Each operation includes `correlation_id` or `request_id` for result mapping.
- **Operation-level errors**: Each result includes errors array, not just top-level success flag.
- **Per-operation transactions**: Each operation runs in its own transaction (non-atomic default).
- **Chunked processing**: Process in chunks internally (50 per chunk) to manage memory.
- **Configurable concurrency**: Max 10 parallel operations; sequential option for ordered operations.

## Architecture Guidelines

- Endpoint pattern: `POST /resources/bulk` for mixed or `POST /resources/bulk-create` for single-operation batches.
- Response order must match request order so consumers can correlate results.
- Bulk calls count as 1 request against rate limit, not N operations.
- Async bulk for batches > 500 with callback/webhook for result delivery.
- Validation of batch envelope (size limit, format) before processing any operations.

## Performance Considerations

- Parallel processing limited to 10 threads max to avoid resource exhaustion.
- Large batches (500+) use chunked processing (50 per chunk internally).
- Memory usage grows linearly with batch size — monitor and enforce limits.
- Database connections pooled per batch; operations share same connection pool.

## Security Considerations

- Validate batch size against consumer tier to prevent DoS via large batches.
- Each operation validated independently — one malicious operation should not affect others.
- Per-operation authorization checked for each item, not just batch-level.
- Rate limit bulk requests as single requests to prevent abuse.

## Common Mistakes

- Using atomic transactions for non-related operations (one failure blocks all).
- Not preserving request order in response (consumer cannot map results).
- Returning only top-level error for partial failures without per-item details.
- Setting batch size limits too high (memory exhaustion) or too low (defeats purpose).
- Not handling idempotency for per-operation vs whole batch.

## Anti-Patterns

- **Mixed resource types in one bulk request**: Different validation and processing logic per type complicates implementation.
- **No correlation identifiers**: Consumer cannot determine which operations succeeded/failed.
- **Synchronous processing of huge batches**: Timeouts and memory exhaustion. Use async for large batches.

## Examples

- Request: `POST /users/bulk { "operations": [{ "request_id": "op-1", "data": { "name": "Alice" } }, { "request_id": "op-2", "data": { "name": "Bob" } }] }`.
- Response: `{ "results": [{ "request_id": "op-1", "status": 201, "data": { "id": 1 } }, { "request_id": "op-2", "status": 422, "errors": { "name": ["Already exists"] } }] }`.

## Related Topics

- **Prerequisites**: Idempotency Key Design, Request Size Limits
- **Closely Related**: Backward Compatibility Policy, API Usage Tracking
- **Advanced**: Async bulk with webhook callbacks, Streaming bulk responses, Bulk operation pricing and quota management

## AI Agent Notes

When designing bulk operations: use per-operation (non-atomic) transactions by default, preserve request order in response, provide per-operation correlation identifiers, limit batch to 500 operations, use chunked processing internally, cap parallel processing at 10 threads, return per-operation errors not just top-level status.

## Verification

Sources: Stripe batch API patterns, AWS DynamoDB BatchWriteItem, Shopify bulk mutations, domain-analysis.md.
