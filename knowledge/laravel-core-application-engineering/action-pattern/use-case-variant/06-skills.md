# Skill: Create a Pragmatic Use Case

## Purpose

Build a Use Case with a typed DTO input boundary and framework-agnostic business logic while pragmatically returning Eloquent models and using concrete dependencies — capturing 80% of the architectural benefit with 30% of the overhead.

## When To Use

- The same operation must be called from 2+ entry points (HTTP controller, CLI command, queue worker).
- The operation has enough business logic to justify a dedicated input contract (validation, computation, multiple steps).
- The team is adopting the Use Case pattern and wants to start with minimal boilerplate.
- The operation's input data shape is complex (5+ fields) and benefits from a typed contract.

## When NOT To Use

- Single-entry-point operations — the DTO overhead is not justified.
- Simple CRUD operations with no business logic — Eloquent models or actions suffice.
- Full Hexagonal Architecture is required by policy — interface dependencies and result DTOs are needed.
- The team is not ready for the added class count — each Use Case adds at least a DTO file.

## Prerequisites

- PHP 8.1+ for typed properties and promoted constructor.
- Understanding of the Use Case pattern: typed DTO input, framework-agnostic business logic, optional result DTO.
- A clear operation specification with defined inputs and outputs.

## Inputs

- The operation specification: inputs, business logic, outputs.
- The entry points that will call this Use Case.
- The existing infrastructure (Eloquent models, repositories, hashers).

## Workflow

1. **Name the Use Case.** Use VerbNoun + UseCase suffix: `RegisterUserUseCase`, `ProcessRefundUseCase`. Place in `app/UseCases/{Domain}/` or `app/Actions/{Domain}/`.

2. **Create the input DTO.** Create `app/DTOs/{OperationName}Data.php` or co-locate with the Use Case. Add typed `public readonly` properties for every field the Use Case needs. The DTO is a pure data carrier — no methods beyond the constructor.
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

3. **Create the Use Case class.** Create `app/UseCases/{Domain}/{OperationName}UseCase.php`. Declare it `final readonly class` (PHP 8.2+).

4. **Define constructor dependencies.** Inject infrastructure dependencies (repositories, hashers, loggers) as concrete classes. For a Pragmatic Use Case, interfaces are optional.
   ```php
   public function __construct(
       private EloquentUserRepository $users,
       private BcryptHasher $hasher,
   ) {}
   ```

5. **Define the execute method.** Accept exactly one parameter: the typed input DTO. Return an Eloquent model (pragmatic). Keep framework imports out of the method body — use injected collaborators instead of facades.
   ```php
   public function execute(RegisterUserDTO $dto): User
   {
       $user = $this->users->create(
           name: $dto->name,
           email: $dto->email,
           password: $this->hasher->hash($dto->password),
       );
       return $user;
   }
   ```

6. **Ensure zero framework imports in business logic.** Scan the `execute()` method for any `Illuminate\*` imports, facade calls (`\Log::`, `\Cache::`), or helper functions (`session()`, `request()`, `auth()`, `cache()`). Replace each with an injected dependency.

7. **Create the adapter (controller).** The controller extracts data from the HTTP request, constructs the DTO, calls the Use Case, and maps the result to a response. The Use Case never touches HTTP.
   ```php
   public function __invoke(RegisterUserRequest $request): UserResource
   {
       $dto = new RegisterUserDTO(
           name: $request->validated('name'),
           email: $request->validated('email'),
           password: $request->validated('password'),
       );
       $user = $this->registerUserUseCase->execute($dto);
       return new UserResource($user);
   }
   ```

8. **Write tests.** Test the Use Case by instantiating it directly (with mocked or real dependencies). Test the input contract — verify that the DTO enforces the correct types. Test the business logic with both valid and invalid inputs.

## Validation Checklist

- [ ] Input DTO is `final readonly` with typed `public readonly` properties
- [ ] DTO contains no business logic — pure data carrier
- [ ] Use Case method accepts exactly one typed DTO parameter
- [ ] Use Case has zero `Illuminate\*` imports in the execute method body
- [ ] Use Case uses injected dependencies instead of facades/helpers
- [ ] Controller constructs the DTO from the HTTP request
- [ ] Transaction boundary is NOT in the Use Case (delegated to orchestrator if needed)
- [ ] Tests verify both valid and invalid input paths

## Common Failures

- **Use Case accepts array input.** A class named `RegisterUserUseCase` taking `array $data` is an Action, not a Use Case. The typed DTO is what makes it a Use Case.
- **DTO with business logic.** Adding `validate()`, `toArray()`, or computed methods violates its purpose. Keep DTOs as pure data carriers.
- **Framework imports in business logic.** `use Illuminate\Support\Facades\Log` silently couples it to Laravel. Inject a `LoggerInterface` instead.
- **Missing adapter layer.** The controller passes the Request object directly to the Use Case, coupling it to HTTP.

## Decision Points

- **Pragmatic vs Full Hexagonal:** Start with the Pragmatic variant. Upgrade to Full Hexagonal only when multi-entry-point reuse materializes.
- **DTO directory:** Place DTOs in `app/DTOs/` for shared DTOs. Co-locate if the DTO is used by a single Use Case.
- **Spatie laravel-data:** Consider using `spatie/laravel-data` for automatic validation, transformation, and serialization support.

## Performance Considerations

- DTO instantiation adds ~0.001-0.005ms — negligible.
- Returning Eloquent models (pragmatic) has zero overhead vs a result DTO.

## Security Considerations

- The DTO provides compile-time input validation — incorrect types cause a TypeError at the call site.
- Never pass DTO properties directly to Eloquent `::create()`. Map explicit fields to prevent mass-assignment vulnerabilities.

## Related Rules

- Rule: Enforce Zero Framework Imports in Use Case Business Logic (use-case-variant/05-rules.md)
- Rule: Use Typed DTOs for All Use Case Input, Never Raw Arrays (use-case-variant/05-rules.md)
- Rule: Keep DTOs as Simple Data Carriers with Typed Readonly Properties (use-case-variant/05-rules.md)
- Rule: Do Not Create Use Cases for Single-Entry-Point Operations (use-case-variant/05-rules.md)
- Rule: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed (use-case-variant/05-rules.md)

## Related Skills

- Upgrade an Action to a Use Case (action-vs-service-vs-usecase/06-skills.md)
- Create a Full Hexagonal Use Case (use-case-variant/06-skills.md)

## Success Criteria

- The Use Case has a typed input contract — callers know exactly what data is required.
- The Use Case can be called from HTTP, CLI, or queue identically (the caller constructs the DTO).
- The Use Case has zero `Illuminate\*` imports in its execute method — it could theoretically run in a non-Laravel context.
- The Use Case is testable without HTTP concerns — pure PHP instantiation with real or mocked dependencies.

---

# Skill: Create a Full Hexagonal Use Case

## Purpose

Build a strict Hexagonal Architecture Use Case with typed DTO input and output, interface dependencies, and zero framework imports — enabling framework-portable business logic.

## When To Use

- The architectural policy requires strict framework-boundary separation (Hexagonal/Clean Architecture).
- The same Use Case must run in multiple frameworks or in a vanilla PHP worker.
- The team has 10+ developers and needs the strictest possible boundaries between domain and infrastructure.

## When NOT To Use

- Single-entry-point operations — the DTO and interface overhead is not justified.
- Small teams (1-3 developers) where speed is more important than strict boundaries.
- Projects with no plans for framework migration — the portability guarantee is theoretical.

## Prerequisites

- PHP 8.1+ for typed properties and promoted constructor.
- Understanding of Hexagonal Architecture: domain layer (Use Cases, DTOs, interfaces), infrastructure layer.
- A service provider that can bind interfaces to implementations.
- The Pragmatic Use Case skill (start pragmatic, evolve to full hexagonal).

## Inputs

- The operation specification.
- Knowledge of all infrastructure implementations (repository, hasher, mailer bindings).
- The entry points that will call this Use Case.

## Workflow

1. **Create the input DTO.** A `final readonly class` with typed `public readonly` properties. Pure data carrier — no business logic.
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

2. **Create the result DTO.** A separate DTO for output containing only the data the caller needs. No Eloquent models, no framework classes.
   ```php
   final readonly class UserDTO
   {
       public function __construct(
           public int $id,
           public string $name,
           public string $email,
           public string $createdAt,
       ) {}
   }
   ```

3. **Extract interfaces for all constructor dependencies.** Create interfaces in `app/Contracts/`. Define only the methods the Use Case calls.
   ```php
   interface UserRepositoryInterface
   {
       public function create(string $name, string $email, string $password): array;
       public function findByEmail(string $email): ?array;
   }

   interface PasswordHasherInterface
   {
       public function hash(string $password): string;
   }
   ```

4. **Create the Use Case class.** `final readonly class`. Inject only interfaces — no concrete classes.
   ```php
   final readonly class RegisterUserUseCase
   {
       public function __construct(
           private UserRepositoryInterface $users,
           private PasswordHasherInterface $hasher,
       ) {}
   }
   ```

5. **Implement execute.** Accept the input DTO, perform business logic through interfaces, map to the output DTO. Zero framework imports.
   ```php
   public function execute(RegisterUserDTO $dto): UserDTO
   {
       $userData = $this->users->create(
           name: $dto->name,
           email: $dto->email,
           password: $this->hasher->hash($dto->password),
       );
       return new UserDTO(
           id: $userData['id'],
           name: $userData['name'],
           email: $userData['email'],
           createdAt: $userData['created_at'],
       );
   }
   ```

6. **Create infrastructure implementations.** Implement each interface with Laravel-specific code. Implementations may import framework classes.
   ```php
   class EloquentUserRepository implements UserRepositoryInterface
   {
       public function create(string $name, string $email, string $password): array
       {
           $user = User::create(compact('name', 'email', 'password'));
           return $user->toArray();
       }
   }
   ```

7. **Bind interfaces in a service provider.** Register every interface binding. Add a boot-time assertion to catch missing bindings early.
   ```php
   public function register(): void
   {
       $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
       $this->app->bind(PasswordHasherInterface::class, BcryptHasher::class);
   }
   public function boot(): void
   {
       $this->app->make(RegisterUserUseCase::class);
   }
   ```

8. **Create the adapter layer (controller).** Controller constructs input DTO from Request, calls Use Case, maps result DTO to HTTP response.
   ```php
   public function __invoke(RegisterUserRequest $request): UserResource
   {
       $dto = new RegisterUserDTO(
           name: $request->validated('name'),
           email: $request->validated('email'),
           password: $request->validated('password'),
       );
       $result = $this->registerUserUseCase->execute($dto);
       return new UserResource($result);
   }
   ```

9. **Write pure unit tests.** Instantiate with mock interface implementations. No Laravel boot.
   ```php
   public function test_it_registers_a_user(): void
   {
       $repo = Mockery::mock(UserRepositoryInterface::class);
       $repo->shouldReceive('create')->once()->andReturn([...]);
       $hasher = Mockery::mock(PasswordHasherInterface::class);
       $hasher->shouldReceive('hash')->once()->andReturn('hashed');
       $useCase = new RegisterUserUseCase($repo, $hasher);
       $result = $useCase->execute(new RegisterUserDTO('John', 'john@test.com', 'secret'));
       $this->assertInstanceOf(UserDTO::class, $result);
   }
   ```

## Validation Checklist

- [ ] Input DTO is `final readonly` with typed properties
- [ ] Output DTO is `final readonly` with typed properties
- [ ] Use Case depends only on interfaces in constructor
- [ ] Use Case has zero `Illuminate\*` imports anywhere in the file
- [ ] Use Case does not call any facade, helper, or Laravel-specific function
- [ ] All interfaces are bound in a service provider with boot-time assertion
- [ ] Controller constructs DTOs and maps responses — no framework logic in the Use Case
- [ ] Use Case is testable without booting Laravel (pure PHP unit test)

## Common Failures

- **Interface explosion.** Every Use Case adding methods to the same repository interface creates a god interface. Use query objects for specialized queries.
- **Missing service provider binding.** The container throws `BindingResolutionException` at runtime because an interface is not bound.
- **DTO with hundreds of fields.** A DTO mirroring a database table with 50+ fields is an anti-pattern. Use smaller, operation-specific DTOs.
- **Result DTO mapping errors.** A DTO-to-interface return mapping that omits a required field causes a runtime error. Every field must be explicitly mapped.

## Decision Points

- **Pragmatic vs Full Hexagonal:** Upgrade from Pragmatic to Full Hexagonal only when multi-entry-point reuse or framework portability becomes a real requirement. Most teams never need Full Hexagonal.
- **Interface granularity:** One method per interface (role interfaces) vs grouped interfaces per domain. Role interfaces are more flexible but create more files.

## Performance Considerations

- DTO instantiation adds ~0.001-0.005ms. Negligible.
- Interface method calls have the same performance as concrete method calls in PHP (after OpCache).

## Security Considerations

- The zero-framework-import rule prevents bypassing Laravel's security layers. All database access goes through repository interfaces.
- Authorization checks should happen in the adapter layer or through an authorization interface — not in the Use Case itself.

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
- Upgrade an Action to a Use Case (action-vs-service-vs-usecase/06-skills.md)

## Success Criteria

- The Use Case can be instantiated and tested without booting Laravel — pure PHP unit tests with mocked interfaces.
- The same Use Case class works identically when called from HTTP, CLI, or queue worker.
- The Use Case file contains zero `Illuminate\*` imports — it could run in a non-Laravel context with compatible infrastructure implementations.
- All interface dependencies are bound in a service provider with boot-time verification.
