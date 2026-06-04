# Skill: Choose the Right Pattern for a Business Operation

## Purpose

Apply the three-tier decision framework (Cohesion → Granularity → Portability) to select between Service, Action, and Use Case patterns for any business operation.

## When To Use

- Creating a new business operation and deciding where to place the logic.
- Reviewing existing code where the pattern choice seems wrong (over-engineered or under-engineered).
- Onboarding new developers who need to understand when to use each pattern.
- Refactoring an existing operation that has outgrown its current pattern.

## When NOT To Use

- The operation is a simple read/query (use repository, query object, or direct Eloquent call).
- The operation is a trivial CRUD pass-through with no business logic (use the model directly).
- The team has a strict "one pattern only" policy (valid only for very small projects) — this skill helps evaluate if that policy is appropriate.

## Prerequisites

- Understanding of the three patterns: Service (multi-method, entity-oriented), Action (single-method, operation-oriented), Use Case (framework-agnostic, DTO-contracted).
- A clear statement of what the operation does (not how it does it).
- Knowledge of current and anticipated entry points (HTTP, queue, CLI, events).

## Inputs

- The operation specification: what it does, what it needs, what it returns.
- The entity or domain it operates on.
- The current entry points that will call it.
- Anticipated future entry points (within the next 3 months).

## Workflow

1. **State the operation.** Write a one-sentence description: "This operation registers a new user with email verification." This clarifies exactly what "one operation" means.

2. **Ask Question 1: Cohesion.** Does this operation belong to a group of related operations on the same entity? If the entity (User, Order, Product) already has a service, and this operation shares constructor dependencies with existing service methods → choose **Service**. If the operation is the only operation on this entity or has unique dependencies → proceed to Question 2.

3. **Ask Question 2: Granularity.** Is this a single, distinct operation that may be reused or composed with other actions? If the operation is a distinct business step that could be called from multiple workflows or needs independent test isolation → choose **Action**. If the operation is trivially simple (1-2 method calls, no dependencies) and not reused → choose **Service** (keep as a service method).

4. **Ask Question 3: Portability.** Does this operation need to run identically across entry points (HTTP, queue, CLI) with framework-agnostic contracts? If yes, and the operation is called from 2+ entry points now (not someday) → choose **Use Case**. If single-entry-point or no framework-agnostic requirement → choose **Action** (already selected in step 3).

5. **Document the decision.** Record which pattern was chosen and why. Reference the three-tier framework. This documentation helps future reviewers understand the reasoning.

6. **Apply the evolution rule.** Start with the simpler pattern. Actions can later be upgraded to Use Cases. Service methods can later be extracted to Actions. Document the criteria that would trigger the next evolution (e.g., "Extract to Action when a second caller emerges").

## Validation Checklist

- [ ] The operation is clearly defined in one sentence
- [ ] Question 1 (Cohesion) was answered — does it share dependencies with entity operations?
- [ ] Question 2 (Granularity) was answered — is it a distinct, reusable, isolatable unit?
- [ ] Question 3 (Portability) was answered — is it called from 2+ entry points with framework-agnostic needs?
- [ ] The chosen pattern matches the most specific applicable answer
- [ ] The decision is documented with the reasoning
- [ ] Evolution criteria are documented (what would trigger the next pattern)

## Common Failures

- **Skipping Question 1.** Jumping directly to Action or Use Case without considering entity grouping. A group of 10 operations on User should live in a Service, not 10 separate Action classes.
- **Use Case for single-entry-point.** Creating a full Use Case (DTO + interface + result DTO) for an operation that only runs from HTTP. The portability benefit is never realized, but the overhead is paid immediately.
- **Dogmatic one-pattern-only.** "We only use Actions" leads to file proliferation for simple CRUD. "We only use Services" leads to 30-method god services. Use all three where each fits.
- **Pattern by team convention, not by evidence.** Choosing a pattern because "the team uses services" rather than because "this operation fits the service criteria." Apply the framework to each operation individually.
- **Pattern inconsistency within a domain.** One operation in a domain uses a Service, another uses an Action, a third uses a Use Case — all for the same entity. Keep patterns consistent within a domain.

## Decision Points

- **Service-Action complement is the default.** The dominant production pattern is Services for orchestration/navigation + Actions for execution. Use Cases are an opt-in specialization.
- **Start simple, evolve.** Begin with Service methods. Extract to Actions when the method needs isolation or reuse. Upgrade to Use Cases only when multi-entry-point portability is required. This is the additive evolution path.

## Performance Considerations

- The resolution cost difference between the three patterns is negligible (~0.05ms per resolution). File count has zero runtime performance impact (OpCache). Pattern choice is an architectural decision, not a performance one.

## Security Considerations

- Services that share constructor dependencies across methods may accidentally expose authorization gaps when called from different contexts. Actions provide better authorization isolation. Use Cases enable framework-agnostic authorization.

## Related Rules

- Rule: Apply the Three-Tier Decision Framework to Each Operation Individually (action-vs-service-vs-usecase/05-rules.md)
- Rule: Use Service-Action Complement as the Default Production Pattern (action-vs-service-vs-usecase/05-rules.md)
- Rule: Start with Services, Evolve to Actions, Introduce Use Cases as Needed (action-vs-service-vs-usecase/05-rules.md)
- Rule: Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case (action-vs-service-vs-usecase/05-rules.md)
- Rule: Keep Pattern Choices Consistent Within a Domain (action-vs-service-vs-usecase/05-rules.md)
- Rule: Do Not Enforce a Single Pattern Across the Entire Codebase (action-vs-service-vs-usecase/05-rules.md)

## Related Skills

- Extract Controller Logic to an Action (action-class-design/06-skills.md)
- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Create a Pragmatic Use Case (use-case-variant/06-skills.md)

## Success Criteria

- Each business operation in the codebase uses the most specific pattern that fits its characteristics.
- No operation is over-engineered (Use Case for simple CRUD) or under-engineered (30-method service where actions would provide better isolation).
- The pattern choice for any operation is predictable — team members reach the same conclusion independently using the three-tier framework.
- Pattern evolution is additive (Service → Action → Use Case) and never requires reverting a decision.

---

# Skill: Evolve a Service Method to an Action

## Purpose

Extract a single method from a Service class into an independent Action class when the method needs isolation, reuse, or dedicated test coverage.

## When To Use

- A service method has unique dependencies that differ from other methods in the same service.
- The method is called from multiple entry points (controllers, CLI commands, jobs).
- The method's test coverage requires complex setup that interferes with other service method tests.
- Merge conflicts on the service file are frequent because multiple developers modify different methods.
- The method has crossed the threshold where a single file for the operation provides better discoverability.

## When NOT To Use

- The method shares all its dependencies with other methods in the service — extracting it creates duplicate constructor injection across files.
- The method is a simple getter/setter with no business logic — keep it in the service.
- The service has fewer than 5 methods and is not causing any practical problem — defer extraction.
- The method accesses private service state from other methods — refactor to remove coupling first.

## Prerequisites

- An existing Service class with the method to extract.
- Knowledge of the method's constructor dependencies.
- All call sites that invoke the method.

## Inputs

- The service class file.
- The method signature and body.
- The constructor parameters used by the method.
- All call sites.

## Workflow

1. **Identify the method to extract.** Choose a method that represents a distinct business operation with clear inputs and outputs. The method should have a natural name that could become the action class name (e.g., `sendWelcomeEmail` → `SendWelcomeEmailAction`).

2. **Audit constructor dependencies.** List every constructor property of the service that the method uses directly. These will become the action's constructor dependencies. Dependencies used by other methods (but not this one) stay in the service.

3. **Create the action class.** Create `App\Actions\{Domain}\{MethodName}Action.php`. Add the audited dependencies as constructor properties. Copy the method body into a single public method (`handle()` or `execute()`).

4. **Adjust for statelessness.** If the method reads/writes service-level state (private properties set by other methods), refactor to pass the state as method parameters. The action must not depend on service-internal state.

5. **Update the service method.** Replace the method body with a delegation to the new action:
   ```php
   // Before:
   public function sendWelcomeEmail(User $user): void
   {
       // inline logic
   }
   
   // After:
   public function sendWelcomeEmail(User $user): void
   {
       $this->sendWelcomeEmailAction->execute($user);
   }
   ```

6. **Add the action to the service constructor.** Inject the new action class as a constructor dependency of the service. The service continues to provide the same API — callers do not change.

7. **Write the action test.** Create `tests/Unit/Actions/{Domain}/{MethodName}ActionTest.php`. Write pure unit tests with mocked dependencies. Cover the happy path, validation failures, and exception paths.

8. **Simplify the service test.** Remove test cases from the service's test class that covered the extracted method's internal logic. Keep only tests that verify the service delegates correctly to the action.

9. **Verify no callers broke.** Callers still reference `$service->sendWelcomeEmail($user)` — the API is unchanged. Run the full test suite to confirm.

## Validation Checklist

- [ ] New action class is created in `App\Actions\{Domain}\`
- [ ] Action class is `final readonly` (PHP 8.2+) with exactly one public method
- [ ] Action has only the dependencies the extracted method actually uses
- [ ] Service method now delegates to the action
- [ ] Method signature is unchanged — callers did not need to update
- [ ] Service constructor now injects the action
- [ ] Action test file exists with pure unit tests
- [ ] Full test suite passes

## Common Failures

- **Action shares all dependencies with the service.** If the method uses all the same dependencies as the rest of the service, extracting it causes duplication. Consider keeping it in the service or extracting multiple methods together.
- **Action uses service-internal state.** The method reads `$this->pendingEmails` or similar service-level state. Refactor to pass state explicitly as method parameters before extracting.
- **Extraction not additive.** The service method is removed entirely, forcing all callers to switch to the action directly. Keep the service method as a delegate — extraction is additive, not reductive.
- **Over-extraction.** Extracting every service method to an action creates file proliferation. Only extract when there is a concrete benefit (unique deps, reuse, test isolation, merge conflict reduction).

## Decision Points

- **Keep vs remove the service method:** Keep the service method as a delegate. This preserves the service's API contract, allows gradual migration of callers, and maintains the service as the navigation entry point.

## Performance Considerations

- Adding the action as a service dependency adds one container resolution per service instantiation (~0.01-0.05ms). Negligible.
- The action's test runs faster than the old service method test because only the action's mocks are needed.

## Security Considerations

- Authorization checks that were in the service method must be preserved in the action or kept at the service delegation level. Do not lose authorization during extraction.

## Related Rules

- Rule: Start with Services, Evolve to Actions, Introduce Use Cases as Needed (action-vs-service-vs-usecase/05-rules.md)
- Rule: Use Service-Action Complement as the Default Production Pattern (action-vs-service-vs-usecase/05-rules.md)

## Related Skills

- Extract Controller Logic to an Action (action-class-design/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)

## Success Criteria

- The service method is reduced to a single-line delegation call.
- The new action has its own test class with isolated, fast tests.
- No existing caller needed any changes — the service API is unchanged.
- The service class is slightly smaller and has one fewer reason to change.

---

# Skill: Upgrade an Action to a Use Case

## Purpose

Evolve an existing action class into a Use Case by adding a typed DTO input contract, framework-agnostic interface dependencies, and optional result DTO output, enabling multi-entry-point portability.

## When To Use

- An existing action is called from 2+ entry points (HTTP controller, CLI command, queue worker).
- The action needs to run identically in a non-Laravel context (vanilla PHP worker, Symfony, etc.).
- The architectural policy requires strict framework-boundary separation between business logic and infrastructure.
- The action's array input has caused production errors due to incorrect keys from different callers.

## When NOT To Use

- The action is called from a single entry point (HTTP-only) — the Use Case overhead is not justified.
- The action already uses a DTO but returns Eloquent models directly — it is already a Pragmatic Use Case; no upgrade needed.
- The operation is simple CRUD with no business logic — actions or services suffice.
- The team is small (1-3 devs) — the tradeoff between boilerplate and value favors actions.

## Prerequisites

- An existing action class with a single public method.
- Knowledge of all current and planned entry points.
- Understanding of the three Use Case layers: input DTO, interface dependencies, optional result DTO.
- PHP 8.1+ for typed properties and promoted constructor.

## Inputs

- The existing action class file.
- A list of all call sites and the data they pass.
- The current return type and its structure.

## Workflow

1. **Create the input DTO.** Create `app/DTOs/{OperationName}Data.php`. Add typed `public readonly` properties for every input field the action uses. Include only the fields the action actually reads — no extra fields.
   ```php
   final readonly class RegisterUserDTO
   {
       public function __construct(
           public string $name,
           public string $email,
           public string $password,
       ) {}
   }
   ```

2. **Extract interfaces for dependencies.** For each constructor dependency that is a concrete class (Eloquent repository, specific hasher), create an interface in `app/Contracts/`. Define only the methods the action uses. Extract interfaces only for dependencies that need framework-agnosticism — keep concrete classes for pragmatic Use Cases.
   ```php
   interface UserRepositoryInterface
   {
       public function create(string $name, string $email, string $password): array;
   }
   ```

3. **Rename the action to a Use Case.** Rename the action class from `{ActionName}Action` to `{ActionName}UseCase`. Update the namespace if following a different convention (e.g., `App\UseCases\` instead of `App\Actions\`).

4. **Replace array input with DTO.** Change the method signature from `execute(array $data)` to `execute({OperationName}DTO $dto)`. Replace all `$data['key']` accesses with `$dto->key`.

5. **Replace concrete dependencies with interfaces.** Update constructor parameter types from concrete classes to interfaces. For a Pragmatic Use Case, this step is optional — keep concrete classes if full decoupling is not yet needed.

6. **Remove framework imports.** Scan the Use Case for any `use Illuminate\*` imports, facade calls (`\Log::`, `\Cache::`), or helper functions (`session()`, `request()`, `auth()`, `cache()`). Replace each with an injected interface dependency.

7. **Create optional result DTO.** If the Use Case should return a framework-agnostic result (not an Eloquent model), create a result DTO. Map the model's properties to the DTO in the Use Case's return statement.

8. **Bind interfaces in a service provider.** For each interface dependency, add a binding in `AppServiceProvider` or a dedicated service provider:
   ```php
   $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
   ```

9. **Update adapter layer (controller).** Update the controller to construct the input DTO from the Request and pass it to the Use Case. Map the Use Case's result DTO to an HTTP response.
   ```php
   $dto = new RegisterUserDTO(
       name: $request->validated('name'),
       email: $request->validated('email'),
       password: $request->validated('password'),
   );
   $result = $this->registerUserUseCase->execute($dto);
   return new UserResource($result);
   ```

10. **Update tests.** Replace array arguments with DTO instances. Mock interface dependencies instead of concrete classes. Verify that the Use Case is testable without booting Laravel.

## Validation Checklist

- [ ] Input DTO exists with typed `public readonly` properties
- [ ] Use Case method accepts typed DTO (not array, not Request)
- [ ] Zero framework imports in the Use Case class (`use Illuminate\*` forbidden)
- [ ] No facade calls or helper functions in the Use Case
- [ ] All framework dependencies are replaced with injected interfaces (at minimum for Pragmatic; full interfaces for Hexagonal)
- [ ] Interface bindings are registered in a service provider
- [ ] Controller constructs the DTO from the Request
- [ ] Result DTO (optional) is framework-agnostic
- [ ] Use Case is testable without booting Laravel (pure unit test)
- [ ] All existing callers are updated to pass DTOs

## Common Failures

- **Use Case still imports framework classes.** A `use Illuminate\Support\Facades\Log` in the Use Case breaks the framework-agnostic contract. Inject a `LoggerInterface` instead.
- **DTO with business logic.** Adding `validate()` or `toArray()` methods to the DTO violates its single responsibility as a data carrier.
- **Interface over-parameterization.** Every Use Case adding its own method to the repository interface creates a god interface. Use query objects or specification pattern for specialized queries.
- **Missing service provider binding.** The container throws `BindingResolutionException` at runtime because an interface dependency is not bound.
- **Use Case for single-entry-point operation.** The DTO and interface overhead was paid but the operation never needed multi-entry-point support.
- **Pragmatic Use Case not evolved.** The team creates a Pragmatic Use Case (DTO input, model output, concrete dependencies) and never upgrades when multi-entry-point reuse materializes.

## Decision Points

- **Pragmatic vs Full Hexagonal:** Start with the Pragmatic variant (DTO input + Eloquent model output + concrete deps). Upgrade to Full Hexagonal (result DTO + interface deps) only when the codebase demonstrates a clear need. The Pragmatic variant covers 80% of the benefit with 30% of the cost.
- **Use Case directory:** Place Use Cases in `app/UseCases/` to distinguish them from actions. Or co-locate in `app/Actions/` if the team treats Use Cases as a strict action variant.

## Performance Considerations

- Each DTO instantiation is a plain PHP object allocation (~0.001-0.005ms). Negligible.
- Interface method calls have the same performance as concrete method calls in PHP (after OpCache).
- Result DTO construction adds ~0.01ms overhead vs returning a model directly.

## Security Considerations

- The zero-framework-import rule prevents the Use Case from accidentally bypassing Laravel's security layers. All database access goes through repository interfaces.
- Authorization checks should happen in the adapter layer (controller/middleware) or through an authorization interface — not in the Use Case itself.

## Related Rules

- Rule: Enforce Zero Framework Imports in Use Case Business Logic (use-case-variant/05-rules.md)
- Rule: Use Typed DTOs for All Use Case Input, Never Raw Arrays (use-case-variant/05-rules.md)
- Rule: Keep DTOs as Simple Data Carriers with Typed Readonly Properties (use-case-variant/05-rules.md)
- Rule: Depend on Interfaces, Not Concrete Classes, in Use Case Constructors (use-case-variant/05-rules.md)
- Rule: Bind Every Use Case Interface Dependency in a Service Provider (use-case-variant/05-rules.md)
- Rule: Do Not Create Use Cases for Single-Entry-Point Operations (use-case-variant/05-rules.md)
- Rule: Do Not Create Use Cases for CRUD-Only Operations with No Business Logic (use-case-variant/05-rules.md)
- Rule: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed (use-case-variant/05-rules.md)

## Related Skills

- Create a Pragmatic Use Case (use-case-variant/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)

## Success Criteria

- The Use Case can be instantiated and tested without booting Laravel — pure PHP unit tests with mocked interfaces.
- The same Use Case class works identically when called from an HTTP controller, CLI command, or queue worker.
- The input DTO is the single source of truth for the operation's input contract — callers cannot pass incorrect data.
- The adapter layer (controller) is the only place where framework imports appear — the Use Case has zero framework coupling.
