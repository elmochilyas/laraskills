# Action Class Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Action Class Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

An action class is a single-purpose class that executes one business operation. It typically has one public method (`execute()` or `__invoke()`), receives a DTO as input, performs the operation, and returns a result (model, DTO, or void). Action classes are the most granular unit of business logic in a Laravel application — they encapsulate a single "thing the application does."

The engineering significance of action class design is that it creates independently testable, composable units of business logic. Each action is a transaction boundary, a test boundary, and a reuse boundary. Unlike service classes (which group multiple operations), action classes are focused on one operation only. This makes them the preferred pattern for discrete CRUD operations and the building block for larger workflows.

---

## Core Concepts

### Single Responsibility Per Action

An action does one thing — and only one thing:

```php
class RegisterUserAction
{
    public function execute(RegisterUserDto $dto): User
    {
        return DB::transaction(fn() => User::create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => Hash::make($dto->password),
        ]));
    }
}
```

If an action does two things (create user + send email), it violates single responsibility. The email sending should be a separate action or an event listener.

### Invokable vs Execute Convention

```php
// Invokable pattern
class RegisterUserAction
{
    public function __invoke(RegisterUserDto $dto): User { /* ... */ }
}

// Execute pattern
class RegisterUserAction
{
    public function execute(RegisterUserDto $dto): User { /* ... */ }
}
```

Both conventions are valid. `__invoke` allows the action to be used as a callable (`$action($dto)`). `execute` is more explicit. Teams should pick one convention and apply it consistently.

### Dependencies via Constructor Injection

Actions declare their dependencies in the constructor, resolved by the container:

```php
class CreateOrderAction
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryService $inventory,
    ) {}

    public function execute(CreateOrderDto $dto): Order
    {
        $this->inventory->validateStock($dto->items);
        return $this->orders->create($dto);
    }
}
```

---

## Mental Models

### The Single-Use Tool

An action class is a specialized tool — like a torque wrench. It does one job precisely. You reach for it when you need that specific operation. You don't ask a torque wrench to also hammer nails.

### The Transaction Boundary

An action represents a unit of work that either completes fully or fails entirely. If the action is transactional, the boundary is explicit: all operations inside the action succeed together or roll back together.

---

## Internal Mechanics

### Container Resolution

Actions are resolved by the service container at the point of injection in controllers or other consumers:

```php
class UserController
{
    public function __construct(
        private RegisterUserAction $registerUser,
    ) {}

    public function store(CreateUserRequest $request)
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->registerUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

The container resolves `RegisterUserAction`, recursively resolving its dependencies (repositories, services, gateways).

### Action Composition (Internal)

An action can call other actions internally:

```php
class OnboardUserAction
{
    public function __construct(
        private CreateUserAction $createUser,
        private SendWelcomeEmailAction $sendWelcome,
        private CreateDefaultTeamAction $createTeam,
    ) {}

    public function execute(OnboardUserDto $dto): User
    {
        $user = $this->createUser->execute($dto);
        $this->sendWelcome->execute($user);
        $this->createTeam->execute($user);
        return $user;
    }
}
```

This is action composition — building complex workflows from simple, testable actions.

---

## Patterns

### Basic CRUD Action

```php
class UpdateProductAction
{
    public function __construct(
        private ProductRepository $products,
    ) {}

    public function execute(UpdateProductDto $dto): Product
    {
        $product = $this->products->findOrFail($dto->productId);
        return $this->products->update($product, $dto->toArray());
    }
}
```

### Action Returning Void (Delete)

```php
class DeleteProductAction
{
    public function execute(int $productId): void
    {
        Product::findOrFail($productId)->delete();
    }
}
```

The controller returns `204 No Content` for void actions.

### Action with Authorization

```php
class DeleteProductAction
{
    public function execute(User $actor, int $productId): void
    {
        Gate::forUser($actor)->authorize('delete', Product::class);
        Product::findOrFail($productId)->delete();
    }
}
```

Or pass the authorized check to the controller and keep the action pure.

---

## Architectural Decisions

### Action vs Service for Single Operations

Actions are the default choice for any discrete business operation. Services are used only when multiple actions share enough dependencies and context to warrant grouping. The rule: start with an action, extract to a service only when related operations grow to 3+.

### Action File Organization

```
app/Actions/
  Users/
    CreateUserAction.php
    UpdateUserAction.php
    DeleteUserAction.php
    FindUserAction.php
  Orders/
    CreateOrderAction.php
    CancelOrderAction.php
```

Domain-based directories within `Actions/` keep related actions grouped.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Independently testable — test one action in isolation | File per operation — 20 CRUD operations = 20 action files | Predictable, easy to navigate |
| Composable — actions call other actions | Action composition can create deep call chains | Keep composition to 2-3 levels |
| Clear transaction boundary per operation | Ceremony for trivial operations (toggle boolean) | Skip action for `Model::update($data)` with no logic |

---

## Performance Considerations

Action resolution cost is ~0.01ms per action (container resolution). Action composition multiplies this: calling 4 composed actions adds ~0.04ms resolution overhead. Negligible for any application.

---

## Production Considerations

### Naming Convention

Actions are named as `[Verb][Entity]Action`: `CreateUser`, `UpdateProfile`, `CancelOrder`, `AddTeamMember`. The verb prefix makes the action's purpose immediately clear.

### Action as Transaction Boundary

Each action is a natural transaction boundary. Wrapping the action body in `DB::transaction()` is the default pattern for write operations:

```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => User::create($dto->toArray()));
    }
}
```

### Testing Actions

```php
public function test_it_creates_a_user(): void
{
    $dto = new CreateUserDto(
        name: 'John',
        email: 'john@test.com',
        password: 'secret123',
    );

    $user = (new CreateUserAction(...))->execute($dto);

    $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
}
```

No HTTP, no request, no middleware — just the action and its dependencies.

---

## Common Mistakes

### Multi-Purpose Action (Action Scope Creep)
Why it happens: Adding "one more thing" to an action because it's related to the primary operation. Why it's harmful: The action is no longer single-purpose — it creates a user AND sends an email AND logs to audit. Better approach: Extract side effects to event listeners or separate actions composed by a coordinator.

### Action Without DTO
Why it happens: Passing `$request->validated()` or loose parameters to the action. Why it's harmful: The action signature doesn't document the required data. Better approach: Always accept a DTO as the primary parameter.

### Business Logic in Controller, Action is Just Pass-Through
Why it happens: The controller validates, constructs the DTO, then the action just calls `Model::create()`. Why it's harmful: The business logic (validation, preparation, authorization) is in the controller, not the action. Better approach: Move business rules into the action.

---

## Failure Modes

### Action Chain Too Deep
An action that calls an action that calls an action that calls a repository. Debugging a failure requires tracing through 4+ classes. Limit composition to 2-3 levels. Consider an orchestrator service for deep chains.

### Action That Does Nothing
An action that just forwards to `Model::create($dto->toArray())` without any business logic. The action adds ceremony without value. Consider whether the action is necessary, or if the controller can call the model directly.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses action classes for all team operations: `CreateTeam`, `UpdateTeamName`, `AddTeamMember`, `RemoveTeamMember`, `DeleteTeam`. This is the canonical example of action class design from the framework authors.

### Laravel Fortify
Fortify uses actions for authentication workflows: `CreateNewUser`, `ResetUserPassword`, `UpdateUserPassword`. Single-purpose, focused actions.

### Spatie Packages
Many Spatie packages use action classes for discrete operations. The pattern is consistent across the ecosystem.

---

## Related Knowledge Units

### Prerequisites
- Thin Controller Principle — Why controllers delegate to actions
- Data Transfer Object Design — DTO as action input

### Related Topics
- Action Composition — Composing actions into workflows
- Transactional Actions — Database transactions in action classes
- Controller-DTO-Action Flow — The flow pattern that uses actions

### Advanced Follow-up Topics
- Queued Actions — Dispatching actions to queues
- Action Decorators — Cross-cutting concerns via action wrapping

---

## Research Notes

### Source Analysis
- Laravel Jetstream: `App/Actions` — 10+ action classes for team management
- Laravel Fortify: Actions for authentication operations
- Spatie packages: Consistent action class usage

### Key Insight
Action classes are the most granular unit of business logic in Laravel. Their value is inversely proportional to their complexity — simple actions are easy to test, compose, and understand. The discipline is recognizing when an action has exceeded its single-purpose scope and needs refactoring.

### Version-Specific Notes
- Laravel 8+: `__invoke` single-action controllers complement action classes
- PHP 8.0+: Constructor property promotion standard for action DI
- No version-specific changes to action class patterns in Laravel 10-13
