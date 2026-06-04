# Skill: Implement Idempotency Semantics

## Purpose
Understand and apply idempotency per HTTP method: GET/DELETE/PUT/HEAD inherently idempotent, POST not idempotent (use `Idempotency-Key` header), PATCH conditionally idempotent.

## When To Use
- API endpoint design
- Idempotency key implementation decisions
- Client-idempotent contract design

## When NOT To Use
- Non-API operations

## Prerequisites
- HTTP method semantics
- Idempotent vs safe distinction

## Workflow
1. GET/HEAD/OPTIONS are inherently idempotent — safe methods, no side effects
2. PUT is idempotent — full replacement, same request always same result
3. DELETE is idempotent — resource deleted or not found, same result
4. POST is NOT idempotent — creates new resource each time
5. PATCH is conditionally idempotent — depends on patch operation semantics
6. Apply `Idempotency-Key` header for POST endpoints where retry safety needed
7. Never apply idempotency to GET (already idempotent) or DELETE (already idempotent)
8. Document idempotency properties per endpoint
9. Test idempotent endpoints with repeated identical requests

## Validation Checklist
- [ ] GET/HEAD/DELETE idempotent — tested
- [ ] PUT idempotent — tested
- [ ] POST non-idempotent unless Idempotency-Key used
- [ ] Idempotency-Key on POST where needed
- [ ] Idempotency properties documented per endpoint

## Related Skills
- HTTP Method Semantics
- Idempotency Key Design
- Idempotency Key TTL Expiration
