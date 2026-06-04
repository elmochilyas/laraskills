# Anti-Patterns — When to Skip Layers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | When to Skip Layers |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| The Slippery Slope | Critical | High | Code review: "just this once" becomes the default pattern |
| Architecture Collapse | Critical | Medium | Code review: layers exist but are consistently bypassed |
| Silent Skip in Controller | High | High | Code review: one method calls Eloquent directly, others use services |
| Skip as Default for New Features | High | Medium | Code review: new features skip layers unless forced to add them |
| Skipping Writes | Critical | Medium | Code review: write operations skip layers |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Undocumented Skips | Layer exceptions not documented with annotations or in an exception registry | No one knows which operations skip layers; security and data integrity gaps are invisible |
| No Quarterly Review | Layer skip exceptions are created but never reviewed | Conditions that justified the skip change, but the skip remains as permanent architectural debt |
| Skip Driven by Performance | Layers skipped for performance without profiling first | Performance problem may be elsewhere; the skip becomes permanent even after optimization |

---

## Anti-Pattern Details

### AP-WSL-01: The Slippery Slope

**Description**: "Just this once" becomes the gradual default. One developer skips a layer for a simple operation with "justification." A second developer sees the pattern and repeats it. Over months, layer skips become the norm rather than the exception — 20% of operations skip layers, then 40%, then 60%. The architecture degenerates silently.

**Root Cause**: Each individual exception seems reasonable. The cumulative effect is invisible until the architecture has collapsed. No alarm triggers when the skip count exceeds 10% of operations.

**Impact**:
- Architecture is inconsistent — some paths follow layer rules, most don't
- New developers can't determine the real architecture from the documented one
- Code review accepts new skips because "there are already 50 skips like this"
- Security and data integrity gaps proliferate silently

**Detection**:
- Metrics: more than 10% of operations have layer skips
- Code review: skips are accepted without requiring documentation
- Code review: reviewers say "it's just like the other skips" as justification

**Solution**:
- Require documented justification for every skip (annotations in code, entry in exception registry)
- Enforce review cadence: every skip is re-evaluated quarterly
- Set a hard limit: no more than 5% of operations may have active skips
- Treat undocumented skips as bugs, not technical debt

**Example**:
```php
// BEFORE: Slippery slope — undocumented skips accumulate
class UserController
{
    public function show(int $id): JsonResponse
    {
        return response()->json(User::with('posts')->find($id)); // "just this once"
    }
}
class ReportController
{
    public function __invoke(): JsonResponse
    {
        return response()->json(User::where('active', true)->count()); // "saw it in UserController"
    }
}
// 6 months later: 40% of controllers have direct Eloquent calls

// AFTER: Each skip is documented and bounded
class UserController
{
    /**
     * @layer-skip Service, Action
     * Reason: Simple read-only lookup with no business logic.
     * Reviewer: @tech-lead
     * Date: 2026-06-02
     * Review: Quarterly
     */
    public function show(int $id): JsonResponse
    {
        return response()->json($this->findUser->execute($id));
    }
}
```

---

### AP-WSL-02: Silent Skip in Controller

**Description**: A controller method calls Eloquent directly in one method while using services in all other methods. The skip is undocumented, unbounded, and invisible to automated enforcement tools. Other developers don't realize a skip exists until they trace the code path. The skip creates a hidden inconsistency in the architecture.

**Root Cause**: A developer takes a shortcut for one method in a controller and doesn't annotate it. Since other controller methods use the correct pattern, no one notices the exception.

**Impact**:
- Hidden code path that bypasses business logic and security
- Inconsistency within a single controller: one method uses Eloquent directly, others delegate to services
- Debugging requires tracing every method individually
- Automated enforcement tools (PHPStan rules, architectural tests) miss mixed skip patterns

**Detection**:
- Code review: controller has some methods with Eloquent, some without
- Code review: no documentation or annotation on the skipping method
- Search: methods in controllers marked `@layer-skip` vs unmarked methods

**Solution**:
- Every skip must be documented with `@layer-skip` annotation
- Automated enforcement should flag any undocumented model access in controllers
- If a controller needs a skip, annotate the specific method, not the entire class
- Use architectural tests that check each controller method individually

**Example**:
```php
// BEFORE: Silent skip
class UserController
{
    public function index(): JsonResponse
    {
        return response()->json($this->userService->listAll()); // ✅ uses service
    }

    public function show(int $id): JsonResponse
    {
        // Silent skip — undocumented, invisible
        return response()->json(User::with('posts')->findOrFail($id));
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        return response()->json($this->registerUser->execute($dto), 201); // ✅ uses action
    }
}

// AFTER: Documented skip (or fix it)
class UserController
{
    /**
     * @layer-skip Service, Action
     * Reason: Simple read-only lookup. Mocked for tests. Will extract if query logic grows.
     * Reviewer: @tech-lead
     * Date: 2026-06-02
     */
    public function show(int $id): JsonResponse
    {
        return response()->json(User::with('posts')->findOrFail($id));
    }
}
```

---

### AP-WSL-03: Skipping Writes

**Description**: A write operation (create, update, delete) skips one or more layers. A controller calls `Model::create()` directly, or a service calls Eloquent directly without going through a repository. Write operations are where data integrity, authorization, and validation matter most — skipping layers for writes creates the highest-risk exceptions.

**Root Cause**: The developer believes the write is "simple enough" to not need the full layer stack. "It's just a create with no business logic." But writes have the most to lose from missing layers: multi-tenant scoping, validation, event dispatching, and authorization.

**Impact**:
- Authorization checks in the skipped layer are bypassed
- Multi-tenant data isolation is compromised
- Validation and business rules are not applied
- Events (audit log, notifications) are not dispatched
- Data integrity: inconsistent state if the write is part of a larger transaction

**Detection**:
- Code review: any write operation (create, update, delete) that doesn't follow the full layer stack
- Code review: controller calls `Model::create()`, `Model::update()`, `Model::delete()`
- Code review: action/service makes a write without a transaction wrapper

**Solution**:
- Never skip layers for write operations — always follow the full stack
- If a write seems "too simple" for the full stack, create the layers anyway
- Treat write-skipping as a critical architecture violation in code review
- Add automated checks: any model write (create/update/delete/save) outside the data access layer is flagged

**Example**:
```php
// BEFORE: Skipping layers for a write
class UserController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);
        $user = User::create($validated); // ❌ write skips DTO, action, service, repository
        return response()->json($user, 201);
    }
}

// AFTER: Full layer stack for writes
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
// createUser action → repository → Eloquent — full stack for a write
```

---

### AP-WSL-04: Skip as Default for New Features

**Description**: When adding a new feature, the default approach is to skip layers and only add them when "forced." The initial implementation uses direct Eloquent in the controller or minimal indirection. Layers are added only when someone complains or when the feature needs to be modified. This creates an inconsistent architecture where new features are built with shortcuts from day one.

**Root Cause**: Productivity pressure. "We need this feature fast — we'll refactor later." "Later" never comes because the feature works as-is. The shortcut becomes permanent.

**Impact**:
- New features are inconsistent with the existing architecture
- Technical debt is accumulated from day one of each feature
- The refactoring backlog grows without bound
- Developers learn that "skip first, refactor later" is the real architecture convention

**Detection**:
- Code review: new features use direct Eloquent while older features use services
- Process: no checklist or requirement to follow layer rules for new features
- Developer interviews: "we skip layers because it's faster, then we never refactor"

**Solution**:
- New features must follow the same architectural conventions as existing code
- The definition of "done" for a feature includes all architectural layers
- Use code-generation templates that produce the full layer stack for new endpoints
- If time pressure forces a shortcut, create a ticket and assign it in the same sprint

**Example**:
```php
// BEFORE: New feature skips layers
// Feature: "User Preferences API"
// Added in one file, no layers
class UserPreferenceController
{
    public function update(int $userId, Request $request): JsonResponse
    {
        $pref = UserPreference::updateOrCreate(
            ['user_id' => $userId],
            $request->validate(['key' => 'required', 'value' => 'required'])
        );
        return response()->json($pref);
    }
}

// AFTER: New feature follows conventions
// Feature: "User Preferences API" — complete with DTO, action, controller
class UpdateUserPreferenceAction
{
    public function execute(UpdatePreferenceDto $dto): UserPreference
    {
        return UserPreference::updateOrCreate(
            ['user_id' => $dto->userId],
            ['key' => $dto->key, 'value' => $dto->value]
        );
    }
}
class UserPreferenceController
{
    public function update(int $userId, UpdatePreferenceRequest $request): JsonResponse
    {
        $dto = UpdatePreferenceDto::fromRequest($request, $userId);
        $pref = $this->updatePreference->execute($dto);
        return response()->json($pref);
    }
}
```
