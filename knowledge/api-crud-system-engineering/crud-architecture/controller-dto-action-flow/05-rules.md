# Controller-DTO-Action Flow — Rules

## Rule 1: Controller Constructs DTO from Validated Data Only
---
## Category
Architecture
---
## Rule
Always construct DTOs from `$request->validated()` or a `fromRequest()` factory method, never from `$request->all()` or raw request input.
---
## Reason
Raw input may contain unvalidated or unexpected fields. Validated data guarantees type safety and prevents mass-assignment vulnerabilities from reaching the action layer.
---
## Bad Example
```php
public function store(Request $request): JsonResponse
{
    $dto = new CreateUserDto(...$request->all()); // ❌ Unvalidated data
    $user = $this->createUser->execute($dto);
    return response()->json($user, 201);
}
```
---
## Good Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request);
    $user = $this->createUser->execute($dto);
    return response()->json($user, 201);
}
```
---
## Exceptions
No common exceptions. DTOs must always receive validated data.
---
## Consequences Of Violation
Mass-assignment vulnerabilities, unvalidated data reaching business logic, silent failures from unexpected fields.
</rule>

## Rule 2: Action Receives DTO, Never Request
---
## Category
Layer Isolation
---
## Rule
Never pass `$request` or any HTTP object to an action; the action must only receive DTOs or scalar parameters.
---
## Reason
Passing the request couples the action to HTTP, making it untestable without HTTP scaffolding and unreusable from CLI/queue. The DTO is the explicit boundary between HTTP and business logic.
---
## Bad Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    return $this->createUser->execute($request); // ❌ Request passed to action
}
```
---
## Good Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request);
    return $this->createUser->execute($dto);
}
```
---
## Exceptions
No common exceptions. The DTO is always the boundary.
---
## Consequences Of Violation
HTTP-coupled actions, impossible to test without calling the API, cannot dispatch actions to queue, layer isolation collapse.
</rule>

## Rule 3: Action Returns Domain Data, Controller Handles HTTP Response
---
## Category
Architecture
---
## Rule
Never return HTTP-specific types (RedirectResponse, JsonResponse, View) from an action; return domain data (models, DTOs, void) and let the controller build the response.
---
## Reason
Actions that return HTTP responses are no longer transport-agnostic and cannot be reused from CLI, queue, or tests that expect domain data.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): JsonResponse // ❌ HTTP response
    {
        $user = User::create($dto->toArray());
        return response()->json($user, 201);
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
No common exceptions. Actions must never handle HTTP response concerns.
---
## Consequences Of Violation
Untestable actions, unreusable from queue/CLI, HTTP logic scattered outside the controller layer.
</rule>

## Rule 4: Three-Layer Responsibility Boundaries Must Be Respected
---
## Category
Architecture
---
## Rule
Never cross layer boundaries: Controller handles HTTP only, DTO carries typed data only, Action executes business logic only.
---
## Reason
Crossing boundaries — such as the controller calling Eloquent directly or the action returning HTTP responses — collapses the architecture and makes every layer responsible for everything.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts')->find($id); // ❌ Controller queries model
        return response()->json($user);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = $this->findUser->execute($id);
        return response()->json($user);
    }
}
```
---
## Exceptions
Trivial operations with zero business logic (simple lookups, boolean toggles) may skip the action layer with explicit `@layer-skip` annotation.
---
## Consequences Of Violation
Architecture collapse, untestable HTTP-coupled logic, no clear ownership of any concern, debugging across flat code.
</rule>

## Rule 5: Return 204 for Void Actions
---
## Category
Framework Usage
---
## Rule
Always return `204 No Content` for actions that return void (delete operations, toggles).
---
## Reason
A void action has no body to return. 204 is the semantically correct HTTP status for successful operations with no response body, avoiding empty JSON objects or confusing null values.
---
## Bad Example
```php
public function destroy(int $id): JsonResponse
{
    $this->deleteUser->execute($id);
    return response()->json(['success' => true]); // ❌ 200 with meaningless body
}
```
---
## Good Example
```php
public function destroy(int $id): JsonResponse
{
    $this->deleteUser->execute($id);
    return response()->json(null, 204);
}
```
---
## Exceptions
No common exceptions. 204 is the standard for successful void operations.
---
## Consequences Of Violation
API consumers parse empty or meaningless response bodies, inconsistent HTTP semantics across endpoints.
</rule>

## Rule 6: Test Flow Without HTTP by Constructing DTOs Directly
---
## Category
Testing
---
## Rule
Always test actions by constructing DTOs directly in test methods, never by sending HTTP requests through the controller.
---
## Reason
Direct DTO construction tests isolate the business logic and execute in milliseconds without framework bootstrapping. HTTP tests are slower and test the controller layer, not the action.
---
## Bad Example
```php
public function test_create_user(): void
{
    $response = $this->postJson('/api/users', ['name' => 'John']); // ❌ Tests HTTP + action
    $response->assertStatus(201);
}
```
---
## Good Example
```php
public function test_create_user(): void
{
    $dto = new CreateUserDto(name: 'John', email: 'john@test.com');
    $user = $this->createUserAction->execute($dto); // Direct action test
    $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
}
```
---
## Exceptions
Integration tests that verify the full HTTP flow (controller + middleware + action) should exist for critical paths but as a complement, not replacement.
---
## Consequences Of Violation
Slow test suites, tests that break when HTTP structure changes, no way to test business logic in isolation.
</rule>
