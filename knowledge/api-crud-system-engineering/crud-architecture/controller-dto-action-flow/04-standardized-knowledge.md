# ECC Standardized Knowledge — Controller-DTO-Action Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-DTO-Action Flow |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The Controller-DTO-Action flow is a request processing pattern where a controller receives an HTTP request, constructs a typed DTO from validated input, passes it to a single-action class for business logic execution, and returns the result. This is the most common three-layer pattern for CRUD operations in modern Laravel applications — it provides maximum separation of concerns with minimum indirection. Each layer has a distinct responsibility: the controller handles HTTP, the DTO enforces a typed data contract, and the action executes a single business operation.

## Core Concepts

- **Three-Layer Responsibility Map**: Controller (parse request, delegate, respond — HTTP-aware), DTO (type-safe data carrier — not HTTP-aware), Action (single business operation — not HTTP-aware)
- **DTO Construction Timing**: DTO is built in the controller after FormRequest validation, receiving only validated data — never raw request input
- **Action Execution and Container Resolution**: Actions are resolved through the service container with all constructor DI wired automatically
- **No HTTP Leakage**: The action never receives `$request` — it receives a DTO containing only the data it needs, guaranteeing HTTP-agnostic testing
- **Single-Action Class Convention**: Actions are invokable or single-method classes (`execute()` or `__invoke()`) receiving a DTO and returning a result

## When To Use

- Discrete CRUD operations (create user, update profile, place order)
- When each operation maps to a single action class capturing the entire workflow
- Applications with <50 models where a full service layer adds unnecessary ceremony
- When independent testability of business logic without HTTP is a priority

## When NOT To Use

- When multiple related operations share enough dependencies to warrant a service class
- For operations with complex cross-cutting concerns (multi-step workflows, orchestration)
- When the DTO would be an exact copy of the FormRequest with no additional value
- For trivial operations with zero business logic (no conditionals, no side effects)

## Best Practices

- Construct DTOs from FormRequest validated data using a `fromRequest()` factory method
- Name actions by operation: `CreateUserAction`, `UpdateProfileAction`, `DeleteUserAction`
- Place DTOs adjacent to their actions under `app/Actions/` or organized by domain
- Return `204 No Content` for void actions (delete operations)
- Test the flow without HTTP by constructing DTOs directly and calling actions

## Architecture Guidelines

- Use DTO when data shape is complex, reused across multiple actions, or must guarantee type safety
- Pass `$request->validated()` directly only when data crosses two layers and the shape is simple (3-5 fields)
- Every action class is a file — for trivial operations (toggle boolean), consider skipping the action
- The pattern adds ~0.01ms per request for DTO construction and action resolution — negligible

## Performance Considerations

- DTO construction and action resolution adds ~0.01ms per request — immeasurable for typical CRUD (10-50ms total)
- Action class autoloading is zero-cost with OpCache
- DTO property promotion (PHP 8.0+) eliminates constructor boilerplate overhead

## Security Considerations

- Authorization should happen before or during action execution — never in the DTO
- The DTO should only carry data, never perform authorization or validation beyond type enforcement
- Actions must not implicitly trust the DTO — business rule validation should still occur in the action
- Ensure DTOs don't carry sensitive data beyond what the action needs (principle of least data)

## Common Mistakes

- **Passing `$request` to Action**: The action becomes HTTP-coupled. Solution: Extract everything into a DTO.
- **DTO and FormRequest Duplication**: Feels like duplication but is intentional — validation and data transport are separate concerns.
- **Action Contains HTTP Logic**: Action returns a redirect or sets a cookie. Solution: Return domain data; let the controller handle HTTP concerns.
- **DTO-Action Mismatch**: DTO fields change but action consumers aren't updated. PHP type hints catch constructor mismatches, but `fromArray()` can silently allow missing keys.

## Anti-Patterns

- **Fat Controller**: Controller contains business logic instead of delegating to the action. Makes testing require HTTP scaffolding.
- **Anemic Action**: Action is a pass-through to `Model::create()` with no business logic. The action adds ceremony without value.
- **DTO-Less Flow**: Passing `$request->validated()` or loose parameters to the action. Loses type safety and self-documenting signatures.

## Examples

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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Thin Controller Principle | Why controllers delegate to actions | Prerequisite |
| Data Transfer Object Design | DTO patterns for typed data transport | Prerequisite |
| Action Class Design | Single-action class patterns | Related |
| Controller-DTO-Service Flow | When a service layer sits between | Related |
| Action Composition | Composing multiple actions in a workflow | Follow-up |
| Transactional Actions | Database transactions inside actions | Follow-up |
| Queued Actions | Dispatching actions to queues | Follow-up |

## AI Agent Notes

- This is the default pattern for CRUD operations in Laravel — use it unless there is a specific reason for more layers
- The pattern is the sweet spot: enough structure for separation of concerns without service layer ceremony
- Most applications with <50 models should default to this pattern and only introduce services when cross-cutting coordination is needed
- When generating code, create FormRequest → DTO → Action → Controller wiring in that dependency order

## Verification

- [ ] Controller constructs DTO from validated request data, not from `$request` directly
- [ ] Action receives DTO, not `$request` or loose parameters
- [ ] Action has no HTTP imports or HTTP return types
- [ ] DTO is a typed class with named properties, not an associative array
- [ ] Controller builds response from action result
- [ ] Flow is testable without HTTP for the action layer
- [ ] Three-layer responsibility boundaries are respected
