# Anti-Patterns — Request Lifecycle Complete Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Request Lifecycle Complete Flow |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Architecture by Shortcut | Critical | High | Code review: controller calls model directly, skipping DTO and action |
| Data Without DTO | High | High | Code review: arrays passed across all layer boundaries |
| Business Logic in Controllers | High | High | Code review: controller has conditionals, queries, and domain decisions |
| Flow Short-Circuit Debugging | Medium | Medium | Bug reports: developer debugs wrong layer |
| Assuming the Flow Is Shorter | Medium | Medium | Code review: new endpoint missing middleware, DTO, or response formatting |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Skipping Layer Without Justification | A request skips DTO, action, or response formatting without documented reason | Creates inconsistent data handling, bypasses type safety and formatting |
| Flow Not Documented | Team doesn't have a shared mental model of the request flow | Each developer designs endpoints differently; debugging is confused |
| Terminable Middleware Abuse | Heavy cleanup logic in terminable middleware that could be in a queued action | Blocks response completion, complicates debugging |

---

## Anti-Pattern Details

### AP-RLF-01: Architecture by Shortcut

**Description**: Layers in the 12-step flow are consistently skipped — the controller calls Eloquent models directly, bypassing the DTO and action/service layers. The written architecture (documented flow) no longer represents the real architecture (actual code). The flow has collapsed to 3 steps: Request → Controller → Model → Response.

**Root Cause**: Short-term convenience. Each shortcut is individually faster than creating the correct layer files. Over time, the shortcuts become the default pattern.

**Impact**:
- Business logic is embedded in controllers or not present at all
- No layer provides isolation — a database schema change can break HTTP responses
- Security policies (auth, throttle, validation) are inconsistently applied
- Testing requires HTTP scaffolding for every test

**Detection**:
- Code review: controller methods contain `Model::find()`, `Model::where()`, `DB::table()`
- Code review: no DTOs, no actions, no services — just controllers and models
- Metrics: 80% of controller methods have 15+ lines of executable code

**Solution**:
- Re-establish the correct flow: Controller → DTO → Action/Service → Data Access
- Add architectural tests that assert layer boundaries
- Refactor existing shortcuts one endpoint at a time, starting with write operations
- Enforce in code review: no Eloquent queries in controllers

**Example**:
```php
// BEFORE: Architecture by shortcut
class UserController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);
        $user = User::create($validated); // ❌ shortcut: DTO, action, service all skipped
        event(new UserRegistered($user)); // ❌ shortcut: event dispatching in controller
        return response()->json($user, 201);
    }
}

// AFTER: Following the complete flow
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);              // DTO construction
        $user = $this->registerUser->execute($dto);              // action execution
        return response()->json(new UserResource($user), 201);   // response formatting
    }
}
```

---

### AP-RLF-02: Data Without DTO

**Description**: Raw validated arrays (`$request->validated()`) flow through all layers of the application instead of typed DTOs. The DTO boundary between HTTP and business logic is missing. Every method that receives an array must manually document its expected keys, and there is no compiler enforcement when fields change.

**Root Cause**: The developer views DTOs as "duplication" of the FormRequest and doesn't see the value of the explicit contract at the architectural boundary.

**Impact**:
- Method signatures don't document data requirements: `execute(array $data)` vs `execute(CreateUserDto $dto)`
- No compiler-checked contract when fields change
- Refactoring requires finding every array construction site manually
- Nested data validation is inconsistent

**Detection**:
- Code review: action/service methods accept `array $data` or `array $input`
- Code review: controller passes `$request->validated()` directly to the action
- Refactoring: adding a field requires grep-and-replace across multiple files

**Solution**:
- Create a typed DTO for every operation in the flow
- The DTO is constructed in the controller from validated data
- Every layer below receives the DTO, never an array
- Enforce in code review: no `array` type hints for data that crosses layers

**Example**:
```php
// BEFORE: Data without DTO
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $user = $this->registerUser->execute($request->validated());
        return response()->json($user, 201);
    }
}
class RegisterUserAction
{
    public function execute(array $data): User // what keys? unknown
    {
        return User::create($data);
    }
}

// AFTER: Typed DTO in the flow
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->registerUser->execute($dto);
        return response()->json($user, 201);
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
class RegisterUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}
```

---

### AP-RLF-03: Business Logic in Controllers

**Description**: The controller contains business rules, decision logic, and database queries that belong in the service/action layer. Controllers become the default location for all logic — the flow collapses because there's no need to delegate to lower layers when the controller does everything.

**Root Cause**: The controller is the first layer developers write, and it's easiest to keep adding logic there. Creating an action or service is "more work" and requires understanding an additional abstraction.

**Impact**:
- Business logic is untestable without HTTP scaffolding
- Logic cannot be reused from CLI, queue, or other controllers
- Controller files grow to 300+ lines
- Route changes risk breaking unrelated logic in the same controller

**Detection**:
- Code review: controller has conditionals (`if ($user->isAdmin())`), loops, or inline queries
- Code review: controller method exceeds 10 lines of executable code
- Metrics: controller files average 50+ lines of non-boilerplate code

**Solution**:
- Extract conditionals and decision logic to actions or services
- Extract queries to repository methods or query scopes
- Keep controller methods to 3-5 lines: validate → DTO → action → response
- Enforce the single-responsibility principle: controller handles HTTP only

**Example**:
```php
// BEFORE: Business logic in controller
class UserController
{
    public function store(RegisterUserRequest $request): JsonResponse
    {
        if (User::where('email', $request->validated('email'))->exists()) {
            return response()->json(['error' => 'Email taken'], 409);
        }
        $user = User::create($request->validated());
        $user->assignRole($request->validated('role', 'subscriber'));
        Mail::to($user)->send(new WelcomeMail($user));
        return response()->json($user, 201);
    }
}

// AFTER: Logic extracted to action
class UserController
{
    public function store(RegisterUserRequest $request): JsonResponse
    {
        $dto = RegisterUserDto::fromRequest($request);
        $user = $this->registerUser->execute($dto);
        return response()->json($user, 201);
    }
}
```
