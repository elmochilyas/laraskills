# HATEOAS / Hypermedia Controls

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: hateoas-hypermedia-controls
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
HATEOAS (Hypermedia as the Engine of Application State) is the most challenging REST constraint. It requires that API responses include hypermedia links that guide clients to the next possible actions. A client that understands hypermedia formats can navigate a REST API entirely through links, without prior knowledge of the URL structure.

In practice, HATEOAS adoption is low — most production APIs provide link objects (self, next, prev, related resources) without fully implementing hypermedia-driven navigation. The practical consensus is that self links and pagination links provide value, but full hypermedia-driven navigation is rarely implemented because clients don't use it.

## Core Concepts
- **HATEOAS Constraint**: Server guides client state transitions by embedding links in responses. Clients discover URLs from hypermedia, not from documentation.
- **Link Object**: Standard structure with `href` (target URL), `rel` (relationship), `method` (HTTP method), optional `title`.
- **Self Link**: Canonical URL for the current resource. Every resource response should include a `self` link.
- **State-Driven Links**: Links change based on resource state and authorization — active user gets `deactivate`, suspended user gets `activate`.
- **Pagination Links**: `self`, `first`, `prev`, `next`, `last` on collection responses.
- **API Root Links**: Top-level entry points — `/api` returns links to all available resources.
- **Hypermedia Formats**: HAL (`_links`, `_embedded`), JSON:API (comprehensive), Siren (entity-based), Collection+JSON.

## When To Use
- APIs with complex state machines where links encode valid transitions
- Public APIs where discoverability is a design goal
- APIs consumed by hypermedia-native clients or generated SDKs
- APIs where URL restructuring is anticipated (links decouple clients from URLs)
- API root endpoints that list available entry points

## When NOT To Use
- Simple CRUD APIs where URL structure is stable and well-documented
- Internal microservices where clients are developed in-house and can be coordinated
- Bandwidth-constrained environments where link payload overhead matters
- APIs where the primary consumers are not hypermedia-aware (most HTTP clients)
- Prototypes/MVPs where link generation adds complexity without immediate benefit

## Best Practices (WHY)
- **Always include self links**: Every resource response needs a canonical URL. Clients use `self` links to identify which resource they're viewing.
- **Include only actionable links**: If a link would return 403 or 404 when followed, don't include it. State-driven links should reflect actual capabilities.
- **Use named routes for link generation**: Always use `route()` helper with named routes — never hardcode URL strings. Different environments produce different base URLs.
- **Generate only first/prev/next/last for pagination**: Don't generate links for every page in a 500-page result set. The standard four navigation links are sufficient.
- **Conditionally compute links based on auth**: Batch authorization checks using model policies to minimize query count when computing links per item in collections.

## Architecture Guidelines
- Standardize on a `_links` object structure at both resource and collection levels.
- Use consistent `rel` values (IANA Link Relations where applicable). Never change link `rel` values after release.
- HATEOAS links must use the correct base URL — set `APP_URL` to the API domain in production.
- Links from cached responses may point to deleted resources — clients must handle link staleness gracefully.
- Full HATEOAS (hypermedia-driven navigation) requires significantly more server complexity than pragmatic links. Start with self + pagination links.
- For collections, avoid per-item link generation that requires N+1 queries — eager load or batch compute.

## Performance
- Each link object adds ~50-100 bytes per response. For collections of 100 items with 4 links each: 20-40KB overhead.
- Conditional link computation based on authorization adds per-item processing — batch auth checks.
- Pagination link generation for large result sets (500+ pages) is wasteful — generate only first/prev/next/last.
- Link generation in resource `toArray()` adds serialization time — ~5-15ms for 100-item collections.

## Security
- State-driven links must respect authorization — never include links to actions the current client cannot perform.
- Links must not expose internal server hostnames, IP addresses, or non-public endpoints.
- `self` link URLs should use HTTPS and the public-facing API domain.
- Authorization claims used for link computation must be re-validated when the link is followed (authorization may change between response and action).

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| All links regardless of state | Including links that return 403/404 when followed | Easier than computing state-driven links | Clients lose trust in link accuracy | Only include links the client can successfully follow |
| Missing self links | No canonical URL on resource responses | Focus on data payload | Clients cannot identify which resource they're viewing | Always include a `self` link on every resource |
| Hardcoded URL strings | `"href": "/users/42"` instead of `route()` helper | Convenience | Different environments produce wrong URLs | Always use named routes with `route()` helper |
| Links no client uses | Implementing full HATEOAS without hypermedia-aware clients | "REST requires it" | Bandwidth waste, no client benefit | Start with self/pagination links; add more when clients use them |
| Circular link graphs | Resource A → B → C → A without bound | Poor link graph design | Naive clients may infinite-loop | Design link graphs as DAGs where possible |
| Link authorization mismatch | Links based on auth at response time but auth changes before link is followed | Temporal gap between response and action | Followed links return 403 | Document that followed links may fail; return clear error |

## Anti-Patterns
- **Full HATEOAS Without Client Buy-In**: Server requires clients to follow links, but clients hardcode URLs from documentation.
- **Links on Every Response Without Consideration**: Adding the same set of links to every resource regardless of state.
- **Hardcoded href Values**: Using string concatenation instead of `route()` helper for link URLs.
- **Authorization in Links**: Embedding tokens or auth state in link URLs.
- **Resource Links Without Method**: Link objects missing the `method` field — clients don't know which HTTP verb to use.

## Examples
```php
// Resource with self link and state-driven action links
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        $links = [
            'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
        ];
        
        if ($request->user()?->can('update', $this)) {
            $links['update'] = ['href' => route('users.update', $this), 'method' => 'PUT'];
        }
        if ($this->trashed()) {
            $links['restore'] = ['href' => route('users.restore', $this), 'method' => 'POST'];
        }
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            '_links' => $links,
        ];
    }
}

// Pagination links in collection
class UserCollection extends ResourceCollection
{
    public function toArray($request)
    {
        return [
            'data' => $this->collection,
            '_links' => [
                'self' => ['href' => $this->url($this->currentPage()), 'method' => 'GET'],
                'first' => ['href' => $this->url(1), 'method' => 'GET'],
                'prev' => ['href' => $this->previousPageUrl(), 'method' => 'GET'],
                'next' => ['href' => $this->nextPageUrl(), 'method' => 'GET'],
                'last' => ['href' => $this->url($this->lastPage()), 'method' => 'GET'],
            ],
        ];
    }
}

// API root with entry point links
class ApiRootResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            '_links' => [
                'users' => ['href' => route('users.index'), 'method' => 'GET'],
                'orders' => ['href' => route('orders.index'), 'method' => 'GET'],
                'profile' => ['href' => route('profile.show'), 'method' => 'GET'],
            ],
        ];
    }
}
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, url-structure-design
- **Related**: rest-maturity-model, response-structures, pagination-strategies
- **Advanced**: api-documentation-generation, client-sdk-generation

## AI Agent Notes
- Always include `self` link on every resource response using `route()` helper.
- Generate links conditionally based on authorization — only include links the client can use.
- For collections, batch authorization checks to avoid N+1 queries.
- Use consistent `rel` values and link object structure across all resources.
- Generate only first/prev/next/last pagination links — not every page.
- Never hardcode URL strings — always use named routes.

## Verification
- Every resource response includes a `self` link with correct `href` and `method`.
- Paginated collection responses include `self`, `first`, `prev`, `next`, `last` links.
- Links change based on resource state (e.g., deleted resources show `restore`, not `update`).
- All links use `route()` helper with named routes — no hardcoded URL strings.
- Links are computed using authorization checks — unauthorized actions are not linked.
- API root endpoint (`GET /api`) returns links to all available entry points.
