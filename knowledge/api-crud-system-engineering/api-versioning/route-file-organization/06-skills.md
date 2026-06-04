# Skill: Organize Versioned Route Files

## Purpose
Structure API route files per version with separate files, config-gated loading, versioned prefixes, and proper naming to maintain clean separation as API versions evolve.

## When To Use
- Any API project with more than one version
- When adding a new API version to an existing project
- As part of standard Laravel API project setup

## When NOT To Use
- Single-version APIs (standard `routes/api.php` suffices)
- Prototypes with minimal routing
- APIs with a single endpoint

## Prerequisites
- Laravel routing knowledge
- RouteServiceProvider setup

## Inputs
- Route definitions per version
- Version activation configuration

## Workflow
1. Create separate route file per version — `routes/api-v1.php`, `routes/api-v2.php`
2. Load versioned routes from RouteServiceProvider with prefix and name — `Route::prefix('api/v1')->name('api.v1.')->group(...)`
3. Use config-gated loading — `config("api.versions.v1.active", true)` controls version activation
4. Load oldest version first to prevent route shadowing
5. Name routes with version prefix to avoid collisions — `api.v1.posts.index`
6. Run `php artisan route:cache` after every route change
7. Remove retired version route registration but keep the file for reference
8. Maintain a shared routes file for health, auth endpoints (loaded before versioned files)

## Validation Checklist
- [ ] Separate route file per version in `routes/` directory
- [ ] RouteServiceProvider loads versioned files with prefix/name
- [ ] Config-gated loading controls version activation
- [ ] Routes named with version prefix to avoid collisions
- [ ] `php artisan route:cache` runs in deployment
- [ ] Retired versions removed from loading but files remain

## Common Failures
- Loading all route files in `web.php` or `api.php` instead of RouteServiceProvider
- Forgetting `route:cache` after adding version — routes return 404
- Naming collisions — two versions with same route name
- Not removing old version route loading when retired

## Decision Points
- Separate file per version vs single file with groups — separate for clean diffs
- Config-gated vs hardcoded loading — config for flexibility, hardcoded for simplicity
- Shared routes location — file loaded before versioned files

## Performance Considerations
- Route file count does NOT affect resolution speed (cached routes are one file)
- Each version adds ~1-2 KB to cached route file — negligible
- Route caching should be part of deployment pipeline
- Config-gated loading adds one `config()` call per version — negligible

## Security Considerations
- Ensure middleware applied to route groups includes auth/rate-limiting for all versions
- Route caching can mask missing middleware if not verified after generation
- Removed version routes should be confirmed inaccessible

## Related Rules
- Use Separate Route File Per API Version
- Load Versioned Routes From RouteServiceProvider
- Run `route:cache` After Every Route Change
- Use Config-Gated Route Loading For Version Toggle
- Load Oldest Version First
- Name Routes With Version Prefix

## Related Skills
- URL Path Versioning — route prefix structure
- Controller Inheritance — controllers routes point to
- Versioning Strategy Selection — choosing route strategy

## Success Criteria
- Each version has clean separate route files
- Versions can be toggled on/off via config
- Route caching is part of deployment
- No route name collisions between versions
- Retired version files remain for reference