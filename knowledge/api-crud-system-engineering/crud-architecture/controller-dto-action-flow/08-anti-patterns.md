# Anti-Patterns — Controller-DTO-Action Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-DTO-Action Flow |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Fat Controller | High | High | Code review: controller has business logic, queries, or conditionals |
| Anemic Action | Medium | High | Code review: action is a pass-through to `Model::create()` |
| DTO-Less Flow | High | Medium | Code review: action receives `$request->validated()` or loose params |
| DTO and FormRequest Duplication Without Intent | Medium | Medium | Code review: DTO is identical to FormRequest with no added value |
| Action Contains HTTP Logic | High | Medium | Code review: action returns redirect, sets cookie, or flashes session |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Bypassing the Flow | Controller calls Eloquent directly instead of delegating to an action | Breaks layer isolation, bypasses business logic, couples HTTP to persistence |
| Mixed Flow Patterns | Some endpoints use Controller-DTO-Action, others use Controller-DTO-Service, others use Controller only | Inconsistent architecture, developers can't predict the pattern for new endpoints |
| Action Injected with Request Dependencies | Action constructor includes HTTP-related dependencies (Request, Middleware) | Action becomes HTTP-coupled and cannot be tested without scaffolding |

---

## Anti-Pattern Details

### AP-CDA-01: Fat Controller

**Description**: A controller that contains business logic, database queries, conditionals, event dispatching, and response formatting beyond simple delegation. The controller's method exceeds 10 lines of executable code and does work that belongs in the action layer. This is the most common violation of the Controller-DTO-Action flow.

**Root Cause**: The developer takes the shortest path to a working feature. Adding logic to the controller requires no new files and no understanding of the action layer. Over time, "just one query" becomes the norm.

**Impact**:
- Business logic is untestable without HTTP scaffolding
- Logic cannot be reused from CLI, queue, or other controllers
- Controller grows to 200+ lines with mixed responsibilities
- Every route change risks breaking unrelated controller logic

**Detection**:
- Code review: controller has `User::where()`, `DB::table()`, or `if ($user->isAdmin())`
- Code review: controller method body exceeds 10 lines
- Metrics: controller file has 200+ lines of executable code

**Solution**:
- Extract every query, conditional, and business decision to an action class
- The controller should only: validate → construct DTO → call action → return response
- Enforce via code review: no Eloquent queries in controllers, period

**Example**:
```php
// BEFORE: Fat controller with business logic
class UserController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);
        if (User::where('email', $validated['email'])->exists()) {
            return response()->json(['error' => 'Email taken'], 409);
        }
        $user = User::create($validated);
        $user->assignRole('subscriber');
        event(new UserRegistered($user));
        return response()->json($user, 201);
    }
}

// AFTER: Thin controller delegating to action
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

---

### AP-CDA-02: Anemic Action

**Description**: An action class that exists purely to forward data from the DTO to `Model::create()` or similar ORM methods with zero business logic. The action has no conditionals, no transformations, no side effects, and no decision making — it is a direct code pass-through that adds a file and a method call without providing value.

**Root Cause**: Dogmatic application of "always use actions" without evaluating whether the operation justifies the overhead. Simple CRUD operations gain nothing from action indirection.

**Impact**:
- Increases file count without improving testability, reusability, or clarity
- Developers learn that actions are pointless ceremony, eroding trust in the architecture
- Genuinely useful actions are harder to distinguish from the noise of anemic ones
- Tests must mock an action that does nothing, adding test complexity without benefit

**Detection**:
- Code review: action method body is one line, calling `Model::create($dto->toArray())`
- Code review: action could be deleted and the code inlined with no loss of clarity
- Coverage: action has no meaningful test coverage because there's nothing to test

**Solution**:
- Skip the action layer for purely trivial operations
- Call `Model::create()` directly from the controller (with a thin service or direct delegation)
- Add the action when business rules emerge — not before
- For the gray area, consider whether future business rules are likely

**Example**:
```php
// BEFORE: Anemic action
class ToggleUserStatusAction
{
    public function execute(ToggleUserStatusDto $dto): User
    {
        $user = User::findOrFail($dto->userId);
        $user->update(['active' => $dto->active]);
        return $user;
    }
}

// AFTER: Inline in controller or use a simple service
class UserController
{
    public function updateStatus(int $id, UpdateStatusRequest $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update($request->validated());
        return response()->json($user);
    }
}
```

---

### AP-CDA-03: DTO-Less Flow

**Description**: Passing `$request->validated()` (an associative array) or loose scalar parameters directly to the action instead of constructing a typed DTO. This loses all type safety, self-documenting method signatures, and the explicit data contract between the HTTP layer and business logic layer.

**Root Cause**: The developer sees DTO creation as unnecessary boilerplate. "The validated array already has the data, why wrap it in another object?" This reasoning misses that the DTO is the explicit contract at the architectural boundary.

**Impact**:
- Action method signature doesn't document what data it needs: `execute(array $data)` vs `execute(CreateUserDto $dto)`
- No compiler enforcement when fields change — adding/removing a field doesn't cause an error
- Refactoring the data shape requires finding every call site that passes the array
- Nested data validation is manual and inconsistent across call sites

**Detection**:
- Code review: action method accepts `array $data` or loose scalar parameters
- Code review: controller passes `$request->validated()` directly to action
- Refactoring difficulty: changing a field name requires grep-and-replace across the codebase

**Solution**:
- Create a typed DTO for every action that receives data
- The DTO documents every field with a type hint and documents the operation's data requirements
- Use `readonly` properties (PHP 8.1+) to enforce immutability
- The controller constructs the DTO from validated data; the action receives the DTO

**Example**:
```php
// BEFORE: DTO-less flow
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        return $this->createUser->execute($request->validated());
    }
}
class CreateUserAction
{
    public function execute(array $data): User
    {
        return User::create($data);
    }
}

// AFTER: Typed DTO flow
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        return $this->createUser->execute($dto);
    }
}
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User { /* ... */ }
}
```

---

### AP-CDA-04: Action Contains HTTP Logic

**Description**: An action class that returns HTTP-specific responses (redirects, JSON responses with status codes), manipulates sessions, sets cookies, or depends on request-scoped HTTP state. This violates the fundamental contract of the action layer — that it is transport-agnostic and testable without HTTP.

**Root Cause**: Convenience. The action has access to the response factory via Laravel's facade, and returning a `RedirectResponse` from the action seems simpler than returning domain data and letting the controller handle the response.

**Impact**:
- Action cannot be tested without HTTP scaffolding
- Action cannot be called from CLI, queue, or other non-HTTP entry points
- Violates the layer separation principle — HTTP concerns belong in the controller
- Controller loses control over the response format

**Detection**:
- Static analysis: action imports `Illuminate\Http\RedirectResponse`, `Illuminate\Http\JsonResponse`
- Code review: action calls `redirect()`, `response()->json()`, `session()->flash()`
- Test inspection: action tests require `$this->actingAs()` or `$this->post()`

**Solution**:
- Return domain data (models, DTOs, or void) from the action
- Let the controller handle all HTTP concerns: status codes, headers, redirects, sessions
- If the action needs to communicate "what happened," return a result DTO

**Example**:
```php
// BEFORE: Action contains HTTP logic
class CreateUserAction
{
    public function execute(CreateUserDto $dto): JsonResponse
    {
        $user = User::create($dto->toArray());
        return response()->json($user, 201);
    }
}

// AFTER: Action returns domain data
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}
// Controller handles the HTTP response
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
```
