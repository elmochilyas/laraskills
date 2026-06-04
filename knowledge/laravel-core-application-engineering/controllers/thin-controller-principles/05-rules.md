# ECC Behavioral Rules — Thin Controller Principles

---

## Rule: Never Write Database Queries in Controllers

---

## Category

Architecture

---

## Rule

Do not call Eloquent methods (`User::where()`, `DB::table()`, `Model::query()`) or any query builder inside a controller method. All data retrieval must be delegated to service classes, action classes, or repository classes.

---

## Reason

Database queries in controllers couple the HTTP layer directly to the data layer. The same query cannot be reused from CLI commands, queues, or other entry points. Queries embedded in controllers are untestable without full HTTP bootstrapping.

---

## Bad Example

```php
class UserController extends Controller
{
    public function index(): View
    {
        $users = User::where('active', true)
            ->with('posts')
            ->paginate(20);
        return view('users.index', ['users' => $users]);
    }
}
```

---

## Good Example

```php
class UserController extends Controller
{
    public function __construct(
        private UserService $service,
    ) {}

    public function index(): View
    {
        return view('users.index', ['users' => $this->service->listActive()]);
    }
}
```

---

## Exceptions

`Model::findOrFail()` calls inside `update`/`destroy` methods are not needed because route model binding resolves the model before the method executes.

---

## Consequences Of Violation

Testing risks: queries cannot be unit-tested. Maintenance risks: the same query logic is duplicated across controllers. Scalability risks: the query pattern cannot be reused in CLI or queue contexts.

---

## Rule: Never Format Responses Inline in Controllers

---

## Category

Architecture

---

## Rule

Do not construct JSON arrays, format collections, or build response structures inside controller methods. Use API Resources for JSON transformation and Blade views for HTML rendering.

---

## Reason

Inline response formatting couples presentation logic to the HTTP handler. Every endpoint that returns the same resource must repeat the formatting, creating duplication. Changes to response structure require modifying every controller method instead of one Resource class.

---

## Bad Example

```php
public function index(): JsonResponse
{
    $users = User::all();
    return response()->json([
        'data' => $users->map(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'post_count' => $user->posts->count(),
            'created_at' => $user->created_at->toISOString(),
        ]),
        'meta' => ['total' => $users->count()],
    ]);
}
```

---

## Good Example

```php
public function index(): UserCollection
{
    return new UserCollection(User::all());
}

// app/Http/Resources/UserResource.php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'post_count' => $this->posts->count(),
            'created_at' => $this->created_at,
        ];
    }
}
```

---

## Exceptions

Simple status messages (e.g., `response()->json(['message' => 'Deleted'])`) in destroy methods are acceptable. Complex collection formatting must use Resources.

---

## Consequences Of Violation

Maintenance risks: response structure changes require modifying every controller. Testing risks: response formatting is tested through HTTP tests instead of isolated Resource tests. Duplication: every endpoint repeats the same transformation logic.

---

## Rule: Delegate All Business Logic to Services or Actions

---

## Category

Architecture

---

## Rule

Every controller method that performs a business operation must delegate it to a service class or action class. Controllers must not contain calculations, conditional workflows, multi-step processes, or state mutations.

---

## Reason

Business logic in controllers is the root cause of untestable, unreusable, and unmaintainable code. Delegated logic is independently unit-testable, reusable across HTTP/CLI/queue entry points, and modifiable without touching the HTTP layer.

---

## Bad Example

```php
public function store(StoreOrderRequest $request): RedirectResponse
{
    $validated = $request->validated();
    $total = $validated['price'] * $validated['quantity'];
    $discount = $total > 100 ? $total * 0.1 : 0;
    $tax = $total * 0.08;
    $grandTotal = $total - $discount + $tax;
    $order = Order::create([...]);
    $order->items()->createMany([...]);
    Inventory::decrement(...);
    event(new OrderCreated($order));
    return redirect()->route('orders.index');
}
```

---

## Good Example

```php
public function store(StoreOrderRequest $request): RedirectResponse
{
    $this->orderService->create($request->validated());
    return redirect()->route('orders.index');
}
```

---

## Exceptions

Trivial conditional logic that directly controls the HTTP response (e.g., `return $user->isAdmin() ? redirect('/admin') : redirect('/dashboard')`) is acceptable.

---

## Consequences Of Violation

Testing risks: every behavior test requires HTTP bootstrapping. Maintenance risks: same logic is duplicated across controllers. Scalability risks: cannot invoke business logic from CLI, queue, or webhook handlers.

---

## Rule: Keep Controller Methods Under 10 Lines

---

## Category

Maintainability

---

## Rule

Limit every controller method to 10 lines of executable code, excluding blank lines, opening braces, and closing braces. A method that exceeds 10 lines is doing more than validating, delegating, and returning.

---

## Reason

The 10-line limit is an objective threshold that forces delegation. If a method cannot express its intent in 10 lines, the intent is too complex for a controller. The limit creates a "pain point" that encourages extracting concerns to the proper layer.

---

## Bad Example

```php
public function update(UpdateUserRequest $request, User $user): RedirectResponse
{
    $validated = $request->validated();
    if (isset($validated['password'])) {
        $validated['password'] = Hash::make($validated['password']);
    }
    $user->update($validated);
    if ($request->has('roles')) {
        $user->roles()->sync($validated['roles']);
    }
    event(new UserUpdated($user));
    Log::info('User updated', ['id' => $user->id, 'updated_by' => auth()->id()]);
    Cache::forget("user.{$user->id}");
    return redirect()->route('users.show', $user)
        ->with('success', 'User updated successfully.');
}
```

---

## Good Example

```php
public function update(UpdateUserRequest $request, User $user): RedirectResponse
{
    $this->service->update($user, $request->validated());
    return redirect()->route('users.show', $user);
}
```

---

## Exceptions

`index()` methods that pass view data (multiple variables, pagination metadata, filter state) may extend to 12-15 lines if all extra lines are data-passing assignments.

---

## Consequences Of Violation

Maintenance risks: long methods hide business logic and side effects. Testing risks: multiple concerns in one method require multiple test scenarios. Reliability risks: side effects at the end of a long method are easy to miss during code review.

---

## Rule: Use FormRequest for Every Store and Update Action

---

## Category

Architecture

---

## Rule

Every controller method that receives and processes user input must type-hint a dedicated FormRequest class. Do not use `$request->validate()` or type-hint `Illuminate\Http\Request` for store/update methods.

---

## Reason

FormRequest classes encapsulate validation rules, authorization logic, and input preparation in a single testable unit. They execute validation before the controller method runs, ensuring invalid data never reaches the method body. They also support `authorize()` for access control.

---

## Bad Example

```php
public function store(Request $request): RedirectResponse
{
    $request->validate([
        'title' => 'required|string|max:255',
        'body' => 'required|string',
    ]);
    Post::create($request->all());
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

Index and show methods that accept only optional query-string filters may use `Request` type-hints. Destructive actions (destroy) that only receive a route model binding do not need a FormRequest.

---

## Consequences Of Violation

Security risks: missing `authorize()` checks. Maintenance risks: validation rules duplicated across endpoints. Testing risks: validation cannot be tested independently.

---

## Rule: Limit Controller Imports to HTTP-Layer Concerns

---

## Category

Architecture

---

## Rule

Controller import statements should only reference HTTP-layer classes: FormRequests, Resources, Services/Actions, Response types, and Facades that generate responses. Do not import Models, DB facades, or Query Builder classes directly.

---

## Reason

Imports are a proxy for coupling. If a controller imports `App\Models\User`, it is likely querying the model directly. Importing only HTTP-layer classes enforces the thin controller discipline by making violations visible at the top of the file.

---

## Bad Example

```php
use App\Models\User;          // Should not be imported in controller
use Illuminate\Support\Facades\DB; // Should not be imported in controller
use Illuminate\Support\Facades\Cache; // Should not be imported in controller

class UserController extends Controller
{
    public function index(): View
    {
        $users = User::where('active', true)->get(); // Violation visible from imports
        return view('users.index', compact('users'));
    }
}
```

---

## Good Example

```php
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserCollection;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class UserController extends Controller
{
    public function __construct(
        private UserService $service,
    ) {}

    public function index(): View
    {
        return view('users.index', ['users' => $this->service->list()]);
    }
}
```

---

## Exceptions

Controllers that must return model instances from route model binding (e.g., `show(User $user)` returning a view with `$user`) may import the model type if it is only used in the method signature, not for querying.

---

## Consequences Of Violation

Maintenance risks: model imports make it easy to write inline queries. Testing risks: controller tests become integration tests. Enforcement difficulty: violations require review — they cannot be caught automatically without architecture tests.

---

## Rule: Follow the Three-Step Pattern: Validate, Delegate, Return

---

## Category

Architecture

---

## Rule

Structure every controller method as exactly three sequential phases: validate the input (via FormRequest), delegate to a service or action, and return an HTTP response. Do not insert other logic between these phases.

---

## Reason

The three-step pattern creates a predictable, reviewable structure for every controller method. Reviewers know exactly where to look for validation, logic, and response. Any deviation is immediately visible and must be justified.

---

## Bad Example

```php
public function store(StoreUserRequest $request): RedirectResponse
{
    // Validate happens (FormRequest in signature)
    Log::info('Creating user');                    // Step between validate and delegate
    $this->notificationService->send();             // Step between validate and delegate
    $user = $this->service->create($request->validated()); // Delegate
    Cache::forget('user-count');                    // Step between delegate and return
    event(new UserCreated($user));                   // Step between delegate and return
    return redirect()->route('users.index');         // Return
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request): RedirectResponse
{
    $user = $this->service->create($request->validated());
    return redirect()->route('users.index');
}
```

---

## Exceptions

Early-return guards (e.g., `if ($this->service->isDuplicate($request)) return back()`) are acceptable as pre-delegation checks. Post-delegation logging may be acceptable if the log line is the only addition.

---

## Consequences Of Violation

Maintenance risks: side effects are interleaved with the core flow. Testing risks: tests must handle side effects that belong in the service layer. Reliability risks: reordering or removing steps accidentally breaks behavior.

---

## Rule: Do Not Use Controllers as Orchestrators

---

## Category

Architecture

---

## Rule

Do not write controller methods that call multiple services, manage transactions, dispatch events, send notifications, or coordinate multi-step workflows. All orchestration must be handled by a service class.

---

## Reason

The controller's responsibility is HTTP translation — not process orchestration. Orchestration logic in controllers cannot be reused across entry points, cannot be unit-tested without HTTP, and makes the controller the "god class" of the request lifecycle.

---

## Bad Example

```php
public function store(StoreOrderRequest $request): RedirectResponse
{
    DB::beginTransaction();
    try {
        $order = $this->orderService->create($request->validated());
        $this->paymentService->charge($order, $request->input('payment'));
        $this->inventoryService->reserve($order);
        $this->notificationService->sendOrderConfirmation($order);
        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        return back()->with('error', 'Order failed');
    }
    return redirect()->route('orders.show', $order);
}
```

---

## Good Example

```php
public function store(StoreOrderRequest $request): RedirectResponse
{
    $order = $this->orderService->create($request->validated());
    return redirect()->route('orders.show', $order);
}

// OrderService::create() handles transaction, payment, inventory, notification
```

---

## Exceptions

Simple two-step flows (e.g., create and attach a relationship) that do not involve external services or side effects may remain in the controller if the delegated service already handles the main operation.

---

## Consequences Of Violation

Maintenance risks: orchestration logic is coupled to the HTTP entry point. Scalability risks: cannot reuse the orchestration from CLI or queue. Testing risks: every test must mock multiple services.

---

## Rule: Never Perform Authorization Logic Directly in Controllers

---

## Category

Security

---

## Rule

Do not write `if (auth()->user()->isAdmin())`, `$user->can()`, or `Gate::allows()` inside controller methods. Delegate all authorization to FormRequest `authorize()` methods, Policy classes, or middleware.

---

## Reason

Authorization logic in controllers bypasses Laravel's Policy/Gate system, making permissions untestable through Policy tests and unreviewable through Policy registrations. Centralized authorization in Policies ensures consistent enforcement across all entry points.

---

## Bad Example

```php
public function destroy(User $user): RedirectResponse
{
    if (!auth()->user()->isAdmin() && auth()->id() !== $user->id) {
        abort(403);
    }
    $this->service->delete($user);
    return redirect()->route('users.index');
}
```

---

## Good Example

```php
// FormRequest
public function authorize(): bool
{
    return $this->user()->can('delete', $this->route('user'));
}

// Controller
public function destroy(DestroyUserRequest $request, User $user): RedirectResponse
{
    $this->service->delete($user);
    return redirect()->route('users.index');
}
```

---

## Exceptions

When using middleware-based authorization (e.g., `$this->middleware('admin')->only(['destroy'])`), the authorization check is in the middleware layer, which is acceptable.

---

## Consequences Of Violation

Security risks: authorization logic is invisible to security audits that check Policy registrations. Testing risks: authorization scenarios cannot be tested through Policy tests. Maintenance risks: same authorization check is duplicated across controllers.

---

## Rule: Ban Eloquent Model and DB Imports in Controllers via Architecture Tests

---

## Category

Testing

---

## Rule

Write an architecture test that fails if any controller file imports `App\Models\*`, `Illuminate\Support\Facades\DB`, or calls `Model::method()` directly. Automate this check in CI.

---

## Reason

Architecture tests enforce the thin controller discipline programmatically. Without automated enforcement, violations creep in during code review gaps. A Pest or PHPUnit architecture test catches violations before they reach production.

---

## Bad Example

No automated check — violations discovered during code review or not at all.

---

## Good Example

```php
// tests/Architecture/ControllerTest.php
test('controllers do not import models')
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Models');

test('controllers do not import DB facade')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Support\Facades\DB');

test('controllers do not import Cache facade')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Support\Facades\Cache');
```

---

## Exceptions

Controllers that pass a model instance from route model binding to a view are exempt, provided the model import is only used in the method signature, not for querying.

---

## Consequences Of Violation

Maintenance risks: architecture violations accumulate silently. Scalability risks: controllers grow fatter as more violations are introduced. Testing risks: no automated safety net for thin controller enforcement.
