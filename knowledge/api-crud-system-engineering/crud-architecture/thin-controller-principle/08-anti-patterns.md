# Anti-Patterns — Thin Controller Principle

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Thin Controller Principle |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| The God Controller | Critical | High | Code review: 15+ methods, 600+ lines in one controller |
| Controller as Service | High | High | Code review: controller contains business logic |
| Controller as Query Layer | High | High | Code review: controller calls Model::where() directly |
| Controller as Event Dispatcher | Medium | Medium | Code review: controller dispatches events inline |
| Controller as Mailer | Medium | Medium | Code review: controller sends emails directly |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| The Fat Controller Creep | Adding "just one query" gradually normalizes fat controllers | Every addition seems small, but accumulated violations make the controller unfixable |
| Returning Eloquent Models Directly | Controller returns `User::find($id)` without a resource or DTO | Exposes sensitive attributes (password, remember_token) and couples response to schema |
| Inline Validation in Controller | `$request->validate(...)` used instead of a FormRequest | Validation duplicated across controller methods, harder to unit test |

---

## Anti-Pattern Details

### AP-TCP-01: The God Controller

**Description**: A controller with 15+ methods, 600+ lines of code, mixing CRUD operations with custom endpoints, reporting, and file downloads. Every route change requires modifying this single file. The controller is the entry point for every feature in the domain and has become the largest file in the application.

**Root Cause**: All logic for a domain is placed in one controller file. No extraction to actions, services, or separate controllers. The "convenience" of having everything in one place outweighs the maintainability cost — until the file becomes unmanageable.

**Impact**:
- Impossible to navigate: 600+ lines of mixed concerns
- High risk of merge conflicts: every developer works on the same file
- Testing requires HTTP scaffolding for all 15+ methods
- A change to one method risks breaking unrelated methods (shared mutable state, globals)

**Detection**:
- Metrics: controller file exceeds 300 lines
- Metrics: controller has 10+ public methods
- Code review: single controller handles CRUD, reports, exports, imports, and custom endpoints

**Solution**:
- Extract each CRUD operation to its own action class
- Split custom endpoints into separate controllers (e.g., `UserReportController`, `UserExportController`)
- Use invokable controllers for single-action endpoints
- Keep resource controllers to standard CRUD methods only

**Example**:
```php
// BEFORE: God controller
class UserController
{
    public function index() { /* list */ }
    public function store() { /* create */ }
    public function show(int $id) { /* find */ }
    public function update(int $id) { /* update */ }
    public function destroy(int $id) { /* delete */ }
    public function export() { /* CSV export — 40 lines */ }
    public function import() { /* CSV import — 50 lines */ }
    public function report() { /* monthly report — 30 lines */ }
    public function suspend(int $id) { /* suspend user — 25 lines */ }
    public function bulkAssign() { /* assign roles in bulk — 35 lines */ }
    public function activityLog(int $id) { /* show user activity — 20 lines */ }
    // ... 5 more custom endpoints
    // Total: 600+ lines
}

// AFTER: Split into focused controllers
class UserController { /* index, store, show, update, destroy only */ }
class UserExportController { /* __invoke */ }
class UserImportController { /* __invoke */ }
class UserReportController { /* __invoke */ }
class UserAdminController { /* suspend, bulkAssign */ }
```

---

### AP-TCP-02: Controller as Service

**Description**: A controller that contains business logic, conditionals, calculations, and domain decisions — code that belongs in a service or action class. The controller method exceeds 20 lines, with nested conditionals, database queries, and event dispatching. The controller is the de facto service layer.

**Root Cause**: The developer writes all logic in the controller because it's the first layer reached by the request. Creating an action or service requires a new file, class definition, and wiring — more work than adding lines to the existing controller.

**Impact**:
- Business logic is untestable without HTTP scaffolding
- Logic cannot be reused from CLI, queue, or other controllers
- Controller files grow to 50+ lines per method
- Every HTTP test must set up full request/response context

**Detection**:
- Code review: controller has `if ($user->isAdmin())`, `if ($total > 100)`, business conditionals
- Code review: controller method body exceeds 10 lines
- Code review: controller creates things (emails, PDFs, reports) that actions should create

**Solution**:
- Extract business conditionals and calculations to action classes
- The controller should only: validate → construct DTO → call action → return response
- Enforce in code review: if the controller method has more than one conditional, extract it
- Use the "10-line rule": if a controller method exceeds 10 lines of executable code, extract the excess

**Example**:
```php
// BEFORE: Controller as service
class UserController
{
    public function store(RegisterUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        if (User::where('email', $validated['email'])->exists()) {
            return response()->json(['error' => 'Email taken'], 409);
        }
        if ($validated['plan'] === 'premium' && !$this->featureFlags->isEnabled('premium')) {
            return response()->json(['error' => 'Premium not available'], 400);
        }
        $user = User::create($validated);
        $this->assignDefaultTeam($user);
        event(new UserRegistered($user));
        return response()->json($user, 201);
    }
}

// AFTER: Thin controller, logic extracted to action
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

---

### AP-TCP-03: Controller as Query Layer

**Description**: The controller calls Eloquent models directly — `User::with('posts')->find($id)`, `User::where('active', true)->get()`, `DB::table('orders')->sum('total')`. The controller bypasses all lower layers (actions, services, repositories) and couples HTTP handling to the database schema.

**Root Cause**: Convenience. Writing `User::find($id)` is faster than creating an action class. For "simple" queries, the developer feels no abstraction is needed.

**Impact**:
- Database schema changes require controller changes (brittle coupling)
- Multi-tenant scoping, caching, and authorization are bypassed
- Queries are scattered across controllers, making it impossible to centralize query logic
- Tests must set up database state even for simple controller tests

**Detection**:
- Code review: controller has `Model::find()`, `Model::where()`, `Model::with()`
- Code review: controller calls `DB::` facade
- Static analysis: controller imports `App\Models\*` and uses it in method bodies

**Solution**:
- Create an action or service for every database operation
- The controller's only reference to models should be through type hints on injected actions/services
- Use PHPStan custom rules to block model imports in controller files
- Enforce in code review: zero exceptions for Eloquent in controllers

**Example**:
```php
// BEFORE: Controller as query layer
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts', 'profile')->findOrFail($id);
        return response()->json($user);
    }
}

// AFTER: Controller delegates to action
class UserController
{
    public function __construct(private FindUserAction $findUser) {}

    public function show(int $id): JsonResponse
    {
        $user = $this->findUser->execute($id);
        return response()->json($user);
    }
}

// The action contains the query logic
class FindUserAction
{
    public function execute(int $id): ?User
    {
        return User::with('posts', 'profile')->findOrFail($id);
    }
}
```
