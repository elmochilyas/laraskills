# Skill: Add Top-Level Metadata to a Resource

## Purpose

Add API-level context (version, timestamps, request IDs, deprecation headers) to resource responses using `with()` for JSON body data and `withResponse()` for HTTP header modifications.

## When To Use

- Embedding API version information in every response
- Adding cache timestamps or invalidation markers
- Indicating applied filters or permission context
- Setting custom HTTP headers (deprecation notices, custom status codes)
- Adding request IDs for request tracing

## When NOT To Use

- For global headers that apply to all responses (CORS, content-type) — use middleware instead
- For pagination metadata — that is handled by `PaginatedResourceResponse`
- When the metadata is large or computed from heavy operations — compute in controller and pass to resource
- For sensitive data visible to all consumers — `with()` output is seen by every API consumer

## Prerequisites

- A resource class extending `JsonResource`
- Understanding of `with($request)` and `withResponse($request, $response)` methods
- Decision on what metadata to include

## Inputs

- Resource class to modify
- Metadata specification (version, timestamps, filters, etc.)
- HTTP header requirements (deprecation, status code, custom headers)

## Workflow

1. Decide what metadata should be included:
   - Static metadata (API version, format version) — define in a base resource class
   - Dynamic metadata (request time, applied filters, user context) — define in endpoint-specific resources
2. Create a base resource class (if 5+ resources exist) with a standardized `with()` implementation:
   ```php
   abstract class ApiResource extends JsonResource
   {
       public function with($request): array
       {
           return [
               'api_version' => config('api.version'),
               'request_id' => $request->header('X-Request-ID'),
           ];
       }
   }
   ```
3. Use unique key names in `with()` that will not collide with pagination's built-in `data`, `links`, and `meta` keys — array union (`+`) silently drops colliding keys.
4. Keep `with()` computation light — no database queries, external API calls, or heavy computations. Pre-compute in the controller or cache results.
5. Never include sensitive data in `with()` output — it is visible to every API consumer.
6. Use `withResponse()` for HTTP header and status code modifications, not for JSON body data.
7. Use middleware for global response concerns (CORS, content-type), not `withResponse()`.
8. Only define `with()` on outer (top-level) resources — nested sub-resources' `with()` is discarded.
9. Write tests that explicitly assert metadata key presence and values — array union can silently drop keys.

## Validation Checklist

- [ ] All resources use a shared base class with standardized `with()` structure
- [ ] No sensitive data (internal state, server paths, config values) in metadata
- [ ] `with()` does not contain expensive database queries or external calls
- [ ] Metadata keys do not conflict with pagination keys (`data`, `links`, `meta`)
- [ ] `withResponse()` headers are integration-tested to confirm no collisions with middleware
- [ ] `with()` on sub-resources is not expected to appear at the top level

## Common Failures

- Confusing `with()` and `withResponse()` — mixing up data metadata (belongs in JSON body) and response modification (belongs in HTTP headers)
- Heavy computation in `with()` — running expensive operations inside `with()` adds latency to every response
- Array union surprise — expecting `with()` to override existing keys; array union (`+`) means pagination's `data`, `links`, `meta` take precedence
- Assuming `with()` on sub-resources appears in the final response — only the outer resource's `with()` takes effect
- Key collisions with pagination metadata — using `meta` or `links` keys in `with()` when the response is paginated causes silent key disappearance

## Decision Points

- **with() vs withResponse()**: Use `with()` for data that becomes part of the JSON body (version, timestamps, filters). Use `withResponse()` for HTTP header modifications (deprecation, status codes, custom headers).
- **Base class vs per-resource metadata**: Define shared metadata (API version, request ID) in a base class. Add endpoint-specific metadata (applied filters, cache timestamps) in individual resources.
- **Middleware vs withResponse()**: Use middleware for global response concerns that apply to all endpoints (CORS, content-type). Use `withResponse()` for resource-specific header changes (deprecation, custom status).

## Performance Considerations

- `with()` adds a single array merge operation — <0.001ms overhead
- Expensive computation inside `with()` should be avoided — cache or pre-compute in the controller
- `withResponse()` modifies the response object before serialization — zero serialization overhead
- Metadata bloat across many endpoints can accumulate — audit total metadata size if responses exceed expectations

## Security Considerations

- No sensitive data in metadata — `with()` output reaches every consumer. Never include internal state, configuration values, server paths, or debug information
- Header collisions — if middleware sets a header and `withResponse()` sets the same header, the last writer wins. Test header values in integration tests
- Request IDs in headers can be used for tracing by clients — ensure the ID format does not leak internal system information (e.g., server hostname)

## Related Rules

- Standardize Metadata Structure via a Base Resource Class (Code Organization)
- Use Middleware for Global Metadata; Use with() for Endpoint-Specific (Architecture)
- Avoid Key Conflicts with Pagination Metadata (Design)
- Keep with() Computation Light (Performance)
- Never Include Sensitive Data in with() Output (Security)
- Use withResponse() for HTTP Headers, with() for JSON Body (Framework Usage)
- Only Expect with() on the Outer Resource (Design)
- Test That Metadata Keys Appear in the Response (Testing)
- Use Unique Key Names to Avoid Array Union Surprises (Reliability)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

## Success Criteria

- All resources use a consistent metadata structure via a base class
- No sensitive or internal data appears in metadata
- `with()` computation is lightweight — no DB queries or external calls
- Metadata keys do not collide with pagination `data`/`links`/`meta` keys
- `with()` and `withResponse()` are used for their correct purposes
- Tests verify metadata key presence and values
