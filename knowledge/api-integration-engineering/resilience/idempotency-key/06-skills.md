# Skill: Implement Idempotency Keys for Safe API Call Retries

## Purpose
Use idempotency keys to enable safe retry of mutating API calls, ensuring the same operation is processed only once even if the request is sent multiple times.

## When To Use
- Mutating API operations (POST, PUT, PATCH, DELETE)
- Payment processing and financial transactions
- Any operation where duplicate processing has side effects
- Retry-with-guarantee integration patterns

## When NOT To Use
- Read-only operations (GET)
- Idempotent-by-design operations
- Logging or analytics operations where duplicates are acceptable

## Prerequisites
- Cache or database for idempotency key storage
- Idempotency key generation mechanism

## Workflow
1. Generate unique idempotency key for each operation (UUID v4)
2. Include `Idempotency-Key` header in request
3. On server: check if key already processed in cache/DB
4. If processed: return stored response (idempotent)
5. If new: process request, store response keyed by idempotency key
6. Set TTL on stored keys (e.g., 24 hours) for cleanup
7. Handle idempotency key conflicts (same key, different request)
8. Return 409 Conflict for mismatched idempotency key reuse

## Validation Checklist
- [ ] Unique UUID generated per operation (client-side)
- [ ] `Idempotency-Key` header sent with requests
- [ ] Server checks key before processing
- [ ] Processed keys stored with responses
- [ ] Duplicate keys return original response
- [ ] TTL configured for key cleanup
- [ ] Key conflicts return 409
