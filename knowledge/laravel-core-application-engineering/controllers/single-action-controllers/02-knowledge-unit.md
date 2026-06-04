# Single-Action Controllers

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Single-Action Controllers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Single-action controllers are controller classes with exactly one public method: `__invoke()`. They are dispatched using `Route::get('/path', SomeController::class)` — a class name string without a method reference. The framework detects the absence of `@`, checks for `__invoke()`, and normalizes the action to `SomeController@__invoke` for standard dispatch.

The engineering significance of single-action controllers is that they enforce single-responsibility at the architectural level. A class can only do one thing — if it needs to do more, it needs more classes. This constraint is both their greatest strength (clear boundaries, zero ambiguity about responsibility) and their greatest weakness (file proliferation, perceived over-engineering for simple operations).

The normalization to `Class@__invoke` means single-action controllers are trivially serializable for route caching — they pass through the same serialization path as any multi-action controller. There is zero runtime difference between a single-action controller and a multi-action controller after normalization. The decision is purely an organizational tradeoff.

---

## Core Concepts

### __invoke() Magic Method
PHP's `__invoke()` method allows an object to be called as a function. The framework detects this via `method_exists($class, '__invoke')` during route action parsing and normalizes the route action to `Class@__invoke`.

### Normalization to Class@method
`RouteAction::parse()` processes route definitions:
```
Route::get('/dashboard', ShowDashboardController::class)
  → RouteAction parses: string without '@'
  → makeInvokable(): method_exists('ShowDashboardController', '__invoke')?
  → Yes: normalizes to 'ShowDashboardController@__invoke'
  → Stored as: ['uses' => 'ShowDashboardController@__invoke']
```

After normalization, the dispatch path is identical to `Route::get('/dashboard', [ShowDashboardController::class, '__invoke'])`.

### Route Caching Compatibility
Single-action controllers produce string action references (`Class@__invoke`) that are trivially serializable by `route:cache`. This is their primary architectural advantage over closure routes. The route cache stores the action string, and on reload, `RouteAction::parse()` processes it identically.

### Naming Conventions
Single-action controllers are typically named using Verb + Noun or VerbNoun pattern:
- `ShowDashboardController`, `StoreUserController`, `PublishPostController`
- `ExportReportController`, `GenerateInvoiceController`, `SendWelcomeEmailController`

The naming should describe the action performed, not the resource managed. This distinguishes them from resource controllers (named after the resource: `UserController`).

---

## Mental Models

### One File, One Responsibility
A single-action controller encodes "this class exists to handle exactly this one HTTP operation." If the operation grows too complex for one method, the complexity must be extracted to services or actions — the controller itself remains a thin entry point.

### File as Command
Each single-action controller file represents a command: "Show the dashboard," "Store a user," "Publish a post." The file name IS the action. This makes code navigation straightforward — the developer knows exactly what code runs for a given route.

### Normalization as Equalizer
After framework normalization, single-action controllers are indistinguishable from multi-action controllers at the dispatch level. The `__invoke()` method is just a method named by convention rather than by route definition. The dispatch system treats them identically.

---

## Internal Mechanics

### RouteAction::makeInvokable()

```php
RouteAction::parse($uri, $action)
  ├── if $action uses array callable [Class::class, 'method']:
  │     └── normalize to 'Class@method'
  │
  ├── if $action is string AND has no '@':
  │     └── RouteAction::makeInvokable($action)
  │           ├── if !method_exists($action, '__invoke'):
  │           │     └── throw UnexpectedValueException("Invalid route action: [{$action}].")
  │           └── return $action . '@__invoke'
  │
  └── // Result: always 'Class@method' format for controller routes
```

The exception is thrown at route REGISTRATION time (during `RouteServiceProvider::boot()` or route file loading), not at route DISPATCH time. This means a missing `__invoke()` method is caught immediately when routes are loaded, not when the route is accessed.

### Route Action Storage
After normalization, the action is stored as:
```php
['uses' => 'App\Http\Controllers\ShowDashboardController@__invoke']
```

The `isControllerAction()` check returns true because `uses` is a string and is not a serialized closure. The `getControllerClass()` method parses `ShowDashboardController@__invoke` and returns `ShowDashboardController`.

### Dispatch Path
```
Route::run() → runController()
  ├── getController() → Container::make(ShowDashboardController::class)
  ├── getControllerMethod() → '@__invoke' → '__invoke'
  ├── ControllerDispatcher::dispatch(route, controller, '__invoke')
  └── $controller->__invoke(...$resolvedParameters)
```

Identical to multi-action dispatch. The method name `__invoke` is resolved from the action string just like `index` or `store`.

---

## Patterns

### Simple Delegation Pattern
```php
class SubscribeToNewsletterController
{
    public function __invoke(SubscribeRequest $request, NewsletterService $service)
    {
        $service->subscribe($request->email());
        return redirect()->route('home')->with('success', 'Subscribed!');
    }
}
```
Form request validates, service executes, controller returns response. 4 lines.

### Complex Orchestration Pattern
```php
class GenerateReportController
{
    public function __invoke(
        GenerateReportRequest $request,
        ReportGenerator $generator,
        ReportMailer $mailer
    ) {
        $report = $generator->generate($request->toDto());
        $mailer->send($request->user(), $report);
        
        return new ReportResource($report);
    }
}
```
Multiple dependencies, multiple service calls, resource response. Still <10 lines.

### Resource Controller Separation
For a resource that has a complex non-CRUD operation:
```php
// UserController handles CRUD
// ExportUsersController handles the one-off export
Route::get('/users/export', ExportUsersController::class);
```

---

## Architectural Decisions

### Why Normalization Exists
The normalization to `Class@__invoke` exists to unify the dispatch path. If single-action controllers were dispatched through a separate path, the framework would need duplicate dispatch logic. By normalizing to the standard `Class@method` format, all controller routes — single or multi-action — go through the same `ControllerDispatcher`.

### Why method_exists Check Is at Registration Time
The `method_exists($class, '__invoke')` check runs at route registration time (during `RouteServiceProvider::boot()` or route file loading). If the method doesn't exist, the error is thrown immediately, not at dispatch time. This catches missing methods early — the developer sees the error on the first request after adding the route, not when they navigate to the specific path.

### Why Naming Is Conventional, Not Enforced
The framework does not enforce naming conventions for single-action controllers. The file can be named anything as long as it has `__invoke()`. This flexibility means teams can adopt their own conventions (VerbNoun, NounVerb, or domain-specific patterns) without framework interference.

---

## Tradeoffs

### Single-Action vs Multi-Action Controllers

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single: Clear single-responsibility | File proliferation: each action = 1 file | 20+ files for 7 resources (140 actions) vs 7 resource controller files |
| Single: No unused methods | Constructor DI repeated across files | Same service injected in 3 files instead of 1 |
| Single: Fewer merge conflicts | More use statements to maintain | Files tend to be 20-30 lines of boilerplate + 3-5 lines of logic |
| Multi: Shared constructor DI | Methods may grow beyond single-responsibility | One file can become a dumping ground for unrelated operations |
| Multi: Fewer files to navigate | Merge conflicts on shared file | Two developers editing different methods in same file = conflict |

### Single vs Resource Controllers for CRUD

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single: Each CRUD action is independent | 7 files per resource | File count = 7x resource count |
| Resource: All CRUD in one file | File can grow to 200+ lines | But the grouping is logical (all actions on one entity) |
| Community consensus: Resource for CRUD clusters, single-action for standalone operations |

### When Single-Action Is Appropriate
- Complex operations that don't fit CRUD (report generation, bulk import, subscription management)
- Operations that are reused across entry points (controller, CLI command, queue job)
- Operations with unique middleware, validation, or authorization requirements
- When the operation is the unit of team ownership (one team owns one operation)

### When Single-Action Is Over-Engineering
- Simple CRUD operations that could be grouped in a resource controller
- Operations that are 3-5 lines with no complex orchestration
- When the resulting file count creates navigation overhead without organizational benefit

---

## Performance Considerations

### Normalization Cost
`method_exists($class, '__invoke')` is called once during route registration. This is a PHP built-in function that checks the class method table — negligible cost (~0.001ms per route).

### Dispatch Cost
After normalization, dispatch is identical to any multi-action controller. `__invoke()` is called via the same `ControllerDispatcher::dispatch()` → `callAction()` → `$this->{$method}()` path.

### File Count Impact
Each single-action controller is one file that must be autoloaded. PHP OpCache caches compiled files, so the autoloading cost is paid once and cached. For typical applications, the difference between 50 controllers and 150 controllers is negligible in terms of autoload performance.

---

## Production Considerations

### Method Name Stability
`__invoke()` is a PHP magic method — it cannot be renamed. Unlike multi-action controllers where methods can be renamed (with route updates), single-action controllers are permanently bound to `__invoke`. If the controller is changed to multi-action (adding other methods), the route definition must also change to specify the method name.

### File Organization
Single-action controllers can lead to directory bloat in a flat `Controllers/` directory. Production applications should organize them into subdirectories by domain:
```
Controllers/
├── Dashboard/
│   ├── ShowDashboardController.php
│   └── ExportDashboardController.php
├── Users/
│   ├── StoreUserController.php
│   ├── UpdateUserController.php
│   └── ExportUsersController.php
└── Posts/
    ├── PublishPostController.php
    └── ArchivePostController.php
```

### Route Naming
Name single-action controller routes explicitly:
```php
Route::get('/dashboard', ShowDashboardController::class)->name('dashboard.show');
```

---

## Common Mistakes

### Creating Single-Action Controllers for Every Route
Why it happens: Enthusiasm for the single-responsibility pattern. Why it's harmful: File count grows uncontrollably, navigation becomes harder, and simple CRUD operations are scattered across 7x more files than a resource controller. Better approach: Use resource controllers for CRUD clusters, single-action for standalone non-CRUD operations.

### Not Implementing __invoke()
Why it happens: Developer writes the controller but uses a differently named method. Why it's harmful: `RouteAction::makeInvokable()` throws `UnexpectedValueException` at route registration time. The error is immediate and explicit. Better approach: Always use `__invoke()` for single-action controllers.

### Using Single-Action for Proxy Operations
Why it happens: Creating a controller that just returns a view or redirect. Why it's harmful: The file adds boilerplate with no logic benefit — 20 lines for what could be a `Route::view()` or `Route::redirect()` one-liner. Better approach: Use `Route::view()` or `Route::redirect()` for trivial responses.

### Heavy Constructor Injection in Single-Action Controllers
Why it happens: Developer injects services via constructor (correct DI practice). Why it's harmful: If the same service is needed across multiple single-action controllers, it's injected N times instead of once in a shared resource controller. Better approach: Consider a multi-action controller for grouped operations that share dependencies, or extract shared logic to a service class.

---

## Failure Modes

### Missing __invoke() Method
`RouteAction::makeInvokable()` checks `method_exists($action, '__invoke')` and throws `UnexpectedValueException` if the method doesn't exist. This is caught at route registration time — the error message includes the invalid action string.

### Controller Name Collision
Two single-action controllers with the same class name in different namespaces. PHP autoloader resolves the first registered namespace — if the wrong controller is autoloaded, the wrong `__invoke()` runs. Fix: Use unique class names or avoid importing in the same context.

### Refactoring from Single to Multi-Action
Changing a single-action controller to multi-action requires updating the route definition from class string to `[Class::class, 'method']` array. Forgetting this change produces `UnexpectedValueException` from `makeInvokable()` because the method is no longer `__invoke`.

---

## Ecosystem Usage

### Laravel Framework
Laravel Jetstream uses single-action controllers for team management operations (CreateTeam, UpdateTeam, DeleteTeam, AddTeamMember). These are complex operations with unique authorization and validation that don't fit CRUD.

### Spatie Packages
Spatie uses single-action controllers in some package route registrations for simple endpoints. Their larger packages (laravel-medialibrary) use multi-action controllers for administrative interfaces.

### Community Trend
The single-action controller pattern gained significant adoption after Nuno Maduro's advocacy and Steve McDougall's "Laravel API series" (2025-2026). It is now a standard pattern in the community, particularly for API development where each endpoint is a distinct operation.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — How controllers are dispatched
- Route Definition — Route action parsing and normalization

### Related Topics
- Thin Controller Principles — Keeping controllers focused on delegation
- Dependency Injection — Constructor vs method injection in single-action controllers

### Advanced Follow-up Topics
- Controller Organization — Subdirectory strategies for single-action controllers
- Action Pattern — Relationship between invokable controllers and service/action classes
- Controller Testing — Testing __invoke() in isolation

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\RouteAction.php` — `parse()`, `makeInvokable()`, `containsSerializedClosure()`
- `Illuminate\Routing\Router.php` — Route registration methods (all normalized through RouteAction)
- `Illuminate\Routing\ControllerDispatcher.php` — Standard dispatch (no special handling for __invoke)
- `Illuminate\Support\Reflector.php` — `isCallable()` detection

### Key Insight
The normalization of single-action controllers to `Class@__invoke` means there is NO architectural distinction between single-action and multi-action controllers at the framework level. The dispatch path, middleware gathering, dependency resolution, and response handling are identical. The decision between them is purely an organizational and team preference — the framework treats them identically.

### Version-Specific Notes
- Single-action controller support is consistent across Laravel 8-13
- `RouteAction::makeInvokable()` behavior unchanged across all versions
- No special serialization for single-action controllers in route caching — they serialize as `Class@__invoke` strings
