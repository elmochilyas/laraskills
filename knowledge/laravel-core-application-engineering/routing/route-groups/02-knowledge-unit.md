# Route Groups

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Route Groups
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Route groups allow applying shared attributes (prefix, middleware, namespace, name prefix, domain, where constraints) to a set of routes. Groups can be nested arbitrarily, and attribute inheritance follows type-specific merge rules — prefix concatenates, namespace concatenates with reset-support, name prepends, domain replaces, where overrides.

Route groups are the primary mechanism for organizing routes by middleware stack (web vs api), URL prefix (admin vs app), authentication status (auth vs guest), and domain/subdomain (tenant.example.com vs admin.example.com). They solve the problem of repeating common attributes across dozens of routes.

The engineering significance of groups is that attribute inheritance semantics differ per attribute type — expecting uniform merge behavior is the most common source of group-related bugs. A prefix concatenates (outer + inner), but a domain replaces (inner overrides outer). A name prefix prepends (outer + inner), but where patterns override (inner overwrites outer). These type-specific behaviors are documented but non-obvious, especially at 3+ levels of nesting.

---

## Core Concepts

### Group Attribute Stack
`Router::group()` stores group attributes in a `$this->groupStack[]` array — a LIFO stack. Each group push adds a new attribute set to the stack. Each route created within the group inherits attributes from all stack levels, merged via `RouteGroup::merge()`.

### RouteGroup::merge() Semantics
Each attribute type has distinct merge behavior:

| Attribute | Merge Behavior | Example |
|-----------|---------------|---------|
| `prefix` | Concatenated with `/` | `admin/users` |
| `namespace` | Concatenated with `\` | `App\Http\Admin` |
| `as` (name) | Prepended (outer + inner) | `admin.users.index` |
| `name` | Same as `as` | Prepended |
| `domain` | Replaced (inner replaces outer) | Inner `domain` overrides outer |
| `middleware` | Merged into array (additive) | Both middleware stacks apply |
| `where` | Merged (inner overrides outer for same key) | Inner constraint wins |
| `controller` | Replaced (inner replaces outer) | Inner controller overrides |
| Other string | Replaced | Inner wins |
| Other array | `array_merge` (inner overrides) | Inner keys override outer |

### RouteRegistrar Fluent Builder
`RouteRegistrar` provides fluent attribute setting via `__call()`:

```php
Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->domain('admin.example.com')
    ->group(function () {
        // Routes with all above attributes
    });
```

The `RouteRegistrar::attribute()` method maps method names to action keys:
- `middleware()` → `middleware` (adds to array)
- `prefix()` → `prefix` (sets string)
- `name()` → `as` (sets/appends string)
- `domain()` → `domain` (sets string)
- `namespace()` → `namespace` (sets string)
- `scopeBindings()` → `scope_bindings` (sets boolean)
- `withoutScopedBindings()` → `scope_bindings` (sets false)

### Group Nesting
Groups can nest to arbitrary depth. Each nesting level pushes attributes onto the stack. Route `Router::group()` pushes before executing the group's Closure and pops after. Nested groups accumulate attributes from all ancestor scopes.

### Subdomain Routing
`Route::domain('{account}.example.com')` sets host-matching on all routes in the group. Subdomain parameters (`{account}`) are extracted by `RouteParameterBinder::bindHostParameters()` and are available in controllers.

---

## Mental Models

### Groups as Attribute Cascades
Group attributes flow outward-to-inward like CSS cascades. Outer groups set defaults; inner groups override or extend them. Unlike CSS, the merge semantics differ per attribute type — some combine (prefix), some replace (domain), some merge uniquely (middleware).

### Groups as Route Middleware Selectors
The primary use of groups is to select which middleware stack the contained routes use. `Route::middleware('web')` selects the web middleware stack. `Route::middleware('api')` selects the API stack. This association between routes and their middleware is the most important organizational function of groups.

### Groups as URL Prefix Context
A prefix group establishes a URL context. Routes within `/admin/` are administratively scoped. Routes within `/api/v1/` are API-versioned. The prefix is part of the route's identity — changing it changes all URLs.

---

## Internal Mechanics

### Group Push/Pop Flow

```
Router::group($attributes, $routes)
  ├── $this->groupStack[] = $this->mergeWithLastGroup($attributes)
  │     ├── If no stack: $attributes as-is
  │     └── If stack exists: RouteGroup::merge($attributes, $last)
  │
  ├── if $routes is Closure:
  │     └── $routes($this)  // router passed as parameter
  │
  ├── if $routes is string (file path):
  │     └── (new RouteFileRegistrar($this))->register($routes)
  │
  └── array_pop($this->groupStack)
```

### Attribute Application to Routes

```
Router::createRoute($methods, $uri, $action)
  ├── $this->mergeGroupAttributesIntoRoute($action)
  │     ├── foreach $this->groupStack as $group:
  │     │     ├── Apply prefix: concatenate URIs
  │     │     ├── Apply namespace: concatenate or reset
  │     │     ├── Apply name prefix: prepend to action['as']
  │     │     ├── Apply middleware: merge arrays
  │     │     ├── Apply domain: set action['domain']
  │     │     └── Apply where: merge constraints
  │     └── return merged $action
  └── Create Route with merged action
```

### Prefix Concatenation
Prefixes concatenate with a `/` separator:
```
Outer prefix: admin
Inner prefix: users
Result: admin/users
```

Trailing slashes on outer prefixes and leading slashes on inner prefixes are handled by normalizing with trim.

### Namespace Concatenation
Namespaces concatenate with `\`:
```
Outer namespace: App\Http\Controllers
Inner namespace: Admin
Result: App\Http\Controllers\Admin
```

An inner namespace starting with `\` resets (absolute namespace):
```
Outer: App\Http\Controllers
Inner: \MyPackage\Controllers
Result: MyPackage\Controllers
```

### Name Prefix Prepending
Outer name prefixes are prepended to inner:
```
Outer name: admin.
Inner name: users.
Result: admin.users.
```

The `name()` method on RouteRegistrar appends to the current `as` value.

### Middleware Collection
Middleware arrays are additive — routes receive middleware from all group levels:
```
Outer middleware: ['auth']
Inner middleware: ['verified']
Result: ['auth', 'verified']
```

Middleware is executed in the order specified in the array.

### Subdomain Parameter Matching
`RouteParameterBinder::bindHostParameters()` compiles the domain pattern into a regex. Parameters in the domain pattern (`{account}`) are extracted and available as route parameters. The `HostValidator` checks the request host against the compiled domain pattern.

---

## Patterns

### Middleware Stack Selection
```php
Route::middleware('web')->group(function () {
    // Standard web routes with session, CSRF, cookies
});

Route::middleware('api')->group(function () {
    // API routes with rate limiting, JSON handling
});
```
The most common group pattern — every route belongs to a middleware stack.

### Prefix-Based Domain Organization
```php
Route::prefix('admin')->name('admin.')
    ->middleware(['auth', 'verified', 'can:access-admin'])
    ->group(function () {
        // All admin routes inherit prefix, name, middleware
    });

Route::prefix('api')->name('api.')
    ->group(base_path('routes/api.php'));
```

### Subdomain-Based Multi-Tenant Routing
```php
Route::domain('{account}.example.com')->group(function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::resource('users', UserController::class);
});

Route::domain('admin.example.com')->group(function () {
    Route::get('/', [AdminController::class, 'index']);
});
```

### Namespace Organization
```php
Route::namespace('Admin')->prefix('admin')->group(function () {
    // Controllers resolve to App\Http\Controllers\Admin\*
});
```

### Composite Group Pattern
```php
Route::prefix('api')->name('api.')->group(function () {
    Route::prefix('v1')->name('v1.')->group(function () {
        Route::prefix('leads')->name('leads.')
            ->group(base_path('routes/api/leads.php'));
    });
});
// Results in route names like: api.v1.leads.index
```

---

## Architectural Decisions

### Why Attribute Merge Behaviors Differ
Each attribute type has a natural composition behavior: prefixes are path components that should concatenate; domains are distinct hosts that should replace; namespaces are hierarchical but can be absolute; middleware is additive. Uniform merge rules would create awkward semantics for each attribute type, so each has type-specific rules.

### Why Group Stack Exists
The LIFO attribute stack allows lexical scoping of route attributes. When a group is closed, its attributes disappear. This prevents attribute leakage between unrelated route groups and enables nested attribute refinement without modifying parent scope.

### Why RouteRegistrar Uses __call()
The fluent builder (`Route::prefix()->middleware()->name()->group()`) uses `__call()` to map method names to attribute keys. This design enables extensibility — packages can add custom group attributes without modifying the framework core.

---

## Tradeoffs

### Many Small Groups vs Few Large Groups

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Many small: Precise attribute control, easy to reason about | More nesting levels, harder to read | Deeply nested groups obscure which attributes apply |
| Few large: Simple structure, easy to audit | Attribute over-inclusion — routes get middleware they don't need | Routes may fail if middleware expects state they don't provide |

### Subdomain vs Prefix Organization

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Subdomain: Clear separation, DNS-level isolation | More complex deployment, SSL certificates per domain | Resources spread across subdomains complicate session/cookie management |
| Prefix: Simple, shared session/cookies, single domain | All routes on same domain, path-based organization | Can reach URL depth limits for deeply nested features |

### Nested Groups vs Explicit Groups

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Nested: Inherits all parent attributes automatically | Non-obvious attribute composition | Merging 3+ levels of attributes requires mental execution of RouteGroup::merge() |
| Explicit: Every attribute visible on every group | Verbose, repetitive | Router attributes duplicated across groups |

---

## Performance Considerations

### Group Processing Overhead
Each `Route::group()` call pushes to the group stack and pops after execution. This is O(1) overhead per group — negligible regardless of group count.

### Attribute Merging Cost
Each route within a group merges all stack attributes during `createRoute()`. The merge is a shallow array operation — negligible for typical attribute counts (3-5 per group). For deeply nested groups with many attributes, the cumulative merge cost is proportional to nesting depth × route count.

### Subdomain Regex Compilation
The `HostValidator` compiles the domain pattern into a regex for each route. For subdomain routes, this adds regex compilation cost on first match. With route caching, the compiled regex is serialized and restored.

---

## Production Considerations

### Middleware Order Within Groups
The order in which middleware is specified in groups determines execution order. When multiple groups contribute middleware, the combined list executes in the combined order. This can produce surprising execution sequences when middleware from outer and inner groups interleave.

### Subdomain SSL Certificate Requirements
Each subdomain used in `Route::domain()` must have a valid SSL certificate if served over HTTPS. Wildcard certificates (`*.example.com`) cover all single-level subdomains. Multi-level subdomains require specific certificates.

### Route Name Uniqueness Across Groups
Route names must be globally unique. Two groups on different domains that use the same route name (`dashboard`) conflict in the name registry — only the last registered name wins. Group name prefixes mitigate this: `admin.dashboard` and `app.dashboard` are unique.

### Route List Verification for Complex Groups
```bash
php artisan route:list
```
For deeply nested groups, the route list shows the full method, URI, middleware, and name for each route. Use this to verify group attribute inheritance is as expected.

---

## Common Mistakes

### Assuming Uniform Attribute Merge
Why it happens: Most attributes (prefix, name, middleware) combine additively, so developers assume all do. Why it's harmful: `domain` replaces, `where` overrides — inner domains silently erase outer ones, inner where constraints overwrite outer ones. Better approach: Consult `RouteGroup::merge()` documentation for each attribute type used.

### Route Name Collisions Across Domains
Why it happens: Two domains with the same route names (`dashboard`, `profile`). Why it's harmful: The second registration silently overwrites the first in `nameList`. The first route is inaccessible via `route()` helper. Better approach: Prefix route names per domain: `admin.dashboard`, `app.dashboard`.

### Over-Nesting Beyond 3 Levels
Why it happens: Adding nested groups for each prefix/name/middleware combination. Why it's harmful: Attribute inheritance becomes non-obvious; changing a parent group attribute affects all descendant groups in unexpected ways. Better approach: Flatten groups by using explicit attributes on each group instead of deep nesting.

### Middleware Dependency on Group Context
Why it happens: A middleware expects a parameter (like `{account}`) that is available only in certain route groups. Why it's harmful: Routes in other groups that share the same middleware but not the parameter context fail with missing parameter errors. Better approach: Use conditional middleware or separate middleware stacks for different route contexts.

### Assuming Namespace Affects All Classes
Why it happens: Setting group namespace changes how controllers are resolved. Why it's harmful: The namespace only affects controller resolution — NOT models, services, or other classes referenced within controllers. Better approach: Use the namespace attribute only for controller routing; use PHP `use` statements for all other class references.

---

## Failure Modes

### Attribute Inheritance Surprise
A deeply nested group accumulates attributes from all ancestor levels. If an outer group has middleware 'auth' and an inner group doesn't explicitly remove it (which it can't), all inner routes require authentication. Removing middleware inheritance requires moving routes outside the group.

### Domain Override Silent Replacement
Outer group sets `domain('{account}.example.com')`, inner group sets `domain('admin.example.com')`. The inner `domain` replaces the outer — parameter `{account}` is no longer available. Routes in the inner group cannot access the account parameter.

### Subdomain Parameter Collision
Two routes in different subdomain groups use the same parameter name (`{account}`). The parameter name exists in both contexts but resolves from different parts of the URL (host). If both groups are active (same domain pattern), the parameter value from the last match is used.

---

## Ecosystem Usage

### Laravel Framework
The framework uses groups for middleware stack selection (`web`, `api`, `console`). First-party packages (Horizon, Telescope) use prefix groups to isolate their routes under `/horizon`, `/telescope` with authentication middleware.

### Spatie Packages
Spatie packages that register routes use prefix groups within their service providers. For example, `spatie/laravel-activitylog` registers routes under a configurable prefix.

### Monica CRM
Monica uses nested groups: `auth` → `verified` → `mfa` for session routes, with separate groups for different access levels. Group nesting is 2-3 levels with explicit prefix and name prefixes.

### Akaunting
Akaunting routes are registered per module. Each module uses prefix, middleware, and name groups to isolate its routes. Route registration happens within module service providers.

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Basic route registration
- Middleware System — Middleware selection via groups

### Related Topics
- Resourceful Routing — Resources within groups
- Route Name Generation — Name prefixes in groups
- API Versioning — Prefix groups for versioned APIs

### Advanced Follow-up Topics
- Feature-based Application Structure — Module-level route groups with service providers
- Rate Limiting — Named limiter application within groups

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Router.php` — `group()`, `createRoute()`, `mergeGroupAttributesIntoRoute()`, `groupStack`
- `Illuminate\Routing\RouteGroup.php` — `merge()` static method with type-specific merge logic
- `Illuminate\Routing\RouteRegistrar.php` — Fluent builder, `__call()` method dispatch, attribute mapping
- `Illuminate\Routing\RouteParameterBinder.php` — Host parameter binding for subdomain routes
- `Illuminate\Routing\Matching\HostValidator.php` — Subdomain regex matching

### Key Insight
`RouteGroup::merge()` is the most important function for understanding group behavior. Each attribute type's merge behavior is independently defined in the merge method. The cumulative effect of 3+ levels of nested groups requires mentally executing the merge for each attribute type — a cognitive load that grows with nesting depth.

### Version-Specific Notes
- Group behavior is consistent across Laravel 8-13
- Subdomain routing parameters are stable across all versions
- Laravel 11+ moved RouteServiceProvider configuration to `bootstrap/app.php` with `->withRouting()` but group semantics are unchanged
