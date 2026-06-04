# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Use Case classes with DTO contracts
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Use Case classes represent a single business intent, bridging the gap between action classes (too granular) and service classes (too broad). A use case encapsulates a complete business interaction—what the user wants to achieve. "Register User" is a use case. "Process Checkout" is a use case. Use cases receive typed DTOs, coordinate domain objects, and return output DTOs. They are the natural evolution of service classes toward the Application layer in Clean Architecture.

---

# Core Concepts

Use cases are characterized by:
- **Single business intent:** One use case = one user goal
- **DTO contracts:** Input and output are typed DTOs
- **Framework independence:** No HTTP imports, no facades
- **Orchestration role:** Coordinates domain objects and infrastructure interfaces

```php
class RegisterUserUseCase {
    public function __construct(
        private UserRepository $users,
        private EventDispatcher $events,
    ) {}

    public function execute(RegisterUserDto $dto): RegisteredUserDto {
        // Validate business rules
        if ($this->users->existsByEmail($dto->email)) {
            throw new UserAlreadyExistsException();
        }

        // Create domain entity
        $user = User::register($dto->email, $dto->password);

        // Persist
        $this->users->save($user);

        // Dispatch events
        $this->events->dispatch(new UserRegistered($user->id()));

        return new RegisteredUserDto($user->id(), $user->email());
    }
}
```

---

# Mental Models

**The "User Story Encapsulation" model:** A use case directly maps to a user story. "As a visitor, I want to register an account" → `RegisterUserUseCase`. One use case class per user story.

**The "Input/Output Contract" model:** The DTOs define the contract. Any delivery mechanism (HTTP, CLI, queue) that can construct the input DTO and handle the output DTO can use this use case.

**The "Application Layer Heart" model:** In Clean Architecture, use cases are the Application layer. They contain no business rules (those are in Domain) and no infrastructure (those are in Infrastructure). They only orchestrate.

---

# Internal Mechanics

Use cases are resolved by the service container and injected into controllers:
```php
class UserController {
    public function store(StoreUserRequest $request, RegisterUserUseCase $useCase): UserResource {
        $result = $useCase->execute(RegisterUserDto::fromRequest($request));
        return new UserResource($result);
    }
}
```

Multiple delivery mechanisms can use the same use case:
```php
// CLI command
class RegisterUserCommand extends Command {
    public function handle(RegisterUserUseCase $useCase): void {
        $dto = new RegisterUserDto($this->argument('email'), $this->argument('password'));
        $useCase->execute($dto);
    }
}
```

---

# Patterns

**Use case as Invokable:** Single-method use cases can use `__invoke()`:
```php
class RegisterUserUseCase {
    public function __invoke(RegisterUserDto $dto): RegisteredUserDto { ... }
}
```

**Unit of Work pattern:** The use case manages the transaction boundary:
```php
public function execute(RegisterUserDto $dto): RegisteredUserDto {
    return DB::transaction(function () use ($dto) {
        // ... domain operations ...
    });
}
```

---

# Architectural Decisions

**Use use cases when:** The application has complex business operations with distinct intents, you need multiple delivery mechanisms, or you're following Clean Architecture.

**Use service classes when:** Operations are simple CRUD. Service methods are sufficient without the ceremony of individual use case classes.

**Use action classes when:** Operations are simple enough that a single `execute()` method suffices, but you want the granularity of individual classes.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear mapping from business intent to code | More classes than service layer | Each business operation = 1 use case + 2 DTOs |
| Multi-delivery mechanism support | DTO mapping boilerplate | Request → DTO → Use Case = extra transform step |
| Framework-independent business orchestration | Learning curve for team | Team must understand use case vs. service vs. action |
| Testable without HTTP | Use case composition is complex | Using a use case inside another use case is discouraged |

---

# Performance Considerations

Use case resolution adds one more layer of indirection. Negligible for most applications.

---

# Production Considerations

Use cases are the right level for logging and monitoring. Log which use cases are executed, with timing. This provides business-level observability.

---

# Common Mistakes

**Business logic in use cases:** Putting domain rules (discount calculations, validation) in the use case. These belong in domain entities or domain services.

**Framework coupling in use cases:** `use Illuminate\Http\Request` or `Facades\DB` in a use case. Framework code belongs in adapters.

**Giant use cases:** A use case that does everything: register user, create workspace, send emails, set up billing, and schedule onboarding. Split into coordinated use cases or use a service.

---

# Failure Modes

**Use case proliferation:** 100+ use cases for a simple CRUD application. The overhead of individual classes, DTOs, and tests for each CRUD operation isn't justified.

**Use case calling use case:** One use case depends on another use case. This couples business intents. Extract shared logic to domain services.

---

# Ecosystem Usage

The `laravel-clean-architecture` package scaffolds use cases and DTOs. The `backslashphp/backslash` CQRS framework uses commands/queries (a variation of use cases). Spatie's `laravel-event-sourcing` uses use cases internally.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-05 DTO pattern | SLP-10 Service vs Action vs Use Case | LAP-06 Application layer |
| SLP-01 Service classes | CPC-08 CQRS pattern | LAP-09 Framework independence |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
