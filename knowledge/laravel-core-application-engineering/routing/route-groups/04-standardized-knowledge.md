# ECC Standardized Knowledge — Route Groups

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Route Groups |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Route groups allow applying shared attributes (middleware, prefix, name prefix, domain, controller namespace) to multiple routes without repeating the configuration. Groups are composable — nested groups merge attributes according to specific rules (middleware merges, prefixes concatenate, names prepend).

The group attribute system uses a cascading merge pattern: attributes defined at the group level are inherited by all routes within the group, and nested groups merge their attributes with the parent group's. This enables hierarchical organization of routes by middleware stack, URL prefix, or domain.

---

## Core Concepts

### Group Attributes
- `middleware` — array of middleware class names (merged, not replaced)
- `prefix` — URL prefix prepended to all route URIs
- `name` — name prefix prepended to all route names
- `domain` — subdomain constraint for the group
- `controller` — controller namespace for the group

### Attribute Merging Rules
- `middleware` — arrays are merged (parent + child, no deduplication)
- `prefix` — concatenated with `/` separator
- `name` — concatenated (parent name + child name)
- `domain` — replaced by child group (child overrides parent)
- `where` — merged (child adds to parent patterns)

### Route::prefix()
`Route::prefix('admin')` prepends 'admin/' to all route URIs in the group.

### Route::name()
`Route::name('admin.')` prepends 'admin.' to all route names in the group.

### Route::middleware()
`Route::middleware(['auth', 'verified'])` applies middleware to all routes in the group.

### Route::domain()
`Route::domain('admin.example.com')` constrains the group to a specific subdomain.

---

## When To Use

- Grouping routes by middleware requirement (auth, verified, throttle)
- Prefixing routes by feature (admin, api/v1, account)
- Constraining routes by domain (admin subdomain, api subdomain)
- Applying shared configuration to a set of related routes

---

## When NOT To Use

- A single route with unique configuration (no need for a group)
- Deeply nested groups (3+ levels) — they become hard to reason about
- Groups that mix domain and prefix without clear separation

---

## Best Practices

### Use Groups for Middleware Stack Selection
Group routes by middleware requirement first, then by prefix.

**Why:** Middleware determines the request's security model. Grouping by middleware makes it clear which routes share authentication, rate limiting, and verification requirements.

### Keep Group Nesting Shallow
Limit nesting to 2-3 levels maximum.

**Why:** Deep nesting makes attribute merging non-obvious. Developers must trace through multiple group levels to understand which middleware, prefixes, and names apply to a given route.

### Explicitly Close Groups
Close groups properly and avoid overlapping group scopes.

**Why:** Unclosed groups can accidentally include routes that were intended to be outside the group. Each `Route::group()` should have a matching scope end.

### Use Name Prefixes Consistently
Always add name prefixes matching the URL prefix.

**Why:** Name prefixes ensure route names follow the same hierarchy as URL paths, making `route()` calls predictable and self-documenting.

---

## Architecture Guidelines

### Basic Group Structure
```php
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    // Result: URL /admin/dashboard, name admin.dashboard, middleware auth
});
```

### Nested Groups
```php
Route::prefix('api')->name('api.')->group(function () {
    Route::prefix('v1')->name('v1.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        // Result: URL /api/v1/users, name api.v1.users.index
    });
});
```

### Domain Group
```php
Route::domain('admin.example.com')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    // Only matches requests to admin.example.com
});
```

---

## Performance Considerations

Route groups have zero runtime performance cost. Group attributes are resolved at route registration time (bootstrap), not at request dispatch time. The merged attributes are stored on each route object individually.

---

## Security Considerations

### Middleware Inheritance
Be aware that nested groups merge middleware. A middleware that was intended for a parent group also applies to child routes. Use `withoutMiddleware()` to exclude middleware from specific routes.

### Domain Grouping for Admin Routes
Use domain-based groups for admin panels to keep admin routes isolated. This adds a layer of access control beyond middleware.

---

## Common Mistakes

### Misunderstanding Attribute Merging
Desc: Assuming child group attributes replace parent attributes.
Cause: Not understanding the merge rules (middleware merges, prefix concatenates, name prepends).
Consequence: Routes have unexpected middleware, prefixes, or names.
Better: Understand the merge rules for each attribute type.

### Deep Group Nesting
Desc: 4+ levels of nested groups.
Cause: Trying to organize routes by every possible dimension.
Consequence: Difficult to trace which attributes apply to a given route.
Better: Limit nesting to 2-3 levels; use flat groups with explicit attributes.

### Forgetting Name Prefix Separator
Desc: `Route::name('admin')` instead of `Route::name('admin.')`.
Cause: Omitting the trailing dot separator.
Consequence: Route names become `adminusers.index` instead of `admin.users.index`.
Better: Always include the trailing `.` in name prefixes.

---

## Anti-Patterns

### Group-as-Organization
Creating groups purely for visual organization without applying shared attributes. Groups should only be created when attributes are shared. Use comments or separate files for visual organization.

### Group-in-Group Middleware Confusion
Nesting groups with different middleware stacks without understanding the merge behavior. Test middleware composition with `php artisan route:list`.

---

## Examples

### Feature-Based Grouping
```php
Route::prefix('admin')->middleware(['auth', 'admin'])->name('admin.')->group(function () {
    Route::resource('users', Admin\UserController::class);
    Route::resource('settings', Admin\SettingController::class);
});
```

### API Version Grouping
```php
Route::prefix('api')->group(function () {
    Route::prefix('v1')->name('v1.')->group(function () {
        Route::apiResource('users', Api\V1\UserController::class);
    });
    Route::prefix('v2')->name('v2.')->group(function () {
        Route::apiResource('users', Api\V2\UserController::class);
    });
});
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Foundation for all route registration

### Closely Related
- **Resourceful Routing** — Using groups with resource routes
- **Rate Limiting** — Applying rate limiters to route groups
- **Middleware** — Middleware assignment within groups

### Advanced
- **API Versioning** — Groups for versioned API routes
- **Route Caching** — Groups and route cache interaction

---

## AI Agent Notes

### Important Decisions
- Group attribute merging rules differ by attribute type (merge, concatenate, replace, prepend)
- Middleware arrays are merged but not deduplicated — duplicate middleware runs multiple times
- Laravel 11+ uses `bootstrap/app.php` for group configuration instead of Kernel classes

### Important Constraints
- Route groups cannot change the matching order of routes within the group
- Group attributes are resolved at registration time, not at dispatch time
- Prefixes and name prefixes are string concatenation — trailing/leading characters matter

### Rules Generation Hints
- Enforce maximum nesting depth of 3 levels
- Enforce trailing `.` on name prefixes
- Enfuel middleware deduplication awareness

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::group()` — group registration
- `Illuminate\Routing\RouteGroup::merge()` — attribute merging logic
- `Illuminate\Routing\Router::createRoute()` — group attribute application
