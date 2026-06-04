# ECC Behavioral Rules — Resource Controllers

---

## Rule: Use Resource Controllers for All CRUD Operations

---

## Category

Architecture

---

## Rule

Every CRUD operation on a resource must use a resource controller with the 7 standard action methods — `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`. Register routes using `Route::resource()`.

---

## Reason

Resource controllers enforce a predictable, documented convention across the entire application. Every developer knows exactly which method handles which operation, reducing cognitive overhead and eliminating the need for per-route documentation.

---

## Bad Example

```php
class UserController extends Controller
{
    public function list() { /* ... */ }                 // Non-standard
    public function add(Request $request) { /* ... */ }  // Non-standard
    public function view($id) { /* ... */ }              // Non-standard
    public function change($id, Request $r) { /* ... */ } // Non-standard
    public function delete($id) { /* ... */ }            // Non-standard
}

// Route::get('/users', [UserController::class, 'list']);
// Route::post('/users', [UserController::class, 'add']);
```

---

## Good Example

```php
class UserController extends Controller
{
    public function index() { /* ... */ }
    public function create() { /* ... */ }
    public function store(Request $request) { /* ... */ }
    public function show(User $user) { /* ... */ }
    public function edit(User $user) { /* ... */ }
    public function update(Request $request, User $user) { /* ... */ }
    public function destroy(User $user) { /* ... */ }
}

// Route::resource('users', UserController::class);
```

---

## Exceptions

Read-only resources that never create, update, or delete should use `Route::resource()->only(['index', 'show'])` or `Route::apiResource()` with only the relevant methods.

---

## Consequences Of Violation

Maintenance risks: every controller has a different method naming convention. Developer onboarding: new team members must learn custom naming for each resource. Routing complexity: each route must be manually registered instead of using `Route::resource()`.

---

## Rule: Use apiResource for API Endpoints

---

## Category

Framework Usage

---

## Rule

For JSON API endpoints, use `php artisan make:controller --api` and `Route::apiResource()`. This generates only the 5 API-necessary methods (index, store, show, update, destroy) and omits the create/edit form methods.

---

## Reason

API endpoints do not need `create()` or `edit()` methods because JSON APIs do not serve HTML forms. Including them adds dead code and creates confusion for API consumers who see unused routes in `php artisan route:list`.

---

## Bad Example

```bash
php artisan make:controller Api\UserController --resource
```

```php
// Routes include create and edit — unnecessary for API
// GET /users/create -> 404 or broken response
// GET /users/{user}/edit -> 404 or broken response
```

---

## Good Example

```bash
php artisan make:controller Api\UserController --api
```

```php
// Only 5 routes registered
// GET /users
// POST /users
// GET /users/{user}
// PUT/PATCH /users/{user}
// DELETE /users/{user}
```

---

## Exceptions

If an API returns form schemas or metadata that describes the create/edit interface (e.g., JSON:API resource schema), the create/edit methods may be implemented as metadata endpoints.

---

## Consequences Of Violation

Maintenance risks: dead create/edit methods accumulate dead code. Reliability risks: unused routes may return unexpected responses if accessed.

---

## Rule: Generate Resource Controllers via Artisan

---

## Category

Framework Usage

---

## Rule

Always use `php artisan make:controller NameController --resource` or `--api` to generate resource controllers. Do not write resource controller files manually.

---

## Reason

Artisan generates correct method signatures, docblocks, import statements, and follows the latest framework conventions. Manual creation risks outdated signatures, missing docblocks, and namespace inconsistencies.

---

## Bad Example

Creating a file manually with outdated method signatures or wrong namespace.

---

## Good Example

```bash
php artisan make:controller PostController --resource
php artisan make:controller Api\PostController --api
php artisan make:controller Admin\UserController --resource
```

---

## Exceptions

When the controller needs a custom base class or trait that Artisan does not support, a manual stub may be necessary. In that case, publish and customize the `stubs/controller.plain.stub`.

---

## Consequences Of Violation

Developer productivity: manual method creation wastes time. Maintenance risks: generated vs. manual controllers have inconsistent signatures.

---

## Rule: Keep Each Resource Action Under 10 Lines

---

## Category

Maintainability

---

## Rule

Each resource action method (index, store, show, etc.) must be 10 lines or fewer, excluding blank lines and closing braces. The method should follow the validate-delegate-return pattern.

---

## Reason

Resource controllers are the most-visited controllers in an application. Fat resource actions are the primary indicator of missing service/action extraction. Methods under 10 lines are readable at a glance and force delegation to the proper layer.

---

## Bad Example

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $post = new Post();
    $post->title = $validated['title'];
    $post->body = $validated['body'];
    $post->user_id = auth()->id();
    $post->save();
    if ($request->has('tags')) {
        $post->tags()->attach($request->input('tags'));
    }
    event(new PostCreated($post));
    Log::info('Post created');
    Mail::to(auth()->user())->send(new PostConfirmation($post));
    return redirect()->route('posts.index')->with('success', 'Created');
}
```

---

## Good Example

```php
public function store(StorePostRequest $request): RedirectResponse
{
    $this->service->create($request->validated());
    return redirect()->route('posts.index');
}
```

---

## Exceptions

`index()` methods that need to pass multiple pieces of data to a view (e.g., filters, pagination metadata) may extend to 15 lines if the extra lines are all view-data assignments.

---

## Consequences Of Violation

Maintenance risks: long methods hide business logic, queries, and side effects. Testing risks: cannot test HTTP behavior independently of business logic.

---

## Rule: Do Not Add Non-Resource Actions to Resource Controllers

---

## Category

Architecture

---

## Rule

Do not add custom methods like `publish()`, `archive()`, `approve()`, or `export()` to a resource controller. Use a separate controller, a single-action controller, or a dedicated route with explicit method mapping.

---

## Reason

Non-standard methods violate the predictable resource contract. Developers expect exactly the 7 standard actions from a resource controller. Custom methods create confusion about which methods exist and how they are routed.

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
    public function publish(Post $post) { /* ... */ }     // Non-standard
    public function archive(Post $post) { /* ... */ }     // Non-standard
    public function approve(Post $post) { /* ... */ }     // Non-standard
}
// These custom methods require manual route registration
```

---

## Good Example

```php
// Resource controller — standard only
class PostController extends Controller
{
    public function index() { /* ... */ }
    public function store() { /* ... */ }
    public function show() { /* ... */ }
    public function update() { /* ... */ }
    public function destroy() { /* ... */ }
}

// Single-action controllers for non-CRUD operations
class PublishPostController
{
    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $this->action->execute($post);
        return redirect()->route('posts.index');
    }
}

// Routes
Route::resource('posts', PostController::class);
Route::post('/posts/{post}/publish', PublishPostController::class);
```

---

## Exceptions

When a resource has a domain-specific action that is universally accepted as part of the resource lifecycle and the team explicitly agrees on the convention, it may be added as a single custom method with explicit route registration.

---

## Consequences Of Violation

Maintenance risks: developers checking the resource's API surface must read the entire controller. Testing risks: custom methods may not follow the resource testing pattern. Confusion: `Route::resource()` does not automatically register custom methods.

---

## Rule: Use Form Requests for Store and Update Validation

---

## Category

Architecture

---

## Rule

Every `store()` and `update()` method in a resource controller must type-hint a dedicated FormRequest class. Do not use inline validation or type-hint `Illuminate\Http\Request`.

---

## Reason

The store and update actions process user input that must be validated and authorized. Dedicated FormRequest classes provide a single location for validation rules, authorization logic, and input preparation, keeping the controller method focused on delegation.

---

## Bad Example

```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([...]); // Inline validation
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

public function update(UpdatePostRequest $request, Post $post): RedirectResponse
{
    $post->update($request->validated());
    return redirect()->route('posts.index');
}
```

---

## Exceptions

When a store or update method accepts no user input and all data is derived from the authenticated user or server state, a FormRequest is unnecessary. This is extremely rare.

---

## Consequences Of Violation

Security risks: missing authorization checks in FormRequest `authorize()`. Maintenance risks: validation rules duplicated across controllers. Testing risks: validation logic cannot be tested in isolation.

---

## Rule: Use Route Model Binding in Show, Edit, Update, Destroy

---

## Category

Framework Usage

---

## Rule

Type-hint the bound Eloquent model in the `show($model)`, `edit($model)`, `update(Request, $model)`, and `destroy($model)` method signatures. Never manually resolve models using `$id`.

---

## Reason

Route model binding eliminates repetitive `Model::findOrFail($id)` calls, reduces method length, and provides automatic 404 responses. The model is resolved before the method body executes, preventing null-reference errors.

---

## Bad Example

```php
public function show(int $id): View
{
    $post = Post::findOrFail($id);
    return view('posts.show', ['post' => $post]);
}

public function update(Request $request, int $id): RedirectResponse
{
    $post = Post::findOrFail($id);
    $post->update($request->validated());
    return redirect()->route('posts.index');
}
```

---

## Good Example

```php
public function show(Post $post): View
{
    return view('posts.show', ['post' => $post]);
}

public function update(UpdatePostRequest $request, Post $post): RedirectResponse
{
    $post->update($request->validated());
    return redirect()->route('posts.index');
}
```

---

## Exceptions

When using soft-deleted models that need `withTrashed()`, explicit binding or a custom route binding in `RouteServiceProvider` is needed instead of implicit binding.

---

## Consequences Of Violation

Maintenance risks: every method repeats `findOrFail` boilerplate. Reliability risks: inconsistent 404 handling; forgotten `findOrFail` causes unhandled exceptions.

---

## Rule: Avoid Resource Controllers for Non-CRUD Resources

---

## Category

Architecture

---

## Rule

Do not create resource controllers for resources that do not support the full or partial CRUD lifecycle (e.g., read-only dashboards, single-operation imports). Use single-action controllers or plain controllers instead.

---

## Reason

A resource controller implies the 7 standard operations. Using it for a resource that only needs one or two actions creates dead methods that can never be reached, confusing developers and generating noise in route listings.

---

## Bad Example

```php
class DashboardController extends Controller
{
    public function index() { /* ... */ }   // Only this is used
    public function create() { /* never */ }
    public function store() { /* never */ }
    public function show() { /* never */ }
    public function edit() { /* never */ }
    public function update() { /* never */ }
    public function destroy() { /* never */ }
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

When a resource truly has only one or two operations but the team expects it to grow into a full CRUD resource, start with `Route::resource()->only(['index', 'show'])` to reserve the structure without dead methods.

---

## Consequences Of Violation

Maintenance risks: dead code accumulates; unused methods must be maintained. Testing risks: unused methods require stub tests or are untested. Route noise: `php artisan route:list` shows irrelevant routes.

---

## Rule: Keep the Create/Edit Methods Minimal in Web Resources

---

## Category

Code Organization

---

## Rule

The `create()` and `edit()` resource methods should only return a view with the necessary data. Do not include validation, queries, or business logic in these methods.

---

## Reason

Create and edit are display methods — they show forms. Any logic beyond fetching data for the form belongs in the store and update methods respectively. Business logic in create/edit typically runs on GET requests, performing side effects on page visits.

---

## Bad Example

```php
public function create(): View
{
    $this->service->initializeDraft(); // Side effect on GET
    $defaults = $this->service->getDefaults();
    $suggestions = $this->service->getSuggestions(); // Heavy query
    return view('posts.create', compact('defaults', 'suggestions'));
}
```

---

## Good Example

```php
public function create(): View
{
    return view('posts.create');
}
```

---

## Exceptions

When the create form requires domain-specific options (e.g., list of categories, available templates), loading that data in `create()` is acceptable as long as it is a read-only query with no side effects.

---

## Consequences Of Violation

Performance risks: heavy queries and side effects on GET requests. Maintenance risks: create/edit methods are unexpectedly expensive. Reliability risks: side effects fire on page refresh.
