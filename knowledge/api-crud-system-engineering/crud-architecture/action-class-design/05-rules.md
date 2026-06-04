# Action Class Design — Rules

## Rule 1: One Public Method Per Action
---
## Category
Architecture
---
## Rule
Always expose exactly one public method (`execute()` or `__invoke()`) per action class.
---
## Reason
Multiple public methods turn an action into a service, losing the single-responsibility guarantee and confusing consumers about the class's purpose.
---
## Bad Example
```php
class UserAction
{
    public function create(CreateUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function delete(int $id): void { /* ... */ }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User { /* ... */ }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Ambiguous class contract, testing requires mocking multiple methods, consumers don't know which method to call.
</rule>

## Rule 2: DTO as Single Input Parameter
---
## Category
Architecture
---
## Rule
Always accept a typed DTO as the primary parameter; never pass `$request`, arrays, or loose scalar parameters individually.
---
## Reason
A DTO enforces a typed contract, documents all required data, and decouples the action from HTTP. Loose parameters allow subtle bugs when signatures change.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(string $name, string $email, string $password): User { /* ... */ }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User { /* ... */ }
}
```
---
## Exceptions
Simple lookup by ID: `execute(int $id)` is acceptable for find/delete where a DTO would add ceremony without value.
---
## Consequences Of Violation
HTTP-coupled actions, brittle parameter lists, missing data when callers forget to pass parameters.
</rule>

## Rule 3: No HTTP Dependencies in Actions
---
## Category
Architecture
---
## Rule
Never import or depend on `Illuminate\Http\Request`, `Response`, or any HTTP-related class inside an action.
---
## Reason
HTTP imports couple the action to the request-response cycle, making it untestable without HTTP scaffolding and unreusable from CLI/queue.
---
## Bad Example
```php
use Illuminate\Http\Request;

class CreateUserAction
{
    public function execute(Request $request): RedirectResponse { /* ... */ }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User { /* ... */ }
}
```
---
## Exceptions
No common exceptions. Actions must remain transport-agnostic.
---
## Consequences Of Violation
Untestable outside HTTP context, cannot dispatch to queue, cannot call from CLI commands, violates layer isolation.
</rule>

## Rule 4: Stateless Action Design
---
## Category
Design
---
## Rule
Never store per-request mutable state on action properties; all request-specific data must arrive through method parameters.
---
## Reason
Mutable state makes actions unsafe for singleton resolution, causes cross-request data leaks under Octane, and breaks test isolation.
---
## Bad Example
```php
class CreateUserAction
{
    private string $tempEmail;

    public function execute(CreateUserDto $dto): User
    {
        $this->tempEmail = $dto->email; // ❌ Mutable state
        return $this->doCreate();
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => User::create($dto->toArray()));
    }
}
```
---
## Exceptions
No common exceptions. Actions must always be stateless.
---
## Consequences Of Violation
Race conditions under Octane, flaky tests due to shared state, impossible to reason about action behavior.
</rule>

## Rule 5: Write Operations Wrapped in Transactions
---
## Category
Reliability
---
## Rule
Always wrap write operations in `DB::transaction()` inside the action method.
---
## Reason
Without transactions, partial failures leave the database in an inconsistent state — a user created but profile not, inventory decremented but order not placed.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = User::create($dto->toArray());
        $user->profile()->create($dto->profile->toArray()); // May fail after User::create committed
        return $user;
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            $user->profile()->create($dto->profile->toArray());
            return $user;
        });
    }
}
```
---
## Exceptions
Read-only actions (find, search) do not need transactions. Idempotent single-table writes may also skip with explicit justification.
---
## Consequences Of Violation
Partial data writes, unrecoverable inconsistent state, time-consuming data repair operations.
</rule>

## Rule 6: Name Actions as Verb + Entity + Action
---
## Category
Code Organization
---
## Rule
Always name action classes using the `[Verb][Entity]Action` convention — `CreateUserAction`, `UpdateProfileAction`, `CancelOrderAction`.
---
## Reason
Consistent naming makes actions discoverable via IDE search, self-documents the operation, and prevents duplicate or overlapping actions.
---
## Bad Example
```php
class UserHandler { /* ... */ }
class UserManager { /* ... */ }
class DoStuff { /* ... */ }
```
---
## Good Example
```php
class CreateUserAction { /* ... */ }
class UpdateUserAction { /* ... */ }
class DeleteUserAction { /* ... */ }
```
---
## Exceptions
No common exceptions. All action classes across the entire codebase must follow the same naming convention.
---
## Consequences Of Violation
Undiscoverable action classes, duplicate logic created because existing action could not be found, onboarding confusion.
</rule>

## Rule 7: Prefer Concrete Class Resolution Over Service Provider Binding
---
## Category
Framework Usage
---
## Rule
Do not register concrete action classes in service providers; let the container auto-resolve them without binding.
---
## Reason
Laravel's container can instantiate concrete classes without explicit binding. Adding bindings for every action creates unnecessary maintenance and obscures the architecture.
---
## Bad Example
```php
// ServiceProvider
public function register(): void
{
    $this->app->bind(CreateUserAction::class, CreateUserAction::class); // ❌ Unnecessary
    $this->app->bind(UpdateUserAction::class, UpdateUserAction::class);
}
```
---
## Good Example
```php
// No binding needed — the container resolves concrete classes automatically
class UserController
{
    public function __construct(
        private CreateUserAction $createUser, // Auto-resolved
    ) {}
}
```
---
## Exceptions
Only bind when an action implements an interface and multiple implementations exist, or when constructor arguments require manual configuration.
---
## Consequences Of Violation
Unnecessary boilerplate, service provider clutter, harder to understand which classes are resolved where.
</rule>

## Rule 8: Skip Actions Only for Trivial Operations
---
## Category
Architecture
---
## Rule
Skip the action layer only when the operation has zero business logic — a direct `Model::create()` or `Model::find()` with no conditionals, no side effects, and no transformations.
---
## Reason
Every file has a cost. An action that just forwards to `Model::create()` with no additional logic adds ceremony without value. Only create actions when they encapsulate meaningful business behavior.
---
## Bad Example
```php
// Action with zero business logic — pure ceremony
class CreateTagAction
{
    public function execute(CreateTagDto $dto): Tag
    {
        return Tag::create($dto->toArray());
    }
}
```
---
## Good Example
```php
// Controller calls Model directly for trivial operations
class TagController
{
    public function store(CreateTagRequest $request): JsonResponse
    {
        $tag = Tag::create($request->validated());
        return response()->json($tag, 201);
    }
}
```
---
## Exceptions
Keep the action if consistency (all operations wrapped in actions) is valued more than ceremony reduction, or if the operation is likely to gain business rules soon.
---
## Consequences Of Violation
File bloat, developer resentment toward the architecture, increased maintenance surface for zero benefit.
</rule>

## Rule 9: Pass Authenticated User Explicitly
---
## Category
Security
---
## Rule
Never call `auth()->user()` or `Auth::user()` inside an action; pass the authenticated user as an explicit method parameter or DTO field.
---
## Reason
Implicit auth calls make the action dependent on the session state, untestable without authentication setup, and unreliable when called from queue workers (which have no authenticated user).
---
## Bad Example
```php
class DeleteUserAction
{
    public function execute(DeleteUserDto $dto): void
    {
        $currentUser = auth()->user(); // ❌ Implicit HTTP dependency
        // ...
    }
}
```
---
## Good Example
```php
class DeleteUserAction
{
    public function execute(DeleteUserDto $dto, User $actor): void
    {
        // $actor is passed explicitly from the controller
    }
}
```
---
## Exceptions
No common exceptions. Actions must always receive the actor explicitly.
---
## Consequences Of Violation
Untestable without session setup, broken when dispatched to queue, security bugs when auth context is wrong.
</rule>
