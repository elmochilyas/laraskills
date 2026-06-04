# ECC Behavioral Rules — Controller Middleware

---

## Rule: Register Middleware Only in Constructors

---

## Category

Code Organization

---

## Rule

All `$this->middleware()` calls must appear exclusively in the controller's constructor. Never call `$this->middleware()` inside a controller method or outside the class definition.

---

## Reason

The framework collects controller middleware registrations only when the controller is resolved for a route. Registrations outside the constructor are silently ignored, creating a false sense of security.

---

## Bad Example

```php
class UserController extends Controller
{
    public function index(): View
    {
        $this->middleware('auth'); // NEVER — silently ignored
        return view('users.index');
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index', 'show']);
    }
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: routes intended to be protected are publicly accessible. Maintenance risks: developers debugging unexpected access cannot find the middleware declaration.

---

## Rule: Use only() or except() for Every Middleware Registration

---

## Category

Security

---

## Rule

Every `$this->middleware()` call must chain either `->only(...)` or `->except(...)` to declare which actions the middleware applies to. Do not register middleware without method scoping.

---

## Reason

Unscoped middleware applies to every method in the controller, including methods added later. Explicit scoping documents the intent and prevents accidentally protecting or exposing a new method.

---

## Bad Example

```php
public function __construct()
{
    $this->middleware('auth'); // Applies to ALL methods — including index and show
}
```

---

## Good Example

```php
public function __construct()
{
    $this->middleware('auth')->except(['index', 'show']);
    $this->middleware('admin')->only(['destroy']);
}
```

---

## Exceptions

A controller where every single method requires the same middleware (e.g., AdminDashboardController where all routes are admin-only) may omit `->only()`/`->except()` with a comment explaining the blanket application.

---

## Consequences Of Violation

Security risks: public-facing methods like `index` and `show` are unexpectedly behind authentication. Maintenance risks: adding a new action unintentionally inherits middleware.

---

## Rule: Keep Constructors Limited to Middleware Registration

---

## Category

Code Organization

---

## Rule

A controller constructor must contain only `$this->middleware()` calls and no other logic — no queries, service calls, event dispatches, or computed assignments.

---

## Reason

The controller constructor runs at container resolution time, before the route is dispatched. Any logic in the constructor executes even when the matched action is not the one that middleware targets, causing unexpected side effects.

---

## Bad Example

```php
public function __construct(
    private UserService $service,
) {
    $this->middleware('auth')->except(['index', 'show']);
    $this->service->warmup(); // Runs on every resolution, even for index
    $this->data = Cache::get('global-data'); // Side effect on every request
}
```

---

## Good Example

```php
public function __construct(
    private UserService $service,
) {
    $this->middleware('auth')->except(['index', 'show']);
}
```

---

## Exceptions

Initializing private constants or read-only configuration values that are middleware-related (e.g., extracting allowed roles from config) is acceptable if the operation has zero side effects.

---

## Consequences Of Violation

Reliability risks: constructor logic runs before middleware, potentially accessing session/auth data that isn't ready. Performance risks: expensive operations in constructors execute on every request to any route handled by the controller.

---

## Rule: Prefer Route-Level Middleware for Shared Protection

---

## Category

Architecture

---

## Rule

Use route groups or route-level middleware when the same middleware applies to multiple controllers. Reserve controller middleware for method-level granularity within a single controller.

---

## Reason

Route-level middleware is visible in route files, making the security posture auditable from a single location. Controller middleware is hidden inside class files and requires developers to check every controller to understand the full middleware stack.

---

## Bad Example

```php
// routes/web.php
Route::resource('users', UserController::class);
Route::resource('posts', PostController::class);

// UserController constructor
public function __construct()
{
    $this->middleware('auth')->except(['index', 'show']);
}

// PostController constructor
public function __construct()
{
    $this->middleware('auth')->except(['index', 'show']);
}
```

---

## Good Example

```php
// routes/web.php
Route::middleware('auth')->group(function () {
    Route::resource('users', UserController::class)->except(['index', 'show']);
    Route::resource('posts', PostController::class)->except(['index', 'show']);
});

// Make public routes explicit outside the group
Route::resource('users', UserController::class)->only(['index', 'show']);
Route::resource('posts', PostController::class)->only(['index', 'show']);
```

---

## Exceptions

When method-level granularity is needed (e.g., `admin` middleware only on `destroy`), controller middleware is the appropriate tool.

---

## Consequences Of Violation

Security risks: auditors may miss controller middleware when reviewing security. Maintenance risks: middleware logic is duplicated across every controller.

---

## Rule: Do Not Use Controller Middleware as Authorization Gate

---

## Category

Architecture

---

## Rule

Do not use `$this->middleware('can:update,post')` or similar authorization middleware in the controller constructor. Perform authorization in FormRequest `authorize()` methods or dedicated Policy gates.

---

## Reason

Controller middleware runs authorization at the middleware layer, before the controller method resolves. This couples the authorization check to the route resolution and makes it invisible in the method signature. FormRequest `authorize()` keeps authorization coupled to the validated request data.

---

## Bad Example

```php
public function __construct()
{
    $this->middleware('can:update,post')->only(['update']);
}
```

---

## Good Example

```php
// FormRequest
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

---

## Exceptions

Simple role-based checks (e.g., `$this->middleware('admin')->only(['destroy'])`) are acceptable when no model-specific authorization is required.

---

## Consequences Of Violation

Maintenance risks: authorization logic is split between middleware and FormRequest/Policy. Testing risks: harder to test authorization without sending HTTP requests.

---

## Rule: Verify Middleware Composition with route:list

---

## Category

Maintainability

---

## Rule

Run `php artisan route:list` after adding or modifying controller middleware to verify the effective middleware stack for each route. Ensure middleware is not applied twice.

---

## Reason

Middleware can be applied at multiple levels (global, route group, route, controller). The same middleware applied at both route-group and controller level executes twice, causing duplicate checks, double rate-limit hits, or authentication challenges.

---

## Bad Example

```php
// Route group applies throttle
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class);
});

// Controller also applies throttle
public function __construct()
{
    $this->middleware('throttle:api')->only(['store']); // Double throttle
}
```

---

## Good Example

```php
// Route group applies throttle for all write operations
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class)->only(['store', 'update', 'destroy']);
});

// Controller applies auth only (throttle already handled at route level)
public function __construct()
{
    $this->middleware('auth:sanctum');
}
```

---

## Exceptions

When different throttle limits apply per action (e.g., 60/min for listing, 10/min for writes), intentional double middleware with different parameters is valid.

---

## Consequences Of Violation

Performance risks: middleware executes extra times on every request. Reliability risks: rate-limit headers return incorrect remaining counts. Security risks: authentication challenges fire twice, confusing clients.

---

## Rule: Always Declare except() for Public Resource Actions

---

## Category

Security

---

## Rule

When applying `auth` middleware to a resource controller, always include `->except(['index', 'show'])` to keep read-only public actions accessible.

---

## Reason

Resource controllers are commonly paired with `auth` middleware. Without `except()` for index and show, the public-facing list and detail pages become inaccessible to unauthenticated visitors, which is rarely the intent.

---

## Bad Example

```php
public function __construct()
{
    $this->middleware('auth'); // index and show are now login-required
}
```

---

## Good Example

```php
public function __construct()
{
    $this->middleware('auth')->except(['index', 'show']);
    $this->middleware('verified')->only(['store']);
    $this->middleware('admin')->only(['destroy']);
}
```

---

## Exceptions

When the entire application requires authentication (e.g., internal admin panel), omitting `except()` is correct.

---

## Consequences Of Violation

User-facing impact: public routes return 302 redirects to login instead of content. Testing risks: feature tests fail with unexpected redirects for guest users.

---

## Rule: Use ->only() as the Default, ->except() as the Exception

---

## Category

Security

---

## Rule

Prefer `$this->middleware('m')->only(['action'])` over `$this->middleware('m')->except(['action'])` when only a few actions need the middleware. Restrictive scoping is safer than permissive scoping.

---

## Reason

`->only()` explicitly lists what is protected, making it immediately clear which actions have the middleware. `->except()` requires the reader to know all controller methods and subtract the exceptions mentally, which is error-prone as methods are added.

---

## Bad Example

```php
$throttle = new ControllerMiddlewareOptions;
$throttle->except(['index', 'show']); // Permissive — unclear what is intended
$this->middleware('throttle:api', $throttle);
```

---

## Good Example

```php
$this->middleware('throttle:api')->only(['store', 'update', 'destroy']);
```

---

## Exceptions

When the middleware applies to all but one or two actions (e.g., `auth` protecting everything except `index` and `show`), `->except()` is more readable.

---

## Consequences Of Violation

Security risks: new actions added to the controller are unprotected until the developer remembers to list them in `->except()`. Maintenance risks: every method addition requires reviewing the `->except()` list.
