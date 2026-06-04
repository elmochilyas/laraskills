# Anti-Patterns: Enum Binding

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing System |
| Knowledge Unit | Enum Binding |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Route Ordering Without `whereIn()` Workaround | Reliability | Critical |
| 2 | Using Enum Binding for Dynamic Value Sets | Architecture | High |
| 3 | Expecting Int-Backed Enum Support | Reliability | Medium |
| 4 | Manual `tryFrom()` in Controllers Instead of Enum Binding | Architecture | Medium |
| 5 | Enum Case Rename Breaking Production URLs | Reliability | High |

---

## Anti-Pattern 1: Route Ordering Without `whereIn()` Workaround

### Category
Reliability

### Description
Registering an enum-bound route (`/categories/{category}` with `Category` enum) before more specific literal routes (`/categories/featured`). Because enum binding does not generate regex constraints at registration time, the enum route matches first for ALL URL segments, including values that would match a later literal route. The enum route then fails resolution (not a valid enum case) and returns 404, shadowing the intended route.

### Why It Happens
Enum routes look like parameterized routes and are placed alongside other parameterized routes in the route file. Developers assume that enum routes automatically generate regex constraints from the enum cases (like `whereIn()` does). The constraint deferral to resolution time is not obvious from the syntax.

### Warning Signs
- Enum-bound route is defined before specific literal routes in the same URL space
- Requests to specific routes like `/categories/featured` return 404
- Changing route file order (literal routes before enum routes) fixes the 404
- The 404 error message includes "must be one of: [a, b, c]" — the route matched, enum validation failed
- No `->whereIn()` constraint is added to the enum route

### Why Harmful
The route silently matches and rejects requests that should be handled by a different route. The 404 is misleading — the resource exists but the route configuration shadows it. This is a silent configuration bug: the route file looks correct, the enum definition is correct, but the route ordering is wrong. The bug only manifests when specific literal routes are accessed, and the error message points to an enum validation failure rather than a missing route.

### Real-World Consequences
- Route file:
```php
Route::get('/categories/{category}', [CategoryController::class, 'show']); // Enum bound
Route::get('/categories/featured', [CategoryController::class, 'featured']); // Specific
Route::get('/categories/new', [CategoryController::class, 'new']); // Specific
```
- Request to `/categories/featured` matches the first route
- `Category::tryFrom('featured')` returns null (not an enum case)
- 404 returned: "Route parameter [category] must be one of: electronics, clothing, books"
- The `featured` route never runs
- Fix: move specific routes before the enum route, or add `->whereIn('category', Category::cases())`

### Preferred Alternative
Always add `->whereIn('category', Category::cases())` to enum-bound routes, or register literal routes before the enum route.

```php
// Wrong: enum route before literal routes, no whereIn()
Route::get('/categories/{category}', [CategoryController::class, 'show']);
Route::get('/categories/featured', [CategoryController::class, 'featured']); // Never reached

// Fix 1: add whereIn() constraint
Route::get('/categories/{category}', [CategoryController::class, 'show'])
    ->whereIn('category', Category::cases());
Route::get('/categories/featured', [CategoryController::class, 'featured']); // Now reachable

// Fix 2: register literal routes first
Route::get('/categories/featured', [CategoryController::class, 'featured']);
Route::get('/categories/new', [CategoryController::class, 'new']);
Route::get('/categories/{category}', [CategoryController::class, 'show']); // Enum route last
```

### Refactoring Strategy
1. Audit all enum-bound routes for route ordering
2. Add `->whereIn()` constraints to enum routes for regex-level filtering
3. Or reorder route definitions so literal routes come before parameterized routes
4. Run `php artisan route:list` to verify route order
5. Test both valid enum values and specific literal routes

### Detection Checklist
- [ ] Enum-bound routes use `->whereIn('param', Enum::cases())`
- [ ] Or literal routes are registered before enum routes
- [ ] Specific routes are not shadowed by enum routes
- [ ] `php artisan route:list` shows correct order
- [ ] Requests to specific literal routes return expected responses (not 404)

### Related Rules/Skills/Trees
- Rule: Add `->whereIn()` to enum routes to prevent route ordering shadowing
- Rule: Enum routes match ALL segments — register literal routes first
- Related KU: Route Definition, Route Constraints

---

## Anti-Pattern 2: Using Enum Binding for Dynamic Value Sets

### Category
Architecture

### Description
Using PHP enums for route binding when the set of valid values changes dynamically — user-created categories, tags from the database, or values added by administrators without a deployment.

### Why It Happens
Enum binding is the most convenient validation mechanism — zero configuration, automatic 404 on invalid values. Developers apply it to all constrained route segments without considering whether the value set is truly static. The convenience outweighs the correctness concern until a new value needs to be added.

### Warning Signs
- Enum values are loaded from the database or user input during enum definition
- The enum has cases that mirror database records (one case per database row)
- Adding a new valid value requires a deployment (code change + deploy)
- The enum file is edited frequently (weekly or more)
- The enum is in a "dynamic" domain: tags, categories, product types, departments

### Why Harmful
PHP enums are compile-time constants. Adding a case requires a code change, commit, CI run, and deployment. For dynamic value sets, this means a deployment for every new category, tag, or type. The deployment overhead slows down changes and encourages developers to batch changes (delaying important updates). Enum binding also breaks if an enum case is removed without coordinating with route access patterns.

### Real-World Consequences
- `ProductCategory` enum has cases for all product categories
- Marketing team adds a new category: "Sustainable"
- Developer must edit the enum, add `case Sustainable = 'sustainable'`, commit, deploy
- Until deployment, routes accepting `sustainable` return 404
- Marketing asks: "Why can't we add categories without a deployment?"
- Three months later: enum has 47 cases, changes weekly, frequent deployment friction

### Preferred Alternative
Use database-backed validation or explicit route binding for dynamic value sets. Reserve enum binding for truly static, domain-level value sets that change at most annually.

```php
// Wrong: enum for dynamic value set
enum Category: string
{
    case Electronics = 'electronics';
    case Clothing = 'clothing';
    // ... 45 more cases matching database records
}

// Correct: database-backed validation
// Use implicit model binding
Route::get('/categories/{category:slug}', [CategoryController::class, 'show']);
// Or custom binding with database check
Route::bind('category', function (string $value) {
    $valid = DB::table('categories')->where('slug', $value)->exists();
    abort_if(! $valid, 404);
    return $value;
});

// Correct: enum for truly static values only
enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    // These values change maybe once a year
}
```

### Refactoring Strategy
1. Identify enum-bound routes using dynamic or frequently-changing value sets
2. Replace enum binding with database-backed model binding or custom validation
3. Keep the enum for application logic (not binding) if needed
4. Reserve enum binding for stable, domain-level value sets
5. Document which value sets require deployments to change

### Detection Checklist
- [ ] Enum-bound routes use only static, stable value sets
- [ ] Dynamic value sets use database-backed binding or custom validation
- [ ] Adding a new valid value does not always require a deployment
- [ ] Enum changes are rare (less than quarterly)
- [ ] Enum values are not duplicated from database records

### Related Rules/Skills/Trees
- Rule: Use enum binding for static value sets, database binding for dynamic sets
- Rule: Enums are compile-time constants — not suitable for frequently changing values
- Related KU: Route Model Binding, Custom Route Binding

---

## Anti-Pattern 3: Expecting Int-Backed Enum Support

### Category
Reliability

### Description
Using int-backed enums in route parameter type-hints, expecting the framework to resolve them automatically. Laravel's int-backed enum support was attempted experimentally but deferred due to breaking changes. Only string-backed enums are stable for route binding.

### Why It Happens
PHP 8.1 supports both `: string` and `: int` backed enums. Developers familiar with both types may use int-backed enums for route parameters that are naturally numeric (status codes, numeric tiers, integer identifiers). The framework behavior for int-backed enums is inconsistent across versions.

### Warning Signs
- Enum is declared as `enum Foo: int` and used in a route parameter type-hint
- Route resolution throws errors or returns unexpected results for valid integer values
- The route works in one Laravel version but not another
- Framework upgrade breaks enum binding that previously worked
- No documentation or version note about int-backed enum support status

### Why Harmful
Int-backed enum binding is not reliable across Laravel versions. It may work in some versions (experimental implementation) and fail in others (after the breaking change was detected). An application relying on int-backed enum binding may break during a minor framework upgrade. The behavior is not tested by the framework's test suite, making it an undocumented and unsupported feature.

### Real-World Consequences
- Enum `UserRole: int { case Admin = 1; case Editor = 2; }`
- Route: `/users/{role}` with `UserRole $role` parameter
- Works on Laravel 11.0 (experimental support merged)
- Upgrade to Laravel 11.5 (PR #51114 reverted the breaking change)
- `UserRole::tryFrom(1)` works individually, but framework routing doesn't call it
- Route returns 500 error or passes raw integer instead of enum
- Fix: change to string-backed enum or handle conversion manually

### Preferred Alternative
Use string-backed enums exclusively for route binding. Maintain URL segments as readable strings, not numeric codes.

```php
// Unstable: int-backed enum
enum UserRole: int
{
    case Admin = 1;
    case Editor = 2;
}
Route::get('/users/{role}', function (UserRole $role) {
    // May not work reliably across Laravel versions
});

// Stable: string-backed enum
enum UserRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
}
Route::get('/users/{role}', function (UserRole $role) {
    // Reliable across Laravel 9-13
});

// Manual resolution for int-backed enums
Route::get('/users/{role}', function (string $role) {
    $roleEnum = UserRole::tryFrom((int) $role);
    abort_if(! $roleEnum, 404);
    // ...
});
```

### Refactoring Strategy
1. Audit all int-backed enums used in route type-hints
2. Convert to string-backed enums with readable URL values
3. Map old numeric URLs to new string URLs (redirects if needed)
4. Alternatively, use manual `tryFrom()` in controllers for int-backed enums
5. Test enum binding after Laravel version upgrades

### Detection Checklist
- [ ] All route-bound enums are string-backed (`: string`)
- [ ] URL segments use readable strings, not numeric codes
- [ ] No int-backed enums in route parameter type-hints
- [ ] Manual resolution is used if int-backed enums are unavoidable
- [ ] Enum binding works across Laravel version upgrades

### Related Rules/Skills/Trees
- Rule: Use string-backed enums for route binding — int-backed is unreliable
- Rule: Int-backed enum route binding is experimental and not stable
- Related KU: PHP 8.1 Enumerations, Route Definition

---

## Anti-Pattern 4: Manual `tryFrom()` in Controllers Instead of Enum Binding

### Category
Architecture

### Description
Writing explicit `$enum = EnumType::tryFrom($request->route('param')) ?? abort(404)` in controllers when the framework would handle this automatically via route parameter type-hinting.

### Why It Happens
Developers may not know about enum binding (introduced in Laravel 9). The manual `tryFrom()` pattern is explicit and familiar — it is the standard PHP approach. Developers coming from non-Laravel backgrounds or older Laravel versions naturally use this pattern.

### Warning Signs
- Controller methods call `EnumType::tryFrom($value)` with route parameters
- Controller has `abort(404)` or `abort_unless()` on enum resolution
- Route parameter is type-hinted as `string` instead of the enum class
- The same `tryFrom()` pattern is repeated across multiple controllers
- Enum validation logic exists in controllers instead of being handled by routing

### Why Harmful
Manual enum resolution in controllers duplicates code across every controller method that uses enum route parameters. The routing layer is the correct place for this validation — it ensures invalid values are rejected before any controller code executes. Manual resolution also requires the developer to remember the `abort(404)` pattern, which may be forgotten for some endpoints.

### Real-World Consequences
- 5 controllers each have `OrderStatus::tryFrom($request->status) ?? abort(404)`
- New developer adds a 6th controller but forgets the `abort(404)` fallback
- Invalid status value reaches controller logic without the enum resolved
- `$status->value` call on null — TypeError: "Call to member function value() on null"
- 500 error instead of proper 404
- Enum binding would prevent this by design

### Preferred Alternative
Type-hint the enum class in the controller parameter. The framework handles resolution automatically.

```php
// Wrong: manual tryFrom() in controller
public function show(string $status): Response
{
    $enum = OrderStatus::tryFrom($status);
    abort_if(! $enum, 404);
    // ...
}

// Correct: enum binding in route parameter
public function show(OrderStatus $status): Response
{
    // $status is already resolved to OrderStatus enum
    // Invalid values automatically return 404
    // ...
}

// Route definition
Route::get('/orders/{status}', [OrderController::class, 'show']);
```

### Refactoring Strategy
1. Identify controller methods calling `EnumType::tryFrom()` with route parameters
2. Change the parameter type-hint from `string` to the enum class
3. Remove the manual `tryFrom()` and `abort_if()` calls
4. Update route definition if needed (URL segments remain the same)
5. Test that invalid enum values return 404 without controller code execution

### Detection Checklist
- [ ] No manual `EnumType::tryFrom()` with route parameters in controllers
- [ ] Controller parameters use enum type-hints for enum-bound routes
- [ ] Invalid enum values return 404 without controller code executing
- [ ] Enum binding is used consistently across the application
- [ ] No duplicated validation logic in controllers

### Related Rules/Skills/Trees
- Rule: Use route-level enum binding instead of manual tryFrom() in controllers
- Rule: Enum binding moves validation to the routing layer
- Related KU: Route Model Binding, Route Definition

---

## Anti-Pattern 5: Enum Case Rename Breaking Production URLs

### Category
Reliability

### Description
Renaming the value of a backed enum case after the enum is used in production routes. Existing URLs that use the old value break — returning 404 because `tryFrom()` no longer matches.

### Why It Happens
Enums are code, and code refactoring seems safe. Developers rename enum values for consistency, spelling fixes, or convention alignment without realizing that the enum value IS the API contract for URL segments. The value is user-facing and must be treated as a public API.

### Warning Signs
- Enum case value is renamed: `case Electronics = 'elec'` → `case Electronics = 'electronics'`
- Old URLs containing `/products/elec` return 404
- External consumers report broken links
- SEO rankings drop as indexed URLs become invalid
- No migration or redirect exists for old values

### Why Harmful
Enum values embedded in URLs are part of the public API. Changing them breaks all existing links — from search engines, social media shares, bookmark, external consumers, and internal references. Unlike controller refactoring (which is internal), enum value changes have external visibility and impact.

### Real-World Consequences
- `Category::Electronics` has value `'elec'` → renamed to `'electronics'`
- All URLs like `/products/elec` return 404
- Google has indexed 10,000 product pages with `/products/elec/...`
- All search traffic to those pages drops immediately
- Social media shares, email links, and bookmarks all break
- Fix: add redirect middleware or keep old value, add alias

### Preferred Alternative
Treat enum values as immutable once deployed. If a rename is absolutely necessary, maintain backward compatibility by keeping the old value as an alias or adding a redirect.

```php
// Wrong: renaming breaks existing URLs
enum Category: string
{
    case Electronics = 'elec'; // Old value — renaming to 'electronics' breaks URLs
}

// Correct: keep old value, add transition logic if needed
enum Category: string
{
    case Electronics = 'elec'; // Keep the old value forever
    // Add new case for the new value
}

// Or: add a mapping layer for backward compatibility
class CategoryRouter
{
    private const ALIASES = [
        'elec' => 'electronics',
        'ele' => 'electronics',
    ];

    public static function resolve(string $slug): ?Category
    {
        $canonical = self::ALIASES[$slug] ?? $slug;
        return Category::tryFrom($canonical);
    }
}

// Or redirect old values in middleware
Route::bind('category', function (string $value) {
    $redirects = ['elec' => 'electronics'];
    if (isset($redirects[$value])) {
        return redirect('/products/' . $redirects[$value]);
    }
    return Category::tryFrom($value) ?? abort(404);
});
```

### Refactoring Strategy
1. Audit enum case values used in URL routes — mark as immutable
2. If a value must change: add a redirect from old value to new value
3. Keep old enum case value if possible (deprecate in documentation only)
4. Add URL alias mapping for backward compatibility
5. Document: enum values in routes are part of the public API — changes require migration plan

### Detection Checklist
- [ ] No enum case values have been renamed after production deployment
- [ ] Old enum values still resolve in URL routes
- [ ] Redirects exist for any changed values
- [ ] Enum values are documented as part of the public contract
- [ ] Enum value changes follow a migration plan with consumer notification

### Related Rules/Skills/Trees
- Rule: Enum case values used in routes are part of the public API — do not rename
- Rule: Renaming enum values breaks existing URLs — treat as immutable
- Related KU: Route Definition, URL Design
