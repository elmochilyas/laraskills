# Skill: Cache Idempotent Operation Responses for Retry Safety

## Purpose
Cache responses of idempotent operations keyed by idempotency key, enabling safe return of the same response when retries or duplicate requests arrive.

## When To Use
- Any idempotent operation that may be retried
- Safe returning of previous responses on duplicate requests
- Idempotency key storage with response caching

## When NOT To Use
- Non-idempotent operations (replaying a different request with same key)
- Operations where response caching is too expensive

## Prerequisites
- Idempotency key mechanism
- Cache or database for response storage

## Workflow
1. On first request processing: store response before returning
2. Key response by idempotency key with TTL
3. On duplicate request with same key: return cached response
4. Ensure response content is exactly the same (no different timestamps)
5. Handle cached response expiry: return 200 with warning or reprocess
6. Purge cached response on related data changes if needed
7. Test duplicate request returns identical response
8. Monitor response cache hit rate for idempotency

## Validation Checklist
- [ ] Response cached before returning on first request
- [ ] Keyed by idempotency key with appropriate TTL
- [ ] Duplicate requests return identical cached response
- [ ] Cache expiry handled gracefully
- [ ] Duplicate response tested for content equality
- [ ] Response cache hit rate monitored
