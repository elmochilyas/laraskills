# URL Structure Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** URL Structure Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

URL structure design defines the hierarchy, identifiers, query parameters, and versioning strategy for an API's URI space. A well-designed URL structure makes the API intuitive, predictable, and stable over time. The URL is the primary interface contract between client and server — every change to a URL is a breaking change for clients that have hardcoded it.

The key design dimensions are: path hierarchy (how resources nest), identifier strategy (what identifies a resource — IDs, UUIDs, slugs), query parameter conventions (filtering, sorting, including, searching), and versioning placement (path prefix, header, or query param). Laravel's routing system supports all of these patterns natively through route parameters, route groups, and middleware.

---

## Core Concepts

### URL Anatomy
```
https://api.example.com/v1/users/42/orders?filter[status]=active&sort=-created_at
\___/  \____________/ \_/\_____/\_/\_____/ \______________________/\______________/
scheme    authority    base version collection identifier action    query parameters
```

### Path Hierarchy
- **Collection:** `/users` — list of user resources
- **Member:** `/users/42` — single user resource
- **Nested collection:** `/users/42/orders` — orders belonging to user 42
- **Nested member:** `/users/42/orders/99` — specific order of user 42

### Identifier Strategies

| Type | Example | Pros | Cons |
|---|---|---|---|
| Auto-increment ID | `/users/42` | Short, fast, cache-friendly | Predictable, exposes count, merges issues |
| UUID | `/users/550e8400-e29b-41d4-a716-446655440000` | Globally unique, not predictable | Long URLs, slower indexes |
| Slug | `/users/john-doe` | Human-readable, SEO-friendly | Can change, may collide |
| Hash ID (hashids) | `/users/abc123` | Obfuscated ID, short | Entropy limited, hash collisions possible |

### Query Parameter Conventions

| Concept | Convention | Example |
|---|---|---|
| Filtering | `filter[field]=value` | `?filter[status]=active` |
| Sorting | `sort=field` or `sort=-field` (desc) | `?sort=-created_at` |
| Pagination | `page[size]&page[number]` | `?page[size]=25&page[number]=2` |
| Sparse fields | `fields[resource]=field1,field2` | `?fields[users]=id,name,email` |
| Inclusion | `include=relation` | `?include=posts,profile` |
| Searching | `search=term` | `?search=john` |
| Partial response | `fields=id,name,email` | (non-standard) |

### Versioning Strategies

| Strategy | Example | Mechanism |
|---|---|---|
| URL path prefix | `/v1/users` | Route group prefix |
| Accept header | `Accept: application/vnd.myapp.v2+json` | Content negotiation |
| Query parameter | `/users?api_version=2` | Request parameter |

---

## Mental Models

### The File System Model
A URL path is like a file system path. `/users/42/orders/99` is like navigating to `users/42/orders/99`. Each segment refines the location. Query parameters are like command-line flags that modify the response.

### The Graph Traversal Model
URLs navigate a graph of related resources. `/users/42` finds a node. `/users/42/orders` traverses the "orders" edge from that node to related nodes. Query parameters filter which nodes to return.

### The Address Model
Each resource has a unique address (URL). The URL encodes enough information to find the resource without additional context, similar to a postal address that encodes country, city, street, and number.

---

## Internal Mechanics

### Laravel Route Group Prefixing
```php
Route::prefix('v1')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('users.orders', OrderController::class);
});
// Generates: /v1/users, /v1/users/{user}/orders
```

### Route Parameters and Binding
```php
Route::get('users/{user:slug}', [UserController::class, 'show']);
// Binds User model by 'slug' column instead of 'id'

Route::get('users/{user}/posts/{post:uuid}', [PostController::class, 'show']);
// Custom key for each parameter
```

### Query Parameter Parsing
```php
$request->query('filter.status');        // Single filter value
$request->query('sort', '-created_at');   // Default value

// Complex filters
$request->input('filter.status');
// Query string: filter[status]=active&filter[role]=admin
```

---

## Patterns

### API Version Path Prefix
```php
Route::prefix('v1')->group(function () {
    Route::apiResource('users', V1\UserController::class);
});
Route::prefix('v2')->group(function () {
    Route::apiResource('users', V2\UserController::class);
});
```

### Resource Identifier Customization
```php
Route::get('users/{user:uuid}', [UserController::class, 'show']);
// If User model uses UUID primary key, bind by UUID by default

Route::get('posts/{post:slug}', [PostController::class, 'show']);
// Bind Post by slug
```

### Filtering via Query Parameters
```php
Route::get('users', function (Request $request) {
    $query = User::query();
    
    if ($request->filled('filter.status')) {
        $query->where('status', $request->input('filter.status'));
    }
    if ($request->filled('search')) {
        $query->where('name', 'like', '%'.$request->input('search').'%');
    }
    
    $sortField = ltrim($request->input('sort', '-created_at'), '-');
    $sortDir = str_starts_with($request->input('sort', '-created_at'), '-') ? 'desc' : 'asc';
    $query->orderBy($sortField, $sortDir);
    
    return UserResource::collection($query->paginate());
});
```

### Including Related Resources
```php
Route::get('users/{user}', function (Request $request, User $user) {
    $includes = explode(',', $request->input('include', ''));
    if (in_array('posts', $includes)) {
        $user->load('posts');
    }
    if (in_array('profile', $includes)) {
        $user->load('profile');
    }
    return new UserResource($user);
});
```

---

## Architectural Decisions

### ID Strategy Selection
Decision framework:
- Auto-increment: internal APIs, low traffic, no security concerns
- UUID: public APIs, high traffic, security through non-predictability
- Slugs: user-facing resources where readability matters (blog posts, products)
- Hashids: legacy migrations where existing integer IDs must be obfuscated

### Versioning Strategy Decision
- Path prefix (`/v1/users`): most explicit, easy to route, hard to forget
- Header-based (`Accept: version=1`): cleaner URLs, harder to test manually
- Query parameter (`?api_version=1`): acceptable for minor variations, not for major versions

Recommendation: Use path prefix for major versions, Accept header for minor revisions.

### Nesting Depth Decision
- 1 level: simple, flat structure (recommended for most APIs)
- 2 levels: parent-child relationships with clear ownership
- 3 levels: maximum acceptable; require justification
- 4+ levels: design smell — restructure

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| UUIDs eliminate sequential ID enumeration | UUIDs are 36 characters — long URLs | CDN caching keys increase in size |
| Slugs produce intuitive URLs | Slugs can change — break links created by clients | Requires slug history or redirect support |
| Path versioning is explicit and testable | Path versioning duplicates route definitions | May need to maintain multiple route files |
| Query parameter filtering is flexible | Complex filters become URL-encoded JSON | Some APIs switch to POST for search |
| Deep nesting encodes full context | Deep nesting creates fragile, long URLs | Clients construct URLs incorrectly more frequently |

---

## Performance Considerations

### URL Length Impact
CDNs and proxies may truncate URLs beyond 2,048-8,000 characters. Long UUID-based paths + complex query parameters can hit these limits. Use query parameters with named filters rather than path segments for complex queries.

### Route Registration Overhead
Versioned route groups (`prefix('v1')`, `prefix('v2')`) register duplicate route definitions. For APIs with many resources, registration time doubles with each version. Use route caching (`php artisan route:cache`) to mitigate.

### Identifier Type Performance
Integer IDs: fastest for database lookups, smallest indexes. UUIDs: 4x larger than integers, slower index performance. Slugs: require index on varchar column, case-insensitive comparison overhead.

---

## Production Considerations

### URL Normalization
Normalize URLs to lowercase. Enforce via middleware or redirect. `/Users/42` should redirect to `/users/42`. Consistent URLs improve caching behavior and prevent split caches.

### Trailing Slash Policy
Choose a trailing slash policy and enforce it. `/users/` (trailing) vs `/users` (no trailing). Redirect the non-preferred version. Laravel routes match both by default; explicitly redirect to the canonical form.

### URL Deprecation
Deprecated URLs should continue working with a `Deprecation` header (RFC 8594) and/or a `Link` header pointing to the new URL. Do not break old URLs without a migration period.

---

## Common Mistakes

### Nesting Beyond 3 Levels
Why it happens: Database foreign key hierarchy is mapped directly to URLs. Why it's harmful: `/schools/1/departments/2/courses/3/students/4/enrollments/5` is fragile, long, and encodes too much context. Better approach: Use shallow nesting or reference resources directly: `/enrollments/5`.

### Inconsistent Identifier Types Across Resources
Why it happens: Different teams or different times used different strategies (IDs for users, UUIDs for orders, slugs for posts). Why it's harmful: Clients must handle multiple identifier types; caching strategies become complex. Better approach: Standardize on one identifier type across the entire API.

### Changing the Identifier Strategy After Launch
Why it happens: Migrating from auto-increment to UUIDs for security reasons. Why it's harmful: All existing client URLs break. Better approach: Support both identifiers through migration period or use hashids to obfuscate without changing the identifier.

### Using Unnecessary Path Segments
Why it happens: Adding `/api` prefix when the API is on a subdomain (`api.example.com`), or `/rest` when the API is obviously REST. Why it's harmful: Extra path segments add noise without value. Better approach: Use subdomain for API/UI separation, avoid redundant path segments.

---

## Failure Modes

### Slug Collision
Two resources end up with the same slug (`/users/john-doe` for two different Johns). The second creation fails or gets a slug suffix (`john-doe-2`). Clients that bookmarked the original URL may find the wrong resource if slugs are mutable.

### UUID Case Sensitivity
UUIDs in URLs may be sent as uppercase by some clients and lowercase by others. If the server's UUID comparison is case-sensitive, lookups fail for half the clients. Normalize UUIDs to lowercase in the route binding.

### Cache Splitting
Different URL conventions (trailing slash, casing, ordering of query parameters) create multiple cache entries for the same resource. This reduces cache effectiveness. Normalize URLs before caching.

---

## Ecosystem Usage

### GitHub API
`https://api.github.com/repos/owner/repo/issues/42` — UUIDs for resources, path versioning (`/v3` historically), deep nesting limited to 2 levels, query parameter filtering and sorting.

### Stripe API
`https://api.stripe.com/v1/customers/cus_abc123` — Stripe's own prefixed IDs (`cus_`, `ch_`, `pi_`), path versioning, flat resource hierarchy (minimal nesting), query parameter expansion for related data.

### Twilio API
`https://api.twilio.com/2010-04-01/Accounts/{sid}/Calls/{sid}.json` — Date-based versioning in URL path, deep nesting (3-4 levels), .json extension for format selection.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — Resource identification via URI
- Resource Naming Conventions — Pluralization and casing in paths

### Related Topics
- API Versioning — Versioning strategy selection and migration
- Resource vs Action Orientation — Path design for resource vs action endpoints
- Pagination Strategies — Pagination query parameter conventions

### Advanced Follow-up Topics
- Route Model Binding — Custom route keys and binding logic
- Route Caching — Impact of versioned routes on caching performance

---

## Research Notes

### Source Analysis
- RFC 3986 — Uniform Resource Identifier (URI): Generic Syntax
- URL Design by example: GitHub, Stripe, Twilio API documentation

### Key Insight
URL stability is more important than URL aesthetics. A slightly ugly URL that never changes (using UUIDs, versioned path) is better than a clean URL that breaks every six months. Design for permanence.

### Version-Specific Notes
- Laravel 10-13: Route model binding with custom keys consistent across versions
- `php artisan route:cache` is compatible with all URL structure patterns
- Route group prefixing (`prefix()`) behavior is unchanged
