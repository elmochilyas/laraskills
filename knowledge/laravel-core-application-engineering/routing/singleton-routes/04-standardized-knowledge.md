# ECC Standardized Knowledge — Singleton Routes

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Singleton Routes |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Singleton routes (`Route::singleton()`) generate routes for resources that have at most one instance per parent context. Instead of the 7 standard resource routes, singleton routes generate: show, edit, update, and destroy. The URI does not include an ID parameter because the resource is always accessed at a fixed location.

Common use cases: user profile (one profile per user), application settings (one settings page per team), avatar images (one avatar per user). Singleton routes eliminate the cognitive overhead of "which ID?" when the resource is inherently singular.

---

## Core Concepts

### Singleton Route Pattern
`Route::singleton('profile', ProfileController::class)` generates:
| Verb | URI | Action |
|------|-----|--------|
| GET | /profile | show |
| GET | /profile/edit | edit |
| PUT/PATCH | /profile | update |
| DELETE | /profile | destroy |

### Singleton with Creatable
`Route::singleton('profile', ProfileController::class)->creatable()` adds create and store routes for resources that may not yet exist.

### Nested Singletons
`Route::singleton('team.profile', ProfileController::class)` generates routes under `teams/{team}/profile`.

---

## When To Use

- Resources with exactly one instance per parent (profile, avatar, settings)
- Resources with at most one instance (application configuration)
- Resources where ID is implicit (current user's profile)

---

## When NOT To Use

- Resources that can have multiple instances (use `Route::resource()`)
- Resources where the "current" context is ambiguous
- Resources that need index or listing routes

---

## Best Practices

### Use creatable() When Appropriate
Add `->creatable()` if the singleton resource may not exist yet.

**Why:** Without `creatable()`, there's no way to create the resource. The create/store routes are only needed when creation is a user-initiated action.

### Prefer Singleton Over Resource with only()
Replace `Route::resource('profile', ...)->only(['show', 'edit', 'update', 'destroy'])` with `Route::singleton('profile', ...)`.

**Why:** Singleton routes explicitly communicate the resource's singular nature. They also eliminate the unused `{profile}` parameter from the URI.

---

## Architecture Guidelines

### Singleton Definition
```php
Route::singleton('profile', ProfileController::class);
// vs resource with only():
Route::resource('profile', ProfileController::class)->only(['show', 'edit', 'update', 'destroy']);
```

### Nested Singleton
```php
Route::singleton('team.profile', ProfileController::class);
// Generates: teams/{team}/profile
```

---

## Performance Considerations

Singleton routes generate 4-6 Route objects (vs 5-7 for resource). Negligible performance difference. The benefit is conceptual clarity, not execution speed.

---

## Common Mistakes

### Using Route::resource for Singletons
Desc: Using `Route::resource('profile', ...)` with `only()` for singular resources.
Cause: Not aware of singleton routes.
Consequence: URI includes unused `{profile}` parameter; intent is unclear.
Better: Use `Route::singleton('profile', ...)`.

### Forgetting creatable() for New Resources
Desc: Using singleton without `creatable()` when the resource doesn't exist initially.
Cause: Not understanding the singleton lifecycle.
Consequence: No way to create the first instance.
Better: Add `->creatable()` for resources that may not exist.

---

## Anti-Patterns

### Singleton for Non-Singular Resources
Using singleton routes for resources that can have multiple instances (e.g., team member profiles). This forces unnatural routing and confuses API consumers.

---

## Examples

### Basic Singleton
```php
Route::singleton('profile', ProfileController::class);

// Controller methods:
public function show() { /* current user's profile */ }
public function update(Request $request) { /* update profile */ }
```

### Singleton with Creatable
```php
Route::singleton('avatar', AvatarController::class)->creatable();

// Adds: GET /avatar/create, POST /avatar
```

---

## Related Topics

### Prerequisites
- **Resourceful Routing** — Foundation for understanding resource patterns
- **Route Definition** — Basic route registration

### Closely Related
- **Route Groups** — Grouping singleton routes with middleware
- **Route Model Binding** — Binding parent resources for nested singletons

---

## AI Agent Notes

### Important Decisions
- Singleton routes were added in Laravel 8
- `creatable()` is optional — only include if the resource may not exist initially
- Singleton routes eliminate the `{id}` parameter from the URI

### Rules Generation Hints
- Prefer `Route::singleton()` over `Route::resource()->only()` for singular resources
- Enforce `creatable()` documentation for new resources

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::singleton()` method
- Laravel documentation on singleton resource routes
