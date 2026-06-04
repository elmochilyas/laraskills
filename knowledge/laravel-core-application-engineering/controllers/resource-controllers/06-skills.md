# Skill: Create a Resource Controller for CRUD Operations

## Purpose

Generate and implement a resource controller with the 7 standard actions (or 5 for API) that follows RESTful conventions and Laravel's resource routing pattern. Enforces a predictable, documented structure across the application so every developer knows exactly which method handles which operation.

## When To Use

- Creating a CRUD controller for any resource (User, Post, Product, Order)
- Creating an API endpoint for a resource that needs index, store, show, update, destroy
- Standardizing controller structure across a team

## When NOT To Use

- Non-CRUD operations (publish, approve, archive) — use single-action controllers
- Read-only resources with no create/update/delete — use `->only(['index', 'show'])` or a plain controller
- Resources with a single operation (dashboard, contact form) — use single-action controllers
- Simple redirect routes or static pages — use `Route::redirect()` or `Route::view()`

## Prerequisites

- Route definition decided (web or API)
- Resource name and URI pattern determined
- Model exists (if using route model binding)
- FormRequest classes ready for store and update validation
- Service or action class ready for business logic delegation

## Inputs

- Resource name (singular: `Post`, `User`, `Order`)
- Route registration type: `Route::resource()` or `Route::apiResource()`
- Model class name for route model binding
- FormRequest class names for store and update
- Service class name for business logic delegation

## Workflow

1. **Generate the resource controller with Artisan**

   a. For web resource (full CRUD with HTML forms):
      ```bash
      php artisan make:controller PostController --resource
      ```
   
   b. For API resource (no create/edit methods):
      ```bash
      php artisan make:controller Api/PostController --api
      ```
   
   c. For subdirectory placement:
      ```bash
      php artisan make:controller Admin/PostController --resource
      php artisan make:controller Api/V1/PostController --api
      ```

2. **Verify the generated method signatures**

   Confirm the correct methods were generated:
   - `--resource`: index, create, store, show, edit, update, destroy
   - `--api`: index, store, show, update, destroy

3. **Add constructor dependencies**

   Inject the service used by multiple methods:
   ```php
   public function __construct(
       private readonly PostService $service,
   ) {}
   ```

4. **Implement each CRUD action following the validate-delegate-return pattern**

   a. **index()** — list resources:
      ```php
      public function index(): View
      {
          return view('posts.index', ['posts' => $this->service->list()]);
      }
      ```
   
   b. **create()** — return the creation form (web only):
      ```php
      public function create(): View
      {
          return view('posts.create');
      }
      ```
   
   c. **store()** — validate and create:
      ```php
      public function store(StorePostRequest $request): RedirectResponse
      {
          $this->service->create($request->validated());
          return redirect()->route('posts.index');
      }
      ```
   
   d. **show()** — display a single resource:
      ```php
      public function show(Post $post): View
      {
          return view('posts.show', ['post' => $post]);
      }
      ```
   
   e. **edit()** — return the edit form (web only):
      ```php
      public function edit(Post $post): View
      {
          return view('posts.edit', ['post' => $post]);
      }
      ```
   
   f. **update()** — validate and update:
      ```php
      public function update(UpdatePostRequest $request, Post $post): RedirectResponse
      {
          $post->update($request->validated());
          return redirect()->route('posts.index');
      }
      ```
   
   g. **destroy()** — delete the resource:
      ```php
      public function destroy(Post $post): RedirectResponse
      {
          $this->service->delete($post);
          return redirect()->route('posts.index');
      }
      ```

5. **Register the resource routes**

   ```php
   Route::resource('posts', PostController::class);
   // or for API:
   Route::apiResource('posts', PostController::class);
   ```

   For limited routes:
   ```php
   Route::resource('posts', PostController::class)->only(['index', 'show']);
   Route::apiResource('posts', PostController::class)->except(['destroy']);
   ```

6. **Add middleware protection**

   In the controller constructor, add method-scoped middleware:
   ```php
   public function __construct()
   {
       $this->middleware('auth')->except(['index', 'show']);
       $this->middleware('admin')->only(['destroy']);
   }
   ```

7. **Verify routes are registered**

   Run `php artisan route:list` and confirm all expected routes exist with correct methods and URIs.

## Validation Checklist

- [ ] Controller generated via Artisan (`--resource` or `--api`), not manually
- [ ] All 7 methods (resource) or 5 methods (api) are implemented
- [ ] Every method body is under 10 lines following validate-delegate-return
- [ ] `store()` and `update()` use dedicated FormRequest type-hints
- [ ] `show()`, `edit()`, `update()`, `destroy()` use route model binding
- [ ] `create()` and `edit()` (web) return only a view with no business logic
- [ ] No non-standard methods (publish, archive) exist in the resource controller
- [ ] Routes registered with `Route::resource()` or `Route::apiResource()`
- [ ] Middleware is applied with `->only()` or `->except()` scoping
- [ ] `php artisan route:list` shows all expected routes

## Common Failures

- **Adding non-CRUD methods to the resource controller**: Adding `publish()` or `archive()` alongside the 7 standard methods. Prevention: create a separate single-action controller for non-CRUD operations.
- **Using `--resource` for API endpoints**: Generates `create()` and `edit()` methods that are never used. Prevention: use `--api` for API controllers.
- **Missing FormRequest in store/update**: Using `$request->validate()` or `Request` type-hint instead of a dedicated FormRequest. Prevention: always create and use FormRequest classes.
- **Non-standard method names**: Naming methods `list()`, `add()`, `view()`, `change()` instead of the standard 7. Prevention: always use the standard resource method names.
- **Manual model resolution**: Using `Post::findOrFail($id)` instead of route model binding. Prevention: type-hint the model in the method signature.

## Decision Points

- **`--resource` vs. `--api`**: If the resource serves HTML forms (web) → `--resource`. If it serves JSON (API) → `--api`.
- **`Route::resource()` vs. `Route::apiResource()`**: Same as above. `apiResource` omits the `create` and `edit` routes.
- **Route model binding parameter name**: The default parameter name is the singular form of the resource name (`posts` → `post`). Customize with `Route::resource('posts', ...)->parameters(['posts' => 'article'])`.

## Performance Considerations

- Resource controllers add no overhead vs. plain controllers — the 7 standard methods are resolved identically.
- Route model binding eliminates manual `findOrFail()` queries.
- `create()` and `edit()` in API controllers are dead routes — remove them with `--api` to avoid confusion.

## Security Considerations

- Add `auth` middleware with `->except(['index', 'show'])` to protect write operations while keeping reads public.
- Use FormRequest `authorize()` for model-specific authorization (can the user update this post?).
- Use `admin` middleware with `->only(['destroy'])` for elevated operations.
- Route model binding provides automatic 404 for missing resources.

## Related Rules

- `05-rules.md` Rule: "Use Resource Controllers for All CRUD Operations"
- `05-rules.md` Rule: "Use apiResource for API Endpoints"
- `05-rules.md` Rule: "Generate Resource Controllers via Artisan"
- `05-rules.md` Rule: "Keep Each Resource Action Under 10 Lines"
- `05-rules.md` Rule: "Do Not Add Non-Resource Actions to Resource Controllers"
- `05-rules.md` Rule: "Use Form Requests for Store and Update Validation"
- `05-rules.md` Rule: "Use Route Model Binding in Show, Edit, Update, Destroy"
- `05-rules.md` Rule: "Avoid Resource Controllers for Non-CRUD Resources"
- `05-rules.md` Rule: "Keep the Create/Edit Methods Minimal in Web Resources"

## Related Skills

- "Design and Implement Controller Architecture" — foundation for resource controllers
- "Apply Middleware to Controller Actions" — protecting resource controller actions
- "Apply Dependency Injection to Controllers" — dependency injection for services
- "Write Feature Tests for Controller Actions" — testing every action

## Success Criteria

- Resource controller is generated via Artisan with correct method stubs
- Every method follows validate-delegate-return in under 10 lines
- `store()` and `update()` use dedicated FormRequest type-hints
- `show()`, `edit()`, `update()`, `destroy()` use route model binding
- No non-CRUD methods exist in the controller
- Routes are registered with `Route::resource()` or `Route::apiResource()`
- `php artisan route:list` shows the correct route table
- All 7 (web) or 5 (API) actions are implemented and testable

---

# Skill: Extract Non-CRUD Operations from a Resource Controller

## Purpose

Move custom actions (publish, archive, approve, export, search) out of a resource controller into dedicated single-action controllers or plain controllers. Restores the resource controller to its predictable 7-method contract and gives each operation its own class with clear naming.

## When To Use

- A resource controller has grown to include `publish()`, `archive()`, `approve()`, or other non-standard methods
- Code review identifies non-CRUD operations mixed into a resource controller
- The resource controller exceeds 7-10 public methods
- Team members are confused about which methods exist in the resource controller

## When NOT To Use

- The operation is a standard CRUD action (index, store, show, edit, update, destroy)
- The operation is tightly coupled to the resource lifecycle and the team explicitly agrees it belongs (rare)
- The resource controller is already clean with only the standard 7 methods

## Prerequisites

- The resource controller file with non-CRUD methods
- Route definitions for the non-CRUD methods
- Understanding of the business operation being extracted

## Inputs

- Resource controller with non-CRUD methods to extract
- Route definitions that map to the non-CRUD methods
- Service/action class that the non-CRUD method delegates to

## Workflow

1. **Identify all non-CRUD methods**

   List every method that is NOT one of: index, create, store, show, edit, update, destroy. Common examples:
   - `publish(Post $post)`
   - `archive(Post $post)`
   - `approve(Post $post)`
   - `export()`
   - `search(Request $request)`
   - `import(ImportRequest $request)`

2. **For each non-CRUD method, determine if it belongs as a single-action controller**

   a. If the operation is a single, cohesive action (publish, approve, archive) → single-action controller.
   
   b. If the operation is a collection of related non-CRUD actions (reporting dashboard with multiple data endpoints) → dedicated plain controller.

3. **Create the target controller file**

   a. For single-action controllers:
      ```bash
      php artisan make:controller PublishPostController --invokable
      ```
   
   b. For plain controllers:
      ```bash
      php artisan make:controller PostReportController
      ```

4. **Move the logic to the new controller**

   a. Copy the method body from the resource controller to the new controller.
   
   b. Move the method's dependencies to the new controller's constructor or method signature.
   
   c. Remove the method from the original resource controller.

5. **Update route registrations**

   a. Add routes for the new controllers using explicit path registration:
      ```php
      // Before
      Route::resource('posts', PostController::class);
      // Plus manual route for the custom action:
      Route::post('/posts/{post}/publish', [PostController::class, 'publish']);
      
      // After
      Route::resource('posts', PostController::class);
      Route::post('/posts/{post}/publish', PublishPostController::class);
      Route::post('/posts/{post}/archive', ArchivePostController::class);
      ```

6. **Remove dead route registrations**

   If the old resource controller had manual routes for the non-CRUD methods, delete those route registrations.

7. **Run route verification**

   ```bash
   php artisan route:list
   ```
   
   Confirm:
   - The resource controller routes are unchanged (only 7 routes for full resource, 5 for API)
   - The new controller routes appear correctly

8. **Update middleware for new controllers**

   Add `$this->middleware()` calls to the new controllers as needed — they no longer inherit the resource controller's constructor middleware.

## Validation Checklist

- [ ] All non-CRUD methods are removed from the resource controller
- [ ] Resource controller has at most 7 public methods (index, create, store, show, edit, update, destroy)
- [ ] Each extracted operation has its own controller file
- [ ] Route definitions for extracted operations use the new controller classes
- [ ] New controllers have appropriate middleware (auth, admin, throttle) in their constructors
- [ ] `php artisan route:list` shows correct routes for all controllers
- [ ] All existing tests pass (update route references as needed)

## Common Failures

- **Partial extraction**: Moving one or two methods but leaving others mixed in. Prevention: extract ALL non-CRUD methods in one pass.
- **Losing middleware context**: The extracted controller doesn't inherit the resource controller's constructor middleware. Prevention: add `$this->middleware()` calls to the new controller.
- **Creating dead route registrations**: The old route file still references the old controller method. Prevention: find and update all route references to the old method pattern.
- **Over-engineering into single-action controllers**: Splitting a complex workflow into many single-action controllers when a dedicated plain controller would be simpler. Prevention: if the operations are closely related (export in multiple formats), group them in a plain controller.

## Decision Points

- **Single-action vs. plain controller for extracted methods**: If the extracted method is an atomic operation with one entry point → single-action. If it's a group of related non-CRUD operations (dashboard, reporting) → plain controller.
- **Route structure**: For operations on an existing resource, nest under the resource URI: `/posts/{post}/publish`. For standalone operations, use a top-level URI: `/search`.

## Performance Considerations

- Extracting methods does not change the request processing path — the same code executes.
- Single-action controllers are resolved by the container the same way as resource controllers — no overhead difference.

## Security Considerations

- After extraction, verify that middleware is applied correctly to the new controllers.
- The extracted controller no longer benefits from the resource controller's `$this->middleware('auth')->except(['index', 'show'])` — add appropriate middleware.
- Test authorization scenarios for the new stand-alone endpoints.

## Related Rules

- `05-rules.md` Rule: "Do Not Add Non-Resource Actions to Resource Controllers"
- `05-rules.md` Rule: "Use Single-Action Controllers for Non-CRUD Operations" (cross-reference)
- `05-rules.md` Rule: "Keep Each Resource Action Under 10 Lines"

## Related Skills

- "Create a Single-Action Controller for a Non-CRUD Operation" — creating the replacement controller
- "Organize Controllers into Directory Structure" — placing extracted controllers

## Success Criteria

- The resource controller contains only the standard 7 (web) or 5 (API) CRUD methods
- Each extracted operation has its own controller with a clear operation-based name
- Route definitions are updated to point to the new controllers
- Appropriate middleware is applied to each new controller
- `php artisan route:list` confirms all routes resolve correctly
- All tests pass with updated route references
