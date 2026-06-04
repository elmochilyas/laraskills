# Skill: Use Laravel ApiRoute for Versioned API Routing

## Purpose
Use the `ApiRoute` facade or custom route groups to manage versioned API routes with separate controllers, middleware, and request validation per version.

## When To Use
- Building versioned REST APIs with Laravel
- Managing multiple API versions simultaneously
- Organizing version-specific controllers and validation rules

## When NOT To Use
- Single-version API (standard `Route::apiResource()` suffices)
- API gateway handles versioning externally

## Prerequisites
- Laravel application with API routes
- `composer require laravel/apiroute` (or custom route groups)

## Workflow
1. Define versioned route groups: `Route::prefix('v1')`, `Route::prefix('v2')`
2. Create version-specific controllers: `Api\V1\UsersController`
3. Share common logic via base controller or service classes
4. Keep version-specific transformers/validators in version directories
5. Apply version-specific middleware per route group
6. Register routes for all active versions
7. Test all active version routes in CI
8. Deprecate and remove old version route groups when sunset

## Validation Checklist
- [ ] Route groups defined per version prefix
- [ ] Version-specific controllers organized in namespaces
- [ ] Common logic shared via base controller/services
- [ ] Version-specific middleware applied
- [ ] All active versions tested
- [ ] Deprecated version route groups documented for removal
