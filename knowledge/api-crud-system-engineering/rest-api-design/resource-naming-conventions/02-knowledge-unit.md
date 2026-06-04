# Resource Naming Conventions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** Resource Naming Conventions
- **Last Updated:** 2026-06-02

---

## Executive Summary

Resource naming conventions define the rules for constructing URI paths that identify resources. Consistent naming reduces client confusion, enables predictable endpoint discovery, and is the most visible aspect of API design quality. The core conventions cover pluralization (plural nouns for collections), casing (kebab-case as the dominant standard), relationship depth (nested paths for sub-resources), and special-case handling (singular resources, controller resources).

The dominant convention across the industry is: plural nouns, kebab-case, lowercase, with forward-slash separation for hierarchy. This matches RFC 3986 URI recommendations and is the convention used by major APIs (GitHub, Stripe, Twilio). Laravel's resource routing defaults to plural, snake_case parameter names — the difference between Laravel conventions and REST API conventions is a common source of friction.

---

## Core Concepts

### Plural vs Singular Resource Names

| Collection Resource | Single Resource | Convention |
|---|---|---|
| `/users` | `/users/{user}` | Plural for collection, singular for parameter |
| `/orders` | `/orders/{order}` | Plural nouns consistently |
| `/search` (singular) | N/A | Controller resources are singular |

The rule: collection paths use plural nouns (`/users`), individual resource paths use the collection path plus a singular identifier (`/users/{user}`).

### Casing Conventions

| Convention | Example | Usage |
|---|---|---|
| kebab-case | `/order-items` | Industry standard for URI paths |
| snake_case | `/order_items` | Laravel conventions, database column names |
| camelCase | `/orderItems` | JavaScript conventions, not URI-standard |
| PascalCase | `/OrderItems` | Rare in URIs |

**Recommendation:** kebab-case for all URI segments. This matches RFC 3986 guidance for path segment readability.

### Nested Resource Paths

```
/users/{user}/orders/{order}/items/{item}
```

Nesting encodes parent-child relationships. Best practice limits nesting to 3 levels maximum. Beyond 3 levels, consider shallow nesting or restructuring.

### Controller Resources (Singular)

Resources that represent a singleton — a resource of which there is only one per context:

```
/profile          — current user's profile
/settings         — authenticated user's settings
/dashboard/stats  — dashboard statistics (single aggregate)
```

These use singular names because the collection doesn't exist or doesn't make sense.

---

## Mental Models

### The Filesystem Analogy
A REST API URI is like a file path. `/users/42/orders/99` is analogous to `/users/42/orders/99.json`. The path navigates from the collection root through identifiers to the target resource. This mental model reinforces the hierarchical, collection-oriented view of resources.

### The SQL Table Analogy
Each collection path (`/users`, `/orders`) maps to a database table. The identifier (`/{user}`, `/{order}`) selects a row. Query parameters map to WHERE clauses, sorting, and pagination. This model is intuitive for developers but can lead to over-exposure of the database schema as the API surface.

### The Grammar Model
APIs are written in English. Resources are nouns. Paths read as prepositional phrases: "orders **of** user 42," "items **in** order 99." This model guides the naming and nesting hierarchy.

---

## Internal Mechanics

### Laravel Resource Route Parameter Generation

`Route::resource('order-items', OrderItemController::class)` generates:
```
GET    /order-items              → index       (resource = order-items)
GET    /order-items/create       → create
POST   /order-items              → store
GET    /order-items/{order_item} → show        (parameter = order_item, snake_case)
GET    /order-items/{order_item}/edit → edit
PUT    /order-items/{order_item} → update
DELETE /order-items/{order_item} → destroy
```

Laravel singularizes the resource name for the parameter wildcard using `Str::singular()` and converts to snake_case. For `order-items`, the singularized form is `order-item`, converted to `order_item` for the parameter name.

### Nested Resource Parameter Names

```php
Route::resource('users.orders', OrderController::class);
// URI: /users/{user}/orders
// URI: /users/{user}/orders/{order}
```

The parent parameter takes the singular form of the parent resource segment.
Parameters can be customized:
```php
Route::resource('users.orders', OrderController::class)->parameters([
    'users' => 'user_slug',
    'orders' => 'order_id'
]);
```

---

## Patterns

### Standard Collection Pattern
```
GET    /resources          — List all
POST   /resources          — Create new
GET    /resources/{id}     — Show one
PUT    /resources/{id}     — Replace
PATCH  /resources/{id}     — Partial update
DELETE /resources/{id}     — Delete
```

### Nested Sub-Resource Pattern
```
GET    /parents/{parent}/children          — List children of parent
POST   /parents/{parent}/children          — Create child under parent
GET    /parents/{parent}/children/{child}  — Show specific child
```
Nesting depth: maximum 3. Beyond this, use shallow nesting or resource references.

### Shallow Nesting Pattern
```
GET    /parents/{parent}/children           — List (needs parent context)
POST   /parents/{parent}/children           — Create (needs parent context)
GET    /children/{child}                    — Show (child has global ID)
PATCH  /children/{child}                    — Update (child has global ID)
DELETE /children/{child}                    — Delete (child has global ID)
```

### Singular Controller Pattern
```
GET    /dashboard/stats      — Show stats (non-collection)
PATCH  /profile              — Update profile (singleton per user)
GET    /settings             — Show settings (singleton per user)
```

### Search/Filter Collection Pattern
```
GET /users?filter[status]=active&sort=-created_at&include=posts
```
Filters, sorting, and inclusion are expressed as query parameters, not path segments.

---

## Architectural Decisions

### kebab-case vs snake_case for URIs
Decision guide: kebab-case is the industry standard for URIs. snake_case is Laravel's default parameter naming internally. Choose based on API consumer expectations: if the API is public-facing, use kebab-case. If the API is internal and Laravel-only, snake_case is acceptable.

### Naming Depth Threshold
The hard limit on nesting depth depends on the identifier type:
- **Auto-increment IDs:** 2 levels max (IDs are short, collision risk across parents)
- **UUIDs/Slugs:** 3 levels max (globally unique, shallow nesting works)
- **Beyond 3 levels:** Almost always a design smell — restructure or use query parameters

### Plural vs Singular Decision Rules
- Collection of items → plural (`/users`, `/orders`)
- Singleton per context → singular (`/profile`, `/dashboard`)
- Actions as resources → plural if collection, singular if singleton (`/searches` vs `/search`)
- Aggregate/report → singular (`/reports/daily-sales` — `/reports` is not a collection)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Plural nouns are intuitive for collections | Singular exceptions require documentation | New clients can predict 80% of endpoints |
| kebab-case is URI-standard and readable | Misalignment with Laravel's snake_case conventions | Converting between conventions is friction |
| Deep nesting encodes full relationship context | URLs become long and fragile | Client error rates increase with URL complexity |
| Query parameters for filtering keep URIs clean | Complex filters are verbose in query strings | Some APIs resort to POST for search |

---

## Performance Considerations

### URI Length Impact
URIs longer than 2048 characters may be truncated by proxies, CDNs, or browsers. Deeply nested paths increase URI length. Keep individual path segments under 255 characters.

### Parameter Extraction Cost
Laravel's route parameter binding resolves parameters from the URI. Each level of nesting requires an additional database query (implicit binding). Shallow nesting reduces query count for show/update/delete operations.

---

## Production Considerations

### Case Sensitivity
URIs are case-sensitive per RFC 3986. Enforce lowercase-only naming to prevent `GET /Users/42` vs `GET /users/42` confusion. Standardize in API style guides and enforce via middleware.

### URL Encoding
Resource names containing special characters require percent-encoding. Avoid spaces, Unicode characters, and symbols in resource names. Use kebab-case to eliminate ambiguity.

### Resource Renaming Migration
Changing a resource name after launch requires either a breaking version change or a dual-path migration period. Choose names carefully — renaming `order_items` to `line-items` later is expensive.

---

## Common Mistakes

### Inconsistent Pluralization
Why it happens: Different developers use different conventions for different resources. Why it's harmful: Clients cannot predict endpoint names — `GET /users` exists but `GET /orders` doesn't because someone used `GET /order`. Better approach: Establish a style guide with explicit rules for every resource.

### Over-Nesting
Why it happens: Developers model the database foreign key hierarchy directly in the URL. Why it's harmful: `/schools/1/departments/2/courses/3/students/4/enrollments/5` is unreasonably long and fragile. Better approach: Limit nesting to 2-3 levels; use query parameters or references for deeper relationships.

### Mixing Cases
Why it happens: No enforced convention — some endpoints use camelCase, others snake_case. Why it's harmful: Inconsistent API surface confuses clients; case-sensitive URI matching causes hard-to-find bugs. Better approach: Enforce kebab-case or snake_case across the entire API.

### Using Verbs in URI Paths
Why it happens: Action-oriented thinking leaks into resource naming. Why it's harmful: `/users/getActiveUsers` breaks the resource model — the verb "get" is implicit in the HTTP method. Better approach: Use query parameters for filtering: `GET /users?filter[status]=active`.

---

## Failure Modes

### Singularization Errors
`Str::singular('series')` returns `'serie'`, breaking the route parameter. The URI becomes `GET /series/{serie}` — the parameter name no longer matches the resource concept. Laravel developers must explicitly set parameters for irregular plurals.

### Collision Between Resource Names
`/users/{user}/posts` and `/posts/{post}` — if both are used, the meaning of `posts` changes based on context (all posts vs user's posts). Clients may assume `GET /posts` returns the same shape as nested posts.

---

## Ecosystem Usage

### GitHub API
Plural kebab-case throughout: `/repos/{owner}/{repo}`, `/orgs/{org}/repos`, `/repos/{owner}/{repo}/issues`. Nested depth is 2-3 levels. Singular exceptions: `/user` (authenticated user), `/emojis` (static collection).

### Stripe API
Plural snake_case historically, but newer endpoints use kebab-case. Stripe is transitioning. Deep nesting at 2 levels maximum. Singular resources use the resource name directly (`/account`, `/balance`).

### Twilio API
Twilio uses kebab-case with deep nesting (`/Accounts/{sid}/Calls/{call_sid}/Recordings/{recording_sid}`). This is 4 levels deep and is considered the upper boundary of acceptable nesting.

---

## Related Knowledge Units

### Prerequisites
- URL Structure Design — URI hierarchy and path components
- Resource vs Action Orientation — Resource identification in URIs

### Related Topics
- HTTP Method Semantics — How methods interact with named resources
- Resourceful Routing — Laravel's auto-generated route names
- REST Purity vs Pragmatic — When to break naming conventions

### Advanced Follow-up Topics
- API Versioning — Impact on resource paths (`/v1/users` vs `/users`)
- API Documentation Generation — Naming conventions for spec generation

---

## Research Notes

### Source Analysis
- RFC 3986 — Uniform Resource Identifier (URI): Generic Syntax
- Microsoft REST API Guidelines — Plural nouns, kebab-case, consistent naming
- Google API Design Guide — Resource-oriented design, naming conventions

### Key Insight
The most impactful naming convention is consistency. Clients can adapt to any single convention (kebab, snake, even camelCase) if it is applied uniformly. Inconsistency is the only universal anti-pattern.

### Version-Specific Notes
- `Str::singular()` behavior is unchanged across Laravel 10-13
- Known irregular plural issues: `series` → `serie`, `sheep` → `shep`, `status` → `statu`
