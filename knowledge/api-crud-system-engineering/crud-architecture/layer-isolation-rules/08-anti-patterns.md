# Anti-Patterns — Layer Isolation Rules

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Layer Isolation Rules |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Architecture Collapse | Critical | Medium | Code review: no consistent layer structure, all patterns broken |
| The "Just This Once" Exception | High | High | Code review: repeated layer-skipping exceptions |
| Repository as Bypass | Medium | Medium | Code review: repository exists but services call Eloquent directly |
| Controller as Query Layer | High | High | Code review: controller calls `Model::where()` directly |
| Circular Service Dependencies | High | Low | Static analysis: services import each other |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Enforcement Mechanism | Layer rules exist in documentation but are never checked automatically | Rules are aspirational; violations accumulate silently |
| Inconsistent Enforcement | 50% of endpoints follow layer rules, 50% don't | New developers can't determine the real architecture |
| Framework Bliss | Assuming Laravel enforces layer isolation (it doesn't) | Developers believe the framework prevents violations; it doesn't |

---

## Anti-Pattern Details

### AP-LIR-01: Architecture Collapse

**Description**: The application has no consistent layer structure — controllers call models directly, services call controllers, repositories dispatch events, and action classes contain HTTP responses. Every layer violates the dependency direction rules, creating a "flat" architecture where any layer can interact with any other. Changes to any layer break all others unpredictably.

**Root Cause**: Gradual erosion of architectural conventions. Each violation seems small ("just this one query in the controller"), but accumulated violations destroy the architecture. New developers see the violations and assume they are acceptable.

**Impact**:
- No layer provides isolation — a change to the database schema can break controllers
- Business logic is duplicated across layers (same query in controller, service, and action)
- Testing requires bootstrapping the entire application for any test
- Security policies (multi-tenancy, authorization) are inconsistently applied
- Refactoring requires finding every call site across every layer

**Detection**:
- Code review: controller has `Model::query()`, `DB::table()`, `event()`, `Mail::send()`
- Code review: actions return `RedirectResponse` or set cookies
- Code review: repositories dispatch events or run business logic
- Metrics: no layer boundaries are discoverable or enforceable

**Solution**:
- Establish explicit layer isolation rules documented in the project's architecture guide
- Add PHPStan/Larastan custom rules to detect violations automatically
- Add architectural tests that assert layer boundaries (e.g., `Model` is not imported in `Http` namespace)
- Conduct a layer audit sprint to fix existing violations
- Enforce in code review: every PR must respect layer isolation rules

**Example**:
```php
// Collapsed architecture — every layer does everything
class UserController
{
    public function show(int $id)
    {
        $user = User::with('posts')->find($id); // ❌ controller queries model
        event(new UserViewed($user));            // ❌ controller dispatches events
        return response()->json($user);
    }
}
class UserService
{
    public function find(int $id): User
    {
        return (new SelfController())->someMethod(); // ❌ service calls controller
    }
}

// Restored: each layer respects its boundary
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = $this->findUser->execute($id); // delegates to action
        return response()->json($user);
    }
}
class FindUserAction
{
    public function execute(int $id): User
    {
        return $this->users->find($id); // action calls repository
    }
}
class EloquentUserRepository
{
    public function find(int $id): ?User
    {
        return User::with('posts')->find($id); // only repository uses Eloquent
    }
}
```

---

### AP-LIR-02: The "Just This Once" Exception

**Description**: A developer bypasses a layer with the justification "just this once." The exception is not documented, not reviewed, and not bounded. Over weeks and months, "just this once" accumulates across the codebase. The architecture becomes inconsistent — some paths follow layer rules, others don't. New team members can't determine the real architecture.

**Root Cause**: Short-term convenience always trumps long-term architecture when there is no enforcement. Each violation is individually rational ("it would take 30 minutes to create a service for this 2-line query").

**Impact**:
- Layer violations spread unevenly, creating a patchwork architecture
- Code review cannot distinguish intentional violations from accidental ones
- The architecture degenerates toward complete collapse
- "Just this once" normalizes violations — new team members assume they're acceptable

**Detection**:
- Code review: layer violations without documentation or justification
- Search: undocumented `::where`, `::find`, `DB::` calls in controllers
- Audit: no exception registry, no documented skips

**Solution**:
- Require explicit documentation for every layer-skipping exception
- Use `@layer-skip` annotations with reason, date, and reviewer
- Maintain a central exception registry
- Review all exceptions quarterly — many will no longer be justified
- Treat undocumented violations as bugs, not technical debt

**Example**:
```php
// BEFORE: Undocumented, unbounded exception
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts')->find($id); // "just this once" — undocumented
        return response()->json($user);
    }
}

// AFTER: Documented, bounded exception
/**
 * @layer-skip Service
 * Reason: Simple lookup with no business logic. Will extract to action when business rules emerge.
 * Reviewer: @tech-lead
 * Date: 2026-06-02
 * Review: Quarterly — if no business rules added by Q3 2026, keep this annotation.
 */
class UserController
{
    public function show(int $id): JsonResponse
    {
        return response()->json($this->findUser->execute($id));
    }
}
```

---

### AP-LIR-03: Controller as Query Layer

**Description**: Controllers bypass the service, action, and repository layers to call Eloquent models directly. `User::find($id)`, `User::where()->get()`, `DB::table()` — all in the controller. This is the most common layer isolation violation because it's the most convenient: no new files, no dependency injection, no ceremony.

**Root Cause**: The developer takes the shortest path to a working controller. Creating an action or service requires a new file, class definition, and wiring. Calling `Model::find()` requires zero setup.

**Impact**:
- Business logic is embedded in controllers and cannot be reused
- Multi-tenant scoping and authorization checks are bypassed
- Tests require HTTP scaffolding to verify business logic
- Changing from direct Eloquent to a repository later requires updating every controller

**Detection**:
- Code review: any `Model::` static call in a controller method
- Code review: `DB::` facade calls in controllers
- Static analysis: PHPStan rule for `App\Http\Controllers\*` → `App\Models\*` dependency

**Solution**:
- Create an action or service for every operation that goes beyond simple delegation
- The controller's only database interaction should be through injected services/actions
- Use PHPStan custom rules to enforce: controllers must not import model classes
- Enforce in code review: zero exceptions for Eloquent in controllers

**Example**:
```php
// BEFORE: Controller as query layer
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with(['posts', 'profile'])->findOrFail($id);
        return response()->json($user);
    }
}

// AFTER: Controller delegates
class UserController
{
    public function __construct(private FindUserAction $findUser) {}

    public function show(int $id): JsonResponse
    {
        $user = $this->findUser->execute($id);
        return response()->json($user);
    }
}
```
