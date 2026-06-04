# Skill: Apply HTTP Method Semantics

## Purpose
Select correct HTTP methods for CRUD and action endpoints, following REST conventions: GET for reads, POST for creates/actions, PUT for full replacement, PATCH for partial, DELETE for removal.

## When To Use
- Every API endpoint definition
- CRUD resource registration
- Action endpoints for non-CRUD operations

## When NOT To Use
- Method spoofing (`_method` field) — for HTML forms only, never API routes

## Prerequisites
- HTTP method safety and idempotency understanding
- Laravel route registration

## Inputs
- Resource definitions with CRUD operations
- Action endpoints list

## Workflow
1. Use GET for all read operations — cacheable at every layer
2. Use POST for resource creation and action endpoints
3. Use PUT for full resource replacement (client sends complete representation)
4. Use PATCH for partial updates (client sends only changed fields with `sometimes` rules)
5. Use DELETE for resource removal — return 204 No Content
6. Use HEAD for resource existence checks (no body downloaded)
7. Use POST for non-CRUD actions: `POST /orders/{order}/cancel`
8. Register CRUD endpoints with `Route::apiResource()` — excludes `create`/`edit`
9. Never accept `_method` spoofing on API routes
10. Never send request body with DELETE — use headers or query parameters

## Validation Checklist
- [ ] GET endpoints never modify server state
- [ ] DELETE endpoints return 204 and are idempotent
- [ ] POST endpoints that need idempotency implement `Idempotency-Key` header
- [ ] PUT requires and replaces full resource representation
- [ ] PATCH accepts only changed fields via `sometimes` rules
- [ ] No `create` or `edit` routes in API (using `apiResource`)
- [ ] No verbs in URI paths — HTTP methods encode actions
- [ ] Action endpoints use POST, not PATCH/GET
- [ ] Method spoofing not accepted on API routes

## Common Failures
- POST for read operations — bypasses HTTP caching
- PUT for partial updates — omitted fields may be reset to null
- PATCH without `sometimes` rules — fails when clients send only changed fields
- GET with request body — servers/proxies may strip the body
- DELETE with request body — may be ignored by intermediaries
- Method spoofing on API routes — bypasses method-specific middleware and rate limiting

## Decision Points
- PUT vs PATCH — PUT for full replacement, PATCH for partial; consider using only PATCH if clients consistently confuse them
- POST vs action endpoint — use POST for CRUD create, explicit POST `/resource/{id}/action` for non-CRUD
- DELETE response — 204 No Content for standard, 200 with body only when deletion metadata is needed

## Performance Considerations
- GET responses cacheable at every layer — primary performance advantage of proper method selection
- HEAD requests avoid body serialization — use for existence checks
- POST/PUT/PATCH require body parsing and validation — GET with query params avoids body parsing

## Security Considerations
- GET must never modify state — breaks caching, prefetching, and automated crawlers
- POST is the only non-idempotent, non-safe method — use for operations that shouldn't be auto-retried
- Method spoofing must not be accepted on API routes — bypasses method-specific middleware

## Related Rules
- Use GET For All Read Operations
- Use POST For All Operations That Create Resources
- Return 204 For Successful DELETE
- Use PATCH For Partial Updates, PUT For Full Replacement
- Use POST For Actions That Don't Map To CRUD
- Use Route::apiResource() For CRUD Endpoints
- Use HEAD For Resource Existence Checks
- Never Send Request Body With DELETE
- Do Not Accept Method Spoofing For API Routes

## Related Skills
- HTTP Status Code Selection — for response status codes per method
- Idempotency Semantics — for idempotency key design
- Resource Naming Conventions — for URI path design

## Success Criteria
- All read operations use GET and are cacheable
- All resource creation uses POST with 201 responses
- All updates use PATCH with `sometimes` rules for partial payloads
- All deletions use DELETE with 204 No Content
- Action endpoints use POST with explicit action names in path
- Route list shows exactly 5 routes per CRUD resource (no create/edit)
