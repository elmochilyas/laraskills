# Skill: Design and Implement Controller Architecture

## Purpose

Establish a maintainable controller structure that enforces separation of concerns, keeps methods under 15 lines, and correctly uses Laravel's DI resolution for constructor and method injection. Reduces testing cost, improves readability, and prevents business logic from leaking into the HTTP layer.

## When To Use

- Starting a new Laravel project
- Adding a new controller to an existing project
- Refactoring a fat controller that mixes validation, business logic, and response formatting
- Establishing team standards for controller structure

## When NOT To Use

- Trivial redirect-only routes (use `Route::redirect()`)
- Static page routes (use `Route::view()`)
- Prototyping before architecture decisions are settled
- Routes handled entirely by Closure functions in route files

## Prerequisites

- Laravel service container basics
- PHP 8 promoted constructor properties syntax
- Understanding of PSR-4 autoloading and namespace conventions
- Route definition knowledge (`Route::get()`, `Route::post()`, etc.)

## Inputs

- Route definitions (which URIs and HTTP verbs map to which actions)
- Business domain boundaries (which domain each controller belongs to)
- Service/action class names (what the controller delegates to)
- FormRequest class names (what validates each action's input)
- Response type requirements (view, JSON, redirect)

## Workflow

1. **Determine the controller pattern**

   a. If the operation is CRUD for a resource → use `Route::resource()` or `Route::apiResource()` with a resource controller.
   
   b. If the operation is a single non-CRUD action (publish, approve, search) → use a single-action (invokable) controller.
   
   c. If the operation is a custom collection of related methods that do not fit CRUD → use a plain controller with named methods.

2. **Choose the directory placement**

   a. If the application has fewer than 20 controllers total → place in `app/Http/Controllers/` flat.
   
   b. If the application has 20+ controllers → place in a domain subdirectory: `app/Http/Controllers/{Domain}/`.
   
   c. If the controller serves an API → place under `app/Http/Controllers/Api/V{version}/`.

3. **Generate the controller file**

   a. Run `php artisan make:controller {path}/{ControllerName} --{resource|api|invokable}`.
   
   b. Verify the generated file exists at the correct path with the correct namespace.

4. **Declare constructor dependencies**

   a. Identify services used by multiple methods in the controller.
   
   b. Add them as `private readonly` promoted constructor properties.
   
   c. Do NOT include `Illuminate\Http\Request` (use method injection instead).
   
   d. Keep constructor dependencies to 5 or fewer.

5. **Implement each controller method following the three-step pattern**

   a. **Validate**: Type-hint a FormRequest class in the method signature.
   
   b. **Delegate**: Call `$this->{service}->{method}($request->validated())` with validated data.
   
   c. **Return**: Return an explicit response — `View`, `RedirectResponse`, `JsonResponse`, or API Resource.
   
   d. Verify the method body is under 10-15 lines total.

6. **Apply explicit return types**

   a. Declare a PHP return type on every method: `: View`, `: RedirectResponse`, `: JsonResponse`, `: UserResource`, `: UserCollection`.
   
   b. Do not rely on implicit string or array conversion for responses.

7. **Separate web and API concerns**

   a. If the controller mixes `View`/`RedirectResponse` returns with `JsonResponse` returns, split into dedicated Web and Api controllers.
   
   b. Place API controllers under `App\Http\Controllers\Api\` with their own routes.

## Validation Checklist

- [ ] Controller method bodies are each 10-15 lines maximum
- [ ] No business logic (queries, calculations, multi-step workflows) in any method
- [ ] Every store/update action type-hints a FormRequest, not `Request`
- [ ] Each method returns an explicit response type
- [ ] Constructor uses `private readonly` promoted properties for dependencies
- [ ] No `Illuminate\Http\Request` injected via constructor
- [ ] Controller does not import Model, DB, or Query Builder classes
- [ ] Web and API controllers are separated if both response types exist
- [ ] Controller has at most 5 constructor-injected dependencies
- [ ] No `app()->make()`, `resolve()`, or `App::make()` in any method

## Common Failures

- **Business logic in controllers**: Occurs because the controller is the first code reached. Prevention: enforce via architecture tests that ban Model/DB imports.
- **Fat methods exceeding 15 lines**: Occurs because concerns are not extracted. Prevention: require a reason comment for any method over 15 lines during code review.
- **Inline validation instead of FormRequest**: Occurs because creating FormRequest files seems like extra work. Prevention: ban `$request->validate()` via CI linting; require FormRequest for every store/update.
- **Missing explicit return types**: Occurs because PHP allows dynamic returns. Prevention: configure PHPStan or Psalm at level 5+ to require return types.

## Decision Points

- **Resource vs. single-action vs. plain controller**: If the endpoint maps to one of the 7 CRUD actions → resource. If it is a single non-CRUD operation → single-action. If it groups several related non-CRUD operations → plain.
- **Constructor injection vs. method injection**: If a dependency is used by 2+ methods → constructor. If used by only one method → method. If it is a FormRequest or Request → always method.
- **Flat vs. domain directory**: Count current controllers. Under 20 → flat. 20+ → domain subdirectories.

## Performance Considerations

- Controller resolution adds ~1-3ms overhead for typical dependency graphs.
- A new controller instance is created per request (not singleton).
- Method injection adds minimal reflection overhead via `Container::call()`.
- Constructor injection is more efficient than per-method `app()->make()` calls (resolved once per request vs. per method).

## Security Considerations

- Never trust `$request->all()` directly — always use `$request->validated()` from FormRequests.
- Never inject `Request` in the constructor — it captures request state at construction time, which may be stale or null.
- Authorization belongs in FormRequest `authorize()` or Policies — not in controller methods.

## Related Rules

- `05-rules.md` Rule: "Enforce Maximum Controller Method Length" (10-15 lines)
- `05-rules.md` Rule: "Delegate All Business Logic to Services or Actions"
- `05-rules.md` Rule: "Use FormRequest Classes for All Validation"
- `05-rules.md` Rule: "Return Explicit Response Types"
- `05-rules.md` Rule: "Separate Web and API Controllers"
- `05-rules.md` Rule: "Avoid God Controllers" (max 7-10 public methods)
- `05-rules.md` Rule: "Follow the Three-Step Controller Flow"
- `05-rules.md` Rule: "Use Constructor Promotion for Injected Dependencies"

## Related Skills

- "Apply Dependency Injection to Controllers" — detailed DI decision workflow
- "Organize Controllers into Directory Structure" — directory placement decisions
- "Create a Resource Controller for CRUD Operations" — resource controller specifics
- "Create a Single-Action Controller for a Non-CRUD Operation" — invokable controller specifics
- "Refactor a Fat Controller into a Thin Controller" — migration workflow

## Success Criteria

- Every controller method fits the validate-delegate-return pattern in under 15 lines
- All dependencies are injected via constructor (shared) or method (request-specific)
- No Model, DB, or business logic imports exist in the controller file
- FormRequest classes handle all validation and authorization
- Web controllers return `View`/`RedirectResponse`; API controllers return JSON/Resources
- `php artisan route:list` shows all routes registered to the correct controller methods

---

# Skill: Refactor a Fat Controller into a Thin Controller

## Purpose

Transform a controller that contains business logic, inline queries, and response formatting into one that delegates each concern to its proper layer. Improves testability, reusability of business logic, and maintainability of the HTTP layer.

## When To Use

- A controller method exceeds 15 lines
- A controller imports Model, DB, or Query Builder classes
- A controller uses `$request->validate()` instead of FormRequest
- A controller constructs JSON arrays or formats collections inline
- Business logic needs to be reused from CLI, queue, or webhook entry points

## When NOT To Use

- The logic is trivial (a single redirect or static view)
- The controller is already following the thin pattern
- The business logic is already extracted but the controller still imports models for route model binding type hints only

## Prerequisites

- Existing service classes or action classes to delegate to (create them if they don't exist)
- FormRequest classes for each store/update action (create them if they don't exist)
- API Resource classes if JSON responses need formatting (create them if they don't exist)

## Inputs

- The fat controller file to refactor
- List of business operations currently in the controller
- Existing route definitions for the controller

## Workflow

1. **Analyze the controller for violations**

   a. Read every method and identify code that belongs elsewhere:
      - Inline validation → belongs in FormRequest
      - Eloquent queries → belongs in Service/Action
      - Calculations and workflows → belongs in Service/Action
      - JSON array construction → belongs in API Resource
      - Authorization checks → belongs in FormRequest `authorize()` or Policy
      - Logging, events, side effects → belongs in Service/Action

   b. Count the number of violations per method. If a method has 3+ concerns (validation + logic + formatting), flag it for full extraction.

2. **Create FormRequest classes**

   a. For every `$request->validate()` call, run `php artisan make:request {ActionName}Request`.
   
   b. Move validation rules to the `rules()` method.
   
   c. If inline authorization exists (`if (auth()->user()->isAdmin())`), move it to the `authorize()` method.

3. **Create Service or Action classes**

   a. For each distinct business operation, create a service class (`php artisan make:class Services/{Domain}/{Operation}Service`) or action class.
   
   b. Move database queries, calculations, and multi-step workflows into the service class methods.
   
   c. Move side effects (events, notifications, logging) into the service class.

4. **Create API Resource classes for JSON formatting**

   a. For each inline JSON array construction, run `php artisan make:resource {Name}Resource` or `php artisan make:resource {Name}Collection`.
   
   b. Move the array transformation logic into the `toArray()` method of the Resource.

5. **Refactor each controller method**

   a. Replace `$request->validate()` with the FormRequest type-hint in the method signature.
   
   b. Replace inline Eloquent queries with service method calls using `$this->{service}->{method}()`.
   
   c. Replace inline JSON arrays with `new {Name}Resource($data)` or `new {Name}Collection($data)`.
   
   d. Replace inline authorization with FormRequest `authorize()`.
   
   e. Verify each method now follows validate → delegate → return in under 10 lines.

6. **Clean up imports**

   a. Remove all `use App\Models\*`, `use Illuminate\Support\Facades\DB`, and similar data-layer imports.
   
   b. Replace with imports for FormRequests, Services, API Resources, and Response types.

7. **Verify no regressions**

   a. Run `php artisan route:list` to confirm routes still resolve.
   
   b. Run the existing test suite to confirm no behavioral changes.
   
   c. If no tests exist, manually test each endpoint.

## Validation Checklist

- [ ] Every removed inline query has a corresponding service method
- [ ] Every removed inline validation has a corresponding FormRequest
- [ ] Every removed inline JSON array has a corresponding API Resource
- [ ] Controller no longer imports Model or DB classes
- [ ] Each controller method is under 10-15 lines
- [ ] All tests pass (or new tests verify the refactored behavior)
- [ ] Business logic is now unit-testable without HTTP bootstrapping

## Common Failures

- **Partial extraction**: Extracting queries but leaving formatting in the controller, or vice versa. Prevention: enforce "all or nothing" — if a method had violations in two areas, extract both.
- **Leaving dead imports**: Removing the query but forgetting to remove the Model import. Prevention: review the import block after refactoring and remove unused imports.
- **Breaking route model binding**: Accidentally changing method signatures that use route model binding. Prevention: keep `$param` parameter names matching the route parameter names.

## Decision Points

- **Service vs. Action class**: If the operation is a single cohesive workflow (publish post, import users) → action class. If the operation is part of a group of related operations (UserService with list, create, update) → service class.
- **FormRequest per action vs. shared**: If store and update have different validation rules → separate FormRequests. If they share most rules → a shared FormRequest with conditional rules.

## Performance Considerations

- No performance regression — extraction adds one additional method call, which is negligible.
- Improvement: services can implement caching that is available across all entry points (HTTP, CLI, queue).

## Security Considerations

- Authorization that was inline in the controller must be moved to FormRequest `authorize()` or Policy classes.
- After refactoring, test each endpoint's authorization: guest, unauthorized, and authorized scenarios.

## Related Rules

- `05-rules.md` Rule: "Never Write Database Queries in Controllers"
- `05-rules.md` Rule: "Never Format Responses Inline in Controllers"
- `05-rules.md` Rule: "Delegate All Business Logic to Services or Actions"
- `05-rules.md` Rule: "Keep Controller Methods Under 10 Lines"
- `05-rules.md` Rule: "Use FormRequest for Every Store and Update Action"
- `05-rules.md` Rule: "Limit Controller Imports to HTTP-Layer Concerns"
- `05-rules.md` Rule: "Ban Eloquent Model and DB Imports in Controllers via Architecture Tests"

## Related Skills

- "Design and Implement Controller Architecture" — foundation for thin controllers
- "Apply Dependency Injection to Controllers" — DI patterns for extracted services
- "Write Feature Tests for Controller Actions" — testing after refactoring

## Success Criteria

- The refactored controller has zero Model, DB, or business logic imports
- Every controller method is under 10-15 lines
- All business logic is extractable and unit-testable via service/action tests
- All store/update actions use FormRequests
- All JSON responses use API Resources
- The test suite passes without modification (or with minimal addition for new FormRequests/services)
