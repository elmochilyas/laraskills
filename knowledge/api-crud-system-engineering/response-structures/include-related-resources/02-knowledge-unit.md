# Include Related Resources

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** Include Related Resources
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Including Related Resources allows API consumers to request that related models be embedded in the response via `?include=posts,comments`. This reduces API calls and enables flexible data loading while requiring careful handling of N+1 queries and relationship authorization.

---

## Core Concepts
- **Include Parameter**: `?include=posts` or `?include=posts,comments.likes` — requesting eager-loaded relationships
- **Dot-Notation Nesting**: `?include=posts.comments` for nested relationship inclusion
- **Relationship Allowlist**: Defining which relationships are allowed to be included (security)
- **Resource-Included Transformation**: Using `new PostResource($post)` inside `UserResource::toArray()` for included data
- **N+1 Query Prevention**: Using `whenLoaded()` to only include relationships that were eager-loaded
- **Default Includes**: Relationships included by default without the client requesting them

---

## Mental Models
1. **Shopping List Model**: The `?include` parameter is a shopping list — the client tells the server what "extra items" to put in the response bag.
2. **Eager Loading Menu Model**: Like a restaurant menu where you can add sides to your main dish. The kitchen prepares everything together for efficiency.

---

## Internal Mechanics
The controller reads `?include=posts,comments` and passes it to a query builder. The query builder splits the include string, validates against an allowlist, and calls `$query->with($includes)`. In the resource, `whenLoaded('posts')` checks if the relationship was loaded and includes it in the response. Dot-notation includes expand to nested `with()` calls.

---

## Patterns

### Pattern 1: Query Builder Includes
**Purpose**: Use `->allowedIncludes()` in a query builder package (e.g., spatie/laravel-query-builder)
**Benefits**: Automatic allowlist enforcement; relationship eager loading
**Tradeoffs**: Adds package dependency

### Pattern 2: Manual Include Handling
**Purpose**: Parse `$request->input('include')` manually and apply `with()`
**Benefits**: No external dependencies; full control
**Tradeoffs**: More boilerplate; must handle dot-notation nesting manually

---

## Architectural Decisions
### When To Use
- APIs with related resources that clients frequently access together
- Mobile APIs minimizing round trips
- Public APIs where flexibility is valued

### When To Avoid
- APIs with few or no relationships
- High-security APIs where relationship access must be tightly controlled
- Simple CRUD APIs where separate endpoints suffice

### Alternatives
- Separate relationship endpoints (`/api/users/{user}/posts`)
- Sideloaded resources (JSON:API included)
- Always-include relationships (no client opt-in)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduces client API calls | Relationship allowlist must be maintained | Audit allowlist regularly |
| Flexible data loading | N+1 risk if includes aren't eager-loaded | Always check whenLoaded() in resources |
| Reduced network overhead | Response payload can grow large | Limit maximum include depth (3 levels) |

---

## Performance Considerations
- Eager loading via `with()` prevents N+1 but can still load unnecessary data
- Deep includes (3+ levels) cause many JOINs or multiple queries
- Limit maximum include depth to prevent abuse
- Monitor query counts when includes are used
- Use `withOnly()` for controlling which relationships are loaded

---

## Production Considerations
- Enforce a relationship allowlist to prevent unauthorized data access
- Log which includes are commonly requested for performance tuning
- Set a maximum include depth (3 levels recommended)
- Test includes with authorization — a user shouldn't include relationships they can't see
- Cache include-heavy responses when possible

---

## Common Mistakes
**No `whenLoaded()` check**: Including a relationship in the resource without checking if it was loaded causes N+1 queries.
**No allowlist**: Allowing any relationship to be included exposes internal data or causes deep-loading performance issues.
**Ignoring nested authorization**: Including `posts.comments` may bypass authorization on the nested resource.
**Unlimited depth**: Allowing `?include=posts.comments.author.profile.address` creates a 6-level deep query.

---

## Failure Modes
**N+1 via missing `with()`**: The include parameter is accepted but the relationship isn't eager-loaded. *Detection:* Debugbar shows many queries. *Mitigation:* Validate includes against actual `with()` calls.
**Authorization bypass via include**: A user accesses a related resource they shouldn't see. *Detection:* Security audit. *Mitigation:* Apply authorization to included resources.

---

## Ecosystem Usage
`spatie/laravel-query-builder` provides `allowedIncludes()` with automatic validation. Laravel's `whenLoaded()` in resources handles conditional relationship inclusion. `$resource->whenLoaded('posts', fn () => PostResource::collection($this->posts))` is the pattern.

---

## Related Knowledge Units
### Prerequisites
- API resource transformation
- Eloquent relationship eager loading

### Related Topics
- Sparse field selection
- Conditional relationship inclusion
- API query builder patterns

### Advanced Follow-up Topics
- Deep nesting and circular include detection
- Include authorization per relationship
- Performance optimization for complex includes

---

## Research Notes
- JSON:API supports `include` as a standard parameter for compound documents
- Spatie's package is the de facto standard for Laravel include handling
- Maximum include depth of 3 is the recommended default (spatie defaults to 2)
- Include strings with recursive relationships (user.friends) require cycle detection
