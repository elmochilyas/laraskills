# Skill: Organize Routes with Group Attributes

## Purpose

Apply shared middleware, URL prefixes, name prefixes, and domain constraints to sets of related routes using `Route::group()` and its helper methods, reducing duplication and ensuring consistent security and naming conventions across feature areas.

## When To Use

- Grouping routes by middleware requirement (auth, verified, throttle)
- Prefixing routes by feature area (admin, api/v1, account)
- Constraining routes by subdomain (admin.example.com)
- Applying shared configuration to a set of related routes

## When NOT To Use

- A single route with unique configuration (no need for a group)
- Deeply nested groups (4+ levels) — they become hard to reason about
- Groups that share no attributes (purely visual organization)

## Prerequisites

- Routes to be grouped
- Middleware classes registered
- Understanding of group attribute merging rules

## Inputs

- Middleware list for the group
- URL prefix string
- Name prefix string (with trailing dot)
- Optional: domain constraint

## Workflow

1. Group by middleware stack first (security concern), then by prefix (organization concern)
2. Use `Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () { ... })`
3. Ensure the name prefix ends with `.` to produce correct hierarchical names
4. Call `->name()` on individual routes within the group for the action segment
5. Keep nesting to 3 levels maximum
6. Run `php artisan route:list` to verify merged attributes
7. Verify that middleware is not duplicated across nested groups (middleware arrays merge, not deduplicate)

## Validation Checklist

- [ ] Group provides at least one shared attribute (not purely visual)
- [ ] Name prefix includes trailing dot (e.g., `admin.`)
- [ ] Middleware stack is the outermost grouping dimension
- [ ] Group nesting does not exceed 3 levels
- [ ] `php artisan route:list` shows correct merged prefixes and names
- [ ] No duplicate middleware in nested groups

## Common Failures

### Forgetting name prefix separator
`Route::name('admin')` produces names like `adminusers.index`. Always include the trailing dot: `Route::name('admin.')`.

### Misunderstanding attribute merging
Middleware arrays merge (not replace), prefixes concatenate, names prepend, domain replaces. Not understanding this leads to unexpected route attributes.

### Groups for visual organization only
Empty groups with no shared attributes add nesting complexity without benefit. Use comments or separate files for organization.

## Decision Points

### Middleware-first vs Prefix-first grouping?
Group by middleware first (security model), then by prefix. This prevents routes with different security contexts from being accidentally grouped.

### Nested groups vs flat group with combined prefix?
Use flat groups with combined attributes (`prefix('api/v1')`) for simplicity. Use nested groups when different attributes need different scopes (e.g., parent middleware with child prefix).

## Performance Considerations

Route groups have zero runtime performance cost — attributes are resolved at route registration time. Groups are preserved in route cache.

## Security Considerations

- Nested groups merge middleware — a parent middleware applies to all child routes
- Use `->withoutMiddleware()` to exclude specific routes from inherited middleware
- Domain-based groups add a subdomain access control layer beyond middleware

## Related Rules

- Limit Group Nesting to Three Levels
- Always Include Trailing Dot in Name Prefixes
- Understand Attribute Merging Rules
- Group by Middleware Stack First
- Do Not Create Groups for Visual Organization Only

## Related Skills

- Configure Multi-Level Nested Route Groups
- Define Application Routes
- Implement Named Rate Limiters

## Success Criteria

- All routes in the group inherit the correct middleware, prefix, and name prefix
- Name prefixes produce hierarchical names like `admin.users.index`
- Group nesting is 3 levels or fewer
- Middleware is not duplicated in nested groups
- `php artisan route:list` confirms correct attribute application

---

# Skill: Configure Multi-Level Nested Route Groups

## Purpose

Structure nested route groups for complex applications (API versioning, multi-tenant, admin panels) where different levels of the hierarchy apply different attributes (domain, middleware, prefix, name), while maintaining readability and predictable attribute merging.

## When To Use

- API versioning with version prefixes and name scopes
- Multi-tenant routes with tenant prefix and auth middleware
- Admin panels with domain isolation and auth middleware
- Feature areas requiring different middleware stacks at different levels

## When NOT To Use

- Single-level grouping is sufficient (avoid premature nesting)
- 4+ levels of nesting (flatten or extract to separate files)
- When attribute merging becomes non-obvious by visual inspection

## Prerequisites

- Understanding of attribute merging rules for each attribute type
- Clear hierarchy of scopes (domain > middleware > prefix > name)

## Inputs

- Domain constraints (outermost)
- Middleware lists per security context
- URL prefixes per feature area
- Name prefixes matching URL hierarchy

## Workflow

1. Start with the outermost scope — domain (`Route::domain('admin.example.com')`)
2. Inside, add middleware group (`Route::middleware(['auth', 'admin'])`)
3. Inside middleware, add prefix (`Route::prefix('users')`)
4. Add name prefix matching the URL hierarchy (`Route::name('admin.users.')`)
5. Verify merged attributes with `php artisan route:list`
6. Flatten to a single group if nesting exceeds 3 levels
7. Ensure middleware arrays don't duplicate entries across nesting levels

## Validation Checklist

- [ ] Nesting does not exceed 3 levels
- [ ] Each level applies at least one attribute
- [ ] Attribute merging is predictable and verified with `route:list`
- [ ] Name prefixes produce hierarchical names matching URL hierarchy
- [ ] Middleware is not duplicated across levels
- [ ] Domain constraint (if used) is the outermost group

## Common Failures

### Deep nesting (4+ levels)
Tracing attributes through 4+ group levels is error-prone. Flatten to combined attributes or split into separate route files.

### Middleware duplication
Middleware arrays merge (not deduplicate). Nested groups with the same middleware cause it to run multiple times. Flatten or use `withoutMiddleware()`.

## Decision Points

### Nested vs flattened groups?
Nesting when different attributes have different scopes (e.g., domain applies to all, middleware applies to subset). Flatten when all attributes share the same scope.

## Performance Considerations

Same as single-level groups — zero runtime cost. Attribute merging happens at registration time, preserved in route cache.

## Security Considerations

- Verify that nested middleware stacks produce the correct effective middleware
- Domain-level groups add subdomain isolation — ensure they are the outermost layer
- Test that `->withoutMiddleware()` on child routes correctly excludes inherited middleware

## Related Rules

- Limit Group Nesting to Three Levels
- Understand Attribute Merging Rules
- Group by Middleware Stack First
- Always Include Trailing Dot in Name Prefixes

## Related Skills

- Organize Routes with Group Attributes
- Implement URI-Based API Versioning
- Define Application Routes

## Success Criteria

- Nested groups produce correct merged prefixes, names, and middleware
- `php artisan route:list` confirms expected attributes for every route
- Nesting depth is 3 or fewer levels
- Middleware does not run duplicate instances through nesting
- Name hierarchy mirrors URL hierarchy predictably
