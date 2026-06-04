# Anti-Patterns: Top-Level Meta and Links

## Missing Meta
**Description:** Response returns only `{ "data": [...] }` without any top-level `meta` or `links` objects. Consumers have no context about request ID, API version, or pagination state.
**Why it happens:** Developers focus on the data payload and forget to include response metadata.
**Consequences:** Cannot trace requests across logs; clients don't know API version for compatibility; paginated responses lack navigation context.
**Better approach:** Always include top-level meta with at minimum `request_id` and `api_version`. Include pagination meta for collections.

## Inconsistent Structure
**Description:** Some endpoints return `meta`, others don't. Some include `links`, others don't. The key names change between endpoints.
**Why it happens:** Each endpoint is implemented independently without a shared response template or base class.
**Consequences:** Clients cannot write generic response parsers; every endpoint requires custom handling; documentation becomes complex.
**Better approach:** All envelope responses use `{ "data": ..., "meta": ..., "links": ... }` — enforced by a shared base class or response macro.

## Internal Data In Meta
**Description:** Meta fields expose server internals — database query counts, memory usage, SQL timings, or internal server IPs.
**Why it happens:** Debug-oriented developers leave verbose output in meta that was helpful during development.
**Consequences:** Information disclosure; attackers learn about database structure and server internals; compliance issues.
**Better approach:** Meta contains consumer-facing information only. Internal metrics belong in monitoring, not API responses.

## Mixed Meta and Links
**Description:** Pagination state (page, per_page, total) is placed in `links` and navigation URLs are placed in `meta`, mixing responsibilities.
**Why it happens:** No clear separation of concerns between what goes in meta vs links.
**Consequences:** Clients cannot rely on consistent field locations; parsing logic is error-prone.
**Better approach:** Pagination state (page, per_page, total) belongs in `meta`. Navigation URLs (first, prev, next, last) belong in `links`. Never duplicate or mix.

## No Self Links
**Description:** Resources are returned without a `self` link, forcing clients to construct URLs from path segments.
**Why it happens:** Developers assume consumers know the URL pattern or embed URL construction in client code.
**Consequences:** Brittle client code; URL pattern changes break clients; no canonical resource identifier.
**Better approach:** Every resource response includes a `self` link pointing to the resource's canonical URL. Use `route()` helper with bound parameters.

## Over-Meta-ing
**Description:** Meta object contains 15+ fields including rarely-used data like processing timestamps, server identifiers, feature flags, and internal labels.
**Why it happens:** Every feature team adds their metadata to the response envelope without governance.
**Consequences:** Response body bloat; confusion about which meta fields are stable vs experimental.
**Better approach:** Keep meta concise. Include only fields that every consumer needs. Move optional or infrequently-used data behind a `?meta=extended` parameter.
