# Thin Controller Principle — Rules

## Rule 1: Controller Body Must Not Exceed 10 Lines of Executable Code
---
## Category
Maintainability
---
## Rule
Never write a controller method with more than 10 lines of executable code (excluding blank lines, type hints, and comments); extract logic to actions/services when this limit is exceeded.
---
## Reason
A controller exceeding 10 lines has almost certainly leaked business logic, data access, or HTTP concerns into the wrong layer. The limit forces extraction at the first sign of scope creep.
---
## Bad Example
```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([/* 5 rules */]);
    if (User::where('email', $validated['email'])->exists()) {
        return response()->json(['error' => 'Email taken'], 422);
    }
    $user = User::create($validated);
    $user->assignRole('subscriber');
    event(new UserRegistered($user));
    Mail::to($user)->send(new WelcomeMail($user));
    return response()->json($user, 201);
}
```
---
## Good Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request);
    $user = $this->registerUserAction->execute($dto);
    return response()->json($user, 201);
}
```
---
## Exceptions
No common exceptions. 10 lines is a hard rule enforced during code review.
---
## Consequences Of Violation
Fat controllers, untestable business logic, unreusable code, architecture collapse.
</rule>

## Rule 2: Never Write Eloquent Queries in Controllers
---
## Category
Layer Isolation
---
## Rule
Never call `Model::find()`, `Model::where()`, `DB::table()`, or any data access method inside a controller.
---
## Reason
Direct data access in controllers bypasses all business logic, authorization, caching, and query scoping. It creates an undocumented code path that future maintainers won't know exists.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts.likes')->find($id);
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
        $user = $this->findUserAction->execute($id);
        return response()->json($user);
    }
}
```
---
## Exceptions
No common exceptions. Controllers must never touch data access.
---
## Consequences Of Violation
Bypassed business rules and scoping, untestable code paths, architecture collapse.
</rule>

## Rule 3: Never Dispatch Events, Email, or Queue Jobs from Controllers
---
## Category
Architecture
---
## Rule
Never call `event()`, `Mail::send()`, or `dispatch()` inside a controller; these belong in the action or service layer.
---
## Reason
Side effects from controllers are invisible to the business logic layer. When the action is called from CLI or queue, the side effects are missing because they were wired only in the controller.
---
## Bad Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        event(new UserRegistered($user));
        Mail::to($user)->send(new WelcomeMail($user));
        return response()->json($user, 201);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->registerUserAction->execute($dto);
        return response()->json($user, 201);
    }
}
```
---
## Exceptions
No common exceptions. Side effects belong in the business logic layer.
---
## Consequences Of Violation
Side effects missing when action is called from CLI/queue, inconsistent behavior across entry points.
</rule>

## Rule 4: Always Use FormRequests for Input Validation
---
## Category
Framework Usage
---
## Rule
Never use `$request->validate()` inline in a controller method; always create a dedicated FormRequest class for input validation.
---
## Reason
Inline validation duplicates rules across methods, makes rules invisible to static analysis, couples validation logic to the controller, and prevents reuse of rules across endpoints.
---
## Bad Example
```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);
}
```
---
## Good Example
```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = CreateUserDto::fromRequest($request);
    $user = $this->registerUserAction->execute($dto);
    return response()->json($user, 201);
}
```
---
## Exceptions
Trivial single-field endpoints (toggle boolean, status check) may use inline validation with explicit justification.
---
## Consequences Of Violation
Duplicated validation rules, maintenance overhead, inconsistent validation across endpoints.
</rule>

## Rule 5: Never Return Eloquent Models Directly from Controllers
---
## Category
Security
---
## Rule
Never return Eloquent model instances directly from a controller method; always use API resources, DTOs, or explicitly mapped arrays.
---
## Reason
Returning models directly exposes all model attributes including sensitive fields (password hashes, remember tokens, internal flags) to the API response.
---
## Bad Example
```php
public function show(int $id): JsonResponse
{
    return response()->json(User::find($id));
}
// Exposes password, remember_token, internal flags
```
---
## Good Example
```php
public function show(int $id): JsonResponse
{
    $user = $this->findUserAction->execute($id);
    return response()->json(new UserResource($user));
}
```
---
## Exceptions
No common exceptions. Direct model exposure is always a security risk.
---
## Consequences Of Violation
Sensitive data exposure in API responses, PCI compliance violations, data leaks.
</rule>

## Rule 6: Controller Tests Focus on HTTP Concerns Only
---
## Category
Testing
---
## Rule
Never test business logic through controller HTTP tests; use controller tests to verify status codes, headers, and response structure, and test business logic against actions/services directly.
---
## Reason
HTTP tests are slow, require framework bootstrapping, and mix HTTP concerns with business logic assertions. Testing business logic through HTTP means every test case must set up HTTP context even for pure logic verification.
---
## Bad Example
```php
public function test_user_registration(): void
{
    $response = $this->postJson('/api/users', [
        'name' => 'John',
        'email' => 'john@test.com',
    ]);
    $response->assertStatus(201);
    $response->assertJson(['name' => 'John']);
    // Tests HTTP AND business logic — slow, coupled
}
```
---
## Good Example
```php
// Controller test — HTTP only
public function test_store_returns_201(): void
{
    $response = $this->postJson('/api/users', [
        'name' => 'John',
        'email' => 'john@test.com',
    ]);
    $response->assertStatus(201);
}

// Action test — business logic only
public function test_create_user_persists_record(): void
{
    $dto = new CreateUserDto(name: 'John', email: 'john@test.com');
    $user = $this->createUserAction->execute($dto);
    $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
}
```
---
## Exceptions
End-to-end tests for critical user-facing flows may combine concerns, but must not replace isolated unit tests.
---
## Consequences Of Violation
Slow test suites, tests that break when HTTP structure changes, inability to test business logic edge cases efficiently.
</rule>
