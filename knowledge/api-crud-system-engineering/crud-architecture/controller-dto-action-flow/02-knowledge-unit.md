# Controller-DTO-Action Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Controller-DTO-Action Flow
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Controller-DTO-Action flow is a request processing pattern where a controller receives an HTTP request, constructs a typed DTO from validated input, passes it to a single-action class for business logic execution, and returns the result. This is the most common three-layer pattern for CRUD operations in modern Laravel applications — it provides maximum separation of concerns with minimum indirection.

Each layer has a distinct responsibility: the controller handles HTTP, the DTO enforces a typed data contract, and the action executes a single business operation. The pattern shines for discrete operations (create user, update profile, place order) where a single action class captures the entire workflow. When operations involve multiple steps or cross-cutting concerns, services orchestrate multiple actions.

---

## Core Concepts

### Three-Layer Responsibility Map

| Layer | Responsibility | HTTP-Aware? | Testable Without HTTP? |
|-------|---------------|-------------|----------------------|
| Controller | Parse request, delegate, respond | Yes | No |
| DTO | Type-safe data carrier | No | Yes |
| Action | Single business operation | No | Yes |

### The Flow

```
HTTP Request
    → Router matches URI
    → Middleware runs (auth, throttle, validation)
    → Controller method receives validated data
    → Controller constructs DTO from validated data
    → Controller calls Action->execute(DTO)
    → Action executes business logic (queries, writes, events)
    → Action returns result (model, DTO, void)
    → Controller builds response from result
    → Response sent through middleware
```

### Single-Action Class Convention

Actions are invokable or single-method classes (`execute()` or `__invoke()`). They receive a DTO and return a result:

```php
class RegisterUserAction
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function execute(RegisterUserDto $dto): User
    {
        return $this->users->create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => $this->hasher->hash($dto->password),
        ]);
    }
}
```

---

## Mental Models

### The Assembly Line

The HTTP request moves through stations: Controller (unpacks raw input) → DTO (validates packaging) → Action (does the work) → back to Controller (packages result). Each station does one thing and passes the workpiece to the next.

### The Three-Layer Sandwich

Controller (bread), DTO (filling), Action (bread). The DTO is the filling — the substantive typed data that the business logic operates on. The controller and action are structural layers that handle I/O and processing respectively.

---

## Internal Mechanics

### DTO Construction Timing

DTO construction happens in the controller, after FormRequest validation but before action execution. The DTO receives only validated data — never raw request input:

```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request); // validated data only
    $user = $this->createUser->execute($dto);
    return response()->json($user, 201);
}
```

### Action Execution and Container Resolution

Actions are resolved through the service container. Dependencies are injected via constructor. The action's `execute()` method receives only the DTO — transport-agnostic data:

```php
// Action resolved by container — all constructor DI wired automatically
$action = app(CreateUserAction::class);
$result = $action->execute($dto);
```

### No HTTP Leakage

The action never receives the `$request` object. It receives a DTO containing only the data it needs. This guarantees the action is HTTP-agnostic and testable without HTTP scaffolding.

---

## Patterns

### Canonical Controller-DTO-Action

```php
class UserController
{
    public function __construct(
        private CreateUserAction $createUser,
    ) {}

    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

### Action Returning Void

```php
class DeleteUserAction
{
    public function execute(DeleteUserDto $dto): void
    {
        User::findOrFail($dto->userId)->delete();
    }
}
```

Controller returns `204 No Content` for void actions.

### Action Returning DTO

```php
class GetUserProfileAction
{
    public function execute(GetUserDto $dto): UserProfileDto
    {
        $user = User::findOrFail($dto->userId);
        return new UserProfileDto(
            name: $user->name,
            email: $user->email,
            joinedAt: $user->created_at,
        );
    }
}
```

Action returns a DTO instead of an Eloquent model, controlling exactly what data is exposed.

---

## Architectural Decisions

### When to Use DTO vs Pass Validated Array

Pass `$request->validated()` directly when data crosses only two layers (controller → action) and the data shape is simple (3-5 fields). Introduce a DTO when the data shape is complex, reused across multiple actions, or must guarantee type safety.

### Action vs Inline Logic

Every action class is a file. For trivial operations (toggle boolean, simple status update), the action adds ceremony. The rule: if the operation has no business logic (just `Model::update($data)`), consider skipping the action. If it has one conditional or one side-effect, extract it.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear layer boundaries — each class has one responsibility | Three files per CRUD operation (Controller, DTO, Action) | More files to navigate, but predictable structure |
| Actions are independently testable without HTTP | DTO must be kept in sync with request validation | Add DTO tests for complex construction logic |
| Action reuse across entry points (HTTP, CLI, queue) | Action file count grows with operations | Organize actions by domain, not by HTTP route |

---

## Performance Considerations

The pattern adds ~0.01ms per request for DTO construction and action resolution. For typical CRUD operations (10-50ms total), this overhead is immeasurable. Action class autoloading is zero-cost with OpCache.

---

## Production Considerations

### Action Naming Convention

Actions are named by operation: `CreateUserAction`, `UpdateProfileAction`, `DeleteUserAction`. The name documents the action's single responsibility. Avoid generic names like `UserAction` or `ProcessAction`.

### DTO File Organization

Place DTOs alongside or adjacent to their actions:
```
app/
  Actions/
    CreateUserAction.php
  DTOs/
    CreateUserDto.php
```
Or organize by domain:
```
app/
  Users/
    Actions/
      CreateUserAction.php
    DTOs/
      CreateUserDto.php
```

### Testing the Flow Without HTTP

```php
$dto = new CreateUserDto(name: 'Test', email: 'test@test.com');
$user = (new CreateUserAction(...))->execute($dto);
$this->assertDatabaseHas('users', ['email' => 'test@test.com']);
```

No HTTP calls, no request mocking, no middleware. Pure business logic test.

---

## Common Mistakes

### Passing $request to Action
Why it happens: The action needs data from the request, and passing the whole request is faster than extracting a DTO. Why it's harmful: The action becomes HTTP-coupled and impossible to call from a CLI command or queue job. Better approach: Extract everything the action needs into a DTO.

### DTO and FormRequest Duplication
Why it happens: The FormRequest validates fields, and the DTO declares the same fields — it feels like duplication. Why it's harmful: The duplication is intentional — validation and data transport are separate concerns. Better approach: Accept the duplication. Use DTO factories to bridge the gap.

### Action Contains HTTP Logic
Why it happens: The action needs to return a redirect or set a cookie. Why it's harmful: The action now depends on HTTP concepts. Better approach: Return domain data from the action; let the controller handle HTTP concerns.

---

## Failure Modes

### DTO-Action Mismatch
DTO fields change but action consumers aren't updated. PHP type hints catch constructor parameter mismatches, but array-based DTO construction (`fromArray`) can silently allow missing keys.

### Action Scope Creep
An action starts as a single operation (`CreateUser`) but accumulates related operations (`CreateUser + send welcome email + log to audit + notify admin`). The action is no longer single-purpose. Extract side effects to event listeners or queued jobs.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses this pattern exclusively for team operations: `CreateTeam`, `UpdateTeamName`, `AddTeamMember`, `RemoveTeamMember`. Controllers are thin, DTOs are implicit (validated arrays), actions handle all business logic.

### Laravel Fortify
Fortify's actions (`CreateNewUser`, `ResetUserPassword`, `UpdateUserPassword`) follow the same pattern. The framework authors consistently use Controller → Action for discrete operations.

---

## Related Knowledge Units

### Prerequisites
- Thin Controller Principle — Why controllers delegate to actions
- Data Transfer Object Design — DTO patterns for typed data transport

### Related Topics
- Controller-DTO-Service Flow — When a service layer sits between controller and action
- Action Class Design — Single-action class patterns and conventions
- Action Composition — Composing multiple actions in a workflow

### Advanced Follow-up Topics
- Transactional Actions — Database transactions inside actions
- Queued Actions — Dispatching actions to queues for async execution

---

## Research Notes

### Source Analysis
- Laravel Jetstream: `App/Actions` — canonical example of Controller-DTO-Action
- Laravel Fortify: Actions for all authentication operations
- Spatie packages: Consistent use of action classes for discrete operations

### Key Insight
The Controller-DTO-Action pattern is the sweet spot for CRUD architecture. It provides enough structure for separation of concerns without the ceremony of a full service layer. Most Laravel applications with <50 models should default to this pattern and only introduce services when cross-cutting coordination is needed.

### Version-Specific Notes
- Laravel 8+ `__invoke` single-action controllers complement this pattern
- PHP 8.0+ constructor promotion makes DTO and action declarations minimal
