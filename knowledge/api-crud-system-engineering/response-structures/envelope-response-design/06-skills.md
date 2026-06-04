# Skill: Implement Envelope Response Design

## Purpose
Wrap all API responses in a standardized envelope with `data`, `meta`, `links`, and `errors` keys using API Resources, centralized middleware, and consistent error handling.

## When To Use
- Public APIs with unknown or diverse client types
- APIs where metadata accompanies every response
- Multi-version APIs with stable envelope shape
- Teams enforcing strict response contracts across many endpoints

## When NOT To Use
- Internal microservices where both sides controlled by same team
- Bandwidth-constrained environments (IoT, mobile metered data)
- BFF where API gateway adds envelope later

## Prerequisites
- Laravel API Resources (`JsonResource`)
- Response serialization understanding

## Inputs
- Resource schemas for each endpoint
- Envelope shape specification

## Workflow
1. Create API Resource classes for all models: `UserResource extends JsonResource`
2. Set envelope wrapper key via `$wrap = 'data'` or use `JsonResource::$wrap = 'data'`
3. Return `new UserResource($user)` for single resources, `UserResource::collection($users)` for collections
4. Use `additional()` for resource-specific metadata — never override `data` key
5. Apply envelope-wide metadata (request_id, timestamps) via middleware, not per-controller
6. Return `response()->noContent()` (204) for DELETE — no envelope body on 204
7. Use consistent error envelope with top-level `errors` key for all 4xx/5xx responses
8. Keep envelope shape stable within a version — additive changes only
9. Never return raw arrays from controllers — always return Resource instances
10. Never include sensitive data (tokens, debug output) in `meta`

## Validation Checklist
- [ ] All 200/201 responses have top-level `data` key (or chosen wrapper)
- [ ] All 4xx/5xx responses have `errors` key with consistent structure
- [ ] Paginated collections include both `meta` and `links`
- [ ] No raw arrays returned from controllers
- [ ] DELETE responses are 204 No Content without body
- [ ] Envelope applied at centralized layer (not per-controller)
- [ ] `additional()` used only for resource-specific data
- [ ] No sensitive data in `meta` fields
- [ ] Integration tests assert envelope shape

## Common Failures
- Inconsistent error envelope — some endpoints return `{error}`, others `{errors: []}`
- Mixing envelope styles — some endpoints use envelope, others return bare JSON
- Raw array returns bypassing envelope — collection returned without wrapping
- Nested envelope — meta inside data instead of top-level
- Envelope mutation in middleware after serialization overwrites resource data

## Decision Points
- Generic `data` wrapper vs custom wrapper keys (`user`, `post`) — generic `data` for forward compatibility
- Envelope applied via middleware vs base response class — middleware for consistency, base class for simplicity
- Pagination metadata in envelope vs separate endpoint — in-envelope for standard, separate for complex

## Performance Considerations
- Envelope assembly adds negligible CPU overhead
- Wrapper keys add 15-30% payload size overhead vs bare-body
- Pagination `total` and `last_page` computation dominates response time
- Cache granularity is coarser with envelopes

## Security Considerations
- Never include tokens, internal IDs, debug output in `meta`
- Ensure error envelopes never include stack traces in production
- `meta` fields exposing authorization state must match server-side policy
- Request IDs in `meta` enable log correlation without exposing internal identifiers

## Related Rules
- Always Wrap Errors Under the errors Key
- Never Return Raw Arrays from Controllers
- Keep the Envelope Shape Stable Across Versions
- Apply Envelope at a Centralized Layer
- Never Include Sensitive Data in meta
- Enforce 204 No Content Without an Envelope Body
- Use additional() for Resource-Specific Data Only

## Related Skills
- Data Wrapping Configuration — for `$wrap` and `withoutWrapping()`
- Top-Level Meta and Links — for envelope metadata design
- JSON API Resource Structure — for JSON:API compliance
- Pagination Metadata Design — for paginated envelope content

## Success Criteria
- Every response has consistent top-level envelope structure
- Error and success responses share the same envelope contract
- No endpoint returns unwrapped JSON or raw arrays
- Clients can parse any response generically without endpoint-specific logic
- DELETE responses correctly use 204 No Content with empty body
