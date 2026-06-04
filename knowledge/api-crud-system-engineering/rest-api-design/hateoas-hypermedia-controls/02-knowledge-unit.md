# HATEOAS / Hypermedia Controls

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** HATEOAS / Hypermedia Controls
- **Last Updated:** 2026-06-02

---

## Executive Summary

HATEOAS (Hypermedia as the Engine of Application State) is the most challenging REST constraint. It requires that API responses include hypermedia links that guide clients to the next possible actions. A client that understands hypermedia formats can navigate a REST API entirely through links, without prior knowledge of the URL structure.

In practice, HATEOAS adoption is low — most production APIs provide link objects (self, next, prev, related resources) without fully implementing the hypermedia-driven vision. The most common implementation is a `links` object on each resource containing at minimum a `self` link, with pagination links (`first`, `prev`, `next`, `last`) on collections. Full hypermedia formats (HAL, JSON:API, Siren) are rare in Laravel ecosystems.

---

## Core Concepts

### The HATEOAS Constraint
The server guides client state transitions by embedding links in responses. The client does not construct URLs — it discovers URLs from hypermedia. This decouples clients from server URL structures.

### Link Object Structure
A standard link object contains:
```json
{
    "self": { "href": "/users/42", "method": "GET" },
    "orders": { "href": "/users/42/orders", "method": "GET" },
    "update": { "href": "/users/42", "method": "PATCH" },
    "delete": { "href": "/users/42", "method": "DELETE" }
}
```

### Key Properties
- **href:** The target URL (required)
- **rel:** Relationship type (self, next, prev, related)
- **method:** HTTP method for the link
- **title:** Human-readable label (optional)

### Hypermedia Formats

| Format | Description | Laravel Support |
|---|---|---|
| HAL (JSON HAL) | Standardized link format with `_links` and `_embedded` | Community packages |
| JSON:API | Comprehensive spec including links, relationships, includes | `laravel-json-api` package |
| Siren | Entity-based hypermedia with actions and fields | Community packages |
| Collection+JSON | Read/write hypermedia for collections | Community packages |
| Custom | Project-specific link structure | Direct implementation |

---

## Mental Models

### The Web Page Model
A web page contains links to other pages. The browser doesn't need to know all URLs — it follows links. HATEOAS applies the same principle to API responses: the response tells the client what it can do next.

### The State Machine Model
Each API response represents a state. Links represent valid state transitions. A user resource in "active" state includes links for "deactivate" and "suspend" but not "activate." When the user is "inactive," the links change to provide "activate" instead.

### The Menu Model
An API response is a menu of available actions. The server decides what's on the menu based on the current resource state and the client's authorization level. The client picks from the menu.

---

## Internal Mechanics

### Laravel JSON Resource Link Addition
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            '_links' => [
                'self' => [
                    'href' => route('users.show', $this),
                    'method' => 'GET',
                ],
                'orders' => [
                    'href' => route('users.orders.index', $this),
                    'method' => 'GET',
                ],
                'update' => [
                    'href' => route('users.update', $this),
                    'method' => 'PATCH',
                ],
                'delete' => [
                    'href' => route('users.destroy', $this),
                    'method' => 'DELETE',
                ],
            ],
        ];
    }
}
```

### Conditional Links Based on State
```php
public function toArray(Request $request): array
{
    $links = [
        'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
    ];
    
    if ($request->user()->can('update', $this)) {
        $links['update'] = ['href' => route('users.update', $this), 'method' => 'PATCH'];
    }
    if ($request->user()->can('delete', $this)) {
        $links['delete'] = ['href' => route('users.destroy', $this), 'method' => 'DELETE'];
    }
    if ($this->trashed()) {
        $links['restore'] = ['href' => route('users.restore', $this), 'method' => 'POST'];
    }
    
    return [
        ...parent::toArray($request),
        '_links' => $links,
    ];
}
```

### Pagination Links in Collections
Laravel's `LengthAwarePaginator` provides URL methods used in resource collections:
```php
class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'current_page' => $this->currentPage(),
                'total' => $this->total(),
                'per_page' => $this->perPage(),
            ],
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
```

---

## Patterns

### Self Link Pattern
Every resource response includes a `self` link so clients have the canonical URL:
```json
{ "id": 42, "name": "John", "_links": { "self": { "href": "/users/42", "method": "GET" } } }
```

### Pagination Links Pattern
Collection responses include navigation links:
```json
{
    "data": [...],
    "_links": {
        "self": { "href": "/users?page=2", "method": "GET" },
        "first": { "href": "/users?page=1", "method": "GET" },
        "prev": { "href": "/users?page=1", "method": "GET" },
        "next": { "href": "/users?page=3", "method": "GET" },
        "last": { "href": "/users?page=10", "method": "GET" }
    }
}
```

### State-Driven Links Pattern
Links change based on resource state:
- Active user: includes `deactivate`, `suspend` links
- Suspended user: includes `activate`, `delete` links
- Deleted user: includes `restore`, `permanent-delete` links

### Top-Level Links Pattern
API root endpoint returns available entry points:
```json
GET /api
{
    "_links": {
        "users": { "href": "/users", "method": "GET" },
        "orders": { "href": "/orders", "method": "GET" },
        "profile": { "href": "/profile", "method": "GET" }
    }
}
```

---

## Architectural Decisions

### Full HATEOAS vs Pragmatic Links
Full HATEOAS (hypermedia-driven navigation) requires significant server complexity and specialized clients. Pragmatic links (self, pagination, related resources) provide 80% of the benefit with 20% of the effort. Decision: implement pragmatic links by default; consider full HATEOAS only if clients are hypermedia-native.

### Embedded Format Choice
If adopting a hypermedia format:
- **HAL:** Simplest, most widely supported, good for pragmatic adoption
- **JSON:API:** Comprehensive, includes relationships and includes support, but verbose
- **Custom:** Maximum flexibility, no dependency, but no tooling

### Link Object Structure
Standardize on a `_links` object at the resource level and collection level. Use consistent rel values (IANA Link Relations where applicable). Never change link rel values after release.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clients discover URLs dynamically | Responses are larger (link payload) | 10-30% bandwidth increase from links |
| Server can restructure URLs | Client hypermedia parsing is complex | Most clients ignore links entirely |
| State-driven links encode business rules in API | Server must compute link visibility per request | Additional processing for each response |
| Self links provide canonical resource identifiers | Links encode base URL, complicating local testing | Must configure APP_URL correctly |

---

## Performance Considerations

### Link Payload Size
Each link object adds ~50-100 bytes to the response. For collections of 100 items with 4 links each, this adds 20-40KB. Consider whether every item needs full links or if a link template suffices.

### Conditional Link Computation
Computing links conditionally (based on auth, resource state) adds per-item processing. Batch the authorization checks using model policies with `User::canMany()` pattern to minimize query count.

### Pagination Link Generation
Laravel's paginator generates URLs for every page. For large result sets (500+ pages), generating all pagination links is wasteful. Generate only `first`, `prev`, `next`, `last` — not every page link.

---

## Production Considerations

### Base URL Configuration
HATEOAS links must use the correct base URL. Set `APP_URL` in production to the API domain. In multi-environment setups (staging, production), links must reflect the current environment's base URL.

### Link Target Changes Under Migration
When URLs change (new version, renamed resources), old links returned by the server still point to old URLs. HATEOAS clients follow links, so the server must update links when URLs change. This is easier than hardcoded URL clients.

### Testing Link Correctness
Write tests that assert:
- Every resource response has a `self` link
- Paginated responses have navigation links
- State-driven links appear/disappear correctly
- All links resolve to valid endpoints (integration tests)

---

## Common Mistakes

### Returning Links But Clients Never Use Them
Why it happens: Developers implement HATEOAS because "REST requires it." Why it's harmful: Adds bandwidth and complexity without benefit. Better approach: Either commit to hypermedia-driven clients or provide minimal self/pagination links with clear documentation.

### Including All Possible Links Regardless of State
Why it happens: Easier to compute once than conditionally. Why it's harmful: Clients see links that return 403/404 when followed, eroding trust in the API. Better approach: Only include links that the current client can successfully follow.

### Missing Self Links on Nested Resources
Why it happens: Focus is on the data payload, not the metadata. Why it's harmful: Clients cannot identify which resource they're looking at in a list. Better approach: Always include a `self` link on every resource representation.

### Hardcoding URLs in Link Objects
Why it happens: `route()` helper returns the base URL from config. Why it's harmful: Different environments produce different links; local development may use different ports. Better approach: Always use named routes with `route()` helper, never hardcode URL strings.

---

## Failure Modes

### Circular Link Graphs
Links that form cycles (resource A → B → C → A) can cause infinite loops in naive hypermedia clients. Design link graphs as DAGs where possible. Pagination links are the natural exception (prev/next cycle is bounded).

### Stale Links After Resource Deletion
A cached response contains links to a resource that is deleted between cache generation and link following. The client follows the link and gets 404. The client must handle link staleness gracefully.

### Authorization Mismatch
Links are computed based on authorization at response time, but authorization may change by the time the client follows the link. Session expiry, role changes, or resource state changes can cause followed links to fail.

---

## Ecosystem Usage

### GitHub API
GitHub implements pagination links (`Link` header with `rel="next"`, `rel="last"`) and provides `url` fields on resources. GitHub does not implement full hypermedia-driven discovery — clients must know URL patterns.

### Stripe API
Stripe provides minimal hypermedia: pagination links in list responses and object IDs for related resources. Stripe does not provide action links — clients construct action URLs from documentation.

### JSON:API Adherents
Fractal-based APIs and `laravel-json-api` projects implement JSON:API format with full hypermedia including relationships, links, and includes. These are rare but demonstrate the full HATEOAS pattern.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — The HATEOAS constraint
- URL Structure Design — Link target URL conventions

### Related Topics
- REST Maturity Model — Level 3 (hypermedia) maturity
- Response Structures — Response envelope design
- Pagination Strategies — Pagination link generation

### Advanced Follow-up Topics
- API Documentation Generation — Hypermedia spec generation
- Client SDK Generation — Hypermedia-aware SDKs

---

## Research Notes

### Source Analysis
- Fielding, Roy T. "REST APIs must be hypertext-driven." 2008 — Clarifies that APIs without hypermedia are not REST
- Richardson, Leonard, and Ruby, Sam. "RESTful Web Services." O'Reilly, 2007 — Practical hypermedia guidance
- JSON:API Specification (https://jsonapi.org) — Standardized hypermedia format

### Key Insight
HATEOAS is the most violated REST constraint in production. The practical consensus is that self links and pagination links provide value, but full hypermedia-driven navigation is rarely implemented because clients don't use it. The industry has settled on a pragmatic subset of HATEOAS.

### Version-Specific Notes
- Laravel 10-13: No native HATEOAS support; must be implemented in resource classes
- `spatie/laravel-json-api-paginate` provides JSON:API-compatible pagination links
- Laravel resource collections support custom link structures via `with()` and `additional()`
