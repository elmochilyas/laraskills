# Skill: Implement URI-Based API Versioning

## Purpose

Organize API routes into version-prefixed groups so that multiple API versions coexist without breaking existing consumers. URI versioning (`/api/v1/`, `/api/v2/`) is explicit in logs, cacheable by HTTP caches, testable with standard assertions, and visible in API documentation — the most practical strategy for Laravel applications.

## When To Use

- Public APIs with external consumers that cannot upgrade simultaneously
- APIs under active development with breaking changes between versions
- Multi-version mobile apps where consumers cannot upgrade immediately
- APIs serving different client types (web, mobile, third-party)

## When NOT To Use

- Internal-only APIs where all consumers can be updated simultaneously
- Pre-release APIs before first stable release
- Single-consumer applications (frontend + backend under same deployment)

## Prerequisites

- Route groups and prefix configuration
- Controller directory structure for versioned namespaces
- API Resource directory structure per version

## Inputs

- Number of active versions to support (max 2)
- Version-specific controller classes
- Version-specific API Resource classes
- Deprecation timeline for oldest version

## Workflow

1. Create versioned controller directories: `app/Http/Controllers/Api/V1/`, `app/Http/Controllers/Api/V2/`
2. Create versioned resource directories: `app/Http/Resources/V1/`, `app/Http/Resources/V2/`
3. Define the outermost API prefix group: `Route::prefix('api')->group(...)`
4. Add a version prefix group inside: `Route::prefix('v1')->name('v1.')->group(...)`
5. Register routes using version-specific controllers in each group
6. Add a second version group only when a breaking change is required
7. Apply the same authentication middleware to all version groups
8. Add deprecation middleware to the older version group
9. Run `php artisan route:list` to verify all versions are registered
10. Enforce a max-2-versions policy by removing the oldest version when a new one is released

## Validation Checklist

- [ ] URI prefix used for versioning (`/api/v1/`) — no header or query parameter versioning
- [ ] All versions use the same authentication middleware
- [ ] Maximum 2 active major versions
- [ ] Older version has deprecation headers configured
- [ ] V1 routes return V1 controllers, V2 routes return V2 controllers
- [ ] `php artisan route:list` shows all versioned routes
- [ ] Route caching works with versioned route groups

## Common Failures

### Not versioning from the start
Adding versioning after the API is public requires a breaking migration. Add versioning (`/api/v1/`) from the first release, even with only one version.

### Supporting too many versions
Maintaining 4+ versions multiplies maintenance burden. Enforce a maximum of 2 active major versions with a published sunset policy.

## Decision Points

### URI vs Header vs Query Parameter?
URI versioning is the only recommended strategy for Laravel. Header versioning is invisible and hard to debug. Query parameter versioning pollutes cache keys.

### One version or two?
Start with V1 only. Add V2 only when a breaking change is needed. Remove V1 when all consumers migrate.

## Performance Considerations

Versioning adds no direct performance overhead. Route groups handle version prefix matching efficiently. Controller inheritance adds minimal PHP overhead. All version configurations are preserved in route cache.

## Security Considerations

- Old API versions often lack security fixes — consider rate-limiting deprecated versions more aggressively
- All versions must use the same authentication mechanism to prevent auth confusion
- Versioned resources prevent accidentally exposing new fields in old API responses

## Related Rules

- Enforce URI Versioning
- Limit Active Versions to Two
- Enforce Consistent Authentication Across Versions
- Add Deprecation Headers
- Version Resources Separately

## Related Skills

- Migrate API Versions Using Controller Inheritance
- Define Application Routes
- Implement Route Groups

## Success Criteria

- `/api/v1/users` and `/api/v2/users` both return correct responses
- V2 inherits unchanged V1 behavior without code duplication
- Deprecated versions return `Deprecation` and `Sunset` headers
- No more than 2 active versions in the codebase

---

# Skill: Migrate API Versions Using Controller Inheritance

## Purpose

Create V2 controllers that extend V1 controllers, overriding only changed methods, to minimize code duplication during API version migration. Inheritance ensures bug fixes applied to V1 propagate to V2+ automatically, preventing divergent codebases.

## When To Use

- Adding V2 of an API endpoint where most behavior remains unchanged
- Maintaining multiple API versions where V2 is a superset of V1
- Version migration where V2 changes only specific endpoints

## When NOT To Use

- When controller method signatures change incompatibly between versions
- When the entire controller logic changes between versions
- For resources with completely different response structures

## Prerequisites

- V1 controllers exist and are stable
- Service container supports controller inheritance
- PHP class inheritance and method override knowledge

## Inputs

- V1 controller class to extend
- List of methods that changed in V2
- V2-specific implementation for each changed method

## Workflow

1. Create the V2 controller in `App\Http\Controllers\Api\V2\`
2. Import the V1 controller with an alias: `use App\Http\Controllers\Api\V1\UserController as V1UserController`
3. Extend V1UserController in the V2 class declaration
4. Override only the methods that changed between versions
5. Update V2 API Resources to extend V1 resources for unchanged field serialization
6. Override the `toArray()` method in V2 resources to add new fields via `array_merge(parent::toArray($request), [...])`
7. Register V2 routes pointing to V2 controllers
8. Run `php artisan route:list` to verify V2 routes use V2 controllers

## Validation Checklist

- [ ] V2 controller extends V1 controller (not a copy)
- [ ] Only changed methods are overridden in V2
- [ ] V2 resource extends V1 resource for unchanged serialization
- [ ] V2 routes use V2 controller classes, not V1
- [ ] V1 tests still pass unchanged
- [ ] V2 tests verify only the changed behavior

## Common Failures

### Code duplication across versions
Copying entire controllers per version leads to bug-fix divergence. Always use inheritance. If inheritance isn't possible, extract shared logic into traits or services.

### Resource field leakage
Sharing a single `UserResource` across versions exposes V2 fields in V1 responses. Maintain separate resource classes per version with V2 extending V1.

## Decision Points

### Inheritance vs Traits vs Duplication?
Inheritance is preferred when the interface is compatible. Use traits or shared services when the method signature changes between versions.

### V2 Resource extends V1 or standalone?
Extend V1 when the response structure is similar with additions. Write standalone when the structure changes fundamentally.

## Performance Considerations

Controller inheritance adds minimal overhead (parent constructor calls). Resource inheritance adds negligible cost per response. Route caching preserves all version routing.

## Security Considerations

- V2 controllers inherit V1 auth logic — ensure V2-specific methods also have proper authorization
- Resource inheritance can accidentally expose sensitive V1 fields if V2 adds fields without review
- Test V2 overridden methods thoroughly; inherited methods should pass V1 tests unchanged

## Related Rules

- Use Controller Inheritance Across Versions
- Version Resources Separately
- Enforce Consistent Authentication Across Versions

## Related Skills

- Implement URI-Based API Versioning
- Define Application Routes
- Implement Resourceful Routing

## Success Criteria

- V2 controller contains only overridden methods, no duplicated V1 code
- V1 bug fixes automatically apply to V2 for non-overridden methods
- V2 responses include new fields without affecting V1 responses
- All V1 tests continue to pass after V2 is introduced
