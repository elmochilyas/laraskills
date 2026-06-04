# ECC Behavioral Rules — Controller Dependency Injection

---

## Rule: Use Constructor Injection for Shared Service Dependencies

---

## Category

Architecture

---

## Rule

Inject services, repositories, and infrastructure dependencies that are used by multiple controller methods via the constructor. Declare them using PHP 8 promoted constructor properties with `private readonly`.

---

## Reason

Constructor injection makes shared dependencies visible in the class signature and resolves them once when the controller is instantiated. Method-by-method injection of the same service duplicates resolution overhead and obscures the controller's actual dependencies.

---

## Bad Example

```php
class UserController extends Controller
{
    public function index()
    {
        $service = app(UserService::class); // Hidden dependency
        return view('users.index', ['users' => $service->list()]);
    }

    public function show(User $user)
    {
        $service = app(UserService::class); // Resolved again
        return view('users.show', ['user' => $service->find($user->id)]);
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function __construct(
        private readonly UserService $service,
    ) {}

    public function index(): View
    {
        return view('users.index', ['users' => $this->service->list()]);
    }

    public function show(User $user): View
    {
        return view('users.show', ['user' => $this->service->find($user->id)]);
    }
}
```

---

## Exceptions

When a dependency is used by a single method, prefer method injection to keep the constructor minimal.

---

## Consequences Of Violation

Maintenance risks: hidden service locator calls make dependencies invisible. Testing risks: mocking requires knowing which hidden calls exist. Performance risks: services are resolved repeatedly per-method instead of once.

---

## Rule: Use Method Injection for Form Requests

---

## Category

Architecture

---

## Rule

Always type-hint FormRequest classes in individual controller method signatures. Never inject FormRequests via the constructor.

---

## Reason

FormRequests are validated by the framework before the controller method body executes. Constructor injection would bypass this validation timing — the request would be resolved at controller instantiation, before validation runs.

---

## Bad Example

```php
class UserController extends Controller
{
    public function __construct(
        private StoreUserRequest $request, // Wrong — validated at construction time
    ) {}

    public function store(): RedirectResponse
    {
        User::create($this->request->validated());
        return redirect()->route('users.index');
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());
        return redirect()->route('users.index');
    }
}
```

---

## Exceptions

No common exceptions — FormRequests must always be method-injected.

---

## Consequences Of Violation

Reliability risks: validation runs at the wrong time, potentially validating stale or wrong request data. Security risks: invalid data may reach the method body before validation completes.

---

## Rule: Never Inject Request in Controller Constructors

---

## Category

Architecture

---

## Rule

Do not inject `Illuminate\Http\Request` or any subclass of Request via the constructor. Always use method injection for the Request object.

---

## Reason

The Request object is request-scoped — its data, headers, and attributes change with every HTTP request. Constructor injection captures the Request at controller instantiation time, creating stale state that can cause security-sensitive data (like `user()` or `input()`) to be incorrect.

---

## Bad Example

```php
class UserController extends Controller
{
    public function __construct(
        private Request $request, // Captured at construction time
    ) {}

    public function index(): View
    {
        $this->request->user(); // May be null if auth runs after construction
        return view('users.index');
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function index(Request $request): View
    {
        $request->user(); // Current request — always correct
        return view('users.index');
    }
}
```

---

## Exceptions

If extending a base controller that requires `Request` in its constructor, follow the parent class contract. In that case, document why the approach is necessary.

---

## Consequences Of Violation

Security risks: authenticated user data may be stale or null. Reliability risks: request data inconsistencies across methods. Maintenance risks: subtle bugs are difficult to reproduce and debug.

---

## Rule: Use Method Injection for Single-Method Dependencies

---

## Category

Architecture

---

## Rule

Inject dependencies that are only used by one controller method via that method's signature, not the constructor.

---

## Reason

Constructor injection resolves all dependencies on every request, even when the dispatched method does not use them. Method injection resolves dependencies only when the specific method is called, avoiding unnecessary instantiation cost.

---

## Bad Example

```php
class UserController extends Controller
{
    public function __construct(
        private UserExportService $exportService, // Only used in export()
        private NotificationService $notificationService, // Only used in store()
        private ReportService $reportService, // Only used in report()
    ) {}
    // All resolved on EVERY request to ANY method
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function export(ExportRequest $request, UserExportService $service): JsonResponse
    {
        return $service->export($request->validated());
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        // No unnecessary dependencies in constructor
    }
}
```

---

## Exceptions

When a single-method dependency is expensive to instantiate but used by many controllers across the application, register it as a singleton in the container instead of using method injection.

---

## Consequences Of Violation

Performance risks: unnecessary service instantiation on every request. Maintainability risks: constructors grow with unused dependencies, making it harder to identify what a controller actually needs.

---

## Rule: Avoid Service Locator Calls in Controller Methods

---

## Category

Architecture

---

## Rule

Never use `app()->make()`, `resolve()`, or `App::make()` inside a controller method to obtain dependencies. All dependencies must be declared via constructor or method injection.

---

## Reason

Service locator calls create hidden dependencies that are invisible in the class or method signature. They cannot be mocked or substituted during testing without modifying the controller code, and they bypass Laravel's container resolution optimizations.

---

## Bad Example

```php
class UserController extends Controller
{
    public function index(): View
    {
        $service = app(UserService::class); // Hidden dependency
        return view('users.index', ['users' => $service->list()]);
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function __construct(
        private readonly UserService $service,
    ) {}

    public function index(): View
    {
        return view('users.index', ['users' => $this->service->list()]);
    }
}
```

---

## Exceptions

When conditionally resolving a dependency based on runtime configuration (e.g., `app(FileStorage::class)` vs `app(S3Storage::class)`), the locator call is acceptable if it is wrapped behind a factory or strategy class.

---

## Consequences Of Violation

Testing risks: cannot mock dependencies without changing controller code. Maintenance risks: the class's actual dependencies are undocumented. Security risks: runtime resolution can bypass container security constraints.

---

## Rule: Limit Constructor Dependencies to a Reasonable Count

---

## Category

Maintainability

---

## Rule

Keep the number of constructor-injected dependencies in a single controller to 5 or fewer. If a controller needs more than 5 dependencies, extract some of its operations into dedicated service classes.

---

## Reason

Excessive constructor dependencies indicate the controller is doing too much. Each dependency is a responsibility — 7+ dependencies means 7+ reasons to change the controller, violating single responsibility.

---

## Bad Example

```php
class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService,
        private PaymentService $paymentService,
        private ShippingService $shippingService,
        private NotificationService $notificationService,
        private InventoryService $inventoryService,
        private DiscountService $discountService,
        private TaxService $taxService,
        private AuditService $auditService,
    ) {}
    // 8 dependencies — controller is orchestrating too much
}
```

---

## Good Example

```php
class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService, // Single point of delegation
    ) {}

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $this->orderService->create($request->validated());
        return redirect()->route('orders.index');
    }
}
```

---

## Exceptions

Dashboard or reporting controllers that legitimately compose data from multiple sources may exceed 5 dependencies. In that case, consider composing the data in a dedicated read-model or dashboard service.

---

## Consequences Of Violation

Maintenance risks: every dependency increase requires changing the constructor. Testing risks: every test must resolve or mock 7+ dependencies. Architecture risks: the controller has too many responsibilities.

---

## Rule: Always Type-Hint FormRequest Instead of Request

---

## Category

Architecture

---

## Rule

For any controller method that receives input, type-hint a dedicated FormRequest class in the method signature. Never use `Request` as the parameter type for store or update actions.

---

## Reason

Type-hinting `Request` instead of `StoreUserRequest` means validation is not automatically performed. The method must manually call `$request->validate()`, which pushes validation logic into the controller and prevents the FormRequest's `authorize()`, `prepareForValidation()`, and `after()` hooks from executing.

---

## Bad Example

```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);
    User::create($validated);
    return redirect()->route('users.index');
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request): RedirectResponse
{
    User::create($request->validated());
    return redirect()->route('users.index');
}
```

---

## Exceptions

Index and show methods that accept optional query-string filters may use `Request` if the filters are simple enough that a dedicated FormRequest would have only one or two rules.

---

## Consequences Of Violation

Security risks: missing authorization checks from `authorize()`. Maintenance risks: validation rules scattered across controllers. Testing risks: harder to test validation in isolation.

---

## Rule: Use Method Injection for Route Model Binding

---

## Category

Framework Usage

---

## Rule

Always type-hint Eloquent models in controller method signatures to trigger route model binding. Never manually query for models using `$id` parameters.

---

## Reason

Route model binding eliminates manual `Model::findOrFail($id)` calls, reducing controller method length and centralizing the "not found" handling. The framework automatically resolves the model and returns a 404 if not found, without any controller code.

---

## Bad Example

```php
public function show(int $id): View
{
    $user = User::findOrFail($id); // Manual resolution
    return view('users.show', ['user' => $user]);
}
```

---

## Good Example

```php
public function show(User $user): View
{
    return view('users.show', ['user' => $user]);
}
```

---

## Exceptions

When a route uses a non-standard binding column, use explicit binding in `RouteServiceProvider` or the `getRouteKeyName()` method on the model — still avoid manual queries in the controller.

---

## Consequences Of Violation

Maintenance risks: every method repeats `findOrFail` boilerplate. Reliability risks: inconsistent 404 handling; some methods may forget `findOrFail` and fail with unhandled exceptions.
