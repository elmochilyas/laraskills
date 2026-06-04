# Skill: Implement Idempotency Key Testing

## Purpose
Write tests verifying idempotency key behavior: first request processes and returns, second request with same key returns cached response, in-flight detection returns 409, invalid key formats return 422, key expiry behavior.

## When To Use
- Idempotency key implementation testing
- POST endpoint idempotency validation
- Race condition testing

## Prerequisites
- Idempotency middleware implementation
- HTTP endpoint testing

## Workflow
1. First request with idempotency key — assert processing and 200/201
2. Second request with same key — assert same response (replayed)
3. Assert Idempotent-Replayed: true header on replay
4. Send two concurrent requests with same key — assert 409 on second
5. Send request with invalid key format — assert 422
6. Send request without key — assert normal processing
7. Send request with expired key — assert new processing
8. Test idempotency across different users (same key, different user)
9. Test idempotency on GET (should not affect behavior)
10. Test idempotency cache expires correctly

## Validation Checklist
- [ ] First request processes and returns
- [ ] Second request returns cached response
- [ ] Idempotent-Replayed header on replay
- [ ] Concurrent request returns 409
- [ ] Invalid key format returns 422
- [ ] Missing key processes normally
- [ ] Expired key creates new processing

## Related Skills
- Idempotency Key Design
- HTTP Method Semantics
- Rate Limiter Definitions
