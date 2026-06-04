# Skill: Name Routes and Generate URLs from Named Routes

## Purpose

Assign unique names to every route using `->name()` with dot notation and generate URLs via `route('name', $parameters)`, decoupling URL references from URI patterns so that URI changes require only updating the route definition.

## When To Use

- ALL routes — every route should have a unique name
- URL generation in views, emails, and controllers
- Redirect responses in controllers
- Test assertions that verify correct URLs

## When NOT To Use

- Trivial redirect-only routes (though naming is still recommended)
- Routes that should not be publicly referenced (name them anyway for internal use)

## Prerequisites

- Route definitions exist
- Understanding of URL parameter substitution

## Inputs

- Route name (dot notation, globally unique)
- Route parameters (for parameterized URLs)
- Route definition where the name is assigned

## Workflow

1. Assign a name when defining the route: `Route::get('/users/{user}', ...)->name('users.show')`
2. Use dot notation following the `resource.action` convention
3. Ensure the name is globally unique — check existing names via `php artisan route:list`
4. Generate URLs using `route('users.show', $user)` in views, controllers, and tests
5. Use `redirect()->route('users.index')` for named redirects
6. Never hardcode URI strings like `/users/5` anywhere in the codebase
7. Replace existing hardcoded URIs with `route()` calls

## Validation Checklist

- [ ] Every route has a unique name via `->name()`
- [ ] Names use dot notation (`resource.action`)
- [ ] No two routes share the same name
- [ ] `route('name')` generates the correct URL
- [ ] No hardcoded URIs in views, controllers, or tests
- [ ] `redirect()->route()` used instead of `redirect('/path')`
- [ ] `php artisan route:list` shows all names

## Common Failures

### Not naming routes
Routes without names force hardcoded URIs throughout the codebase. Always call `->name()` on every route.

### Duplicate route names
Two routes with the same name cause the later one to overwrite the earlier. `route('name')` always resolves to the later route. Ensure globally unique names.

### Hardcoded URIs
Using `/users/{{ $user->id }}/edit` instead of `route('users.edit', $user)` creates brittle code that breaks on URI changes.

## Decision Points

### Name format?
Use `resource.action` for standard resources (e.g., `users.show`). Use `domain.resource.action` for grouped routes (e.g., `admin.users.index`).

## Performance Considerations

- Named route lookup is O(1) via the `$nameList` hash table
- `route()` helper performance is dominated by URL parameter substitution, not name lookup
- Named routes are preserved in route cache

## Security Considerations

- Duplicate route names silently overwrite — the first route becomes unreachable by name
- Route names are NOT exposed in URLs (only the URI is exposed)
- Route names appear in logs when using `route()` in logging contexts — avoid exposing sensitive names

## Related Rules

- Name Every Route
- Use Dot Notation Naming
- Ban Hardcoded URLs
- Ensure Globally Unique Route Names

## Related Skills

- Organize Route Names with Group Prefixes
- Define Application Routes
- Implement URI-Based API Versioning

## Success Criteria

- Every route has a unique dot-notation name
- All URL references use `route()` instead of hardcoded URIs
- URI changes require only updating the route definition
- `route('name')` generates correct URLs with parameter substitution
- No hardcoded URIs exist in views, controllers, or tests

---

# Skill: Organize Route Names with Group Prefixes

## Purpose

Use `Route::name('prefix.')` within route groups to automatically prepend hierarchical name segments to all routes in the group, ensuring consistent naming that mirrors the URL hierarchy and avoids manual per-route name prefixing.

## When To Use

- Route groups with shared URL prefixes
- API versioning with version-specific name scopes
- Admin panels with domain or prefix isolation
- Any group where route names should follow the URL hierarchy

## When NOT To Use

- Flat route files with no grouping (names are set individually)
- Groups without URL prefixes (name prefix without prefix may be confusing)

## Prerequisites

- Route group defined with `Route::prefix()` or `Route::group()`
- Name prefix string (with trailing dot)

## Inputs

- Name prefix with trailing dot (e.g., `admin.`)
- Route definitions within the group
- URL prefix matching the name prefix

## Workflow

1. When creating a route group with a URL prefix, add a matching name prefix: `Route::prefix('admin')->name('admin.')->group(...)`
2. Ensure the name prefix ends with `.` so concatenated names are correctly separated
3. Inside the group, assign action-level names: `->name('users.index')` — the full name becomes `admin.users.index`
4. Verify names with `php artisan route:list` — confirm the prefix is applied correctly
5. Generate URLs with the full name: `route('admin.users.index')`
6. For nested groups, chain name prefixes: outer = `admin.`, inner = `users.`, route = `index` → `admin.users.index`

## Validation Checklist

- [ ] Name prefix includes trailing dot (e.g., `admin.` not `admin`)
- [ ] Name prefix matches the URL prefix (e.g., `admin.` matches `/admin`)
- [ ] Individual route names omit the prefix segments (they are added by the group)
- [ ] `php artisan route:list` shows the full concatenated names
- [ ] `route('full.name')` generates the correct URL
- [ ] Name prefix produces hierarchical, predictable names

## Common Failures

### Omitting name prefix separator
`Route::name('admin')` produces `adminusers.index`. Always include the trailing dot.

### Missing name prefix for URL prefix
Using `Route::prefix('admin')` without `Route::name('admin.')` makes route names not reflect the URL hierarchy. Always pair them.

### Nested prefix mismatch
Inner group name prefix `users.` in nested groups — verify that the concatenation produces the expected name hierarchy.

## Decision Points

### Name prefix vs individual names?
Use group name prefixes for shared segments. Use individual `->name()` for action-level segments. Don't repeat prefix segments in individual names.

## Performance Considerations

Name prefix concatenation happens at route registration time — zero runtime cost. Named routes are preserved in route cache.

## Security Considerations

- Predictable name patterns make `route()` calls easier to audit
- Consistent naming prevents accidental name collisions within the group scope
- Group prefixes make it easier to identify which routes belong to which feature area

## Related Rules

- Match Name Prefixes to URL Prefixes
- Always Include Trailing Dot in Name Prefixes
- Use Dot Notation Naming
- Name Every Route

## Related Skills

- Name Routes and Generate URLs from Named Routes
- Organize Routes with Group Attributes
- Implement URI-Based API Versioning

## Success Criteria

- Name prefixes mirror URL prefixes for all route groups
- Full route names follow the pattern `prefix.resource.action`
- Developers can predict route names from URLs and vice versa
- `php artisan route:list` shows clean hierarchical names
- No manual prefix repetition in individual route names
