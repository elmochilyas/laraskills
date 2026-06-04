# Skill: Create a Single-Action Controller for a Non-CRUD Operation

## Purpose

Create an invokable controller that handles exactly one non-CRUD operation (publish, approve, search, export, webhook), registered by class name only. Provides a testable, cacheable, and IDE-resolvable alternative to Closure routes, and keeps resource controllers free of custom methods.

## When To Use

- A single-purpose HTTP endpoint that doesn't fit CRUD (publish, archive, approve, reject)
- A webhook handler (stripe webhook, GitHub push event)
- A search endpoint
- A contact form submission
- A simple dashboard or read-only page
- Replacing a Closure route in a production application

## When NOT To Use

- Standard CRUD operations (use resource controllers)
- Operations that share significant logic with other actions (use a shared service)
- Simple redirect routes (use `Route::redirect()`)
- Static page routes (use `Route::view()`)
- Resources that need index, store, show, update, destroy (use resource controllers)

## Prerequisites

- Route URI and HTTP verb decided (GET, POST, PUT, DELETE)
- Operation name determined (publish, approve, search, etc.)
- Service or action class exists for business logic delegation (or will be created)
- FormRequest class exists if the operation receives input

## Inputs

- HTTP verb and URI (e.g., `POST /posts/{post}/publish`)
- Operation description (e.g., "Publishes a post making it visible to readers")
- Service/action method that performs the operation
- FormRequest class name if input validation is needed

## Workflow

1. **Generate the invokable controller**

   ```bash
   php artisan make:controller PublishPostController --invokable
   ```
   
   Or create manually:
   ```php
   <?php
   
   namespace App\Http\Controllers;
   
   use App\Models\Post;
   use Illuminate\Http\RedirectResponse;
   
   class PublishPostController
   {
       public function __invoke(Post $post): RedirectResponse
       {
           // ...
       }
   }
   ```
   
   Name the controller using the `{Verb}{Resource}Controller` format: `PublishPostController`, `SearchUsersController`, `ApproveOrderController`.

2. **Add constructor dependencies**

   Inject the service or action via promoted constructor properties:
   ```php
   public function __construct(
       private readonly PublishPostAction $action,
   ) {}
   ```
   
   If no dependencies are needed beyond method injection, omit the constructor entirely.

3. **Add `__invoke()` method parameters**

   a. If the operation receives user input → type-hint a FormRequest:
      ```php
      public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
      ```
   
   b. If the operation needs a resource model → use route model binding:
      ```php
      public function __invoke(Post $post): RedirectResponse
      ```
   
   c. If no input is needed → no parameters:
      ```php
      public function __invoke(): View
      ```

4. **Implement the three-step pattern in `__invoke()`**

   Validate (if applicable), delegate to the service/action, return a response:
   ```php
   public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
   {
       $this->action->execute($post);
       return redirect()->route('posts.index')
           ->with('success', 'Post published successfully.');
   }
   ```
   
   Keep `__invoke()` under 15 lines.

5. **Register the route**

   Register the controller by class name only — do NOT specify the method:
   ```php
   Route::post('/posts/{post}/publish', PublishPostController::class);
   Route::get('/dashboard', DashboardController::class);
   Route::post('/contact', ContactFormController::class);
   ```

6. **Add constructor middleware if needed**

   ```php
   public function __construct()
   {
       $this->middleware('auth');
       $this->middleware('admin')->only('__invoke');
   }
   ```
   
   Note: `only()` must target `'__invoke'` — the actual method name in invokable controllers.

## Validation Checklist

- [ ] Controller has exactly one public method: `__invoke()`
- [ ] No other public methods exist (all helpers are `private` or `protected`)
- [ ] Controller is named by operation: `{Verb}{Resource}Controller`
- [ ] Route is registered by class name only: `ControllerName::class`
- [ ] `__invoke()` is under 15 lines following validate-delegate-return
- [ ] Constructor injection is used for shared dependencies (with `private readonly`)
- [ ] FormRequest is used if the operation receives user input
- [ ] Route model binding resolves resource parameters
- [ ] Controller should NOT extend `Controller` base class unless it needs `middleware()` or `validate()` methods
- [ ] No traits that add public methods (like `AuthorizesRequests`) are used

## Common Failures

- **Multiple public methods**: Adding `public function` methods alongside `__invoke()`. Prevention: only `__invoke()` should be public — make all helpers private.
- **Specifying `__invoke` in route registration**: Using `[Controller::class, '__invoke']` instead of `Controller::class`. Prevention: pass the class name only.
- **Mixing CRUD into single-action controllers**: Creating invokable controllers for standard CRUD actions (ListPostsController, ShowPostController). Prevention: use resource controllers for CRUD.
- **Vague naming**: `PostActionController`, `PostMiscController` instead of `PublishPostController`. Prevention: name by the operation: {Verb}{Resource}Controller.
- **Fat `__invoke()` methods**: Methods exceeding 15 lines with business logic. Prevention: delegate to services or actions.

## Decision Points

- **Single-action controller vs. Closure**: If the route needs caching, IDE navigation, or testability → single-action controller. If it's a throwaway prototype → Closure (but convert before production).
- **Constructor injection vs. method injection in `__invoke()`**: If the service is the core dependency of the operation → constructor. If it's a one-off utility → method injection.
- **Extending `Controller` vs. not extending**: If the controller needs `$this->middleware()` → extend `Controller`. If no middleware or framework features are needed → no base class needed.

## Performance Considerations

- Single-action controllers are cached by `php artisan route:cache` — Closure routes are NOT.
- Resolution is identical to multi-method controllers — container resolves the class and calls `__invoke()`.
- No reflection overhead beyond standard method resolution.

## Security Considerations

- Verify middleware is applied correctly — single-action controllers don't inherit middleware from resource controller patterns.
- Route model binding provides automatic 404 for missing resources.
- FormRequest `authorize()` runs before `__invoke()` — use it for model-specific authorization.

## Related Rules

- `05-rules.md` Rule: "Use Single-Action Controllers for Non-CRUD Operations"
- `05-rules.md` Rule: "Name Single-Action Controllers by Operation"
- `05-rules.md` Rule: "Expose Only __invoke() as a Public Method"
- `05-rules.md` Rule: "Keep __invoke() Under 15 Lines"
- `05-rules.md` Rule: "Prefer Single-Action Controllers Over Closure Routes"
- `05-rules.md` Rule: "Do Not Use Single-Action Controllers for CRUD Operations"
- `05-rules.md` Rule: "Register Single-Action Controllers by Class Only"
- `05-rules.md` Rule: "Use Constructor Injection in Single-Action Controllers"
- `05-rules.md` Rule: "Keep Single-Action Controllers Free of Custom Traits"

## Related Skills

- "Design and Implement Controller Architecture" — general controller patterns
- "Extract Non-CRUD Operations from a Resource Controller" — common source of single-action controllers
- "Convert a Closure Route to a Single-Action Controller" — migration from Closures

## Success Criteria

- Controller has exactly one public `__invoke()` method
- Route is registered with only the class name
- `__invoke()` is under 15 lines with validate-delegate-return pattern
- Controller name clearly describes the operation it handles
- Appropriate middleware and FormRequest authorization are applied
- Route can be cached with `php artisan route:cache`

---

# Skill: Convert a Closure Route to a Single-Action Controller

## Purpose

Replace inline Closure route handlers with invokable controller classes to enable route caching, IDE navigation, independent testability, and maintainable code organization. Transforms ad-hoc route logic into a proper controller structure.

## When To Use

- A production route currently uses a Closure handler in a route file
- A route function has grown beyond 5 lines of logic
- The route needs to be testable via controller tests
- Running `php artisan route:cache` and getting "Unable to compile routes" for Closure-based routes

## When NOT To Use

- Trivial redirects (use `Route::redirect()`)
- Static view routes (use `Route::view()`)
- Prototyping endpoints that will be refactored before production
- Routes that are genuinely one-liners with no business logic

## Prerequisites

- Route definition with a Closure handler in `routes/web.php` or `routes/api.php`
- Understanding of the operation the Closure performs

## Inputs

- Route file and line number of the Closure route
- The Closure's HTTP verb, URI, and body

## Workflow

1. **Analyze the Closure route**

   Identify:
   - HTTP verb and URI (e.g., `Route::get('/dashboard', function () { ... })`)
   - What the Closure does (returns a view, queries data, processes input)
   - What dependencies it needs (services, facades, models)

2. **Determine the controller name**

   Use the `{Verb}{Resource}Controller` format based on what the route does:
   - `/dashboard` → `DashboardController`
   - `/search` → `SearchController`
   - `/contact` → `ContactFormController`
   - `/posts/{post}/publish` → `PublishPostController`

3. **Generate the invokable controller**

   ```bash
   php artisan make:controller DashboardController --invokable
   ```
   
   Or create the file manually at `app/Http/Controllers/DashboardController.php`.

4. **Move the Closure logic into `__invoke()`**

   a. If the Closure uses facades or helpers, refactor them to use dependency injection:
      ```php
      // Before (Closure)
      Route::get('/dashboard', function () {
          $stats = DashboardService::getStats();
          return view('dashboard', compact('stats'));
      });
      
      // After (controller)
      class DashboardController
      {
          public function __construct(
              private readonly DashboardService $service,
          ) {}
      
          public function __invoke(): View
          {
              return view('dashboard', [
                  'stats' => $this->service->getStats(),
              ]);
          }
      }
      ```
   
   b. If the Closure handles input, add FormRequest to the `__invoke()` signature.
   
   c. If the Closure accesses route parameters, add route model binding.

5. **Replace the route registration**

   ```php
   // Before
   Route::get('/dashboard', function () {
       // ...
   });
   
   // After
   Route::get('/dashboard', DashboardController::class);
   ```

6. **Test the converted controller**

   a. Hit the route and verify the response matches the original.
   
   b. Run `php artisan route:cache` to confirm the controller is cacheable.

## Validation Checklist

- [ ] The Closure is completely removed from the route file
- [ ] The new controller follows all single-action controller rules
- [ ] `php artisan route:list` shows the new controller for the route
- [ ] `php artisan route:cache` succeeds (Closure routes cause this to fail)
- [ ] The response matches the original Closure's response
- [ ] Any facades used in the Closure are replaced with injected dependencies
- [ ] Route model binding is used for route parameters

## Common Failures

- **Leftover facades in the controller**: The controller still uses `Cache::`, `DB::`, or `User::` directly instead of injected dependencies. Prevention: replace facades with injected services during conversion.
- **Missing middleware**: The Closure route relied on route-group middleware, but the new controller's middleware isn't explicitly declared. Prevention: check `php artisan route:list` and add `$this->middleware()` if needed.
- **Partial conversion**: Leaving a Closure in the file while adding a controller for a similar route nearby. Prevention: convert all Closure routes in one pass.

## Decision Points

- **Facade replacement strategy**: If the facade is used for a framework feature (Cache, Log) → inject the framework contract. If it's a helper facade specific to the app → inject the underlying service class.
- **Keeping `$request->validate()` vs. creating a FormRequest**: If validation is a single rule → `$request->validate()` may be temporarily acceptable. If multiple rules → create a FormRequest.

## Performance Considerations

- The converted route is now cacheable via `php artisan route:cache` — this is the primary performance benefit.
- Controller resolution adds ~1ms vs. a Closure — negligible for production applications.
- The real performance gain is that all routes can now be cached, eliminating route parsing on every request.

## Security Considerations

- Verify middleware is applied correctly — Closure routes often rely on route-group middleware that may not be obvious.
- If the Closure used inline authorization (e.g., `if (auth()->user()->isAdmin())`), move it to FormRequest `authorize()` or middleware.
- The converted controller is IDE-resolvable and testable — both improve security through auditability.

## Related Rules

- `05-rules.md` Rule: "Prefer Single-Action Controllers Over Closure Routes"
- `05-rules.md` Rule: "Register Single-Action Controllers by Class Only"

## Related Skills

- "Create a Single-Action Controller for a Non-CRUD Operation" — full workflow for creating invokable controllers
- "Write Feature Tests for Controller Actions" — testing the converted controller

## Success Criteria

- The Closure is removed from the route file
- The new invokable controller handles the route with proper DI
- `php artisan route:cache` succeeds
- The response behavior is identical to the original Closure
- The controller is testable with standard feature tests
