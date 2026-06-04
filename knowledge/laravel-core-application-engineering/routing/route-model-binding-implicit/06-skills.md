# Skill: Implement Implicit Route Model Binding in Controllers

## Purpose

Type-hint Eloquent models in controller method parameters so that Laravel automatically resolves route parameter values to model instances, eliminating manual `findOrFail()` calls and ensuring consistent 404 handling across all routes.

## When To Use

- Every route where a model ID is a URL parameter
- Controller methods that need a model instance
- API routes where model IDs identify resources
- Nested resource routes with scoped bindings

## When NOT To Use

- When custom resolution logic is needed beyond a simple `findOrFail` (use explicit binding)
- When binding requires authorization checks during resolution (use explicit binding or middleware)
- When the route parameter doesn't directly map to a model
- When the parameter name cannot match the controller variable name

## Prerequisites

- Eloquent model class
- Route parameter defined in the URI (`{user}`)
- Controller method with type-hinted parameter

## Inputs

- Route definition with `{parameter}` syntax
- Controller method signature with type-hinted model
- Optional: custom column syntax `{parameter:column}`

## Workflow

1. Define the route with a model parameter: `Route::get('/users/{user}', [UserController::class, 'show'])`
2. In the controller method, type-hint the model: `public function show(User $user)`
3. Ensure the parameter name `{user}` matches the variable name `$user` exactly
4. The framework automatically calls `User::findOrFail($value)` — no manual resolution needed
5. For custom column binding, use `{user:slug}` in the route URI
6. For soft-deleted models, chain `->withTrashed()` on the route
7. Run `php artisan route:list` to verify the route and parameter binding

## Validation Checklist

- [ ] Route parameter name matches controller variable name (e.g., `{user}` matches `$user`)
- [ ] Controller parameter type-hints the model class (e.g., `User $user`)
- [ ] No manual `Model::findOrFail()` in the controller body for this parameter
- [ ] Parameter name mismatch would cause raw string injection — verified with `route:list`
- [ ] Soft-deleted binding uses `->withTrashed()` only when appropriate
- [ ] Scoped bindings enabled for nested routes (Laravel 8+ default)

## Common Failures

### Parameter name mismatch
Route has `{user}` but controller has `User $account`. The names must match for implicit binding to work. A mismatch silently passes the raw string instead of the resolved model.

### Manual findOrFail() in controllers
Writing `User::findOrFail($id)` defeats the purpose of implicit binding and adds unnecessary boilerplate. Always type-hint the model.

### Assuming binding by ID
Using `{user:slug}` in the route but expecting `$user->id` in the controller. The binding column determines what value is used for resolution.

## Decision Points

### Standard binding vs custom column?
Use `{user}` for ID-based binding. Use `{user:slug}` for non-ID binding on a per-route basis.

### withTrashed() or not?
Only add `->withTrashed()` when the controller explicitly handles trashed models. Without it, soft-deleted models properly return 404.

## Performance Considerations

- Each implicit binding executes one database query (`findOrFail`)
- Nested resources with multiple bindings execute multiple queries
- Use eager loading in controllers to avoid N+1 on related data
- Custom column binding queries the specified column — ensure it is indexed

## Security Considerations

- Implicit binding without scoping allows cross-tenant resource access in multi-tenant apps — use scoped bindings
- Without `withTrashed()`, soft-deleted models return 404 — this is correct default behavior
- `withTrashed()` exposes deleted records — only use when the controller handles trashed resources with authorization

## Related Rules

- Use Type-Hinted Parameters Instead of Manual findOrFail
- Match Parameter Names Between Route and Controller
- Use Inline Syntax Over getRouteKeyName() for Single-Route Customization
- Use Scoped Bindings for Multi-Tenant Routes
- Use withTrashed() Judiciously

## Related Skills

- Implement Explicit Route Model Binding with Custom Resolution
- Configure Custom Route Keys with Inline Syntax
- Implement Scoped Bindings for Nested Routes

## Success Criteria

- Controller methods receive resolved model instances, not raw IDs
- Missing models return 404 automatically
- No manual `findOrFail()` calls exist for route parameters
- Route parameter names match controller variable names
- Custom column bindings use inline `{parameter:column}` syntax
- Soft-deleted routes use `withTrashed()` only when intended
