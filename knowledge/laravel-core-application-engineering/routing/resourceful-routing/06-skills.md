# Skill: Register Resourceful Routes with Explicit Action Control

## Purpose

Register resourceful routes using `Route::apiResource()` or `Route::resource()` with explicit `->only()` or `->except()` to generate standard RESTful routes while limiting the attack surface to only intended actions and documenting supported operations.

## When To Use

- Standard CRUD operations on any resource
- RESTful API endpoints
- Resources with the conventional 5 (API) or 7 (web) actions
- Applications that need consistent route naming

## When NOT To Use

- Singleton resources (use `Route::singleton()`)
- Resources with non-standard action names
- Read-only resources (use `->only(['index', 'show'])` or explicit routes)
- Resources with complex custom actions beyond standard verbs

## Prerequisites

- Controller exists with the standard action methods (index, create, store, show, edit, update, destroy)
- Understanding of RESTful resource conventions

## Inputs

- Resource name (plural noun)
- Controller class reference
- List of allowed actions (for `->only()`) or excluded actions (for `->except()`)

## Workflow

1. Determine if the resource is API-only or web: use `apiResource` for JSON APIs, `resource` for web
2. Write `Route::apiResource('photos', PhotoController::class)` or `Route::resource('photos', PhotoController::class)`
3. Chain `->only(['index', 'show', 'store'])` to limit to specific actions
4. Define custom actions (non-standard verbs) as separate explicit routes near the resource
5. Use plural resource names consistently — never mix singular and plural
6. Run `php artisan route:list` to verify generated routes
7. Test each generated route with a valid request

## Validation Checklist

- [ ] `apiResource` used for API route files (not `resource`)
- [ ] `->only()` or `->except()` limits routes to intended actions
- [ ] Resource name is plural (e.g., `users`, not `user`)
- [ ] Custom actions defined outside the resource definition
- [ ] Controller has methods matching all generated routes
- [ ] `php artisan route:list` shows only the intended routes

## Common Failures

### Not using apiResource for APIs
Using `Route::resource()` for JSON APIs generates unnecessary create/edit routes that return 404. Use `apiResource` which generates only the 5 API-appropriate routes.

### Unrestricted resource routes
Registering a resource without `->only()` exposes all 7 actions even if controllers lack corresponding methods. Always specify the intended subset.

### Mixed plural/singular naming
Inconsistent naming (`user` vs `photos`) creates confusing API surfaces. Always use plural resource names.

## Decision Points

### apiResource vs resource?
Use `apiResource` for JSON APIs (no create/edit routes). Use `resource` for web applications that return HTML forms.

### only() vs except()?
Use `only()` to explicitly list supported actions (whitelist). Use `except()` to exclude a few actions from a mostly-complete resource.

## Performance Considerations

Resource routes generate 5-7 Route objects — no performance difference vs explicit definition at matching time. Route caching works with resource routes.

## Security Considerations

- `->only()` limits the attack surface by preventing unintended actions from being routable
- A controller method that doesn't exist throws an exception when accessed — `->only()` prevents such routes
- Custom actions outside resource definitions are explicit and auditable

## Related Rules

- Use apiResource for API Route Files
- Use only() or except() to Limit Resource Actions
- Use Plural Resource Names
- Add Custom Actions Outside Resource Definitions
- Limit Nesting to Two Levels

## Related Skills

- Configure Nested Resources with Shallow Nesting
- Define Application Routes
- Implement Route Groups

## Success Criteria

- All routes use `apiResource` for APIs, `resource` for web
- Every resource has `->only()` or `->except()` explicitly declared
- Resource names are consistently plural
- Custom actions are defined as separate explicit routes
- `php artisan route:list` shows only the intended routes

---

# Skill: Configure Nested Resources with Shallow Nesting

## Purpose

Register nested resource routes (`posts.comments`) with shallow nesting to produce clean URIs that omit parent IDs when the child is uniquely identified, reducing URI length and complexity while maintaining parent context where needed.

## When To Use

- Resources that belong to a parent resource
- Deeply nested resources (2+ levels)
- RESTful APIs with parent-child relationships

## When NOT To Use

- Top-level resources with no parent
- Singleton resources (use `Route::singleton()`)
- When the parent context is needed for every child route

## Prerequisites

- Parent and child controllers exist
- Parent and child Eloquent models with proper relationships
- Understanding of nested route URIs

## Inputs

- Parent resource name (plural)
- Child resource name (plural)
- Child controller class
- Whether to use shallow nesting

## Workflow

1. Write `Route::resource('posts.comments', CommentController::class)` for nested routes
2. Chain `->shallow()` to remove parent ID from show/edit/update/destroy routes
3. Limit nesting to 2 levels maximum (e.g., `posts.comments`, not `posts.comments.replies`)
4. For API routes, use `Route::apiResource()` instead of `resource`
5. Use `->only()` to limit to specific nested actions
6. Run `php artisan route:list` to verify nested URI patterns
7. Test that parent ID is required for create/store/index but not for show/update/destroy on shallow routes

## Validation Checklist

- [ ] Nesting limited to 2 levels maximum
- [ ] `->shallow()` applied for nested resources
- [ ] Shallow routes omit parent ID from child-specific URIs
- [ ] Index/create/store routes still include parent ID
- [ ] Controller methods match the route parameter signature

## Common Failures

### Forgetting shallow nesting
All nested routes include parent IDs even when unnecessary. `show`, `update`, and `destroy` routes carry redundant parent ID. Apply `->shallow()` to clean URIs.

### Over-nesting
Nesting 3+ levels deep creates unwieldy URIs and complex controllers. Limit to 2 levels and use top-level endpoints for deeper resources.

## Decision Points

### Shallow vs Full Nesting?
Shallow for cleaner URIs when the child is uniquely identified by its own ID. Full nesting when the parent context is needed for every route (authorization, scoping).

### Resource Nesting vs Top-Level Routes?
Resource nesting for hierarchical access patterns. Top-level routes for resources that can be accessed independently.

## Performance Considerations

- Nested resource routes generate additional Route objects proportional to the nesting depth
- Scoped bindings ensure query efficiency by adding `WHERE parent_id = ?` to child queries
- Composite indexes on `(parent_id, id)` improve scoped query performance

## Security Considerations

- Nested resource routes automatically scope child bindings (Laravel 8+)
- Shallow routes without parent ID lose parent context — ensure authorization still validates parent-child relationship
- Limit nesting to prevent overly broad route access patterns

## Related Rules

- Use Shallow Nesting Beyond Two Levels
- Limit Nesting to Two Levels
- Use Plural Resource Names

## Related Skills

- Register Resourceful Routes with Explicit Action Control
- Implement Scoped Bindings for Nested Routes
- Define Application Routes

## Success Criteria

- Nested routes use dot notation: `posts.comments`
- Shallow nesting produces clean URIs: `/comments/{comment}` instead of `/posts/{post}/comments/{comment}`
- Parent ID is present where needed (index, create, store) and absent where not (show, update, destroy)
- Maximum nesting depth is 2 levels
- Route list shows correct URI patterns for all nested actions
