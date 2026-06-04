# bare-body-response-design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: bare-body-response-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Bare-body response design returns the resource representation directly at the JSON top level without any envelope wrapper. The response body IS the resource — no `data`, `meta`, or `links` keys. This maximizes payload efficiency at the cost of coupling clients directly to the resource schema and making transport metadata harder to add.

Bare-body responses shift metadata to HTTP headers: pagination via `Link` headers, status via status codes, caching via `Cache-Control`. This pattern is optimal for internal services, bandwidth-constrained clients, and gateway architectures where an outer layer adds the envelope.

## Core Concepts
- **Direct Representation**: `{ "id": 1, "name": "Alice" }` instead of `{ "data": { "id": 1, "name": "Alice" } }`.
- **Implicit Metadata**: Transport information moves to HTTP headers, not the response body.
- **Collection Responses**: Top-level arrays `[ {...}, {...} ]` — valid JSON but vulnerable to JSON hijacking in old browsers.
- **No Guaranteed Contract**: No enforced top-level keys. Clients must know the schema ahead of time.
- **`withoutWrapping()`**: Laravel method that disables the `data` wrapper for a resource class.
- **Eloquent Raw Serialization**: `Model::toArray()` and `Model::toJson()` produce bare-body responses by default.

## When To Use
- Internal microservices where both producer and consumer are controlled by the same team
- Bandwidth-constrained clients (mobile, IoT, metered networks)
- BFF (Backend For Frontend) where an API gateway adds the envelope
- APIs where the client SDK handles all parsing and formatting
- High-throughput endpoints where every byte of overhead matters

## When NOT To Use
- Public APIs with unknown third-party consumers
- APIs that need to evolve their response shape without breaking clients
- APIs that require pagination metadata alongside resources
- Multi-client ecosystems where different clients need different metadata
- APIs where error responses must be distinguishable from success responses by structure alone

## Best Practices (WHY)
- **Standardize error shape**: Since bare-body lacks a built-in error envelope, define and document a single consistent error structure across all endpoints.
- **Use `Link` header for pagination**: RFC 5988 `Link` headers provide pagination without polluting the response body.
- **Set explicit cache headers**: Without envelope metadata, clients rely entirely on `Cache-Control`, `ETag`, and `Last-Modified` headers for caching decisions.
- **Use `X-Total-Count` for totals**: When clients need total record counts, use a custom header rather than modifying the response body.
- **Document schema rigorously**: Bare-body couples clients to the schema. Use OpenAPI/Swagger to document every field precisely.

## Architecture Guidelines
- Use `Resource::withoutWrapping()` on individual resource classes, not globally (Laravel has no global toggle).
- For collections, return a top-level array or use a minimal wrapper like `{ "items": [...] }` if metadata is needed.
- In microservice architectures, use bare-body internally and transform to envelope at the API gateway.
- For error responses, return a consistent JSON structure documented in the API spec.
- Version bare-body responses via URL prefix or header since the body cannot carry version info.

## Performance
- Bare-body responses are 15-30% smaller than envelope responses due to omitted wrapper keys.
- Serialization is faster — fewer array merges and key additions.
- Top-level arrays serialize and decompress efficiently on the wire.
- The size savings are most significant for mobile APIs on metered data plans.

## Security
- Top-level JSON arrays can be exploited in JSON hijacking attacks on older browsers. Mitigate with proper CORS and `X-Content-Type-Options: nosniff`.
- Without an envelope, sensitive data leaked in a response field has no structural barrier — ensure field-level filtering is robust.
- Custom headers exposed via `Access-Control-Expose-Headers` must be reviewed for information disclosure.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Inconsistent error shapes | Different endpoints return different error formats | No standardized error design | Clients cannot write generic error handling | Define and enforce a single error schema |
| Top-level array for singletons | `[ {...} ]` returned for single resource | Reusing collection logic for single responses | Client forces array destructuring unnecessarily | Return object for singles, array for collections |
| No pagination headers | Omitting `Link` or `X-Total-Count` on paginated arrays | Forgetting that pagination metadata moved to headers | Clients cannot build UI controls | Always include `Link` header and `X-Total-Count` |
| Mixed wrapping | Some endpoints bare, others wrapped | No consistent strategy | Worst of both worlds — client handles both | Choose one pattern and apply universally |
| Breaking changes without versioning | Renaming a field silently breaks all clients | Schema is the contract with bare-body | Client errors appear without server-side logs | Use contract testing (Pact, Dredd) |

## Anti-Patterns
- **Bare Body for Public APIs**: Without envelope extensibility, every schema change is breaking.
- **Mixing Wrapped and Bare Endpoints**: Creates client confusion and conditional parsing code.
- **Error Strings Instead of Objects**: Returning `"error": "msg"` as a string instead of structured error objects.
- **Omitting All Metadata Headers**: No pagination, no caching, no rate-limit info — clients operate blindly.
- **Relying on Status Code Alone for Error Distinction**: A 200 with `{error: ...}` is indistinguishable from success data.

## Examples
```php
// Single resource — no wrapping
UserResource::withoutWrapping();
return new UserResource($user);
// { "id": 1, "name": "Alice", "email": "alice@example.com" }

// Collection — top-level array
UserResource::withoutWrapping();
return UserResource::collection($users);
// [ { "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" } ]

// Pagination via headers
return UserResource::collection($users)
    ->withHeaders(['Link' => '< /users?page=2 >; rel="next"', 'X-Total-Count' => 50]);

// Error response in bare-body style
return response()->json([
    'message' => 'Validation failed.',
    'errors' => ['email' => ['The email field is required.']]
], 422);
```

## Related Topics
- **Prerequisites**: envelope-response-design (contrast)
- **Related**: data-wrapping-configuration, response-format-decision-framework
- **Advanced**: response-caching-headers, response-compression

## AI Agent Notes
- When generating internal API endpoints, prefer bare-body if the consumer is known.
- Use `Resource::withoutWrapping()` at the class level, not per-instance.
- Always include `Link` header for pagination on bare-body collection endpoints.
- For error responses, use a consistent `{message, errors}` structure regardless of endpoint.

## Verification
- Single resources return JSON objects at the top level, not arrays.
- Collections return JSON arrays, not wrapped objects.
- Paginated responses include `Link` header with `first`, `prev`, `next`, `last` relations.
- Error responses follow the documented consistent schema across all endpoints.
- Integration tests verify response structure matches OpenAPI schema exactly.
