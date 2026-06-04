# Anti-Patterns: API Versioning

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing System |
| Knowledge Unit | API Versioning |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Not Versioning from Day One | Architecture | Critical |
| 2 | Returning Raw Eloquent Models from Controllers | Architecture | High |
| 3 | Using `if` Version Branches Inside Controllers | Maintainability | High |
| 4 | Mixing Versioning Strategies Across Endpoints | Architecture | High |
| 5 | Supporting Too Many Versions Indefinitely | Maintenance | Critical |

---

## Anti-Pattern 1: Not Versioning from Day One

### Category
Architecture

### Description
Building an API without versioning and planning to "add versioning later." The API starts at `/api/users` instead of `/api/v1/users`. When the first breaking change is needed, every existing consumer must be updated simultaneously or backward compatibility shims must be maintained indefinitely.

### Why It Happens
Versioning seems like premature complexity. The API is small, the consumers are internal, or "we'll only make backward-compatible changes." The two-character `/v1/` prefix feels unnecessary. Adding versioning later seems manageable until the first breaking change arrives.

### Warning Signs
- Route files use `/api/users` instead of `/api/v1/users`
- "We'll add versioning later" is in the project docs or README
- A breaking change (field removal, validation change, response restructuring) is being discussed without a versioning plan
- Consumers receive breaking changes without migration notice
- API documentation does not mention versions

### Why Harmful
Every consumer integrates against a non-versioned contract. Any breaking change breaks every consumer. Adding versioning later requires either renaming all existing routes (breaking all consumers) or maintaining backward compatibility shims in every controller. Retrofit versioning costs dramatically more than day-one versioning, and the cost compounds with every consumer added during the non-versioned period.

### Real-World Consequences
- API starts at `/api/users` — no version prefix
- 6 months later, 12 external and 3 internal consumers depend on the API
- Breaking change required: rename `full_name` to `name` in response
- Option A: rename → all 12 consumers break simultaneously
- Option B: add versioning → all existing consumers use implicit `/v0` (unversioned), new consumers use `/v1`
- `/v0` must be maintained for all existing consumers with no sunset plan
- Result: indefinite maintenance of unversioned endpoints

### Preferred Alternative
Start with `/api/v1/` from the first route. The cost is two characters in the route file. The benefit is a clear contract boundary from day one.

```php
// Wrong: no versioning
Route::prefix('api')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});

// Correct: version from day one
Route::prefix('api/v1')->name('v1.')->group(function () {
    Route::get('/users', [Api\V1\UserController::class, 'index']);
});
```

### Refactoring Strategy
1. Create `/api/v1/` prefix group around all existing routes
2. Move controllers to `Api\V1` namespace
3. Add deprecation notice to the old unversioned routes (if they must remain)
4. Update existing consumers to use `/api/v1/` URLs
5. Set a sunset date for the old unversioned routes
6. For future breaking changes, create `/api/v2/` with new behavior

### Detection Checklist
- [ ] API routes use `/api/v1/` or versioned prefix from the start
- [ ] No unversioned API routes in production
- [ ] Version prefix is present in API documentation
- [ ] Breaking change process includes new version creation
- [ ] Day-one versioning is standard practice for all new API projects

### Related Rules/Skills/Trees
- Rule: Version API routes from day one — start with `/api/v1/`
- Rule: Adding versioning later costs dramatically more than starting with it
- Related KU: Route Groups, Route Definition

---

## Anti-Pattern 2: Returning Raw Eloquent Models from Controllers

### Category
Architecture

### Description
Returning Eloquent models directly from controller methods (e.g., `return User::find($id)`) instead of using API Resources. The database schema becomes the API contract — any schema change changes the API response, and different versions cannot have different response shapes.

### Why It Happens
Returning a model directly is the fastest path to a working API. `return $user` serializes the model to JSON automatically. Adding API Resources requires additional classes and mapping. The convenience outweighs the long-term cost in early development.

### Warning Signs
- Controller methods end with `return $model` or `return $collection`
- No `Resource` or `ResourceCollection` classes exist in `app/Http/Resources`
- Adding a column to a database table automatically adds it to the API response
- Removing a column from a database table breaks the API
- Different API versions return identical response shapes (cannot customize per version)

### Why Harmful
The database schema is tightly coupled to the API contract. A database column rename or removal becomes an API breaking change. Versioning a response shape (V1 shows `name`, V2 shows `first_name` and `last_name`) requires the same database query with different transformations — impossible without a transformation layer. Eloquent serialization also exposes all model attributes, including sensitive ones (passwords, internal flags), unless explicitly hidden.

### Real-World Consequences
- Controller returns `User::findOrFail($id)` — all columns serialized
- Security audit: `is_admin` column exposed in API response
- Quick fix: add `$hidden = ['is_admin']` to model
- Reporting team depends on `is_admin` in API response for dashboard
- Breaking change: removing `is_admin` from response breaks reporting
- Without versioning, impossible to have both secure and unsecure response shapes

### Preferred Alternative
Use API Resources for every response. Version resources separately to decouple the API contract from the database schema.

```php
// Wrong: raw model — schema is API contract
public function show(string $id): User
{
    return User::findOrFail($id);
}

// Correct: API Resource — explicit response contract
public function show(string $id): V1\UserResource
{
    return new V1\UserResource(User::findOrFail($id));
}

// V2 can have a different shape
public function show(string $id): V2\UserResource
{
    return new V2\UserResource(User::findOrFail($id));
}
```

### Refactoring Strategy
1. Create API Resource classes for every model returned from controllers
2. Replace `return $model` with `return new ModelResource($model)`
3. Define the exact response shape in each Resource class
4. Add version-specific Resources per API version
5. Add CI check: controllers must not return Eloquent models directly

### Detection Checklist
- [ ] No controller returns Eloquent models directly
- [ ] API Resources define explicit response contracts
- [ ] Database schema changes do not affect API responses
- [ ] Different API versions have different Resource classes
- [ ] Sensitive model attributes are not exposed in responses

### Related Rules/Skills/Trees
- Rule: Use API Resources instead of returning raw Eloquent models
- Rule: The database schema must not be the API contract
- Related KU: API Resources, Resource Versioning

---

## Anti-Pattern 3: Using `if` Version Branches Inside Controllers

### Category
Maintainability

### Description
Sharing a single controller across API versions and using `if ($version === 'v1')` branches to handle version-specific behavior. The controller accumulates conditionals as new versions are added, becoming unreadable and untestable.

### Why It Happens
Avoiding code duplication seems virtuous. A single controller with version checks appears to reduce files compared to separate controllers per version. The first version branch seems reasonable; the fifth makes the file unmaintainable, but by then it is too late to refactor.

### Warning Signs
- Controller methods have `if`/`switch` blocks checking version headers or route prefixes
- The file grows longer with each API version added
- A new version requires editing an existing controller (risk of breaking old versions)
- `$request->header('Accept')` or `$request->segment(1)` is used to determine version
- Comments like "// V3 uses different validation" are scattered through the method

### Why Harmful
Version branches create a single file that changes for every version, making it impossible to maintain old versions without risk of breaking them. Adding a new version requires touching old code, introducing regression risk. Testing the controller requires testing every version-conditional branch permutation, leading to combinatorial test explosion (3 versions × 5 conditions = 243 paths).

### Real-World Consequences
- `UserController::store()` has `if (version === 'v1') { ... } elseif (version === 'v2') { ... } elseif (version === 'v3') { ... }`
- V4 adds a new validation field; developer edits the same method
- V1 branch accidentally breaks (missing `break` in `switch`)
- V1 consumers start receiving validation errors
- Debugging: regression in V1 from V4 change
- Fix: separate controllers per version — V4 changes cannot break V1

### Preferred Alternative
Use separate controllers per version. Version-specific code lives in version-specific controllers. Shared logic is extracted into services used by all versions.

```php
// Wrong: version branches in a single controller
public function store(Request $request): Response
{
    if ($request->segment(1) === 'v1') {
        // V1 logic
    } elseif ($request->segment(1) === 'v2') {
        // V2 logic
    }
}

// Correct: separate controllers per version
// V1/UserController.php
class UserController
{
    public function store(V1\StoreUserRequest $request): V1\UserResource
    {
        $user = UserService::create($request->validated());
        return new V1\UserResource($user);
    }
}

// V2/UserController.php
class UserController
{
    public function store(V2\StoreUserRequest $request): V2\UserResource
    {
        $user = UserService::create($request->validated());
        return new V2\UserResource($user);
    }
}
```

### Refactoring Strategy
1. Identify controllers with version conditionals
2. Create separate controller classes per version (V1/, V2/, etc.)
3. Extract version-conditional logic into each version's controller
4. Extract shared business logic into services (unchanged between versions)
5. Update route files to point to the correct version's controller
6. Remove version conditionals from original controllers

### Detection Checklist
- [ ] No version conditionals in controllers
- [ ] Each version has its own controller classes
- [ ] Adding a new version creates new files, does not modify old ones
- [ ] Shared business logic is in services (unchanged between versions)
- [ ] Old versions cannot be broken by new version changes

### Related Rules/Skills/Trees
- Rule: Do NOT use version conditionals in controllers — use separate controllers per version
- Rule: Version branches create regression risk and maintainability debt
- Related KU: Controllers Architecture, Service Layer

---

## Anti-Pattern 4: Mixing Versioning Strategies Across Endpoints

### Category
Architecture

### Description
Using URI versioning for some endpoints (`/api/v1/users`), header versioning for others (`Accept: application/vnd.app.v2+json`), and query parameter versioning for yet others (`/api/users?version=3`). Consumers must understand multiple versioning mechanisms to use the API.

### Why It Happens
Different teams or developers implement versioning independently. One endpoint needs URI versioning for cacheability, another needs header versioning for URL cleanliness. Without a documented versioning strategy, each developer chooses their preferred approach, resulting in an inconsistent API surface.

### Warning Signs
- Some route files use `/api/v1/` prefix, others use `Accept` header detection middleware
- API documentation has different versioning instructions for different endpoints
- Consumers report confusion about how to specify the API version
- Route list shows a mix of versioned and unversioned URI patterns
- Version detection logic is spread across middleware, route groups, and controllers

### Why Harmful
Consumers must implement multiple versioning mechanisms — some endpoints need the version in the URL, others need a custom header, others need a query parameter. This increases client complexity and error rates. Internal API documentation must specify the versioning strategy per endpoint. API clients cannot be standardized across the entire API.

### Real-World Consequences
- Public API uses `/api/v1/users` (URI versioning)
- Internal admin API uses `Accept: application/vnd.admin.v1+json` (header versioning)
- Partner API uses `/api/partners?version=1` (query parameter)
- New developer joins team: "Which versioning strategy should I use for this new endpoint?"
- No standard answer; each endpoint follows its own convention
- Third-party integrators must implement three different versioning mechanisms

### Preferred Alternative
Choose one versioning strategy and apply it consistently across all endpoints. URI versioning is the recommended choice for Laravel applications.

```php
// Wrong: mixed strategies
// Route file 1: URI versioning
Route::prefix('api/v1')->group(function () {
    Route::get('/users', ...);
});

// Route file 2: header versioning
Route::get('/api/reports', function (Request $request) {
    $version = $request->header('Accept');
    // ...
});

// Route file 3: query parameter versioning
Route::get('/api/analytics', function (Request $request) {
    $version = $request->query('version', '1');
    // ...
});

// Correct: consistent URI versioning
Route::prefix('api/v1')->name('v1.')->group(function () {
    Route::get('/users', [V1\UserController::class, 'index']);
    Route::get('/reports', [V1\ReportController::class, 'index']);
    Route::get('/analytics', [V1\AnalyticsController::class, 'index']);
});

Route::prefix('api/v2')->name('v2.')->group(function () {
    Route::get('/users', [V2\UserController::class, 'index']);
    // ... V2 endpoints
});
```

### Refactoring Strategy
1. Document the chosen versioning strategy for the entire API
2. Audit all endpoints for versioning mechanism consistency
3. Migrate header-based and query-parameter-based endpoints to URI versioning
4. Add redirects or deprecation notices for old versioning mechanisms
5. Add CI lint rule enforcing the chosen versioning strategy

### Detection Checklist
- [ ] All API endpoints use the same versioning strategy
- [ ] URI versioning is used consistently (or chosen strategy is documented)
- [ ] No mixed header/URI/query parameter versioning
- [ ] API documentation describes a single versioning mechanism
- [ ] New endpoints default to the established versioning strategy

### Related Rules/Skills/Trees
- Rule: Use a consistent versioning strategy across all API endpoints
- Rule: URI versioning is the recommended default for Laravel APIs
- Related KU: Route Groups, Middleware

---

## Anti-Pattern 5: Supporting Too Many Versions Indefinitely

### Category
Maintenance

### Description
Maintaining N API versions indefinitely because no sunset policy exists. Each new version adds a full set of controllers, resources, form requests, and tests. The maintenance burden grows linearly with version count — every framework upgrade, security patch, or dependency update must be tested against all versions.

### Why It Happens
"No consumer left behind" is a well-intentioned policy. The sales team promises enterprise customers long migration windows. Technical teams are afraid of breaking consumers and never set hard sunset dates. After 5-6 versions, the maintenance burden is severe but no one wants to be the one to deprecate a version.

### Warning Signs
- 3+ API versions are maintained simultaneously
- Team spends more time maintaining old versions than building new features
- Framework upgrades require testing against N versions
- CI pipeline runs the same tests N times (one per version)
- Version discovery endpoint shows 4+ "stable" versions with no sunset dates
- Deprecation headers are never added to old versions

### Why Harmful
Each extra version doubles the surface area for bugs during changes. A security patch to the authentication middleware must be verified against V1, V2, V3, V4, and V5. Controllers and resources for old versions accumulate dead code as features are removed from newer versions. The team's velocity slows proportionally to the number of versions maintained.

### Real-World Consequences
- Version N+1 is released; V1 through V4 are still "stable" with no sunset
- Laravel upgrade from 11 to 12: must update 5 controller namespaces, 5 resource directories, 5 test suites
- Testing takes 5x longer (one run per version)
- Developer who wrote V1 left the company; no one understands the V1 code
- V1 has a security vulnerability in its authentication logic
- Fixing V1 requires reverse-engineering code written 3 years ago

### Preferred Alternative
Enforce a maximum-versions policy (e.g., support only the last 2 major versions). Add deprecation headers to old versions immediately when a new version is released. Set and communicate sunset dates clearly.

```php
// Define sunset policy in a service provider
class VersionPolicyServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Register sunset headers for deprecated versions
        $this->app->make(Router::class)->pushMiddlewareToGroup('v1', function ($request, $next) {
            $response = $next($request);
            $response->header('Sunset', 'Sun, 01 Jan 2027 00:00:00 GMT');
            $response->header('Deprecation', 'true');
            return $response;
        });
    }
}

// Route registration: only active versions
Route::prefix('api/v2')->name('v2.')->group(base_path('routes/api/v2.php'));
Route::prefix('api/v3')->name('v3.')->group(base_path('routes/api/v3.php'));
// V1 route file removed — consumers must migrate
```

### Refactoring Strategy
1. Define and document the maximum supported versions policy (recommended: 2 active versions)
2. Add deprecation headers to the oldest supported version
3. Announce sunset dates to consumers of deprecated versions
4. Remove route registration for expired versions
5. Delete controller, resource, and test files for removed versions
6. Set a recurring calendar reminder to evaluate version retirement

### Detection Checklist
- [ ] Maximum 2 active API versions at any time
- [ ] Deprecation headers are present on older versions
- [ ] Sunset dates are defined and communicated
- [ ] Removed versions have no remaining route, controller, or test files
- [ ] Framework upgrades do not need to test against removed versions

### Related Rules/Skills/Trees
- Rule: Support a maximum of 2 active API versions
- Rule: Maintained versions increase maintenance burden linearly
- Related KU: Route Caching, Controller Architecture
