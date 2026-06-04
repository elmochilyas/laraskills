# ECC Behavioral Rules — Single-Action Controllers

---

## Rule: Use Single-Action Controllers for Non-CRUD Operations

---

## Category

Code Organization

---

## Rule

Prefer single-action (invokable) controllers for any HTTP operation that does not fit the 7 standard resource controller actions. This includes operations like publish, archive, approve, reject, search, export, and webhooks.

---

## Reason

Non-CRUD operations added to a resource controller violate the predictable resource contract and require manual route registration anyway. Single-action controllers give each operation its own class, clear naming, and explicit route registration.

---

## Bad Example

```php
class PostController extends Controller
{
    public function index() { /* ... */ }
    public function store() { /* ... */ }
    public function show() { /* ... */ }
    public function update() { /* ... */ }
    public function destroy() { /* ... */ }
    public function publish(Post $post) { /* ... */ }  // Mixed in
    public function archive(Post $post) { /* ... */ }   // Mixed in
}
```

---

## Good Example

```php
class PublishPostController
{
    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $this->action->execute($post);
        return redirect()->route('posts.index');
    }
}

class ArchivePostController
{
    public function __invoke(ArchivePostRequest $request, Post $post): RedirectResponse
    {
        $this->action->execute($post);
        return redirect()->route('posts.index');
    }
}
```

---

## Exceptions

If a domain-specific operation is tightly coupled to the resource lifecycle and the team explicitly agrees it belongs in the resource controller, it may be added as a named method — but this should be a team decision, not individual choice.

---

## Consequences Of Violation

Maintenance risks: resource controllers grow beyond their 7-standard-method contract. Confusion: developers cannot rely on the resource controller having only standard methods.

---

## Rule: Name Single-Action Controllers by Operation

---

## Category

Code Organization

---

## Rule

Name single-action controllers after the operation they handle, using the format `{Verb}{Resource}Controller` — e.g., `PublishPostController`, `SearchUsersController`, `ApproveOrderController`.

---

## Reason

Operation-based naming makes the class self-documenting. A developer searching for "where is publish handled" can navigate directly to `PublishPostController` without reading route files or guessing method names.

---

## Bad Example

```php
class PostActionController   // Vague — what action?
class PostHelperController   // Vague — what does it do?
class PostMiscController     // Meaningless
```

---

## Good Example

```php
class PublishPostController
class ArchivePostController
class SearchUsersController
class ApproveOrderController
class ExportReportController
```

---

## Exceptions

When the resource name is already implicit from the namespace (e.g., `app/Http/Controllers/Posts/PublishController`), the resource segment may be omitted from the class name.

---

## Consequences Of Violation

Maintenance risks: unsearchable controller names force developers to read route files to find the handler. Developer onboarding: new team members cannot infer purpose from class names.

---

## Rule: Expose Only __invoke() as a Public Method

---

## Category

Architecture

---

## Rule

A single-action controller must have exactly one public method: `__invoke()`. All other methods must be `private` or `protected`. Do not add additional public methods for related operations.

---

## Reason

Adding a second public method breaks the "single action" contract. The route registration (class only, no method name) only calls `__invoke()`. The extra public method is dead code that can never be reached through routing, confusing developers who see it in the class.

---

## Bad Example

```php
class PublishPostController
{
    public function __invoke(Post $post): RedirectResponse
    {
        $this->service->publish($post);
        return redirect()->route('posts.index');
    }

    public function unpublish(Post $post): RedirectResponse // Dead code — never routed
    {
        $this->service->unpublish($post);
        return redirect()->route('posts.index');
    }
}
```

---

## Good Example

```php
class PublishPostController
{
    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $this->service->publish($post);
        return redirect()->route('posts.index');
    }
}
// Unpublish gets its own controller: UnpublishPostController
```

---

## Exceptions

No common exceptions. If a second public method is needed, it means the controller should be split into two single-action controllers.

---

## Consequences Of Violation

Maintenance risks: unreachable public methods accumulate dead code. Confusion: developers waste time reading methods that can never be called.

---

## Rule: Keep __invoke() Under 15 Lines

---

## Category

Maintainability

---

## Rule

Limit the `__invoke()` method to 15 lines at most, excluding blank lines and closing braces. The method should follow the three-step pattern: validate, delegate, return.

---

## Reason

Single-action controllers handle one operation — if the method exceeds 15 lines, it is doing too much. The entire purpose of a single-action controller is clarity and simplicity. Long `__invoke()` methods indicate missing service/action extraction.

---

## Bad Example

```php
class ImportUsersController
{
    public function __invoke(ImportRequest $request): RedirectResponse
    {
        $file = $request->file('csv');
        $handle = fopen($file->path(), 'r');
        $headers = fgetcsv($handle);
        $imported = 0;
        $failed = [];
        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, $row);
            try {
                User::create([...]);
                $imported++;
            } catch (\Exception $e) {
                $failed[] = $data['email'];
            }
        }
        fclose($handle);
        return redirect()->route('users.index')
            ->with('imported', $imported)
            ->with('failed', $failed);
    }
}
```

---

## Good Example

```php
class ImportUsersController
{
    public function __invoke(ImportRequest $request): RedirectResponse
    {
        $result = $this->service->import($request->file('csv'));
        return redirect()->route('users.index')
            ->with('imported', $result->count())
            ->with('failed', $result->failures());
    }
}
```

---

## Exceptions

Dashboard controllers that pass multiple view-data variables may extend slightly beyond 15 lines if all extra lines are view-data assignments.

---

## Consequences Of Violation

Maintenance risks: logic hidden inside the invokable method cannot be reused. Testing risks: must test through HTTP for any assertion. Reliability risks: multiple responsibilities in one method increase bug surface.

---

## Rule: Prefer Single-Action Controllers Over Closure Routes

---

## Category

Framework Usage

---

## Rule

Convert Closure routes to single-action controllers in any production application. Do not define route handlers as inline Closures in route files.

---

## Reason

Closure routes cannot be cached by `php artisan route:cache`, are invisible to IDE navigation, and cannot be tested independently. Single-action controllers support route caching, are IDE-resolvable, and can be tested with standard controller test patterns.

---

## Bad Example

```php
// routes/web.php
Route::get('/dashboard', function () {
    return view('dashboard', [
        'stats' => DashboardService::getStats(),
    ]);
});
```

---

## Good Example

```php
// routes/web.php
Route::get('/dashboard', DashboardController::class);

// app/Http/Controllers/DashboardController.php
class DashboardController
{
    public function __invoke(): View
    {
        return view('dashboard', ['stats' => $this->service->getStats()]);
    }
}
```

---

## Exceptions

Trivial redirects using `Route::redirect()` and static views using `Route::view()` do not need controllers. Prototyping endpoints may remain as Closures but must be converted before production.

---

## Consequences Of Violation

Performance risks: `php artisan route:cache` skips Closure routes — routes must be re-parsed on every request. Maintenance risks: Closure routes cannot be found by IDE searches or referenced in tests.

---

## Rule: Do Not Use Single-Action Controllers for CRUD Operations

---

## Category

Architecture

---

## Rule

Do not create single-action controllers for standard CRUD operations (index, store, show, update, destroy). Use resource controllers for CRUD and single-action controllers only for non-CRUD operations.

---

## Reason

Creating separate invokable controllers for each CRUD action (e.g., `ListPostsController`, `CreatePostController`, `ShowPostController`) produces excessive files and loses the organizational benefit of the resource controller pattern. Resource controllers group related actions into a single predictable class.

---

## Bad Example

```
app/Http/Controllers/
├── ListPostsController.php
├── CreatePostController.php
├── ShowPostController.php
├── UpdatePostController.php
├── DeletePostController.php
├── PublishPostController.php  // This one fits the pattern
```

---

## Good Example

```
app/Http/Controllers/
├── PostController.php          // Resource controller for CRUD
└── PublishPostController.php   // Single-action for non-CRUD
```

---

## Exceptions

In action-domain-driven design where every operation is modeled as an action, the team may choose to use single-action controllers exclusively. This is a valid but advanced architecture that must be declared as a team standard.

---

## Consequences Of Violation

Maintenance risks: excessive file proliferation makes navigation harder. Developer confusion: CRUD operations scattered across 5 files instead of 1 resource controller.

---

## Rule: Register Single-Action Controllers by Class Only

---

## Category

Framework Usage

---

## Rule

Register single-action controllers by passing only the class name to the route method, without specifying a method. Never use `[Controller::class, '__invoke']`.

---

## Reason

Passing only the class name leverages Laravel's invokable detection. It is shorter, clearly communicates that this is a single-action controller, and is the conventional style that other Laravel developers expect to see.

---

## Bad Example

```php
Route::get('/dashboard', [DashboardController::class, '__invoke']);
Route::post('/contact', [ContactFormController::class, '__invoke']);
```

---

## Good Example

```php
Route::get('/dashboard', DashboardController::class);
Route::post('/contact', ContactFormController::class);
```

---

## Exceptions

No common exceptions. Using the class alone is always preferred for invokable controllers.

---

## Consequences Of Violation

Confusion: other developers may not realize the controller is invokable at a glance. Minor inconsistency: the explicit `__invoke` adds unnecessary verbosity.

---

## Rule: Use Constructor Injection in Single-Action Controllers

---

## Category

Architecture

---

## Rule

Inject service/action dependencies via the constructor in single-action controllers, just as in standard controllers. Use promoted constructor properties with `private readonly`.

---

## Reason

Single-action controllers are resolved by the container — constructor injection works identically to multi-method controllers. Using promoted properties keeps dependencies visible and testable.

---

## Bad Example

```php
class PublishPostController
{
    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $service = app(PublishPostService::class); // Service locator
        $service->execute($post);
        return redirect()->route('posts.index');
    }
}
```

---

## Good Example

```php
class PublishPostController
{
    public function __construct(
        private readonly PublishPostService $service,
    ) {}

    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $this->service->execute($post);
        return redirect()->route('posts.index');
    }
}
```

---

## Exceptions

If the single-action controller has no dependencies beyond what method injection provides (FormRequest, route model binding), the constructor may be omitted entirely.

---

## Consequences Of Violation

Testing risks: hidden service locator calls make mocking impossible without modifying the controller. Maintenance risks: dependencies are undocumented in the class signature.

---

## Rule: Keep Single-Action Controllers Free of Custom Traits

---

## Category

Architecture

---

## Rule

Do not apply custom traits to single-action controllers that add public methods. Custom traits with public methods violate the single-public-method contract.

---

## Reason

Traits that add public methods (e.g., `use AuthorizesRequests;` which adds `authorize()`, `authorizeResource()`, etc.) add reachable public surface area to the controller. While these methods cannot be routed, they create confusing class interfaces.

---

## Bad Example

```php
class DashboardController
{
    use AuthorizesRequests; // Adds authorize(), authorizeResource(), etc.
    use ValidatesRequests;  // Adds validate(), validateWithBag(), etc.

    public function __invoke(): View
    {
        return view('dashboard');
    }
}
```

---

## Good Example

```php
class DashboardController
{
    public function __invoke(): View
    {
        return view('dashboard');
    }
}
```

---

## Exceptions

Single-action controllers that extend the base `Controller` class will inherit its traits. This is acceptable because the base class traits are expected.

---

## Consequences Of Violation

Confusion: the class public interface includes methods that cannot be routed. Maintenance risks: trait methods may conflict with `__invoke()` logic.
