# bare-body-response-design
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** bare-body-response-design  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Bare-body response design returns the resource representation directly at the top level without a wrapping envelope. The response IS the resource — no `data`, `meta`, or `links` wrapper keys. This pattern reduces payload size and nesting complexity at the cost of coupling the client directly to the resource shape, making it harder to add transport metadata without breaking changes.

## Core Concepts
- **Direct Representation**: The HTTP response body is the resource itself. A User resource returns `{ "id": 1, "name": "Alice" }`, not `{ "data": { "id": 1, "name": "Alice" } }`.
- **Implicit Metadata**: Transport information moves to HTTP headers (pagination via Link headers, status via status code, caching via Cache-Control headers).
- **Collection Responses**: Collections are returned as top-level arrays `[ { ... }, { ... } ]`. This breaks JSON top-level security in some parsers but is widely used.
- **Error Responses**: Errors are typically structured differently from success responses, often as `{ "message": "...", "errors": {...} }` without a standard envelope.
- **No Implicit Contract**: The response body has no guaranteed top-level keys. Clients must know the endpoint's schema ahead of time.

## Mental Models
- **File Download**: A bare-body response is like downloading a file — the content IS the file, not a wrapper describing the file.
- **Direct Assignment**: Bare-body is analogous to returning a variable directly from a function — no packaging, just the value.
- **Thin Protocol**: The HTTP protocol layer (headers, status) carries transport concerns; the body carries only domain data.

## Internal Mechanics
- **Laravel `withoutWrapping()`**: Calling `YourResource::withoutWrapping()` on a resource disables the default `data` wrapper. The resource's `toArray()` output becomes the top-level response.
- **Resource Collection Without Wrapping**: `ResourceCollection::withoutWrapping()` returns the collection items directly as a top-level array. Pagination metadata must be handled separately via headers or custom structure.
- **Raw Response Returns**: Controllers that return `response()->json($array)` or `$model->toArray()` produce bare-body responses by default.
- **Eloquent Serialization**: `Model::toArray()` and `Model::toJson()` produce bare resource representations. Adding the `Resource` class introduces wrapping.

## Patterns
- **Bare Collection Pattern**: Return a JSON array at the top level for list endpoints. The client iterates the response directly.
- **Header Metadata Pattern**: Move pagination, rate limits, and server timing to HTTP headers. `Link` header for pagination, `X-Total-Count` for total records.
- **Minimal API Pattern**: For internal microservices where consumers control both sides, bare bodies reduce parsing overhead.
- **Laravel Resource withoutWrapping**: Use when building a BFF (Backend For Frontend) that adds its own envelope at the gateway level.

## Architectural Decisions
- **Bare vs. Envelope**: Choose bare-body when clients are owned by the same team, when bandwidth is constrained (IoT, mobile), or when an API gateway adds the envelope. Choose envelope for public APIs with unknown clients.
- **Collection Top-Level Array vs. Object**: Returning a top-level array is valid JSON but loses the ability to add metadata later. Consider returning `{ "items": [...] }` as a compromise (light envelope).
- **Error Structure**: Since bare-body has no standard error envelope, define and document a consistent error shape. Without it, every client parses errors differently.
- **Versioning Strategy**: Versioning bare-body responses often requires URL or header versioning since the body cannot carry version info.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Smaller payload size | No room for metadata expansion | Adding pagination info or links requires breaking change or headers |
| Simpler client parsing | Harder to distinguish data from metadata | Clients must inspect headers for status context |
| Direct resource access | Breaking change to resource shape is a breaking change to the API | Any added field becomes a version negotiation concern |
| No nesting overhead | Inconsistent error structure | Error responses often have different shape than success |
| Easy debugging | No standard contract | Every endpoint must be documented individually |

## Performance Considerations
- **Payload Size**: Bare-body responses are typically 15-30% smaller than enveloped responses due to omitted wrapper keys.
- **Serialization Speed**: Fewer array merges and key additions during serialization. The resource's `toArray()` output is used directly.
- **Collection Overhead**: Top-level arrays serialize and decompress efficiently. No unnecessary object wrapping.
- **Mobile/Metered Networks**: The size savings matter significantly for mobile APIs with metered data plans.

## Production Considerations
- **Gateway-Level Envelope**: If using an API gateway (Kong, AWS Gateway), the gateway can add the envelope, allowing microservices to use bare bodies internally.
- **Client Contract Documentation**: Without an envelope, the schema IS the contract. Use OpenAPI/Swagger rigorously.
- **Link Header Pagination**: `Link: <https://api.example.com/users?page=2>; rel="next"` is standardized by RFC 5988. Support this for pagination.
- **Monitoring Schema Drift**: Schema changes in bare-body responses silently break clients. Use contract testing (Pact, Dredd).
- **Error Response Standardization**: Document a single error shape across all endpoints since bare-body lacks a built-in error envelope.

## Common Mistakes
- **Inconsistent Error Shapes**: Some bare-body APIs return `{ "error": "msg" }`, others return `{ "message": "msg", "code": 400 }`, others return `"msg"` as a string. Standardize.
- **Returning Arrays at Top Level for Singletons**: Returning `[ { ... } ]` for a single resource instead of `{ ... }`. This forces array destructuring on the client.
- **No Pagination Headers**: Omitting Link headers or X-Total-Count when paginating arrays. Clients cannot build UI controls.
- **Wrapping Inconsistency**: Some endpoints are bare, some are wrapped. This creates the worst of both worlds — clients must handle both.
- **Assuming Clients Accept Breaking Changes**: Bare bodies couple the client to the schema. Renaming a field breaks all clients silently.

## Failure Modes
- **JSON Top-Level Array Vulnerability**: Top-level arrays are valid JSON but can be exploited in JSON hijacking attacks on older browsers. Mitigate with proper CORS and X-Content-Type-Options.
- **No Error Distinction**: Without an envelope, a 200 response with `{ "error": "..." }` can be accidentally parsed as data by clients that only check status code.
- **Pagination Metadata Loss**: Switching from envelope to bare-body without adding Link headers loses pagination context.
- **Empty Resource Confusion**: An empty collection returns `[]`, but a null resource returns `null` or `{}`. Clients must distinguish.

## Ecosystem Usage
- **Laravel Framework**: `JsonResponse` and `Model::toArray()` are the most common bare-body mechanisms. Using `Resource::withoutWrapping()` opts out of the envelope.
- **Laravel Forge API (historical)**: Earlier versions returned bare-body responses before moving to enveloped format.
- **Stripe API (old version)**: Stripe's older API used bare-body responses. Their newer API versioned into an envelope pattern.
- **JSON API Fallback Route**: Some Laravel applications expose a bare-body fallback route for internal consumption (microservice-to-microservice).

## Related Knowledge Units
### Prerequisites
- envelope-response-design (contrast)

### Related Topics
- data-wrapping-configuration
- response-format-decision-framework

### Advanced Follow-up Topics
- response-caching-headers
- response-compression

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\Json\JsonResource` (`withoutWrapping()` static method)
- `Illuminate\Http\Resources\Json\ResourceResponse` (wrapping logic)
- `Illuminate\Database\Eloquent\Model::toArray()` (raw serialization)
- `Illuminate\Http\JsonResponse` (bare JSON responses)

### Key Insight
Bare-body responses shift all transport metadata to HTTP headers, achieving 15-30% payload reduction at the cost of coupling clients directly to the resource schema — any field rename is a breaking change.

### Version-Specific Notes
- Laravel 6+: `withoutWrapping()` available; Laravel 8 changed default `$wrap` from resource class name to `'data'`
- Laravel 10/11/12/13: Behavior consistent across versions — `withoutWrapping()` on individual resource classes remains the mechanism; no framework-level global toggle exists
