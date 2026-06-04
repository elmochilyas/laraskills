# Skill: Design Bulk API Operations

## Purpose
Design bulk endpoints for multi-resource operations with per-operation transactions, order-preserved responses, correlation identifiers, batch size limits of 500, per-operation validation/authorization, and chunked internal processing.

## When To Use
- Creating/updating/deleting many resources of the same type
- Reducing network overhead compared to N individual requests
- Operations where partial success is acceptable
- Bulk data imports or migrations

## When NOT To Use
- Operations requiring full atomicity across items
- Mixed resource types in same request
- Very large datasets (>500 operations — use async processing)
- Read-only batch operations

## Prerequisites
- Idempotency key design
- Request size limits configuration
- Understanding of partial failure patterns

## Inputs
- Resource type for bulk operations
- Operation types (create, update, delete)
- Batch size limits and concurrency settings

## Workflow
1. Preserve request order in response — response array index matches request array index
2. Enforce batch size limit of 500 operations at middleware level — return 413 on exceed
3. Process operations in per-operation transactions by default (non-atomic) — one failure does not block others
4. Validate and authorize each operation individually — never just batch-level validation
5. Count bulk request as single rate limit unit, regardless of operation count
6. Require or generate per-operation correlation identifiers (`request_id`) echoed back in responses
7. Process large batches in internal chunks (50 per chunk) with configurable concurrency (max 10 threads)
8. Return per-operation errors in structured format alongside success results

## Validation Checklist
- [ ] Response order matches request order
- [ ] Batch size limit enforced (max 500)
- [ ] Per-operation transactions (non-atomic by default)
- [ ] Per-operation validation and authorization
- [ ] Bulk request counted as single rate limit hit
- [ ] Per-operation correlation IDs in request and response
- [ ] Internal chunked processing (50 per chunk, max 10 threads)
- [ ] Per-operation error details in response

## Common Failures
- Using atomic transactions for non-related operations (one failure blocks all)
- Not preserving request order in response
- Returning only top-level error for partial failures without per-item details
- Setting batch size limits too high (memory exhaustion) or too low (defeats purpose)
- Mixed resource types in one bulk request

## Decision Points
- Atomicity level: per-operation (default) vs grouped transactions vs full atomic
- Batch size limit: 500 default vs consumer-specific higher limits
- Concurrency: parallel (max 10 threads) vs sequential for ordered operations

## Performance Considerations
- Parallel processing limited to 10 threads to avoid resource exhaustion
- Large batches (500+) use chunked processing (50 per chunk)
- Memory usage grows linearly with batch size — monitor and enforce limits

## Security Considerations
- Validate batch size against consumer tier to prevent DoS
- Each operation validated independently — one malicious operation should not affect others
- Per-operation authorization checked for each item, not just batch-level
- Rate limit bulk requests as single requests to prevent abuse

## Related Rules
- Preserve Request Order in Response
- Limit Batch Size to 500 Operations
- Use Per-Operation Transactions (Non-Atomic by Default)
- Validate Each Operation Independently
- Count Bulk Requests as Single Rate Limit Unit
- Provide Per-Operation Correlation Identifiers
- Use Chunked Internal Processing for Large Batches

## Related Skills
- Implement Idempotency Key Design
- Design Request Size Limits
- Design Rate Limit Tiers

## Success Criteria
- Bulk response maintains request order for unambiguous correlation
- Batch size is enforced at middleware level
- Single operation failure does not block other operations
- Each operation is individually validated and authorized
- Bulk request consumes one rate limit unit
- Correlation IDs enable result mapping
- Internal chunking prevents memory exhaustion
