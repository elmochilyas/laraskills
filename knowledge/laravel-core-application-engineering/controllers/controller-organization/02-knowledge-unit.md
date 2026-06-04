# Controller Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Controller Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Controller organization encompasses how controller files are named, namespaced, structured into directories, and how their methods are organized within each class. The framework imposes no directory conventions beyond `app/Http/Controllers` — the default organization is a flat list of controller files organized by resource name. As applications grow, flat organization becomes a navigability problem that requires deliberate structuring strategies.

The engineering significance of controller organization is discoverability and cohesion. Developers must be able to find the controller handling a given route without reading route files. The organization strategy determines whether a codebase of 50 controllers is navigable or chaotic. The two dominant strategies are technical grouping (subdirectories by resource domain) and architectural grouping (API vs web subdirectories). A third strategy, role-based grouping by HTTP verb semantics, is less common but valuable for singular action controllers.

Method organization within a controller follows either the standard resource ordering (index, create, store, show, edit, update, destroy) or a semantic ordering (public methods grouped by access level, private helpers grouped at the bottom). The framework does not enforce any ordering, but community convention strongly favors the resource order for resource controllers.

---

## Core Concepts

### Default Directory Structure
The default Laravel scaffold creates `app/Http/Controllers` as a controller namespace rooted at `App\Http\Controllers`. In Laravel 11+, the bootstrap configuration registers this namespace automatically. All controllers are generated here by default via `php artisan make:controller`.

### Namespace Resolution
Route definitions referencing controllers resolve through the namespace configured in the route file provider. In Laravel 11+, the `api.php` and `web.php` route files use `$router->namespace()` or per-file `Route::namespace()` settings:

```php
// config/routes.php (Laravel 11+)
return [
    'web' => ['namespace' => 'App\Http\Controllers'],
    'api' => ['namespace' => 'App\Http\Controllers\Api'],
];
```

Controllers outside the default namespace must use fully qualified class names in route definitions:
```php
Route::get('/reports', \App\Http\Controllers\Reports\DashboardController::class);
// or
Route::get('/reports', [\App\Http\Controllers\Reports\DashboardController::class, 'index']);
```

### Controller-to-Route Mapping
The route definition determines which controller handles which URL. Controller organization decisions affect route file readability:
- Flat organization: `PostController`, `UserController`, `CommentController` — routes are obvious
- Grouped organization: `Admin\PostController`, `Api\V1\PostController` — routes need namespace prefix
- Domain organization: `Blog\PostController`, `Forum\PostController` — routes disambiguate by context

The organization strategy must balance navigability in filesystem view vs navigability in route definitions.

---

## Mental Models

### Filesystem as Tree of Responsibility
The controller directory structure is a tree where each branch represents a responsibility domain. A flat tree (all controllers in one directory) implies all responsibilities are equal. A structured tree (subdirectories by domain) implies grouping of related responsibilities.

### Controller as File Grouping Unit
Each controller file groups methods that handle related HTTP operations on a single resource or domain concept. The file is the navigability unit — developers look for a controller file by name, then find the method within it. The file name determines discoverability.

### Resource Ordering as Contract
The standard resource method order (index, create, store, show, edit, update, destroy) is an implicit contract. Developers reading a resource controller expect methods in this order. Violating the order creates a cognitive mismatch. The framework reinforces this order through `php artisan make:controller --resource`, which generates methods in this sequence.

---

## Internal Mechanics

### Controller Name Resolution in Router
The `Router::getControllerClass()` method parses the route action string:

```php
// Action string: 'App\Http\Controllers\PostController@index'
// getControllerClass() returns: 'App\Http\Controllers\PostController'
// getControllerMethod() returns: 'index'
```

For string-based route definitions, the namespace prefix is prepended by `RouteRegistrar` or the route group's namespace setting:

```php
Route::namespace('Admin')->group(function () {
    Route::get('/posts', 'PostController@index');
    // Resolves to: App\Http\Controllers\Admin\PostController@index
});
```

Array-based definitions use the class constant directly and skip namespace prepending:
```php
Route::get('/posts', [Admin\PostController::class, 'index']);
// Uses exact class from the imported namespace
```

### Artisan Generator Conventions
`php artisan make:controller` follows these naming conventions:
- `PostController` → `app/Http/Controllers/PostController.php`
- `Api\PostController` → `app/Http/Controllers/Api/PostController.php`
- `Admin\PostController` → `app/Http/Controllers/Admin/PostController.php`
- `Api\V1\PostController` → `app/Http/Controllers/Api/V1/PostController.php`

The generator creates the directory structure automatically if subdirectories don't exist:
```bash
php artisan make:controller Api/V1/PostController --resource
# Creates: app/Http/Controllers/Api/V1/PostController.php
```

### Resource Registrar Method Order
The `ResourceRegistrar` registers resource routes in this order: index, create, store, show, edit, update, destroy. The Artisan `--resource` option generates controller methods in the same order. Both the framework and the convention align on this sequence.

---

## Patterns

### Domain-Based Subdirectory Pattern (Recommended for Scale)

```
Controllers/
├── Posts/
│   ├── PostController.php        (CRUD: index, show, store, update, destroy)
│   ├── PublishPostController.php (single-action: publish)
│   ├── ArchivePostController.php (single-action: archive)
│   └── ExportPostsController.php (single-action: CSV export)
├── Users/
│   ├── UserController.php
│   ├── RegisterUserController.php
│   └── ImpersonateUserController.php
├── Billing/
│   ├── SubscriptionController.php
│   ├── InvoiceController.php
│   ├── PaymentMethodController.php
│   └── WebhookController.php
└── Dashboard/
    ├── DashboardController.php
    └── WidgetController.php
```

Benefits: Grouped by business domain. Developers navigate to the domain first, then the controller. Single-action controllers stay with their domain, not scattered in a flat directory. Works well for 20+ controllers.

Cost: Route definitions need subdirectory paths or individual imports. Directory restructuring is painful if domains change.

### Architectural Boundary Subdirectory Pattern (API + Web)

```
Controllers/
├── Web/
│   ├── PostController.php
│   └── UserController.php
└── Api/
    ├── V1/
    │   ├── PostController.php
    │   └── UserController.php
    └── V2/
        ├── PostController.php
        └── UserController.php
```

Benefits: Clear separation between API and web concerns. Versioned API controllers can be maintained independently. Web controllers can use session-based features while API controllers return JSON.

Cost: Duplicate controllers for the same resource across versions. Domain-crossing features (e.g., a web action that calls an API) require cross-directory references.

### Role-Based Subdirectory Pattern (Admin + Public)

```
Controllers/
├── Admin/
│   ├── PostController.php
│   ├── UserController.php
│   └── DashboardController.php
└── Public/
    ├── PostController.php
    └── UserController.php
```

Benefits: Admin controllers stay behind authentication middleware groups. Separate namespaces for authorization rules. Clear ownership boundaries.

Cost: Method duplication between Admin and Public controllers (e.g., both have `show` methods). Can lead to shared base class complexity.

### Feature-Based Subdirectory Pattern (Modular)

```
Controllers/
├── Posts/
│   ├── PostController.php
│   ├── PostPublishController.php
│   └── PostArchiveController.php
├── Comments/
│   └── CommentController.php
└── Tags/
    └── TagController.php
```

Benefits: Aligns with feature-based application structure. Each feature directory is self-contained. Easy to extract a feature into a package later.

Cost: Requires discipline to maintain clear feature boundaries. Cross-feature dependencies (e.g., a post controller that needs tag functionality) blur the separation.

### Method Ordering Patterns

**Resource Order (Standard):**
```php
class PostController extends Controller
{
    public function index()    {}  // GET /posts
    public function create()   {}  // GET /posts/create
    public function store()    {}  // POST /posts
    public function show()     {}  // GET /posts/{post}
    public function edit()     {}  // GET /posts/{post}/edit
    public function update()   {}  // PUT/PATCH /posts/{post}
    public function destroy()  {}  // DELETE /posts/{post}
}
```

**Semantic Order (Non-Resource Controllers):**
```php
class SubscriptionController extends Controller
{
    // Public-facing methods first
    public function store()     {} // POST /subscribe
    public function cancel()    {} // POST /subscribe/cancel
    public function resume()    {} // POST /subscribe/resume

    // Admin methods grouped
    public function adminIndex()  {} // GET /admin/subscriptions
    public function adminRefund() {} // POST /admin/subscriptions/{id}/refund
}
```

**Single-Action Order:**
Only `__invoke()`. The class has exactly one public method by definition.

### Naming Conventions

**Resource Controllers:** Named after the resource (singular or plural, community varies):
- `PostController` (plural, most common)
- `PostController` (singular, also common)
- Consistency within a project matters more than the choice

**Single-Action Controllers:** Named as VerbNoun or Verb+Noun:
- `PublishPostController`, `ArchivePostController`, `ExportReportController`
- `StoreUserController`, `UpdateProfileController`, `DeleteAccountController`
- Avoid `DoSomethingActionController` suffix — `Controller` suffix is sufficient

**Controller Suffix:** Always use the `Controller` suffix. The framework does not enforce this, but omitting it creates confusion in route definitions and code reviews.

---

## Architectural Decisions

### Why the Framework Does Not Enforce Organization
The framework intentionally avoids imposing a directory structure beyond the default `app/Http/Controllers`. This is a deliberate design choice — application size and team structure vary widely, and no single organization strategy works for all cases. The default flat structure works for small applications without forcing unnecessary complexity.

### Why Controllers Are Separate from Services and Actions
Controllers are in `app/Http/Controllers` while services and actions are typically in `app/Services` or `app/Actions`. This separation reflects the architectural boundary: controllers are HTTP-layer code, while services/actions are business-layer code. Keeping them in separate namespace roots prevents accidental HTTP coupling in business logic.

### Why Resource Method Order Is a Convention, Not a Rule
The framework registers routes in a specific order (index, create, store, ...) but does not enforce method order in the controller class. The resource method order is a community convention that has become standard through the Artisan generator. PHP class methods can be in any order and still work correctly. The convention exists for human readability, not framework correctness.

---

## Tradeoffs

### Flat vs Grouped Directory Structure

| Aspect | Flat | Grouped by Domain |
|--------|------|-------------------|
| Navigability | Easy for <20 controllers | Essential for 50+ controllers |
| Artisan generation | `PostController` | `Posts\PostController` |
| Route definitions | Clean class names | Need subdirectory or FQCN |
| Refactoring | No directory moves | Directory renames change namespaces |
| Single-action controllers | Cluttered at scale | Clean organization |

### Domain vs Architectural Grouping

| Approach | Benefit | Cost |
|----------|---------|------|
| Domain (Posts, Users, Billing) | Aligns with business concepts | Cross-cutting concerns (auth, export) need separate treatment |
| Architectural (Web, Api, Admin) | Clear boundary by request type | Duplicate controllers for same resource across boundaries |

### Method Count Per Controller

| Size | Guideline | Consequence |
|------|-----------|-------------|
| Under 7 methods | Standard resource controller | Clean, predictable |
| 8–15 methods | Controller handles multiple resource variants | Consider splitting into separate controllers |
| 15+ methods | Responsibility overload | Extract single-action controllers for non-CRUD operations |

### Namespace Strategy: Prefix vs Explicit

Route group namespace prefix:
```php
Route::namespace('Admin')->group(function () {
    Route::resource('posts', 'PostController');
    // Resolves to App\Http\Controllers\Admin\PostController
});
```

Convenient but hides the full class path from route files. Developers must know the group namespace to understand which controller handles the route.

Explicit import:
```php
use App\Http\Controllers\Admin\PostController;

Route::resource('posts', PostController::class);
```

More verbose but self-documenting. The route file explicitly shows the full controller path. Preferred for larger codebases.

---

## Performance Considerations

### Autoloading Cost by Directory Depth
Deeper directory nesting does not affect autoloading performance. PHP's PSR-4 autoloader maps namespace segments to directory segments one-to-one. `App\Http\Controllers\Admin\Posts\PostController` has the same autoloading cost as `App\Http\Controllers\PostController` — both resolve to a single file load.

### Namespace Resolution at Route Registration
Route group namespace prefixes are resolved at route registration time. The `RouteRegistrar` prepends the namespace to each route action string. This is a string operation with negligible cost (~0.001ms per route).

### Artisan Controller Generation
`php artisan make:controller` creates the directory structure as a side effect. `mkdir()` calls for deeply nested directories are negligible for the one-time cost of controller creation.

---

## Production Considerations

### Consistency Across Team
The most important organizational decision is consistency. A team that uses domain-based grouping in one area and architectural grouping in another creates confusion. Document the chosen strategy in a project architecture guide and enforce it in code review.

### IDE Navigability
Modern IDEs (PHPStorm, VS Code with IntelliPHP) navigate to controllers by name regardless of directory structure. Filesystem organization matters less for IDE users than for code review and git history navigation. However, `grep`-based searches (common in CI tooling) benefit from consistent naming.

### Git History Implications
Flat directories with many files create a single `Controllers/` directory in git history with high churn. Grouped directories isolate churn to specific domains. When a team owns a domain (e.g., Team A owns Billing), grouping by domain makes git history per-domain easier to audit.

### Controller Method Limits by Convention
Beyond the 7 resource methods, additional actions on a resource controller are an organizational smell. Convention strongly recommends:
- 1–3 extra methods: Consider if they belong on a different resource
- 4+ extra methods: Extract a new controller for the non-CRUD operations
- Any method that references a different resource: Extract to that resource's controller

### Namespace Migration
Changing controller namespaces is a refactoring with broad impact. Every route definition referencing the old namespace must be updated. Use a find-and-replace strategy with git blame to identify all references. In Laravel 11+, check both route files and `bootstrap/app.php` for namespace configurations.

---

## Common Mistakes

### Putting All Controllers in a Flat Directory Forever
Why it happens: The default scaffold creates a flat structure, and small applications don't need grouping. Why it's harmful: As the application grows to 30+ controllers, the flat directory becomes a list of 30+ files with no organization. Finding a specific controller requires scanning alphabetically or using IDE search. Better approach: Start grouping by domain when the controller count exceeds 15–20 files.

### Naming Controllers After URL Segments
Why it happens: Matching the URL structure seems logical. Why it's harmful: URL structure changes more often than domain structure. A controller named `Api\V1\PostController` is tightly coupled to the API version. When V2 arrives, V1 controllers are still in the codebase but unused. Better approach: Name by domain responsibility, not URL path. Use route definitions to map URL to controller.

### Using the Same Controller for Web and API Access
Why it happens: The resource methods are similar for web and API. Why it's harmful: A single controller handling both web and API must conditionally return views or JSON. The methods grow conditional logic and violate single responsibility. Better approach: Separate controllers for web and API. Share business logic via services/actions, not controllers.

### Inconsistent Naming Within a Project
Why it happens: Different developers on different features chose different patterns. Why it's harmful: One developer creates `PostController`, another creates `CreatePostController`, a third creates `PostCreateController`. Developers searching for the post creation handler must check three naming patterns. Better approach: Document and enforce a single naming convention per controller type.

### Not Using Subdirectory Notation in Artisan Commands
Why it happens: `php artisan make:controller AdminPostController` works, so developers think it's correct. Why it's harmful: The generated file is at `Controllers/AdminPostController.php` in the root namespace `App\Http\Controllers\AdminPostController`. It cannot be under a route group namespace `Admin`. Better approach: Use subdirectory notation: `php artisan make:controller Admin/PostController` produces the correct namespace and directory.

### Over-Nesting Controller Directories
Why it happens: Following the "group by domain" pattern too aggressively. Why it's harmful: `Controllers/Admin/Blog/V2/Publish/DraftPostController` is hard to navigate and the namespace is unwieldy in route definitions. Better approach: Limit nesting to 2–3 levels. Deeper nesting indicates a structure problem, not an organizational solution.

---

## Failure Modes

### Circular Controller Dependencies
When two controllers depend on each other's services or redirect to each other's routes, the relationship is natural. When two controllers import each other's classes directly, it indicates a design problem — the controllers should not know about each other. Fix by extracting shared logic to a service.

### Orphaned Controllers
A controller that is no longer referenced by any route definition. This happens when routes are updated but controller files are not removed. Orphaned controllers waste developer attention during codebase exploration. Use static analysis to detect unreferenced controllers.

### Controller Namespace Collision
Two controllers with the same class name in different namespaces. Laravel's namespace resolution in route groups can cause collisions if both namespaces are imported in the same route file. Fix: Use explicit imports with aliasing:

```php
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Api\PostController as ApiPostController;
```

### Controller File That Has Become a Dumping Ground
A controller that started as a 7-method resource controller but has grown to 20+ methods. Each new method seemed reasonable at the time — "just one more action on posts." Over time, the controller violates single responsibility and becomes hard to navigate. Fix: Extract non-CRUD operations to single-action controllers.

---

## Ecosystem Usage

### Laravel Framework
The framework's own controllers (in `Illuminate\Routing` and `Illuminate\Foundation\Auth`) use flat organization with clear naming. `RegistersUsers`, `AuthenticatesUsers`, `ResetsPasswords` are traits used by generated controllers.

### Laravel Jetstream
Jetstream's controllers live in `App\Http\Controllers` and are grouped by feature (Teams, Profile, API Tokens). Team management uses a combination of resource controllers and single-action controllers, all organized into domain subdirectories.

### Spatie Packages
Spatie packages that include controllers (e.g., `laravel-activitylog` dashboard) place them in the package's namespace, typically `Spatie\Activitylog\Http\Controllers`. They organize by package concept, not by generic "Controllers" grouping.

### Community Standards
The dominant community convention (2025–2026) is domain-based subdirectory organization for applications with 20+ controllers. The combination of domain grouping for resource controllers and single-action controllers within each domain is the most recommended pattern in expert blog posts and production codebase audits.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — How controllers are dispatched and what they do
- Directory Conventions — Default application directory structure

### Related Topics
- Single-Action Controllers — File naming and organization for invokable controllers
- Resource Controllers — Standard ordering and method organization
- Thin Controller Principles — Keeping controllers focused on delegation

### Advanced Follow-up Topics
- Feature-based Application Structure — Modular controller organization
- API Versioning — Versioned controller directory strategies
- Service Layer Pattern — Where services live relative to controllers

---

## Research Notes

### Source Analysis
- Laravel Framework source: `Illuminate\Routing\ResourceRegistrar.php` — Route registration order
- `Illuminate\Routing\Router.php` — Controller resolution and namespace handling
- `Illuminate\Routing\RouteAction.php` — Action string parsing
- Artisan `make:controller` command — Generated file structure
- Laravel 11+ `bootstrap/app.php` — Namespace configuration

### Key Insight
Controller organization is a maintainability decision, not a technical one. The framework treats all controllers identically regardless of directory depth or naming convention. The value of organization is entirely in human navigation and team communication.

### Key Controversy
The debate between domain-based and architectural-based controller organization mirrors the broader modular vs layered architecture debate. Domain-based grouping gains favor as applications grow because it aligns with business ownership boundaries. Architectural grouping remains useful for projects with distinct API and web surfaces that share little controller behavior.

### Version-Specific Notes
- Laravel 11+ removed the `$namespace` property from `RouteServiceProvider` — namespace resolution moved to route file configuration
- `make:controller` behavior has been consistent since Laravel 5.x
- The `--resource` option always generates methods in the same order (index → destroy)
- No version-specific changes to controller organization in Laravel 12–13
