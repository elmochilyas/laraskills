# Skill: Refactor a Fat Controller into a Thin Controller

## Purpose

Transform a controller that contains database queries, business logic, inline validation, response formatting, and orchestration into one that follows the three-step pattern (validate, delegate, return) with every concern extracted to its proper layer. Produces a controller that is testable without HTTP bootstrapping, readable at a glance, and maintainable because each concern lives in its dedicated class.

## When To Use

- A controller method exceeds 10 lines of executable code
- A controller imports Model, DB, or Query Builder classes directly
- A controller uses `$request->validate()` instead of FormRequest
- A controller constructs JSON arrays or formats response data inline
- A controller calls multiple services, manages transactions, or dispatches events in the method body
- A controller performs authorization checks inline (`if (auth()->user()->isAdmin())`)
- A controller mixes multiple responsibilities in a single method

## When NOT To Use

- Trivial redirect routes (handled by `Route::redirect()`)
- Static page routes (handled by `Route::view()`)
- Prototype code that will be rewritten before production
- A controller that already follows the thin pattern correctly

## Prerequisites

- PHP 8+ with promoted constructor properties support
- Service layer or action classes exist (or will be created) for business logic
- FormRequest classes exist (or will be created) for validation
- API Resource classes exist (or will be created) for response formatting
- Understanding of the current controller's responsibilities

## Inputs

- The fat controller file to refactor
- List of every method in the controller
- For each method: what validation it performs, what queries it runs, what logic it contains, what response it returns

## Workflow

1. **Analyze every method for violations**

   For each method, identify code that violates thin controller principles:

   a. **Inline validation** — `$request->validate([...])` → extract to FormRequest.
   
   b. **Database queries** — `User::where(...)`, `DB::table(...)`, `Model::query()` → extract to Service.
   
   c. **Business logic** — calculations, conditional workflows, multi-step processes → extract to Service.
   
   d. **Inline response formatting** — array construction for JSON, collection mapping → extract to API Resource.
   
   e. **Orchestration** — multiple service calls, transaction management, event dispatching, notifications → extract to Service.
   
   f. **Inline authorization** — `if (auth()->user()->isAdmin())`, `Gate::allows()`, `$user->can()` → move to FormRequest `authorize()` or Policy.

2. **Extract validation to FormRequest classes**

   a. For every `$request->validate()` call, run:
      ```bash
      php artisan make:request StorePostRequest
      php artisan make:request UpdatePostRequest
      ```
   
   b. Move validation rules to the `rules()` method.
   
   c. Move inline authorization checks to the `authorize()` method.
   
   d. Replace the controller method's `$request->validate()` with the FormRequest type-hint.

3. **Extract database queries and business logic to Service classes**

   a. Create a service class for the controller's domain:
      ```bash
      php artisan make:class Services/PostService
      ```
   
   b. Move each inline query to a named method on the service:
      ```php
      // Controller before
      $users = User::where('active', true)
          ->with('posts')
          ->paginate(20);
      
      // Service method
      public function listActive(array $filters = []): LengthAwarePaginator
      {
          return User::where('active', true)
              ->with('posts')
              ->paginate(20);
      }
      ```
   
   c. Move business logic calculations and multi-step workflows to service methods.
   
   d. Move orchestration (transaction management, event dispatching, notification sending) to service methods.

4. **Extract response formatting to API Resources**

   a. For each inline JSON array construction, create a Resource:
      ```bash
      php artisan make:resource UserResource
      php artisan make:resource UserCollection
      ```
   
   b. Move the transformation logic to the `toArray()` method.
   
   c. Replace inline formatting with `new UserResource($user)` or `new UserCollection($users)`.

5. **Inject the service dependency**

   Replace `app()->make()` calls and facades with constructor injection:
   ```php
   public function __construct(
       private readonly PostService $service,
   ) {}
   ```

6. **Rewrite each controller method**

   Each method should now follow the three-step pattern:
   ```php
   // Before (fat)
   public function store(Request $request): JsonResponse
   {
       $validated = $request->validate([
           'title' => 'required|string|max:255',
           'body' => 'required|string',
       ]);
       
       $post = new Post();
       $post->title = $validated['title'];
       $post->body = $validated['body'];
       $post->user_id = auth()->id();
       $post->save();
       
       if ($request->has('tags')) {
           $post->tags()->attach($request->input('tags'));
       }
       
       event(new PostCreated($post));
       
       return response()->json([
           'id' => $post->id,
           'title' => $post->title,
           'created_at' => $post->created_at->toISOString(),
       ]);
   }
   
   // After (thin)
   public function store(StorePostRequest $request): PostResource
   {
       $post = $this->service->create($request->validated());
       return new PostResource($post);
   }
   ```

7. **Clean up imports**

   a. Remove all `use App\Models\*`, `use Illuminate\Support\Facades\*`, and data-layer imports.
   
   b. Keep only HTTP-layer imports: FormRequests, Services, API Resources, Response types.

8. **Verify no regressions**

   a. Run the full test suite.
   
   b. For each method, verify the response matches the original (same status code, same data structure, same redirect).

9. **Add architecture tests to prevent regression**

   Write a Pest/PHPUnit architecture test that enforces thin controller discipline:
   ```php
   test('controllers do not import models')
       ->expect('App\Http\Controllers')
       ->not->toUse('App\Models');
   
   test('controllers do not use DB facade')
       ->expect('App\Http\Controllers')
       ->not->toUse('Illuminate\Support\Facades\DB');
   ```

## Validation Checklist

- [ ] Every controller method is now under 10 lines
- [ ] No inline validation remains (all store/update use FormRequests)
- [ ] No Eloquent/DB queries remain in any method
- [ ] No inline JSON array construction remains
- [ ] No inline authorization checks remain
- [ ] No `app()->make()` or service locator calls remain
- [ ] Controller imports only HTTP-layer classes (FormRequests, Services, Resources)
- [ ] Every method follows the three-step pattern: validate → delegate → return
- [ ] Architecture tests are in place to prevent regression

## Common Failures

- **Partial extraction**: Extracting queries but leaving formatting, or extracting validation but leaving logic. Prevention: extract ALL concerns from a method in one pass — don't leave a mix.
- **Leaving unused imports**: Old model imports remain but are no longer used. Prevention: run `php artisan clear-compiled` or use IDE "Optimize Imports" after refactoring.
- **Fat services**: Moving all fat logic to a service creates a fat service. Prevention: split large services into focused action classes.
- **Lost middleware or authorization**: The refactored method's authorization logic was inline and not moved to FormRequest `authorize()`. Prevention: verify authorization coverage after refactoring.
- **Breaking route model binding**: Changing method signatures that rely on implicit route model binding. Prevention: keep parameter names that match the route parameter name.

## Decision Points

- **Service class vs. Action class per operation**: If the controller handles a group of related operations (Post: index, store, show, update, destroy) → one Service class with multiple methods. If the controller handles a single atomic operation (PublishPost) → one Action class.
- **Single FormRequest per action vs. shared**: If store and update have different rules → separate FormRequests. If they share significant overlap → a shared FormRequest with conditional `rules()`.
- **Inline formatting extraction to Resource vs. view**: If the endpoint is an API returning JSON → API Resource. If the endpoint is a web view → keep the view in Blade (controller passes data only).

## Performance Considerations

- The refactored controller is MORE performant because:
  - Services can implement caching available to all entry points.
  - Business logic is reusable, reducing code duplication.
- The extraction adds one additional method call per action — negligible.
- FormRequest validation runs before the method body, preventing wasted execution on invalid input.

## Security Considerations

- Inline authorization in controllers is invisible to security audits. After refactoring, authorization is in FormRequest `authorize()` or Policy classes where auditors can find it.
- After refactoring, test every endpoint for three authorization scenarios: guest, unauthorized, authorized.
- Route model binding provides consistent 404 handling for missing resources.

## Related Rules

- `05-rules.md` Rule: "Never Write Database Queries in Controllers"
- `05-rules.md` Rule: "Never Format Responses Inline in Controllers"
- `05-rules.md` Rule: "Delegate All Business Logic to Services or Actions"
- `05-rules.md` Rule: "Keep Controller Methods Under 10 Lines"
- `05-rules.md` Rule: "Use FormRequest for Every Store and Update Action"
- `05-rules.md` Rule: "Limit Controller Imports to HTTP-Layer Concerns"
- `05-rules.md` Rule: "Follow the Three-Step Pattern: Validate, Delegate, Return"
- `05-rules.md` Rule: "Do Not Use Controllers as Orchestrators"
- `05-rules.md` Rule: "Never Perform Authorization Logic Directly in Controllers"
- `05-rules.md` Rule: "Ban Eloquent Model and DB Imports in Controllers via Architecture Tests"

## Related Skills

- "Design and Implement Controller Architecture" — the target architecture
- "Apply Dependency Injection to Controllers" — injecting the extracted services
- "Apply Middleware to Controller Actions" — adding middleware to the refactored controller
- "Write Feature Tests for Controller Actions" — testing after refactoring
- "Enforce Thin Controller Compliance with Architecture Tests" — preventing regression

## Success Criteria

- Every controller method is under 10 lines with validate-delegate-return
- Zero Model, DB, or business logic imports exist in the controller file
- Zero inline `$request->validate()` calls remain
- Zero inline JSON array constructions remain
- Zero inline authorization checks remain
- The business logic is now unit-testable via service/action tests
- Architecture tests enforce the thin controller discipline
- All existing tests pass without modification

---

# Skill: Enforce Thin Controller Compliance with Architecture Tests

## Purpose

Write automated architecture tests that prevent controller violations from reaching production by programmatically enforcing thin controller rules: no model imports, no DB facades, no inline validation, no business logic. Catches violations during CI before code review.

## When To Use

- Setting up a new Laravel project with thin controller standards
- After refactoring a codebase to thin controllers and wanting to prevent regression
- During CI pipeline setup to enforce coding standards automatically
- A codebase has recurring controller violations that slip through code review

## When NOT To Use

- The codebase intentionally uses fat controllers (not recommended)
- No CI pipeline exists to run the tests (enforcement requires automation)
- The project is a prototype with no production deployment

## Prerequisites

- Pest (or PHPUnit) configured for the project
- `tests/Architecture/` directory structure available (create if not)
- Knowledge of which namespace patterns to target (`App\Http\Controllers`)

## Inputs

- Controller namespace: `App\Http\Controllers`
- Forbidden class patterns: `App\Models\*`, `Illuminate\Support\Facades\DB`, `Illuminate\Support\Facades\Cache`, etc.
- Project's testing framework choice (Pest or PHPUnit)

## Workflow

1. **Set up the architecture test file**

   Create `tests/Architecture/ControllerTest.php` (Pest) or `tests/Architecture/ControllerArchitectureTest.php` (PHPUnit).

2. **Write the model import ban test**

   a. Pest syntax:
      ```php
      test('controllers do not import Eloquent models')
          ->expect('App\Http\Controllers')
          ->not->toUse('App\Models');
      ```
   
   b. PHPUnit syntax:
      ```php
      public function test_controllers_do_not_import_models(): void
      {
          $this->assertDoesNotUse(
              'App\Models',
              'App\Http\Controllers',
          );
      }
      ```
      
      If PHPUnit's architecture assertions aren't available, use a custom test that reads `use` statements:
      ```php
      public function test_controllers_do_not_import_models(): void
      {
          $files = glob(app_path('Http/Controllers/**/*.php'));
          
          foreach ($files as $file) {
              $content = file_get_contents($file);
              preg_match_all('/^use (.+);/m', $content, $matches);
              
              foreach ($matches[1] as $use) {
                  $this->assertStringNotContainsString(
                      'App\Models',
                      $use,
                      "{$file} imports {$use} which is not allowed",
                  );
              }
          }
      }
      ```

3. **Write the DB facade ban test**

   ```php
   test('controllers do not use DB facade')
       ->expect('App\Http\Controllers')
       ->not->toUse('Illuminate\Support\Facades\DB');
   ```

4. **Write the Cache facade ban test**

   ```php
   test('controllers do not use Cache facade')
       ->expect('App\Http\Controllers')
       ->not->toUse('Illuminate\Support\Facades\Cache');
   ```

5. **Write the `app()->make()` ban test (optional)**

   If using Pest's `->toUse()` style:
   ```php
   test('controllers do not use service locator')
       ->expect('App\Http\Controllers')
       ->not->toUse('Illuminate\Container\Container');
   ```

6. **Run the architecture tests**

   ```bash
   php artisan test --filter=Architecture
   # or
   ./vendor/bin/pest --filter=Architecture
   ```

7. **Add exceptions for known exemptions**

   If a controller legitimately imports a model for route model binding type hints only:
   ```php
   test('controllers do not import Eloquent models')
       ->expect('App\Http\Controllers')
       ->not->toUse('App\Models')
       ->skip(fn () => true); // Or use ->except()
   ```
   
   Better approach: use `->except()` for specific files:
   ```php
   // Pest (if supported)
   test('controllers do not import Eloquent models')
       ->expect('App\Http\Controllers')
       ->not->toUse('App\Models')
       ->ignoring('App\Http\Controllers\Controller'); // Base class
   ```

8. **Integrate into CI pipeline**

   Add to the CI configuration:
   ```yaml
   - name: Run architecture tests
     run: php artisan test --filter=Architecture
   ```

## Validation Checklist

- [ ] Architecture test bans model imports in `App\Http\Controllers`
- [ ] Architecture test bans DB facade in controllers
- [ ] Architecture test bans Cache facade in controllers (optional)
- [ ] Architecture test bans `app()->make()` or service locator (optional)
- [ ] All architecture tests pass on the current codebase
- [ ] Exemptions are documented and minimal
- [ ] Architecture tests run in CI as part of the test suite
- [ ] A failing architecture test blocks PR merge

## Common Failures

- **False positives from base classes**: `App\Http\Controllers\Controller` may legitimately import models. Prevention: use `->ignoring()` to exempt the base class.
- **Brittle assertions**: Asserting on exact import strings fails if formatting changes. Prevention: use semantic assertions (Pest's `->toUse()` or `->not->toUse()`) over string matching.
- **Architecture tests not running in CI**: The tests exist but are skipped in CI because of a configuration filter. Prevention: explicitly add `--filter=Architecture` to the CI test command.
- **Too many exemptions**: If 5+ controllers need exemptions, the rule is wrong or too strict. Prevention: re-evaluate the ban list — focus on the most impactful violations.

## Decision Points

- **Pest vs. PHPUnit for architecture tests**: Pest has built-in architecture testing assertions (`->expect('Namespace')->not->toUse('...')`). PHPUnit requires custom assertions or string-based tests. Use Pest if available.
- **What to ban**: Start with Model imports and DB facade. Add more as violations are discovered during code review. A common progression: Model imports → DB facade → `$request->validate()` → `app()->make()`.
- **Strict vs. lenient enforcement**: Strict: ban ALL model imports (any controller importing a model fails). Lenient: ban only direct query calls (model import for type hints is OK). Prefer strict.

## Performance Considerations

- Architecture tests run in milliseconds — they are the fastest tests in the suite.
- They should run at the beginning of the test suite to fail fast on structural violations.

## Security Considerations

- Architecture tests enforce the thin controller discipline that prevents authorization logic from being hidden in controller methods.
- By ensuring authorization moves to FormRequests and Policies, architecture tests indirectly improve security auditability.

## Related Rules

- `05-rules.md` Rule: "Ban Eloquent Model and DB Imports in Controllers via Architecture Tests"
- `05-rules.md` Rule: "Limit Controller Imports to HTTP-Layer Concerns"
- `05-rules.md` Rule: "Never Write Database Queries in Controllers"
- `05-rules.md` Rule: "Never Format Responses Inline in Controllers"

## Related Skills

- "Refactor a Fat Controller into a Thin Controller" — the prerequisite refactoring
- "Write Feature Tests for Controller Actions" — regular behavior tests alongside architecture tests
- "Apply Dependency Injection to Controllers" — correct DI pattern that architecture tests enforce

## Success Criteria

- Architecture tests exist and pass for the entire `App\Http\Controllers` namespace
- Model imports in controllers are detected and fail the build
- DB facade usage in controllers is detected and fails the build
- Exemptions are documented, minimal, and justified
- Architecture tests run in CI on every push and PR
- The codebase maintains thin controller compliance over time
