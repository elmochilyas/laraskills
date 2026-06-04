# Skill: Extract Controller Logic to an Action

## Purpose

Refactor inline business logic from a controller method into a dedicated, testable, reusable action class.

## When To Use

- A controller method contains business logic (validation + computation + persistence + side effects) that is not simple CRUD pass-through.
- The same operation is called from multiple entry points (HTTP, CLI, queue) or is likely to be in the future.
- The operation has intrinsic complexity that warrants isolation — multiple steps, dependencies, or business rules.
- The controller method is growing beyond 15-20 lines.

## When NOT To Use

- Simple CRUD pass-through like `User::create($request->validated())` — the model already handles it.
- Single-entry-point operations with no reuse potential — keep in controller or service until a second caller emerges.
- Operations with zero constructor dependencies — a static method or function is more appropriate.
- Operations that need polymorphic behavior — use a strategy pattern or interface-bound service instead.

## Prerequisites

- An existing controller method that performs a distinct business operation.
- Understanding of constructor dependency injection and the service container.
- PHP 8.1+ (typed properties) or PHP 8.2+ (readonly classes).

## Inputs

- The controller file containing the inline business logic.
- A list of framework dependencies used in the inline logic (Models, Facades, Repositories, Services).
- The entry points that currently call this operation (HTTP route, CLI command, etc.).

## Workflow

1. **Identify the operation boundary.** Draw a line around the statements in the controller method that constitute a single business operation. Exclude HTTP concerns: request extraction, response formatting, error page rendering, session flash messages.

2. **Name the operation.** Choose a VerbNoun name that describes the operation (e.g., `RegisterUserAction`). Follow the project's naming convention.

3. **Create the action class.** Create `App\Actions\{Domain}\{ActionName}.php`. Declare `final readonly class` (PHP 8.2+).

4. **Extract dependencies to the constructor.** Move every framework service, repository, gateway, or collaborator from the method body into typed constructor properties. If the operation calls `User::create()`, inject a `UserRepository` or use the model directly through a repository. Never inject `Request`, `Response`, or session objects.

5. **Define the public method.** Create a single public method named per the project's convention (`handle()`, `execute()`, or `__invoke()`). Add typed parameters for the operational input (DTO, individual params, or validated array). Declare a concrete return type.

6. **Move business logic into the method body.** Copy the business logic from the controller into the action method. Replace any `request()->*` calls with method parameters. Replace any `auth()->user()` with an explicit `User $user` parameter. Replace any `session()->*` with return values the controller handles.

7. **Replace HTTP-specific code.** Remove any redirect, response building, or view rendering. The action returns data; the controller handles presentation.

8. **Update the controller.** Replace the inline logic with a call to the new action: `$this->actionName->execute($dto)` or `app(ActionName::class)->execute($data)`. Extract request data into a DTO or individual parameters before calling the action. Handle the action's return value to build the HTTP response.

9. **Write the test.** Create `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Write pure unit tests with mocked dependencies covering the happy path, validation failures, and exception paths.

## Validation Checklist

- [ ] Action class is declared `final readonly` (or `final` on PHP < 8.2)
- [ ] Action class has exactly one public method
- [ ] Action class does not import from `Illuminate\Http` namespace
- [ ] Action class returns a concrete type (not `mixed`, not bare `array`)
- [ ] Constructor has at most 8 parameters
- [ ] Action does not call `request()`, `auth()`, `session()`, or `response()` helpers
- [ ] Action does not set mutable properties during `handle()`/`execute()`
- [ ] Action method parameters are typed (DTO, individual params, or documented array)
- [ ] Controller extracts HTTP data before calling the action
- [ ] Test file exists at `tests/Unit/Actions/{Domain}/{ActionName}Test.php`
- [ ] Tests cover happy path, at least one validation/exception path, and one side-effect path

## Common Failures

- **Action accepts `Request` object.** Couples business logic to HTTP, making the action unusable from CLI/queue. Always extract data in the controller and pass typed parameters.
- **Action has no return type.** Callers cannot reason about the result. Always declare a concrete return type.
- **Action stores result on `$this`.** Unsafe in Octane/RoadRunner — data leaks across requests. Return a result object instead.
- **Action is simple CRUD pass-through.** `User::create($data)` with no business logic adds ceremony without benefit. Skip the action unless there is actual business logic or multi-entry-point reuse.
- **Action constructor has too many parameters.** More than 8 indicates the action is orchestrating rather than executing. Extract sub-operations into child actions or a service.
- **Action has method name that conflicts with class intent.** A `CreateOrderAction` with method `process()` creates confusion. Use `handle()`, `execute()`, or a domain-specific name matching the class.

## Decision Points

- **Method name:** Choose `handle()`, `execute()`, or `__invoke()` as the team standard. `execute()` is auto-detected by Spatie's QueueableAction; `handle()` requires a `queueMethod()` override.
- **Parameter strategy:** Start with individual parameters or simple arrays. Graduate to DTOs when complexity justifies it or when the action is called from multiple entry points.
- **`final` keyword:** `final` prevents mocking via inheritance (Mockery's `makePartial()`). Make the project-level decision and enforce with Pest architecture tests.

## Performance Considerations

- Container resolution adds ~0.01-0.05ms per action instantiation. Cache the resolved instance in a local variable if calling the same action multiple times in a request.
- Action class files are autoloaded via PSR-4. After OpCache warmup, autoloading has zero per-request cost.
- In Octane/RoadRunner, stateless actions are safe — mutable properties leak data across requests.

## Security Considerations

- Actions that accept loose arrays (`handle(array $data)`) pass validation responsibility to the caller. Use DTOs to enforce shape and validation.
- Actions called from multiple entry points must be authorized at every entry point — authorization is not inherited from the controller.
- Never pass untrusted arrays to Eloquent `::create()`. Map DTO fields explicitly.

## Related Rules

- Rule: Enforce Single Public Method Per Action (action-class-design/05-rules.md)
- Rule: Declare Action Classes as `final readonly` (action-class-design/05-rules.md)
- Rule: Never Accept HTTP Request Objects in Actions (action-class-design/05-rules.md)
- Rule: Return Typed Results from Every Action (action-class-design/05-rules.md)
- Rule: Limit Constructor Dependencies to a Maximum of 8 (action-class-design/05-rules.md)
- Rule: Keep Actions Stateless (action-class-design/05-rules.md)
- Rule: Do Not Create Actions for Simple Eloquent CRUD Pass-Through (action-class-design/05-rules.md)
- Rule: Establish a Single Method Name Convention (action-class-design/05-rules.md)
- Rule: Enforce Action Purity with Pest Architecture Tests (action-class-design/05-rules.md)
- Rule: Prefer DTOs or Individual Parameters Over Loose Arrays (action-class-design/05-rules.md)

## Related Skills

- Compose Actions into a Workflow (action-composition/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

## Success Criteria

- The controller method is reduced to request extraction + action call + response building (≤ 5 lines).
- The action class is independently testable — tests pass without framework boot, database, or HTTP context.
- The action can be called from another entry point (CLI command, queue job, another action) without modification.
- The action's constructor signature reveals its full dependency scope — no hidden dependencies via facades or helpers.

---

# Skill: Design an Octane-Safe Stateless Action

## Purpose

Create action classes that are safe to execute in long-lived Laravel Octane and RoadRunner processes without data leakage across requests.

## When To Use

- When deploying to Octane, RoadRunner, or Swoole.
- When an action is bound as a transient service (default) but might accidentally capture per-request state.
- When refactoring existing actions that use mutable properties.
- When establishing coding standards for any new action in a team using long-lived processes.

## When NOT To Use

- PHP-FPM only projects (each request is a fresh process) — state leakage is still a correctness bug but causes no data corruption across requests.
- Actions that are guaranteed to never be bound as singletons and never be cached in the container.

## Prerequisites

- PHP 8.2+ (for `readonly` class enforcement).
- An existing action class or a plan to create a new one.
- Understanding of Octane/RoadRunner lifecycle (process reuse across requests).

## Inputs

- The action class(es) to audit or design.
- A list of all properties set during action execution.
- The service container bindings for each action.

## Workflow

1. **Declare the class as `final readonly`.** Add `readonly` to the class declaration. This makes all constructor properties implicitly readonly and prevents any property mutation after construction. If the class cannot be readonly (PHP < 8.2), enforce statelessness through code review and Pest architecture tests.

2. **Move all execution state to local variables.** Scan the `handle()`/`execute()` method for any `$this->property = ...` assignment. Replace each with a local variable. If the value needs to be accessible to the caller, return it as part of a result object.

3. **Replace getter methods with result objects.** If the action exposes getters like `getProcessedPath()`, remove them. Create a dedicated result class (DTO) that carries all output data. Return the result object from the action method.

4. **Audit memoization.** Check for properties that cache expensive infrastructure lookups. These are safe only if the cached value is truly invariant across all requests (e.g., resolved gateway instance) and never depends on per-request data. Document each memoized property with a comment explaining why it is invariant.

5. **Remove singleton bindings.** Check service providers for `$this->app->singleton(ActionName::class)`. Remove any singleton binding for action classes. Actions must be resolved transiently (new instance per resolution) by default.

6. **Add architecture tests.** Create or update `tests/Arch/ActionsTest.php`:
   ```php
   test('actions are readonly')->expect('App\Actions')->toBeReadonly();
   test('actions are final')->expect('App\Actions')->toBeFinal();
   test('actions have only one public method')->expect('App\Actions')->toHaveOnlyOnePublicMethod();
   ```

7. **Run Octane stress test.** Deploy to an Octane preview environment and run concurrent requests through the action. Verify that no data from request N appears in request N+1's response.

## Validation Checklist

- [ ] Action class is declared `readonly` (PHP 8.2+)
- [ ] No `$this->property =` assignments in `handle()`/`execute()` methods
- [ ] No getter methods for execution results
- [ ] Result object exists and carries all output data
- [ ] Memoized properties are documented as invariant
- [ ] Action is not bound as a singleton
- [ ] Pest architecture tests enforce readonly, final, single-public-method
- [ ] Concurrent Octane requests produce no cross-request data leakage

## Common Failures

- **Property set inside a loop.** `$this->processedCount++` inside a `foreach` is stateful. Use a local counter and return the final count in the result.
- **Lazy-loaded property.** `private ?Gateway $gateway = null` with a getter that initializes it — the gateway instance is shared across requests. Inject via constructor instead.
- **Accidental singleton binding.** A service provider auto-discovers and binds actions via `scan()`. Explicitly exclude actions from singleton binding.
- **`readonly` omitted for testability.** Team avoids `readonly` because tests need to set state. Instead, make tests set state through the result object, not the action instance.

## Decision Points

- **`readonly` vs Pest enforcement:** `readonly` provides compiler-level enforcement. For PHP < 8.2, Pest architecture tests are the enforcement mechanism. Prefer `readonly` wherever possible.

## Performance Considerations

- `readonly` classes have zero runtime overhead — the restriction is enforced at compile time.
- Stateless actions are safe in any runtime and compose without side effects.

## Security Considerations

- Stateful actions in Octane cause silent data corruption — user A's data leaks to user B's response. This is a security vulnerability, not just a reliability bug.
- Pest architecture tests provide automated enforcement against statelessness violations.

## Related Rules

- Rule: Keep Actions Stateless — Never Set Mutable Properties During Execution (action-class-design/05-rules.md)
- Rule: Declare Action Classes as `final readonly` (action-class-design/05-rules.md)
- Rule: Do Not Bind Actions as Singleton Services (action-class-design/05-rules.md)
- Rule: Enforce Action Purity with Pest Architecture Tests (action-class-design/05-rules.md)

## Related Skills

- Extract Controller Logic to an Action (action-class-design/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

## Success Criteria

- The action class has zero `$this->property =` assignments in execution methods.
- The action can be resolved 1000 times concurrently in Octane with zero cross-request data leakage.
- Pest architecture tests fail if a developer adds a mutable property to an action class.
- The result object carries all output data that was previously stored on `$this`.

---

# Skill: Migrate Action Parameters from Arrays to DTOs

## Purpose

Replace loose `array $data` parameters in action methods with typed Data Transfer Objects (DTOs) to provide compile-time safety, discoverable contracts, and self-documenting input shapes.

## When To Use

- An existing action accepts `array $data` and callers frequently pass incorrect keys.
- The action is called from multiple entry points and the array contract is not consistently enforced.
- The action's input data has grown beyond 3-4 fields.
- New developers are being onboarded and need discoverable input contracts.

## When NOT To Use

- Internal or private actions called from a single location with 1-2 trivially obvious parameters.
- Generic processing actions (`LogDataAction`) that handle arbitrary key-value data.
- Actions that are expected to be removed or replaced soon.
- Simple CRUD pass-through actions where the array is passed directly to Eloquent's `::create()`.

## Prerequisites

- An existing action class with a `handle(array $data)` or `execute(array $data)` signature.
- Knowledge of all callers of the action (controllers, CLI commands, other actions).
- PHP 8.1+ (typed properties, promoted constructor).

## Inputs

- The action class file.
- All call sites that invoke the action.
- Documentation of the expected array keys and their types.

## Workflow

1. **Audit all array keys used in the action.** List every key accessed from `$data` inside the action method (`$data['name']`, `$data['email']`, etc.). Determine each key's type (`string`, `int`, `bool`, `array`, nullable?).

2. **Create the DTO class.** Create `app/DTOs/{OperationName}Data.php` or co-locate with the action in `app/Actions/{Domain}/`. Declare it `final readonly class`. Add a typed `public readonly` property for each array key with a `public function __construct(...)` promoting each parameter.

3. **Replace array accesses with DTO property reads.** Inside the action method, replace `$data['key']` with `$dto->key`. Replace `$data` parameters with the typed DTO parameter.

4. **Update all call sites.** For each controller, CLI command, or other action that calls this action, replace the array argument with a new DTO instantiation:
   ```php
   // Before:
   $this->action->execute(['name' => $name, 'email' => $email]);
   // After:
   $this->action->execute(new RegisterUserData(name: $name, email: $email));
   ```

5. **Remove array type hints.** Change the action method signature from `execute(array $data): Result` to `execute(RegisterUserData $data): Result`.

6. **Update tests.** Replace array arguments in test calls with DTO instances. Add tests for DTO construction with invalid types (PHP will enforce types at the language level).

7. **Add DTO validation if needed.** If using Spatie's `laravel-data`, add a `rules()` method to the DTO for validation rules. Otherwise, validate input in the action or a dedicated validator before using the DTO.

## Validation Checklist

- [ ] DTO class is declared `final readonly` with typed `public readonly` properties
- [ ] DTO contains no business logic — no methods besides the constructor
- [ ] DTO properties match every key previously accessed from the array
- [ ] Action method signature now accepts the typed DTO, not `array`
- [ ] All call sites construct the DTO with named arguments
- [ ] Tests use DTO instances instead of arrays
- [ ] Loose array parameter is no longer accepted by the action method

## Common Failures

- **DTO includes fields not used by the action.** Only include fields that the action actually accesses. Extra fields in the DTO create dead parameters that must be passed at every call site.
- **DTO has optional fields.** If a field is sometimes missing from the array, the DTO property should be nullable (`?string`) rather than optional. This makes the contract explicit.
- **DTO contains business logic.** A DTO with `validate()`, `toArray()`, or computed properties is no longer a pure data carrier. Keep DTOs as simple data carriers; move logic to the action or a validator.
- **DTO not serializable for queueing.** If the action uses `QueueableAction`, ensure the DTO is serializable. Plain PHP objects with scalar properties are serializable by default.
- **Mixed use of arrays and DTOs in the same action.** After migration, remove any remaining array handling. The action should accept only the DTO.

## Decision Points

- **Co-located vs separate DTO directory.** Place DTOs in `app/DTOs/` for shared DTOs used across multiple actions. Co-locate with the action in `app/Actions/{Domain}/` for DTOs used by a single action.
- **Spatie laravel-data.** Consider using `spatie/laravel-data` for automatic validation rules, transformation, and serialization support. This reduces DTO boilerplate significantly.

## Performance Considerations

- DTO instantiation adds ~0.001-0.005ms per call. Negligible for individual requests.
- DTOs are plain PHP objects with no framework overhead. They compose well with queue serialization.

## Security Considerations

- DTOs with typed properties provide compile-time input validation — incorrect types cause a TypeError at the call site, not a runtime bug deep in the action.
- Never pass DTO properties directly to Eloquent's `::create()`. Map explicit fields to prevent mass-assignment vulnerabilities.

## Related Rules

- Rule: Prefer DTOs or Individual Parameters Over Loose Arrays (action-class-design/05-rules.md)

## Related Skills

- Extract Controller Logic to an Action (action-class-design/06-skills.md)
- Create a Pragmatic Use Case (use-case-variant/06-skills.md)

## Success Criteria

- The action method signature is fully typed — callers know exactly what data is required without reading the implementation.
- Every call site constructs the DTO explicitly — no array keys to mistype.
- Static analysis (PHPStan, Psalm) catches any DTO property type mismatches at analysis time.
- The DTO class has exactly one job: carrying data between the caller and the action.
