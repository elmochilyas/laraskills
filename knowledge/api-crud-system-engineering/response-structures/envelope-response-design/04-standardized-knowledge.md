# envelope-response-design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: envelope-response-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Envelope response design wraps API payloads inside a standardized container with `data`, `meta`, `links`, and `errors` keys. This decouples the resource representation from transport metadata, enabling uniform client parsing regardless of endpoint. Every response — success or error — follows the same top-level contract.

The envelope pattern dominates in JSON:API, Laravel's API resources with wrapping enabled, and enterprise REST APIs. It trades payload size for structural consistency, ensuring clients never encounter raw arrays, bare objects, or unpredictable top-level keys.

## Core Concepts
- **Envelope Object**: The top-level JSON object containing `data`, `meta`, `links`, `errors`. Never a raw array or scalar.
- **Data Key**: Primary resource payload — object for single resource, array for collections.
- **Meta Key**: Non-resource metadata (pagination counts, timestamps, request ID).
- **Links Key**: Hypermedia links (self, first, prev, next, last, related).
- **Errors Key**: Array of error objects in error responses, never inside `data`.
- **Consistent Structure**: Same top-level key contract for success and failure responses.
- **Wrapping Control**: Laravel's `$wrap` property and `withoutWrapping()` manage envelope behavior.
- **Pagination Injection**: `PaginatedResourceResponse` auto-injects pagination metadata and links.

## When To Use
- Public APIs with unknown or diverse client types
- APIs where metadata (pagination, permissions, timestamps) must accompany every response
- Multi-version APIs where envelope shape changes between versions
- Teams enforcing strict response contracts across many endpoints
- APIs consumed by generic HTTP clients that parse envelopes uniformly

## When NOT To Use
- Internal microservices where both producer and consumer are controlled by the same team
- Bandwidth-constrained environments (IoT, mobile metered data) where every byte counts
- BFF (Backend For Frontend) where an API gateway adds the envelope later
- Simple CRUD APIs with a single consumer where envelope overhead provides no benefit
- Streaming or real-time endpoints where minimal latency matters more than structure

## Best Practices (WHY)
- **Always wrap errors in `errors` key**: Clients write a single error handler instead of conditional parsing for `{error: "msg"}` vs `{errors: [...]}`.
- **Use generic `data` wrapper key**: Custom wrapper keys (`user`, `post`) couple clients to resource names and make renaming the model a breaking change.
- **Keep envelope shape stable**: Adding new top-level keys is additive (backward-compatible). Removing or renaming them is breaking. Design for permanence.
- **Separate resource shape from envelope shape**: The envelope is the outer contract; resource fields can evolve within it.
- **Set constants for envelope keys**: Stringly-typed envelope keys make refactoring difficult. Use a response builder class or constants.

## Architecture Guidelines
- Wrap all responses at the same architectural layer — middleware or a base response class — not per-controller.
- Paginated collections automatically get `meta` and `links`. Ensure non-paginated collections also have consistent structure.
- For 204 No Content, omit the envelope body entirely (correct HTTP semantics) rather than returning `{data: null}`.
- When using `withoutWrapping()`, verify it does not silently disable the envelope for some endpoints while leaving it for others.
- Envelope versioning via Accept header or URL prefix enables evolving the outer contract without breaking existing clients.

## Performance
- Envelope assembly adds negligible CPU overhead per request.
- Wrapper keys add 15-30% payload size overhead vs bare-body responses.
- Pagination metadata computation (especially `total` and `last_page`) dominates envelope response time — use cursor pagination when count queries are expensive.
- Cache granularity is coarser with envelopes — any envelope change invalidates the entire cached response.

## Security
- Never include sensitive data (tokens, internal IDs, debug output) in `meta`. Meta fields are serialized to clients.
- Ensure error envelopes never include stack traces, SQL queries, or file paths in production.
- `meta` fields like `can.update`, `can.delete` expose authorization state — ensure they match actual server-side policy.
- Request IDs in `meta` enable log correlation without exposing internal identifiers.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Inconsistent error envelope | Error returns `{error: "msg"}` instead of `{errors: [...]}` | Developer shortcuts in exception handler | Clients must write conditional error parsing | Standardize error envelope in exception handler |
| Mixing envelope styles | Some endpoints use envelope, others return bare JSON | No centralized response building | Inconsistent API surface erodes client trust | Apply envelope via middleware or base class |
| Array return bypasses envelope | Raw array from controller bypasses resource serialization | Forgetting to wrap in Resource class | Response is an unwrapped JSON array | Always return Resource instances from controllers |
| Nested envelope | Meta inside data, or links inside meta | Misunderstanding envelope structure | Clients must traverse inconsistent depths | Keep meta/links at top level alongside data |
| Envelope mutation in middleware | Middleware modifies envelope after serialization | Adding global headers or transforms | Resource-specific metadata is overwritten | Use `additional()` for resource-specific envelope data |

## Anti-Patterns
- **Envelope Per Endpoint**: Each controller builds its own envelope shape. Use centralized response building.
- **Custom Wrapper Keys Everywhere**: Different resources use different wrapper keys (`user`, `post`, `order`). Use generic `data`.
- **Envelope Without Errors Key**: Success responses have `data`, errors return plain JSON. Clients handle two paths.
- **Mutating Envelope in `additional()` with `data` Key**: Calling `additional(['data' => ...])` overwrites the resource data.
- **Deeply Nested Meta**: Meta fields nested 4+ levels deep become harder to parse and document than flat meta.

## Examples
```php
// Standard envelope response for single resource
return new UserResource($user);
// { "data": { "id": 1, "name": "Alice" }, "meta": { "request_id": "req_abc" } }

// Envelope for paginated collection — auto-injects meta and links
return UserResource::collection($users);
// { "data": [...], "meta": { "current_page": 1, "total": 50 }, "links": { "self": "/users", "next": "/users?page=2" } }

// Error envelope consistent with success envelope
throw new ValidationException($validator);
// { "errors": [{ "title": "Validation Error", "detail": "The email field is required.", "status": 422 }] }
```

## Related Topics
- **Prerequisites**: bare-body-response-design (contrast)
- **Related**: data-wrapping-configuration, top-level-meta-and-links, json-api-resource-structure
- **Advanced**: json-api-compound-documents, rfc-9457-problem-details, response-versioning

## AI Agent Notes
- When generating responses, always wrap in Resource classes, never return raw arrays.
- For new endpoints, use `JsonResource` or `ResourceCollection` as return types.
- Add `$wrap = 'data'` or use `withoutWrapping()` consistently across all resources.
- Include `meta` with request ID and `links` with `self` URL on every resource response.

## Verification
- Every 200/201 response has a top-level `data` key (or the chosen wrapper key).
- Every 4xx/5xx response has an `errors` key with the same top-level structure.
- Paginated collections include both `meta` (pagination data) and `links` (navigation URLs).
- No raw array is returned from any controller (verify with middleware that inspects response structure).
- Integration tests assert the envelope shape, not just the HTTP status code.
