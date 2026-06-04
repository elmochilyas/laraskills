# ECC Behavioral Rules — Controller Architecture

---

## Rule: Enforce Maximum Controller Method Length

---

## Category

Maintainability

---

## Rule

Keep every controller method at or under 10-15 lines, excluding blank lines and closing braces.

---

## Reason

Methods longer than 15 lines indicate mixed concerns — validation, business logic, and response formatting are competing for space. Short methods are readable at a glance, testable in isolation, and force delegation to the proper layer.

---

## Bad Example

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'role' => 'required|in:admin,editor',
    ]);
    $user = User::create($validated);
    $role = Role::where('name', $validated['role'])->first();
    $user->roles()->attach($role);
    event(new UserCreated($user));
    Mail::to($user->email)->send(new WelcomeMail($user));
    Log::info('User created', ['id' => $user->id]);
    return redirect()->route('users.index')
        ->with('success', 'User created successfully.');
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request): RedirectResponse
{
    $this->service->create($request->validated());
    return redirect()->route('users.index');
}
```

---

## Exceptions

Artisan-generated resource stubs with docblocks may exceed 15 lines before logic is added. A method whose only extra lines are early returns for edge cases (e.g., `if (!$this->service->ready()) return back()`) is acceptable.

---

## Consequences Of Violation

Maintenance risks: difficult to read and refactor. Testing risks: HTTP bootstrapping required for any assertion. Reliability risks: side effects buried in long methods are easy to miss.

---

## Rule: Delegate All Business Logic to Services or Actions

---

## Category

Architecture

---

## Rule

Never write business logic, database queries, calculations, or conditional workflows inside a controller method. Always delegate to a service class or action class.

---

## Reason

Business logic in controllers couples domain rules to the HTTP layer, making logic unreusable across CLI commands, queues, and scheduled tasks. Delegated logic is independently unit-testable and modifiable without touching HTTP concerns.

---

## Bad Example

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $total = $validated['price'] * $validated['quantity'];
    $discount = $total > 100 ? $total * 0.1 : 0;
    $final = $total - $discount;
    Order::create([...]);
}
```

---

## Good Example

```php
public function store(StoreOrderRequest $request): RedirectResponse
{
    $this->service->createOrder($request->validated());
    return redirect()->route('orders.index');
}
```

---

## Exceptions

Trivial conditional logic that directly affects response shape (e.g., `return $fresh ? view('users.show', ...) : redirect(...)`) is acceptable.

---

## Consequences Of Violation

Maintenance risks: logic duplication across controllers. Testing risks: unable to unit-test business rules without HTTP. Scalability risks: cannot invoke logic from CLI or queue without refactoring.

---

## Rule: Use FormRequest Classes for All Validation

---

## Category

Architecture

---

## Rule

Never use `$request->validate()` inside a controller. Always type-hint a dedicated FormRequest class in the method signature for any action that receives input.

---

## Reason

Inline validation couples validation rules to the controller, preventing reuse across contexts. FormRequest classes isolate validation, authorization, and preparation logic into a single testable unit that executes before the controller method runs.

---

## Bad Example

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'body' => 'required|string',
    ]);
    Post::create($validated);
    return redirect()->route('posts.index');
}
```

---

## Good Example

```php
public function store(StorePostRequest $request): RedirectResponse
{
    Post::create($request->validated());
    return redirect()->route('posts.index');
}
```

---

## Exceptions

Index and show methods that accept only query-string filters may use `$request->only()` or `$request->validated()` from a reusable query filter request. Prototype endpoints may temporarily use inline validation, but must be refactored before production.

---

## Consequences Of Violation

Maintenance risks: validation rules scattered across controllers cannot be reused. Testing risks: cannot test validation in isolation. Security risks: missing authorization checks because no `authorize()` method was implemented.

---

## Rule: Return Explicit Response Types

---

## Category

Code Organization

---

## Rule

Always declare an explicit return type on controller methods — `View`, `RedirectResponse`, `JsonResponse`, or a Resource class. Do not rely on implicit string or array conversion.

---

## Reason

Explicit return types communicate intent to other developers and enable static analysis. They allow response customization (headers, status codes) and prevent accidental type mismatches when the method's return value changes.

---

## Bad Example

```php
public function index()
{
    return User::all(); // array, implicitly converted to JSON
}

public function show($id)
{
    return User::findOrFail($id); // model, implicitly converted
}
```

---

## Good Example

```php
public function index(): UserCollection
{
    return new UserCollection(User::all());
}

public function show(User $user): UserResource
{
    return new UserResource($user);
}
```

---

## Exceptions

Very simple redirect routes are better served by `Route::redirect()`. Prototype or debug endpoints may return untyped responses temporarily.

---

## Consequences Of Violation

Maintenance risks: implicit conversions hide response structure; changing a model's JSON serialization breaks the API silently. Reliability risks: no compiler or IDE checks for incorrect response types.

---

## Rule: Separate Web and API Controllers

---

## Category

Architecture

---

## Rule

Do not mix web response types (views, redirects) with API response types (JSON) inside the same controller. Use dedicated controllers for web and API, separated by namespace.

---

## Reason

Mixed response types create inconsistent consumer experiences and make it impossible to enforce API-specific behavior (JSON errors, CORS, rate limiting) at the controller level. Separate controllers allow each to follow its own conventions without conditional logic.

---

## Bad Example

```php
class UserController extends Controller
{
    public function index(): View|JsonResponse
    {
        if (request()->wantsJson()) {
            return response()->json(User::all());
        }
        return view('users.index', ['users' => User::all()]);
    }
}
```

---

## Good Example

```php
// App\Http\Controllers\Web\UserController
public function index(): View
{
    return view('users.index', ['users' => $this->service->list()]);
}

// App\Http\Controllers\Api\UserController
public function index(): UserCollection
{
    return new UserCollection($this->service->list());
}
```

---

## Exceptions

Small applications that serve both HTML and JSON for the same resource may temporarily use a single controller with `wantsJson()`, provided the conditional is minimal (< 3 lines). Extract to dedicated controllers when the application exceeds 10 routes.

---

## Consequences Of Violation

Maintenance risks: every method has HTTP negotiation logic. Testing risks: tests must assert both response formats. Scalability risks: API consumers receive inconsistent responses when web changes accidentally affect JSON output.

---

## Rule: Avoid God Controllers

---

## Category

Architecture

---

## Rule

Do not create controllers with more than 7-10 public methods. If a controller exceeds this limit, extract related operations to dedicated service classes, action classes, or separate controllers.

---

## Reason

A controller with 20+ methods violates single responsibility and indicates it handles multiple resources or concerns. Small controllers are easier to navigate, test, and assign to ownership teams.

---

## Bad Example

```php
class AdminController extends Controller
{
    public function index() { /* ... */ }
    public function store() { /* ... */ }
    public function show() { /* ... */ }
    public function update() { /* ... */ }
    public function destroy() { /* ... */ }
    public function reports() { /* ... */ }
    public function export() { /* ... */ }
    public function import() { /* ... */ }
    public function settings() { /* ... */ }
    public function backup() { /* ... */ }
    public function restore() { /* ... */ }
    public function logs() { /* ... */ }
    // 10+ more methods
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function index() { /* ... */ }
    public function store() { /* ... */ }
    public function show() { /* ... */ }
    public function update() { /* ... */ }
    public function destroy() { /* ... */ }
}

class UserReportController extends Controller
{
    public function __invoke() { /* ... */ }
}
```

---

## Exceptions

Search/filter controllers that expose many query dimensions may exceed 7 methods, provided each method follows the thin controller pattern (< 15 lines) and all methods serve the same resource.

---

## Consequences Of Violation

Maintenance risks: single file grows unmanageable; merge conflicts increase. Testing risks: test file grows proportionally. Reliability risks: accidental side effects between unrelated methods.

---

## Rule: Follow the Three-Step Controller Flow

---

## Category

Architecture

---

## Rule

Structure every controller method as exactly three logical steps: Validate (FormRequest), Delegate (service/action), Return (response/view/resource). Do not insert steps between these three phases.

---

## Reason

The three-step flow enforces separation of concerns by construction. Each step maps to a dedicated layer (FormRequest, Service, Response), preventing any one concern from leaking into another.

---

## Bad Example

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);  // validate
    $this->service->doSomething();            // unrelated side effect
    $post = Post::create($validated);         // delegate
    event(new PostCreated($post));            // side effect
    Log::info('post created');                // logging
    return redirect()->route('posts.index');  // return
}
```

---

## Good Example

```php
public function store(StorePostRequest $request): RedirectResponse
{
    $post = $this->service->create($request->validated());
    return redirect()->route('posts.show', $post);
}
```

---

## Exceptions

Early-return guards (e.g., `if (!$this->service->isEligible($request)) return back()->withErrors(...)`) before the delegation step are acceptable.

---

## Consequences Of Violation

Maintenance risks: business logic, logging, and side effects are interleaved with HTTP concerns. Testing risks: tests must handle multiple side effects. Reliability risks: reordering accidental side effects breaks behavior.

---

## Rule: Use Constructor Promotion for Injected Dependencies

---

## Category

Code Organization

---

## Rule

Declare injected constructor dependencies using PHP 8 promoted constructor properties with the `private readonly` modifier. Do not manually assign constructor parameters to class properties.

---

## Reason

Promoted properties reduce boilerplate, enforce immutability of injected dependencies, and make the controller's dependencies visible in a single concise signature.

---

## Bad Example

```php
class UserController extends Controller
{
    protected UserService $service;
    protected Logger $logger;

    public function __construct(UserService $service, Logger $logger)
    {
        $this->service = $service;
        $this->logger = $logger;
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
        private readonly Logger $logger,
    ) {}
}
```

---

## Exceptions

When a child controller must override a parent's dependency, use traditional property assignment. When the controller extends a base class that requires manual constructor setup, follow the parent's convention.

---

## Consequences Of Violation

Maintenance risks: 5+ extra lines per dependency; harder to add/remove dependencies. Reliability risks: mutable `protected` properties allow unintended reassignment in subclasses.
