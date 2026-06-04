# HATEOAS / Hypermedia Controls

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: hateoas-hypermedia-controls
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Always Include Self Link On Every Resource
---
## Category
Design
---
## Rule
Always include a `self` link with `href` and `method` on every resource response — never return a resource without its canonical URL.
---
## Reason
Clients need to identify which resource they are viewing and know its canonical URL. Without a `self` link, the client cannot construct a URL to refresh the resource, share it, or reference it in other operations. The `self` link is the minimum HATEOAS element that provides value to all clients.
---
## Bad Example
```php
return [
    'id' => $this->id,
    'name' => $this->name,
    // No self link — client cannot construct resource URL
];
```

## Good Example
```php
return [
    'id' => $this->id,
    'name' => $this->name,
    '_links' => [
        'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
    ],
];
```

## Exceptions
Nested resources within collections where the parent collection already contains the full URL context. Even then, a self link is recommended for consistency.

## Consequences Of Violation
Clients cannot programmatically refresh resources; increased hardcoded URL dependencies; reduced API discoverability; integration testing is harder without canonical URLs.
---

## Only Include Actionable Links
---
## Category
Design
---
## Rule
Always generate links conditionally based on authorization and resource state — never include links that would return 403 or 404 when followed.
---
## Reason
Including links the client cannot use erodes trust in the API's link accuracy. Clients that discover `update` links may attempt to follow them and receive 403 errors. State-driven links (e.g., `restore` only for deleted resources) prevent clients from attempting invalid operations.
---
## Bad Example
```php
return [
    'id' => $this->id,
    '_links' => [
        'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
        'update' => ['href' => route('users.update', $this), 'method' => 'PUT'],
        'delete' => ['href' => route('users.destroy', $this), 'method' => 'DELETE'],
        // Links included even if user cannot update or delete
    ],
];
```

## Good Example
```php
$links = ['self' => ['href' => route('users.show', $this), 'method' => 'GET']];
if ($request->user()?->can('update', $this)) {
    $links['update'] = ['href' => route('users.update', $this), 'method' => 'PUT'];
}
if ($this->trashed()) {
    $links['restore'] = ['href' => route('users.restore', $this), 'method' => 'POST'];
}
return ['id' => $this->id, 'name' => $this->name, '_links' => $links];
```

## Exceptions
When the API serves public documentation where all possible actions are listed regardless of auth state. Document that links may return 403 when followed.

## Consequences Of Violation
Clients follow links and receive 403/404; wasted bandwidth transmitting unusable links; client developers lose trust in the API's link accuracy.
---

## Use Named Routes With route() Helper For Link Generation
---
## Category
Maintainability
---
## Rule
Always use the `route()` helper with named routes for link URL generation — never hardcode URL strings or use string concatenation.
---
## Reason
Hardcoded URL strings break when the environment changes (localhost vs production, different domain names). Named routes abstract the actual URL pattern — Laravel resolves the correct URL based on the current environment's `APP_URL`. Changing a route pattern updates all links automatically.
---
## Bad Example
```php
'href' => '/api/users/' . $this->id, // breaks if prefix or structure changes
```

## Good Example
```php
'href' => route('users.show', $this), // always correct regardless of prefix
```

## Exceptions
When linking to external systems not controlled by this Laravel application. External URLs must be hardcoded or read from config.

## Consequences Of Violation
Broken links after environment change; links pointing to wrong domain in production; fragile code that breaks on URL restructuring; time wasted debugging environment-specific link failures.
---

## Generate Only First/Prev/Next/Last For Pagination Links
---
## Category
Performance
---
## Rule
Always generate only `self`, `first`, `prev`, `next`, and `last` pagination links — never generate links for every individual page in large result sets.
---
## Reason
A 500-page result set would require 500 link objects, adding ~50KB of overhead to every collection response. Standard pagination links are sufficient for navigation — clients only need to move forward, backward, or jump to the ends. Per-page links waste bandwidth without providing value.
---
## Bad Example
```php
'_links' => [
    'page_1' => ['href' => $this->url(1), 'method' => 'GET'],
    'page_2' => ['href' => $this->url(2), 'method' => 'GET'],
    // ... 498 more page links
    'page_500' => ['href' => $this->url(500), 'method' => 'GET'],
];
```

## Good Example
```php
'_links' => [
    'self' => ['href' => $this->url($this->currentPage()), 'method' => 'GET'],
    'first' => ['href' => $this->url(1), 'method' => 'GET'],
    'prev' => ['href' => $this->previousPageUrl(), 'method' => 'GET'],
    'next' => ['href' => $this->nextPageUrl(), 'method' => 'GET'],
    'last' => ['href' => $this->url($this->lastPage()), 'method' => 'GET'],
];
```

## Exceptions
When the result set is small (fewer than 10 pages) and the client explicitly needs all page URLs for prefetching. Even then, document why per-page links are provided.

## Consequences Of Violation
Response payload bloat for large result sets; increased bandwidth costs; slower serialization time; clients overwhelmed by unnecessary link data.
---

## Batch Authorization Checks For Collection Link Generation
---
## Category
Performance
---
## Rule
Always batch authorization checks using model policies when generating per-item links for collections — never perform individual authorization checks inside resource serialization.
---
## Reason
Individual `$request->user()->can('update', $item)` inside a resource's `toArray()` triggers one database query per item via policy lookups. A 100-item collection with 4 link checks produces 400+ queries. Batch authorization checks with `User::whereIn(...)` reduce this to a single query.
---
## Bad Example
```php
// Inside UserResource::toArray — N+1 queries for 100 users
if ($request->user()?->can('update', $this->resource)) {
    $links['update'] = ['href' => route('users.update', $this), 'method' => 'PUT'];
}
```

## Good Example
```php
// Controller loads authorization data before pagination
$updatableIds = $request->user()->canUpdateUsers()->pluck('id');
$users->each(function ($user) use ($updatableIds) {
    $user->can_update = $updatableIds->contains($user->id);
});

// Resource reads pre-computed value
if ($this->can_update) {
    $links['update'] = ['href' => route('users.update', $this), 'method' => 'PUT'];
}
```

## Exceptions
When the collection size is small (<20 items) and authorization checks are cheap (in-memory policies with no DB queries). Even then, batch checks are good practice.

## Consequences Of Violation
N+1 query problem on every collection response; degraded API performance under load; increased database connection pool pressure; slow response times for paginated endpoints.
---

## Include Method In Every Link Object
---
## Category
Design
---
## Rule
Always include the `method` (HTTP verb) in every link object — never return links without specifying which HTTP method to use.
---
## Reason
Clients need to know which HTTP method to use when following a link. A `self` link uses GET, an `update` link uses PUT, a `delete` link uses DELETE. Without the `method` field, clients must guess or maintain a separate mapping of operations to methods, defeating the purpose of hypermedia discoverability.
---
## Bad Example
```php
'_links' => [
    'self' => ['href' => route('users.show', $this)], // no method — client must guess GET
];
```

## Good Example
```php
'_links' => [
    'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
    'update' => ['href' => route('users.update', $this), 'method' => 'PUT'],
];
```

## Exceptions
When the link relationship type (rel) unambiguously defines the method (e.g., IANA-registered `self` is always GET). Still include the method for consistency.

## Consequences Of Violation
Clients cannot programmatically use links; client developers must maintain external method mapping; hypermedia discoverability is broken; client integration is harder than necessary.
---

## Include API Root Links For Discoverability
---
## Category
Architecture
---
## Rule
Always provide an API root endpoint (`GET /api`) that returns links to all available top-level resources — never leave clients without an entry point.
---
## Reason
The API root is the entry point for hypermedia-driven clients. It provides a single URL that a client can use to discover all available resources. Without it, clients must hardcode resource URLs from documentation, defeating the discoverability benefit of HATEOAS.
---
## Bad Example
```php
// No API root endpoint — clients must know all URLs from documentation
```

## Good Example
```php
Route::get('api', function () {
    return response()->json([
        '_links' => [
            'users' => ['href' => route('users.index'), 'method' => 'GET'],
            'orders' => ['href' => route('orders.index'), 'method' => 'GET'],
            'profile' => ['href' => route('profile.show'), 'method' => 'GET'],
        ],
    ]);
});
```

## Exceptions
Private internal APIs with a single consumer that already hardcodes all URLs from documentation. The API root provides no value if no client uses it.

## Consequences Of Violation
Reduced API discoverability; new client integrations must refer to external documentation for entry points; increased hardcoded URL dependencies in clients.
---

## Use Consistent Link Rel Values Across The API
---
## Category
Maintainability
---
## Rule
Always use consistent, IANA-registered link relation (`rel`) values across all resources — never invent custom rel values when a standard one exists.
---
## Reason
Standard rel values (`self`, `next`, `prev`, `first`, `last`) are understood by generic HTTP clients and documentation generators. Custom rel values force every client to learn your specific vocabulary. Once a rel value is released, changing it breaks existing clients.
---
## Bad Example
```php
'_links' => [
    'get_this_user' => ['href' => route('users.show', $this), 'method' => 'GET'],
    'page_after' => ['href' => $this->nextPageUrl(), 'method' => 'GET'],
];
```

## Good Example
```php
'_links' => [
    'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
    'next' => ['href' => $this->nextPageUrl(), 'method' => 'GET'],
];
```

## Exceptions
Domain-specific operations with no IANA standard (e.g., `pay`, `refund`, `cancel`). Use custom rel values only when no standard exists, and document them clearly.

## Consequences Of Violation
Clients must learn API-specific vocabulary; documentation generators produce incomplete link documentation; client integration is harder than necessary; future migration requires maintaining backward compatibility for custom rels.
---
