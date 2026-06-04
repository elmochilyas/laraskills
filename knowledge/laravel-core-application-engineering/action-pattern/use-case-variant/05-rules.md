# Phase 5: Use Case Variant Rules

---

## Rule: Enforce Zero Framework Imports in Use Case Business Logic

---

## Category

Architecture

---

## Rule

Use Case classes must not import any class from the `Illuminate` namespace, call any facade (`\Facades\*`), or use any Laravel helper function (`session()`, `request()`, `auth()`, `cache()`) inside the `execute()` method body. The business logic must be framework-agnostic.

---

## Reason

The zero-framework-import rule is the defining characteristic of the Use Case pattern. It guarantees that the same class can run in Laravel, Symfony, or a vanilla PHP worker without modification. Framework imports in a Use Case silently couple domain logic to Laravel, negating the portability and interface-testability benefits that justify the Use Case's overhead.

---

## Bad Example

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RegisterUserUseCase
{
    public function execute(RegisterUserDTO $dto): UserDTO
    {
        Log::info('Registering user');  // Framework import — breaks agnosticism
        DB::table('users')->insert(...);  // Direct DB facade — couples to Laravel
        return new UserDTO(/* ... */);
    }
}
```

---

## Good Example

```php
// Zero framework imports — pure PHP + project interfaces:
class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private LoggerInterface $logger,
    ) {}

    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $this->logger->info('Registering user');
        $user = $this->users->create(
            $dto->name,
            $dto->email,
            $dto->password,
        );
        return new UserDTO(
            id: $user->id,
            name: $user->name,
            email: $user->email,
        );
    }
}
```

---

## Exceptions

Adapter-layer code that constructs DTOs from HTTP requests or maps results to HTTP responses sits outside the Use Case and may import framework classes. The Use Case itself — and only the Use Case — must be framework-agnostic.

---

## Consequences Of Violation

Architecture risks: the Use Case's framework-portability promise is broken. Testing risks: Use Cases with framework imports require Laravel boot even for unit tests. Maintenance risks: upgrading Laravel may require changes in Use Case code that should be framework-agnostic.

---

---

## Rule: Use Typed DTOs for All Use Case Input, Never Raw Arrays

---

## Category

Architecture

---

## Rule

Use Case `execute()` methods must accept exactly one parameter: a typed DTO object. Raw arrays, individual scalar parameters, Eloquent models, and Request objects are forbidden as Use Case input.

---

## Reason

The DTO input boundary is the most important architectural signal distinguishing a Use Case from an Action. Requiring a typed DTO enforces an explicit input contract — the developer cannot guess the expected data shape because it is defined in a class. The DTO provides compile-time safety, IDE autocompletion, serialization support for queueing, and a discoverable data contract.

---

## Bad Example

```php
class RegisterUserUseCase
{
    // Array input — indistinguishable from an Action:
    public function execute(array $data): UserDTO
    {
        // What keys does $data need? No way to tell from the signature
        return $this->users->create($data);
    }
}
```

---

## Good Example

```php
final readonly class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}

class RegisterUserUseCase
{
    // Typed DTO — the contract is explicit:
    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $user = $this->users->create(
            $dto->name,
            $dto->email,
            $dto->password,
        );
        return new UserDTO(
            id: $user->id,
            name: $user->name,
            email: $user->email,
        );
    }
}
```

---

## Exceptions

No common exceptions. If the input fits in 1-2 stable, never-changing parameters, the operation may be better suited as an Action rather than a Use Case. Requiring a DTO is the cost of the Use Case pattern — if the cost is too high, use an Action instead.

---

## Consequences Of Violation

Architecture risks: classes named Use Case behave as Actions, eroding the pattern's semantic value. Maintenance risks: array contract changes are not caught by static analysis. Reliability risks: production errors surface when callers pass incorrect array keys.

---

---

## Rule: Keep DTOs as Simple Data Carriers with Typed Readonly Properties

---

## Category

Design

---

## Rule

DTO classes must contain only typed `public readonly` properties and may include a constructor. DTOs must not contain business logic, validation methods, computation, or behavior. They are data carriers and nothing more.

---

## Reason

Putting business logic in a DTO violates the single-responsibility principle and scatters domain rules across the codebase. A DTO with validation or computation logic cannot be used consistently across all callers because the logic is embedded in the data structure, not in the Use Case that owns the operation. Validation and computation belong in the Use Case or in dedicated validation classes.

---

## Bad Example

```php
class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}

    // Business logic in a DTO — wrong:
    public function validate(): array
    {
        $errors = [];
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email';
        }
        if (strlen($this->password) < 8) {
            $errors[] = 'Password too short';
        }
        return $errors;
    }

    public function hashedPassword(): string
    {
        return bcrypt($this->password);  // Computed value — not a DTO concern
    }
}
```

---

## Good Example

```php
final readonly class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
    // No methods — pure data carrier
}

// Validation lives in the Use Case or in a dedicated validator:
class RegisterUserUseCase
{
    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $this->validator->assertValidRegistration($dto);
        $hashedPassword = $this->hasher->hash($dto->password);
        // ...
    }
}
```

---

## Exceptions

DTOs may include static factory methods (`fromArray()`, `fromRequest()`) for construction convenience, but these must not contain business logic — they only map input formats to typed properties.

---

## Consequences Of Violation

Maintenance risks: business logic is scattered across DTOs, Use Cases, and validators instead of being centralized. Testing risks: DTO logic must be tested separately from Use Case logic. Reliability risks: DTO validation may diverge from Use Case validation, creating inconsistent rules.

---

---

## Rule: Depend on Interfaces, Not Concrete Classes, in Use Case Constructors

---

## Category

Architecture

---

## Rule

All constructor dependencies in a Use Case must be interfaces. Concrete class dependencies are forbidden. Infrastructure implementations must be bound to interfaces via service providers.

---

## Reason

Interface dependencies enable framework-agnostic unit testing — the Use Case can be instantiated with mock implementations without booting Laravel, a database, or any framework infrastructure. They also deliver on the Use Case's portability promise: swapping the storage layer (Eloquent → MongoDB, MySQL → Redis) requires only a new interface implementation and a service provider rebinding, with zero changes to the Use Case.

---

## Bad Example

```php
use App\Repositories\EloquentUserRepository;

class RegisterUserUseCase
{
    public function __construct(
        private EloquentUserRepository $users,  // Concrete class — framework coupling
        private BcryptHasher $hasher,            // Concrete class — framework coupling
    ) {}
    // Cannot be tested without booting Laravel and connecting to a database
}
```

---

## Good Example

```php
use App\Contracts\UserRepositoryInterface;
use App\Contracts\PasswordHasherInterface;

class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,    // Interface — framework-agnostic
        private PasswordHasherInterface $hasher,   // Interface — framework-agnostic
    ) {}
    // Testable with any implementation — pure PHP unit tests
}

// Service provider:
public function register(): void
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
    $this->app->bind(PasswordHasherInterface::class, BcryptHasher::class);
}
```

---

## Exceptions

Pragmatic Use Cases in the early stages of adoption may use concrete repository classes as a stepping stone. The team must plan to migrate to interfaces before the second entry point is added.

---

## Consequences Of Violation

Testing risks: Use Cases require full Laravel boot even for simple unit tests. Architecture risks: the framework-portability promise is broken — switching storage requires changing Use Case code. Scalability risks: interface extraction becomes a breaking change when concrete class dependencies are already used in many places.

---

---

## Rule: Bind Every Use Case Interface Dependency in a Service Provider

---

## Category

Framework Usage

---

## Rule

Every interface that a Use Case depends on must have a concrete implementation bound in a service provider. Missing bindings must cause an explicit, documented failure at boot time — not a silent resolution error at runtime.

---

## Reason

The container cannot resolve a Use Case if any interface dependency is unbound. The error surfaces as a `BindingResolutionException` only when the Use Case is first requested — which may be minutes or hours after deployment. Explicit boot-time registration catches missing bindings during deployment validation, not during a user-facing request.

---

## Bad Example

```php
// Use Case depends on an interface:
class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,  // No binding exists
    ) {}
}

// First request to /api/register — BindingResolutionException at runtime
// The error surfaces in production, not during deployment
```

---

## Good Example

```php
// Service provider — explicit binding:
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class,
        );
        $this->app->bind(
            PasswordHasherInterface::class,
            BcryptHasher::class,
        );
    }
}

// Optional: Boot-time assertion
public function boot(): void
{
    $this->app->make(RegisterUserUseCase::class);
    // Throws immediately if any binding is missing
}
```

---

## Exceptions

Interface bindings that are registered by third-party packages (e.g., Spatie's `laravel-data` or `laravel-permission`) do not need explicit project-level binding. Only project-specific interfaces require explicit registration.

---

## Consequences Of Violation

Reliability risks: runtime crashes when the container attempts to resolve an unbound interface. Debugging difficulty: the error message does not indicate which binding is missing — the developer must trace the entire dependency chain. Operational risks: deployments may appear successful but fail on the first user request.

---

---

## Rule: Do Not Create Use Cases for Single-Entry-Point Operations

---

## Category

Design

---

## Rule

A Use Case must only be created when the same business operation is called from at least two entry points (HTTP controller, CLI command, queue worker, event listener, scheduled task). Operations called from a single entry point must use Actions or Services.

---

## Reason

The Use Case pattern incurs overhead: a DTO class, an interface (or concrete dependency), and often a result DTO. This overhead is justified only when it is recouped through multi-entry-point reuse. A single-entry-point Use Case pays the DTO and interface costs without receiving the portability benefit — the same operation could be expressed as an Action with less ceremony and identical behavior.

---

## Bad Example

```php
// Single-entry-point — only called from HTTP:
class UpdateUserNameDTO
{
    public function __construct(public int $id, public string $name) {}
}

class UpdateUserNameUseCase
{
    public function __construct(private UserRepositoryInterface $users) {}
    public function execute(UpdateUserNameDTO $dto): void { /* ... */ }
}

// Controller:
public function updateName(UpdateNameRequest $request): JsonResponse
{
    $dto = new UpdateUserNameDTO($request->validated('id'), $request->validated('name'));
    $this->updateUserNameUseCase->execute($dto);
    return response()->json(['message' => 'Updated']);
}
// 3 extra files (DTO, Use Case, Interface) for a single-entry-point operation
```

---

## Good Example

```php
// Single-entry-point — Action is sufficient:
class UpdateUserNameAction
{
    public function __construct(private UserRepository $users) {}
    public function execute(int $id, string $name): void
    {
        $this->users->update($id, ['name' => $name]);
    }
}

// Controller:
public function updateName(UpdateNameRequest $request): JsonResponse
{
    $this->updateUserNameAction->execute(
        $request->validated('id'),
        $request->validated('name'),
    );
    return response()->json(['message' => 'Updated']);
}
// 1 file — no DTO, no interface overhead
```

---

## Exceptions

Greenfield projects that know from the start (by architectural policy or documented requirements) that a given operation will be called from multiple entry points may create Use Cases proactively.

---

## Consequences Of Violation

Performance risks: DTO and interface overhead is paid without benefit. Maintenance risks: every single-entry-point Use Case adds 2-3 extra files that must be navigated and maintained. Code Organization risks: the codebase becomes dominated by boilerplate DTO and interface files.

---

---

## Rule: Do Not Create Use Cases for CRUD-Only Operations with No Business Logic

---

## Category

Design

---

## Rule

Use Cases must not be created for simple CRUD operations (create, read, update, delete) that contain no business logic beyond data persistence. Eloquent models, service methods, or actions must be used for CRUD-only operations.

---

## Reason

A Use Case that simply passes data through to a repository and returns a result DTO has a boilerplate-to-logic ratio of 10:1 or worse — a DTO class, an interface, a service provider binding, a result DTO, and the Use Case itself — for a single line of actual work. The architectural overhead is not justified when the "business logic" is a database insert.

---

## Bad Example

```php
// CRUD-only — no business logic:
class CreateProductDTO
{
    public function __construct(
        public string $name,
        public float $price,
        public string $sku,
    ) {}
}

class CreateProductUseCase
{
    public function __construct(private ProductRepositoryInterface $products) {}
    public function execute(CreateProductDTO $dto): ProductDTO
    {
        $product = $this->products->create([
            'name' => $dto->name,
            'price' => $dto->price,
            'sku' => $dto->sku,
        ]);
        return new ProductDTO($product->id, $product->name, $product->price);
    }
}
// 4 files for a single create operation — overengineering
```

---

## Good Example

```php
// CRUD-only — Eloquent directly:
Product::create($request->validated());

// Or if reuse is needed, an Action:
class CreateProductAction
{
    public function execute(array $data): Product
    {
        return Product::create($data);
    }
}
// 1 file — no DTO, no interface, no service provider binding
```

---

## Exceptions

CRUD operations that must adhere to a strict framework-agnostic architectural policy (e.g., a Hexagonal Architecture project) and are called from multiple entry points may justify Use Cases — but only if the business logic complexity justifies the overhead.

---

## Consequences Of Violation

Performance risks: unnecessary architectural overhead for simple operations. Maintenance risks: boilerplate files outnumber meaningful business logic files. Code Organization risks: the codebase is dominated by DTOs and interfaces that add no value.

---

---

## Rule: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed

---

## Category

Architecture

---

## Rule

Teams adopting the Use Case pattern must start with the Pragmatic variant (typed DTO input, Eloquent model output, concrete repository dependencies) and evolve to the Full Hexagonal variant (DTO input, DTO output, interface dependencies) only when the codebase demonstrates a clear need for result DTOs or framework-agnostic portability.

---

## Reason

The Pragmatic variant captures the most valuable part of the Use Case pattern — a typed input contract — while minimizing the boilerplate cost. Most teams never need result DTOs (the Eloquent model can be returned directly), and most projects never migrate frameworks. Paying for full interface infrastructure and result DTOs upfront is premature when the pragmatic variant covers 80% of the benefit with 30% of the cost.

---

## Bad Example

```php
// Full Hexagonal from day one — even for a single-entry-point CRUD operation:
class CreateProductDTO { /* ... */ }
class ProductRepositoryInterface { /* ... */ }
class CreateProductUseCase { /* ... */ }
class ProductDTO { /* ... */ }
// 4 files for one operation — 10x more boilerplate than business logic

// Meanwhile, 90% of the app's other operations are still in-line in controllers
```

---

## Good Example

```php
// Pragmatic Use Case — DTO input, Eloquent model output:
class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}

class RegisterUserUseCase
{
    public function __construct(
        private EloquentUserRepository $users,  // Concrete — pragmatic
        private BcryptHasher $hasher,            // Concrete — pragmatic
    ) {}
    public function execute(RegisterUserDTO $dto): User  // Model output — pragmatic
    {
        return $this->users->create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => $this->hasher->hash($dto->password),
        ]);
    }
}

// Upgrade only when needed: add DTO output, extract interfaces, bind in provider
```

---

## Exceptions

Greenfield Hexagonal Architecture projects with explicit framework-agnostic policies may start with Full Hexagonal from day one. The decision must be documented and justified by architectural requirements, not by convention.

---

## Consequences Of Violation

Performance risks: unnecessary boilerplate for operations that never need full decoupling. Maintenance risks: developers resist the Use Case pattern because of its reputation for overengineering. Adoption risks: teams abandon the Use Case pattern entirely after experiencing premature full-hexagonal overhead.

---
