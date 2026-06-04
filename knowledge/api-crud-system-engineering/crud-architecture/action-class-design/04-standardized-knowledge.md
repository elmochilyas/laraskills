# ECC Standardized Knowledge — Action Class Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Action Class Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

An action class is a single-purpose class that executes one business operation. It has one public method (`execute()` or `__invoke()`), receives a DTO as input, performs the operation, and returns a result (model, DTO, or void). Action classes are the most granular unit of business logic in Laravel — they encapsulate a single "thing the application does" and serve as independently testable, composable units. Each action is a transaction boundary, a test boundary, and a reuse boundary.

## Core Concepts

- **Single Responsibility Per Action**: An action does one thing only — create a user, update a profile, cancel an order. If an action does two things (create user + send email), it violates single responsibility.
- **Invokable vs Execute Convention**: `__invoke` allows the action to be used as a callable (`$action($dto)`). `execute` is more explicit. Pick one convention and apply it consistently.
- **Dependencies via Constructor Injection**: Actions declare their dependencies in the constructor, resolved by the container. No HTTP dependencies — actions are transport-agnostic.
- **DTO as Input Contract**: Actions receive a typed DTO, never a `$request` object. This guarantees the action is HTTP-agnostic and testable without HTTP scaffolding.
- **Action as Transaction Boundary**: Each write action is a natural boundary for `DB::transaction()`. All operations inside the action succeed together or roll back together.

## When To Use

- Discrete CRUD operations (create, update, delete, find)
- Operations with business logic beyond a single `Model::create()` call
- When independent testability of business operations is desired
- As building blocks for larger composed workflows
- When the same operation needs to be callable from different entry points (HTTP, CLI, queue)

## When NOT To Use

- Trivial operations without business logic (simple `Model::update($data)` with no conditionals or side effects)
- When ceremony exceeds value for very simple boolean toggles
- As a replacement for event listeners when side effects should be decoupled
- For operations spanning multiple domains that require cross-cutting orchestration (use a service instead)

## Best Practices

- Name actions as `[Verb][Entity]Action`: `CreateUserAction`, `UpdateProfileAction`, `CancelOrderAction`
- Always accept a DTO as the primary parameter — never pass `$request` or loose parameters
- Wrap write operations in `DB::transaction()` by default
- Keep actions stateless — all request-specific data arrives through method parameters
- Limit action composition to 2-3 levels to avoid deep call chains

## Architecture Guidelines

- Place actions under `app/Actions/` organized by domain subdirectory (`app/Actions/Users/`, `app/Actions/Orders/`)
- Use constructor property promotion (PHP 8.0+) for dependency injection
- The container resolves actions automatically — no service provider binding needed for concrete classes
- Skip the action layer for operations with zero business logic; go from controller directly to model

## Performance Considerations

- Action resolution cost is ~0.01ms per action (container resolution)
- Action composition multiplies this — calling 4 composed actions adds ~0.04ms resolution overhead
- Overhead is negligible for any application compared to database query time (1-50ms)
- OpCache eliminates autoloading cost entirely

## Security Considerations

- Actions should receive already-authorized data — authorization checks happen in the controller or via `Gate` inside the action
- Never pass the authenticated user implicitly via `auth()->user()` in an action — pass it explicitly as a parameter
- Transactional actions prevent partial writes that could leave the system in an insecure inconsistent state

## Common Mistakes

- **Multi-Purpose Action**: Adding "one more thing" to an action because it's related. Solution: Extract side effects to event listeners or separate actions composed by a coordinator.
- **Action Without DTO**: Passing `$request->validated()` or loose parameters. Solution: Always accept a DTO as the primary parameter.
- **Business Logic in Controller, Action is Pass-Through**: Action just calls `Model::create()` while logic is in the controller. Solution: Move business rules into the action.
- **Action That Does Nothing**: Forwards to `Model::create($dto->toArray())` without any business logic. Solution: Consider whether the action is necessary at all.

## Anti-Patterns

- **God Action**: An action that handles multiple related operations (create + send email + log to audit + notify admin). Violates single responsibility.
- **HTTP-Coupled Action**: Action depends on `Illuminate\Http\Request` or returns a redirect. Makes the action untestable outside HTTP context.
- **Action with Multiple Public Methods**: An action class should expose exactly one public method. Multiple methods indicate the class is a service, not an action.

## Examples

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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Data Transfer Object Design | DTO as action input | Prerequisite |
| Thin Controller Principle | Why controllers delegate to actions | Prerequisite |
| Action Composition | Composing actions into workflows | Related |
| Transactional Actions | Database transactions in action classes | Related |
| Controller-DTO-Action Flow | The flow pattern that uses actions | Related |
| Queued Actions | Dispatching actions to queues | Follow-up |

## AI Agent Notes

- Action classes are the default choice for any discrete business operation in Laravel
- Services should only be used when multiple actions share enough dependencies to warrant grouping
- The convention (`execute` vs `__invoke`) must be consistent across the entire codebase
- Actions are transport-agnostic — they should never import HTTP-related classes
- When generating actions, create the corresponding DTO first, then the action, then wire it in the controller

## Verification

- [ ] Action has exactly one public method
- [ ] Action receives a DTO, not `$request`
- [ ] Action does not import any HTTP-related classes
- [ ] Action is stateless (no per-request mutable properties)
- [ ] Write operations are wrapped in `DB::transaction()`
- [ ] Action name follows `[Verb][Entity]Action` convention
- [ ] Action is independently testable without HTTP scaffolding
