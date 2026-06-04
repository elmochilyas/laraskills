# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Action classes: single-operation-per-class pattern
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Action classes (also called "single-action classes" or "commands") encapsulate one business operation per class. Instead of `UserService::register()` with 10 other methods, you have `RegisterUserAction::execute()`. Each action class has exactly one public method (typically `handle()` or `execute()`). This is the most granular organizational pattern: each operation is independently testable, injectable, and composable. Actions prevent the god service class problem by forcing a new class for each operation.

---

# Core Concepts

```php
class RegisterUserAction {
    public function __construct(
        private UserRepository $users,
        private WelcomeMailer $mailer,
    ) {}

    public function execute(array $data): User {
        $user = $this->users->create($data);
        $this->mailer->sendWelcome($user);
        return $user;
    }
}
```

Action classes follow the Command pattern from GoF. Each class represents a command that performs one complete business operation.

---

# Mental Models

**The "One Job" model:** Each action class has exactly one job. If you can't describe it in one sentence ("this action registers a user"), the action is too broad.

**The "Leaf Node" model:** Actions are leaf nodes in the call graph. They call models, repositories, and services—but not other actions. Composition happens at the service/orchestration level.

**The "Verb-Noun Command" model:** Action class names are commands: `RegisterUser`, `ProcessPayment`, `GenerateInvoice`, `SendWelcomeEmail`.

---

# Internal Mechanics

Actions can be invoked directly or via a command bus:
```php
// Direct invocation
$user = app(RegisterUserAction::class)->execute($data);

// Via dispatch helper (Laravel's bus)
$user = RegisterUserAction::dispatch($data);

// Via command bus
$user = $this->commandBus->dispatch(new RegisterUserCommand($data));
```

The `lorisleiva/laravel-actions` package provides a base class for actions with before/after hooks, validation, and authorization.

---

# Patterns

**Action as invokable class:** Actions can use `__invoke()`:
```php
class RegisterUserAction {
    public function __invoke(array $data): User { ... }
}
// Called as: app(RegisterUserAction::class)($data)
```

**Action with DTO:** Actions can accept typed DTOs:
```php
class RegisterUserAction {
    public function execute(RegisterUserDto $dto): User { ... }
}
```

**Chainable actions:** Some frameworks support chaining actions with conditional execution:
```php
RegisterUserAction::make()
    ->pipe(CreateWorkspaceAction::make())
    ->pipe(SendWelcomeNotificationAction::make());
```

---

# Architectural Decisions

**Use actions when:** Service classes are growing into god objects, operations are distinct enough to warrant individual classes, or you want maximum testability per operation.

**Use services when:** Operations are tightly related and share significant internal logic. Alternatives: extract shared logic to a service, keep actions for orchestration.

**Use both (recommended):** Services orchestrate workflows, actions are leaf-node operations. Services call actions, actions don't call actions.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Each operation is independently testable | Class explosion | 100 operations = 100 action classes |
| No god objects | Boilerplate per class | Each action has constructor + 1 method |
| Easy to understand single responsibility | File navigation overhead | Finding "all user operations" requires browsing 8 files |

---

# Performance Considerations

Action class resolution adds negligible overhead. Each action is resolved once per invocation.

---

# Production Considerations

Use consistent naming: `{Verb}{Noun}Action` or `{Verb}{Noun}`. Example: `CreateInvoiceAction`, `ProcessRefundAction`.

---

# Common Mistakes

**Actions calling actions:** Action A calls Action B directly. This creates opaque call graphs and couples actions. Services should orchestrate; actions should be leaf nodes.

**Actions with state:** Setting properties on an action between construction and execution. Under Octane, this leaks state between requests.

**Actions that are too large:** An action with 10+ constructor dependencies or 100+ lines of logic. It's doing too much. Split.

---

# Failure Modes

**Action explosion without organization:** 100 action classes in a flat `app/Actions/` directory. Group by domain: `app/Actions/User/RegisterUser.php`, `app/Actions/Order/CreateOrder.php`.

**Anemic actions:** Actions that simply call a single model method. `CreateUserAction::execute(['name' => $name])` → `User::create(...)` adds no value.

---

# Ecosystem Usage

The `lorisleiva/laravel-actions` package (3M+ downloads) popularized the action pattern in Laravel. Spatie uses action classes internally. Modulate's service-action-repository pyramid uses actions as leaf nodes.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-08 Action naming conventions | SLP-10 Service vs Action vs Use Case |
| SLP-03 Controller thinning | SLP-09 Dependency injection | SLP-19 Octane service state |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
