# Skill: Apply Dependency Injection to Controllers

## Purpose

Correctly apply constructor and method injection in controllers to resolve service dependencies and FormRequests. Ensures shared services are injected once (constructor), request-specific dependencies are injected per-method (method injection), and the `Request` object is never captured at construction time. Prevents hidden service locator calls and stale request state.

## When To Use

- Creating a new controller that needs services, FormRequests, or Request access
- Refactoring a controller that uses `app()->make()` or `resolve()` for dependency resolution
- Reviewing a controller with unused or incorrectly injected dependencies
- A controller method needs access to the HTTP request, route model binding, or FormRequest validation

## When NOT To Use

- A controller has no dependencies (empty constructor, no method parameters) — skip injection
- A controller extending a framework base class that requires specific constructor patterns — follow the parent contract
- Testing scenarios where manual dependency resolution is needed (but prefer container resolution)

## Prerequisites

- Understanding of Laravel's service container resolution
- Service classes exist (or will be created) for business logic delegation
- FormRequest classes exist (or will be created) for input validation
- Routes are defined to match the method signatures

## Inputs

- Controller class (new or existing)
- List of service classes the controller needs (by method)
- List of FormRequest classes needed (by action)
- Whether `Illuminate\Http\Request` access is needed in any method

## Workflow

1. **Classify each dependency by scope**

   Create a table of the controller's dependencies:
   | Dependency | Used by methods | Scope |
   |---|---|---|
   | `UserService` | index, store, show, update | Shared (constructor) |
   | `Logger` | index, store | Shared (constructor) |
   | `StoreUserRequest` | store only | Method |
   | `UpdateUserRequest` | update only | Method |
   | `Illuminate\Http\Request` | index (filters) | Method |
   | `User` (route binding) | show, update, destroy | Method |

2. **Inject shared dependencies via the constructor**

   a. Dependencies used by 2+ methods → constructor injection.
   
   b. Use PHP 8 promoted constructor properties with `private readonly`:
      ```php
      public function __construct(
          private readonly UserService $service,
          private readonly Logger $logger,
      ) {}
      ```
   
   c. Keep total constructor dependencies at 5 or fewer.
   
   d. Do NOT inject `Illuminate\Http\Request` in the constructor.

3. **Inject method-scoped dependencies in the method signature**

   a. FormRequests for store/update actions:
      ```php
      public function store(StoreUserRequest $request): RedirectResponse
      public function update(UpdateUserRequest $request, User $user): RedirectResponse
      ```
   
   b. Services used by only one method:
      ```php
      public function export(ExportRequest $request, UserExportService $service): JsonResponse
      ```
   
   c. Route model binding for model resolution:
      ```php
      public function show(User $user): View
      public function update(UpdateUserRequest $request, User $user): RedirectResponse
      ```
   
   d. `Illuminate\Http\Request` for query string access:
      ```php
      public function index(Request $request): View
      ```

4. **Verify the resolution order works correctly**

   When multiple parameters exist in a method signature, the framework resolves in this order:
   - Route parameters (named parameters matching the URI segment)
   - Request instances (FormRequest or Request)
   - Type-hinted services (resolved from the container)

   Parameters can be in any order — the framework resolves by type-hint and parameter name.

5. **Remove service locator calls**

   Search the controller for `app()->make()`, `resolve()`, `App::make()`, or `app()` calls. Replace each with proper injection:
   
   - If the resolved dependency is used by multiple methods → constructor injection
   - If used by one method → method injection

6. **Remove unused imports**

   After refactoring, remove any `use` imports for classes that are no longer manually resolved.

## Validation Checklist

- [ ] `Illuminate\Http\Request` is NOT injected in the constructor (method injection only)
- [ ] Shared dependencies (used by 2+ methods) use constructor injection with `private readonly`
- [ ] FormRequests are injected in method signatures, never in the constructor
- [ ] Route model binding is used for model resolution (no `Model::findOrFail()`)
- [ ] Single-method services use method injection, not constructor injection
- [ ] No `app()->make()`, `resolve()`, or `App::make()` calls in any method
- [ ] Constructor has 5 or fewer dependencies
- [ ] All injected dependencies are actually used (no unused constructor parameters)
- [ ] Uses `private readonly` promoted properties (PHP 8+)

## Common Failures

- **Request in constructor**: `Request` injected in `__construct()` captures state at resolution time, which may be stale. Prevention: always use method injection for Request.
- **FormRequest in constructor**: Injecting `StoreUserRequest` in the constructor causes validation to run at the wrong time. Prevention: always inject FormRequests in the method signature.
- **Unused constructor dependencies**: Injecting services that only one method uses increases resolution cost for all methods. Prevention: use method injection for single-method dependencies.
- **Service locator pattern**: Using `app()->make()` hides dependencies and prevents mocking. Prevention: always declare dependencies in the constructor or method signature.
- **Constructor bloat (6+ dependencies)**: Indicates the controller is doing too much. Prevention: extract related operations to dedicated service classes.

## Decision Points

- **Constructor vs. method injection**: If used by 2+ methods → constructor. If used by 1 method → method. If it's a FormRequest → always method.
- **Service vs. Action injection**: If the service is used across multiple endpoints → constructor. If the action is a single-use, single-method operation → method injection.
- **Route model binding vs. manual query**: If the route parameter name matches the model variable name → route model binding (method injection). If the parameter uses a custom column → explicit binding in `RouteServiceProvider`.

## Performance Considerations

- Constructor injection: resolves dependencies once per request, available to all methods.
- Method injection: resolves dependencies per-method call via `Container::call()` — adds minimal reflection overhead.
- Service locator (`app()->make()`): same resolution cost as method injection but hidden from the class signature.
- Controllers are NOT singletons — a new instance (with full constructor resolution) is created per request.
- Constructor bloat (5+ dependencies) increases resolution time per request, even for methods that don't use most dependencies.

## Security Considerations

- Never inject `Request` in the constructor — the authenticated user may not be available at construction time (middleware hasn't run yet).
- FormRequest `authorize()` runs before the method body — constructor injection of FormRequest bypasses this security check.
- Route model binding automatically returns 404 for missing models — manual `findOrFail()` is more error-prone.

## Related Rules

- `05-rules.md` Rule: "Use Constructor Injection for Shared Service Dependencies"
- `05-rules.md` Rule: "Use Method Injection for Form Requests"
- `05-rules.md` Rule: "Never Inject Request in Controller Constructors"
- `05-rules.md` Rule: "Use Method Injection for Single-Method Dependencies"
- `05-rules.md` Rule: "Avoid Service Locator Calls in Controller Methods"
- `05-rules.md` Rule: "Limit Constructor Dependencies to a Reasonable Count"
- `05-rules.md` Rule: "Always Type-Hint FormRequest Instead of Request"
- `05-rules.md` Rule: "Use Method Injection for Route Model Binding"

## Related Skills

- "Design and Implement Controller Architecture" — overall controller structure
- "Refactor a Fat Controller into a Thin Controller" — extraction workflow
- "Write Feature Tests for Controller Actions" — testing injected dependencies

## Success Criteria

- All dependencies are visible in the constructor signature (shared) or method signature (request-specific)
- No `app()->make()`, `resolve()`, or `App::make()` calls exist in controller methods
- `Illuminate\Http\Request` is never injected via constructor
- All FormRequests are injected in method signatures only
- Route model binding resolves all model dependencies
- Constructor has 5 or fewer `private readonly` promoted properties

---

# Skill: Refactor Away Service Locator Calls in Controllers

## Purpose

Replace hidden `app()->make()`, `resolve()`, and `App::make()` calls in controller methods with explicit constructor or method injection. Makes dependencies visible in the class or method signature, enables mocking in tests, and follows Laravel's intended DI pattern.

## When To Use

- A controller method uses `app()->make()` or `resolve()` to obtain a service
- Adding tests to a controller that uses service locator calls (mocking is impossible without refactoring)
- During a code review that flags hidden dependencies

## When NOT To Use

- When conditionally resolving a strategy based on runtime configuration (e.g., `app(FileStorage::class)` vs `app(S3Storage::class)`) — wrap behind a factory class
- When the resolved dependency has a genuinely dynamic class that cannot be known at compile time

## Prerequisites

- The controller file containing the service locator calls
- Knowledge of which classes are resolved and which methods use them

## Inputs

- Controller file with `app()->make()`, `resolve()`, or `App::make()` calls
- List of each locator call and the method it appears in

## Workflow

1. **Find all service locator calls**

   Search the controller for these patterns:
   ```bash
   grep -n 'app()->make\|app(\|resolve(\|App::make(' app/Http/Controllers/UserController.php
   ```

2. **Categorize each call by usage scope**

   For each locator call, determine:
   - Which class is resolved
   - Which method(s) it appears in
   - Whether it's used in multiple methods or just one

3. **Replace shared-dependency locator calls with constructor injection**

   a. If the resolved class is used in 2+ methods:
      ```php
      // Before
      public function index(): View
      {
          $service = app(UserService::class);
          return view('users.index', ['users' => $service->list()]);
      }
      
      public function show(User $user): View
      {
          $service = app(UserService::class);
          return view('users.show', ['user' => $service->find($user->id)]);
      }
      
      // After
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
      ```

4. **Replace single-method locator calls with method injection**

   a. If the resolved class is used in only one method:
      ```php
      // Before
      public function export(): JsonResponse
      {
          $service = app(UserExportService::class);
          return $service->export();
      }
      
      // After
      public function export(ExportRequest $request, UserExportService $service): JsonResponse
      {
          return $service->export();
      }
      ```

5. **Handle dynamic resolution with a factory pattern**

   If a locator call resolves different implementations based on runtime conditions, extract the logic to a factory class and inject the factory:
   ```php
   // Before
   public function store(Request $request): RedirectResponse
   {
       $storage = $request->input('storage_type') === 's3'
           ? app(S3Storage::class)
           : app(LocalStorage::class);
       $storage->store($request->file('upload'));
   }
   
   // After
   public function __construct(
       private readonly StorageFactory $storage,
   ) {}
   
   public function store(UploadRequest $request): RedirectResponse
   {
       $this->storage->forRequest($request)->store($request->file('upload'));
   }
   ```

6. **Verify no locator calls remain**

   Re-run the search to confirm all locator calls are removed.

## Validation Checklist

- [ ] No `app()->make()` calls remain in the controller
- [ ] No `resolve()` or `App::make()` calls remain
- [ ] No bare `app(ClassName::class)` calls remain
- [ ] All refactored dependencies are visible in constructor or method signatures
- [ ] Tests can now mock the dependencies without changing controller code
- [ ] All existing tests pass after the refactoring

## Common Failures

- **Missing a locator call in an error path**: The refactoring covers the happy path but misses the exception handler. Prevention: search every method body, including catch blocks.
- **Leaving a locator call because "it's dynamic"**: Even dynamic resolution should be encapsulated behind a factory with an injected contract. Prevention: extract to a factory or strategy pattern.
- **Introducing constructor bloat**: Refactoring every locator call to constructor injection, even for single-method dependencies. Prevention: use method injection for single-method dependencies.

## Decision Points

- **Constructor injection vs. method injection for the refactored dependency**: If the dependency was resolved in multiple methods → constructor. If in only one method → method.
- **Factory vs. method injection for dynamic dependencies**: If the class varies by runtime conditions → factory pattern with constructor injection. If the class is always the same → method or constructor injection.

## Performance Considerations

- Constructor injection resolves once per request. Method injection adds per-call resolution overhead via `Container::call()`. Both are more efficient than repeated `app()->make()` calls in a single method's loop.
- Removing locator calls has negligible performance impact but significant maintainability benefit.

## Security Considerations

- Locator calls bypass constructor constraints — they can resolve services that weren't audited for the controller's context.
- After refactoring, verify that the controller's security posture hasn't changed (same authorization, same validation).

## Related Rules

- `05-rules.md` Rule: "Avoid Service Locator Calls in Controller Methods"
- `05-rules.md` Rule: "Use Constructor Injection for Shared Service Dependencies"
- `05-rules.md` Rule: "Use Method Injection for Single-Method Dependencies"

## Related Skills

- "Apply Dependency Injection to Controllers" — the correct pattern to apply

## Success Criteria

- Zero `app()->make()`, `resolve()`, or `App::make()` calls remain in the controller
- All dependencies are declared via constructor injection (shared) or method injection (per-method)
- All existing tests pass without modification
- Dynamic dependencies are encapsulated behind a factory or strategy class
