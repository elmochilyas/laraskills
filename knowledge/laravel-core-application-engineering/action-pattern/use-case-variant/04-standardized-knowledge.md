# ECC Standardized Knowledge — Use Case Variant

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Use Case Variant |
| **Difficulty** | Expert |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

The Use Case variant extends the Action pattern with a framework-agnostic contract boundary. Unlike a standard action (which may accept an array, an Eloquent model, or a Request object), a Use Case enforces typed DTO input and typed result output — no HTTP classes, no Eloquent models in the signature, no framework imports in the business logic. This makes the Use Case callable identically from HTTP controllers, queue workers, CLI commands, and scheduled tasks, with zero framework coupling in its signature.

The engineering significance is that the Use Case variant represents the strictest architectural boundary in the Laravel ecosystem. It is the Clean Architecture / Hexagonal Architecture "use case" or "interactor" adapted to Laravel's conventions. The cost is boilerplate — every Use Case requires a DTO class and often an interface for its dependency. The benefit is framework portability: the same Use Case class can run in Laravel, Symfony, or a vanilla PHP worker without changing a line of code.

---

## Core Concepts

### The Three-Layer Contract

A Use Case enforces three distinct contracts: (1) Input contract — a typed DTO that carries all input data with no array access, no optional fields, and no HTTP awareness. (2) Output contract — a typed result object (DTO, Collection, or void) with no raw arrays or Eloquent models. (3) Dependency contract — constructor dependencies are interfaces, not concrete classes.

### Use Case vs Action vs Service

The distinguishing characteristic of a Use Case is the framework-agnostic guarantee. While an action may import Eloquent, facades, or Request objects, a Use Case has zero framework imports in its business logic. While an action may accept array or model input, a Use Case requires a typed DTO. While an action may depend on concrete classes, a Use Case depends on interfaces.

### The DTO Boundary

The DTO is the defining feature of the Use Case pattern. It is a plain PHP object with typed public readonly properties, contains no business logic, is serializable (for queue dispatch), is framework-agnostic (no Illuminate imports), and validates data shape at construction time.

### Zero Framework Import Rule

A Use Case class must not `use` any class from the `Illuminate` namespace, any facade, or any Laravel-specific helper function. The only exceptions are PHP built-in classes, project-specific interfaces and DTOs, and third-party domain libraries. If a Use Case imports `Request`, `Model`, or `DB`, it has ceased to be a Use Case and become a standard action.

---

## When To Use

- **Full Hexagonal Use Case** when the same business logic must run from HTTP, queue, and CLI identically with framework-agnostic contracts.
- **Pragmatic Laravel Use Case** (DTO input, Eloquent model output) when the input contract is the most valuable part and full result DTO overhead is not justified.
- **Use Case with event emission** when domain events must be dispatched through an interface (not directly through Laravel's Dispatcher), maintaining framework agnosticism.
- **Multi-entry-point operations** when an operation is called from at least 2-3 different entry points — the DTO overhead is recouped through reuse.
- **Hexagonal or Clean Architecture projects** where the architectural policy requires strict framework-boundary separation.

---

## When NOT To Use

- Do NOT use Use Cases for CRUD-only operations with no business logic — simple create/update/delete operations do not justify the DTO and interface overhead.
- Do NOT use Use Cases for operations called from a single entry point (HTTP-only) — the framework portability benefit is never realized.
- Do NOT use Use Cases in small teams (1-3 developers) where speed and simplicity are more important than strict architectural boundaries.
- Do NOT use Use Cases when the project has no plans for framework migration — the portability guarantee is theoretical, not practical, for most projects.
- Do NOT use Use Cases for operations that need to call Laravel-specific features (Eloquent scopes, Queued notifications, Broadcasting) inside the business logic — these break the zero-framework-import rule.

---

## Best Practices (WHY)

- **Use DTOs for input, not arrays.** A typed DTO provides compile-time safety, IDE autocompletion, and self-documenting interfaces. Arrays force the developer to remember the shape of the data — DTOs make the shape explicit.
- **Keep DTOs as simple data carriers.** A DTO should contain only typed properties and maybe validation at construction. No business logic, no methods beyond accessors.
- **Use interface dependencies.** Interface dependencies make the Use Case testable without booting Laravel — the test can mock any collaborator with zero framework setup.
- **Document the team convention.** The Use Case pattern is not a standard Laravel term. Document when to use it, how to structure DTOs, and where to place repository interfaces. New team members need explicit guidance.
- **Start pragmatic, evolve to strict.** Begin with DTO input + Eloquent model output (Pragmatic Use Case). If multi-entry-point reuse materializes, add result DTOs. If framework agnosticism becomes critical, add interface dependencies.

---

## Architecture Guidelines

- **Directory structure:** Use Case classes live in `app/UseCases/` (or domain subdirectories). DTOs live in `app/DTOs/`. Repository interfaces live in `app/Domain/Contracts/`. Infrastructure implementations live in `app/Infrastructure/Repositories/`.
- **Service provider binding:** Every Use Case interface dependency requires a service provider binding: `$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`. Without this, the container cannot resolve the Use Case.
- **Adapter layer:** The controller (adapter) extracts data from the Request, constructs the DTO, calls the Use Case, and maps the result to an HTTP response. The Use Case never touches HTTP.
- **Result DTO mapping:** The mapping between Eloquent models and result DTOs happens in the infrastructure layer (repository), not in the Use Case.
- **Transaction boundary:** The Use Case does not own its transaction (same rule as actions). The entry point or a service orchestrator manages the transaction boundary.
- **Interface growth:** Repository interfaces can grow to 40+ methods if every Use Case adds its own query. Consider query objects or specification pattern for complex queries.

---

## Performance

Each DTO instantiation is a plain PHP object allocation — typically 0.001-0.005ms. Calling a method on an interface has the same performance as calling it on a concrete class in PHP (after OpCache). A Use Case that returns a result DTO constructs a new object from the model's data (approximately 0.01ms overhead vs returning the model directly). The performance impact of all these is negligible for single-call scenarios. For batch processing (1000+ Use Case calls), DTO allocations accumulate but are still minor compared to database query time.

---

## Security

The zero-framework-import rule improves security posture by preventing the Use Case from accidentally bypassing Laravel's security layers (e.g., calling `DB::statement()` directly instead of going through a repository). All database access goes through repository interfaces, which can enforce access control, logging, and query filtering. Authorization checks should happen in the adapter layer (controller or middleware) or through an authorization interface, not in the Use Case itself — keeping the Use Case focused on business logic.

---

## Common Mistakes

- **Use Case imports framework classes.** A Use Case that imports `Illuminate\Http\Request`, `Facades\DB`, or `Eloquent\Model` has broken the framework-agnostic contract. Move the dependency to the infrastructure layer.
- **DTO with business logic.** Adding validation, authorization, or computation to a DTO violates its purpose. A DTO is a data carrier. Business logic belongs in the Use Case.
- **Every operation is a Use Case.** `UpdateUserNameUseCase` with a `UpdateUserNameDTO`, `UserRepositoryInterface`, and `UserDTO` is overengineering for a single field update. Use actions or services for simple CRUD.
- **Repository interface over-parameterization.** Every Use Case adding its own method to the repository interface creates a god interface with dozens of methods. Use query objects for specialized queries.
- **Missing service provider binding.** The Use Case's interface dependencies are not bound in the service provider. The container throws `BindingResolutionException` at runtime.
- **DTO-model mapping errors.** A DTO-to-Eloquent mapping that omits a required field causes a database-level error at runtime. The DTO mapping is explicit — every field must be mapped.

---

## Anti-Patterns

- **Use Case that is never called from multiple entry points.** The full DTO + interface + mapping overhead was paid but never recouped. The operation only runs from HTTP — a standard action would have sufficed.
- **Use Case that directly uses Eloquent.** A Use Case that calls `User::create($dto->toArray())` inside its execute method breaks the zero-framework-import rule and couples the domain logic to Eloquent.
- **Use Case with no interface dependencies.** If every dependency is a concrete class, the Use Case cannot be tested without booting Laravel. The framework-agnostic benefit is lost.
- **DTO with hundreds of fields.** A DTO that mirrors a database table with 50+ fields is a data transfer anti-pattern. Use smaller, operation-specific DTOs that carry only the data needed for that specific operation.
- **Use Case naming without DTO.** A class named `RegisterUserUseCase` that accepts an array parameter has the name of a Use Case but the contract of an action. The DTO is what makes it a Use Case.

---

## Examples

### Full Hexagonal Use Case
```php
final readonly class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}

final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $user = $this->users->create(
            $dto->name,
            $dto->email,
            $this->hasher->hash($dto->password),
        );
        return new UserDTO(
            id: $user->id,
            name: $user->name,
            email: $user->email,
        );
    }
}

// Adapter (Controller)
class RegisterUserController
{
    public function __construct(private RegisterUserUseCase $registerUser) {}

    public function __invoke(RegisterUserRequest $request): UserResource
    {
        $dto = new RegisterUserDTO(
            name: $request->validated('name'),
            email: $request->validated('email'),
            password: $request->validated('password'),
        );
        $result = $this->registerUser->execute($dto);
        return new UserResource($result);
    }
}
```

### Pragmatic Use Case (DTO Input, Model Output)
```php
final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function execute(RegisterUserDTO $dto): User
    {
        return $this->users->create(
            $dto->name,
            $dto->email,
            $this->hasher->hash($dto->password),
        );
    }
}
```

---

## Related Topics

- **Action Class Design** (prerequisite) — the Use Case is a specialized variant of the Action; understanding the base pattern is prerequisite.
- **Dependency Injection** (prerequisite) — constructor injection for interface dependencies.
- **Service Container Basics** (prerequisite) — binding interfaces to implementations.
- **Action vs Service vs Use Case** — the three-way decision framework.
- **Domain vs Application Services** — how domain services align with the Use Case's framework-agnostic requirement.
- **Action Naming Conventions** — Use Case naming follows similar conventions (`RegisterUserUseCase`).
- **Hexagonal Architecture with Laravel** — the full architectural pattern that Use Cases belong to.
- **CQRS** — how Use Cases map to commands and queries in a CQRS system.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, DTOs (prerequisites). Serves as prerequisite for Action vs Service vs Use Case, Hexagonal Architecture.
- **Use Case is NOT a standard Laravel pattern.** It is a Clean Architecture import into the Laravel ecosystem. Most production Laravel applications use services or actions, not explicit Use Cases.
- **Pragmatic Use Case** (DTO input, Eloquent output) is the recommended entry point for teams adopting the pattern. It captures the most valuable part (input contract) while minimizing boilerplate.
- **Zero framework import rule** is aspirational. In practice, many "Use Cases" import `Log`, `Cache`, or `Event` facades. Strict enforcement increases class count significantly.
- **Spatie's laravel-data package** reduces DTO boilerplate significantly. Teams adopting the Use Case pattern should evaluate this package.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Three-layer contract documented | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Zero framework import rule documented | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
