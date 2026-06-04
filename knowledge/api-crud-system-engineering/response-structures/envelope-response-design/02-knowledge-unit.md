# envelope-response-design
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** envelope-response-design  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Envelope response design wraps API response payloads inside a standardized container object, typically containing keys like `data`, `meta`, `links`, and `errors`. This pattern decouples the resource representation from transport metadata, enabling clients to process status, pagination, and error information uniformly without inspecting HTTP headers alone. It is the dominant pattern in JSON:API, Laravel's API resources with wrapping, and enterprise REST APIs.

## Core Concepts
- **Envelope Object**: The top-level JSON object that contains all response data and metadata. Never returns a raw array or scalar at the top level.
- **Data Key**: Contains the primary resource payload — a single object for one resource, an array for collections.
- **Meta Key**: Carries non-resource metadata (pagination counts, timestamps, application-specific information).
- **Links Key**: Contains hypermedia links (self, first, prev, next, last, related).
- **Errors Key**: Present in error responses; contains an array of error objects rather than wrapping error info inside `data`.
- **Consistent Structure**: Every response from the API follows the same top-level key contract regardless of success or failure.

## Mental Models
- **Mail Envelope**: The envelope carries delivery information (meta, links, errors) while the letter inside (data) is the actual content. The recipient inspects the envelope first to know how to handle the letter.
- **Traffic Light**: The envelope is the traffic light — it tells the client whether to proceed, stop, or handle a fault. The data key is what happens after the light turns green.
- **Contract Surface**: The envelope is the API's guaranteed contract surface. Clients depend on `response.data` existing. Breaking the envelope shape is a breaking change.

## Internal Mechanics
- **Serialization Pipeline**: In Laravel, resources pass through `toArray()` → `with()` (meta) → `additional()` → `response()` which constructs the envelope. The `Resource` base class assembles `data`, and `PaginatedResourceResponse` injects pagination meta and links.
- **Top-Level Wrapping**: Laravel's `$wrap` property on resources controls whether the resource is wrapped in a key (e.g. `{ "data": { ... } }` vs. `{ ... }`). The default wrapping behavior changed across Laravel versions.
- **Error Responses**: Exception handlers typically build envelope error responses with `errors` array, `message`, and optional `status` code. Consistent envelope shape for errors prevents clients from needing different parsing logic.
- **Collection Responses**: `ResourceCollection` always wraps in a `data` key by default. Meta and links are merged at the top level alongside `data`, never nested inside it.

## Patterns
- **Consistent Envelope Pattern**: Every endpoint returns `{ data, meta?, links?, errors? }`. Clients write a single response parser.
- **Error-Only Envelope**: On failure, `data` is omitted or null, and `errors` is populated. This prevents clients from accidentally using stale data.
- **Pagination Envelope**: Paginated collections inject `meta.current_page`, `meta.last_page`, `meta.per_page`, `meta.total`, and `links.first`, `links.last`, `links.prev`, `links.next`.
- **Envelope Wrapper Middleware**: Middleware that intercepts raw responses and wraps them into the envelope, ensuring consistency even for early returns or validation failures.

## Architectural Decisions
- **Wrap All Responses vs. Selective Wrapping**: Wrapping all responses (including single resources) provides consistency but adds nesting. Some APIs unwrap single resources and only wrap collections. JSON:API always wraps.
- **Data Key Singular vs. Plural**: Some frameworks wrap single resources in `data` and collections in `data` as well (JSON:API). Others use singular key for single, plural for collections. Choose one and document.
- **Null Data vs. Omission**: On 404 or empty results, decide whether `data` is `null` or the key is absent. JSON:API uses `null` for to-one relationships and omits for empty to-many. Consistency matters more than the choice.
- **Resource Wrapping Key**: The resource wrapper key (`$wrap` property) determines if `{ data: { ... } }` becomes `{ user: { ... } }`. Custom keys couple the client to the resource name and are generally discouraged in favor of generic `data`.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Predictable client parsing | Extra nesting depth | Clients always access `response.data` instead of direct properties |
| Consistent error handling | Bandwidth overhead from wrapper keys | Every response carries structural keys that could be KB-level overhead at scale |
| Decoupled metadata transport | Caching granularity is coarser | Envelope changes (e.g. adding a meta field) invalidate the entire cached response |
| Versioning flexibility | More complex response construction | Need to maintain envelope assembly logic in serializers/middleware |
| Easier client-side interceptors | Breaking change if envelope shape changes | Any new top-level key is additive, but removing one is breaking |

## Performance Considerations
- **Serialization Cost**: Assembling envelope objects adds CPU overhead per request. For high-throughput endpoints, use simple arrays over Eloquent resource objects.
- **Response Size Inflation**: Wrapper keys like `"data"` and `"meta"` add bytes to every response. At scale with millions of requests, this bandwidth cost is non-trivial. Consider compression (see response-compression).
- **Pagination Metadata Cost**: For large collections, computing `total` and `last_page` requires a count query. Use cursor pagination when count queries are expensive.
- **Caching Strategy**: Envelope changes (adding a new meta field) fragment cache keys. Design the envelope shape to be stable.

## Production Considerations
- **Envelope Versioning**: Introduce envelope version via Accept header or URL prefix to allow evolving the envelope shape without breaking existing clients.
- **Monitoring Envelope Compliance**: Write integration tests that assert every response matches the envelope contract. A missing `data` key in a 200 response will break all clients.
- **Error Envelope Completeness**: Ensure error envelopes always include `message` and `status` fields. Clients in incident response mode depend on these.
- **Logging Envelope Structure**: Log malformed envelope responses server-side to catch serialization bugs early.
- **API Gateway Compatibility**: Some API gateways (AWS API Gateway, Kong) can strip or modify response structure. Test the full path.

## Common Mistakes
- **Inconsistent Envelope on Errors**: Returning `{ error: "message" }` instead of `{ errors: [...] }` forces clients to write conditional parsing.
- **Omitting Data on Success**: Returning 204 No Content without an envelope is correct, but returning 200 with `{ data: null }` when the resource was deleted can confuse clients.
- **Mixing Envelope Styles**: Some endpoints use envelope, others return bare JSON. This inconsistency erodes client trust.
- **Mutating Envelope in Middleware**: Modifying the envelope shape in middleware after serialization can break resource-specific metadata.
- **Hardcoding Envelope Keys**: Stringly-typed envelope keys make refactoring difficult. Use constants or a response builder class.

## Failure Modes
- **Envelope Omission on Early Returns**: Laravel middleware or validation that returns `response()->json(...)` without passing through the wrapping logic delivers a non-envelope response.
- **Deeply Nested Envelopes**: Some implementations nest meta inside data, or links inside meta, creating inconsistent depths that confuse clients.
- **Array Returns**: Returning a raw PHP array from a controller bypasses resource serialization entirely, producing an unenveloped response.
- **Collection Without Wrapping**: `ResourceCollection::make()` defaults to wrapping in `data`, but calling `collect()` on resources may not.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Resources\Json\ResourceResponse` and `PaginatedResourceResponse` build the standard envelope. `Resource::wrap()` and `Resource::withoutWrapping()` control the `data` key.
- **JSON:API**: Strict envelope format where `data`, `included`, `meta`, `links`, and `errors` are the only top-level keys. Compound documents include `included` alongside `data`.
- **Spatie/laravel-json-api-paginate**: Integrates pagination metadata into response envelopes.
- **Laravel Nova**: Uses envelope responses with `data`, `meta`, `links` keys throughout its API.
- **Laravel Forge API**: Returns envelope responses with top-level `data` key and meta objects.

## Related Knowledge Units
### Prerequisites
- bare-body-response-design
- resource-controllers (base domain)

### Related Topics
- data-wrapping-configuration
- top-level-meta-and-links
- json-api-resource-structure

### Advanced Follow-up Topics
- json-api-compound-documents
- rfc-9457-problem-details
- response-versioning

## Research Notes
### Source Analysis
Laravel's `Resource` class introduced the `$wrap` property to control the envelope data key. The default changed from wrapping in the resource name (Laravel 6/7) to wrapping in `"data"` (Laravel 8+). This change was a reaction to JSON:API's influence and the community preference for a generic wrapper key.

### Key Insight
The most robust envelope designs are those that treat the envelope shape as a separate contract from the resource shape. Changing the envelope requires client version negotiation; changing the data shape can be done within the same envelope.

### Version-Specific Notes
- Laravel 8+: Default `$wrap` is `'data'`
- Laravel 7-: Default `$wrap` was the resource class basename (e.g. `'user'`)
- `withoutWrapping()` was introduced to opt out of envelope altogether
