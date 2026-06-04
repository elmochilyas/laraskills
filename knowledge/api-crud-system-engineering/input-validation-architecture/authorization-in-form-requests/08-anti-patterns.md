# Anti-Patterns — Authorization in Form Requests

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Authorization in Form Requests |
| Difficulty | Intermediate |
| Category | Security Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| authorize in Controller Instead of FormRequest | Medium | High | Code review: `$this->authorize()` in controller methods |
| Manual Ownership Checks Without Policy | Medium | Medium | Code review: `$post->user_id === auth()->id()` inline |
| authorize With Business Logic Side Effects | High | Low | Code review: DB writes or API calls in `authorize()` |
| Single authorize for All Actions | Medium | High | Code review: same Policy method called for all controller actions |
| authorize With DB Queries That Could Fail | High | Low | Code review: complex DB queries in `authorize()` without error handling |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No authorize Method at All | Missing `authorize()` defaults to `false` | Every request denied — endpoint appears broken |
| Using auth()->user() Instead of $this->user() | Couples authorization to auth facade | Cannot mock user in tests; breaks testability |
| Distinguishing 403 vs 404 Based on Role | Different error for "not found" vs "forbidden" | User enumeration vulnerability |

---

## Anti-Pattern Details

### AP-AFR-01: authorize in Controller Instead of FormRequest

**Description**: Authorization logic is placed in the controller method via `$this->authorize()` or `Gate::allows()` instead of in the FormRequest's `authorize()` method. This splits the endpoint contract across two classes — the FormRequest handles validation rules while the controller handles access control. Developers adding new endpoints may forget to add authorization, and the per-endpoint security contract is not explicit.

**Root Cause**: Convention from Laravel's default controller scaffolding. The `make:controller --resource` command generates `$this->authorizeResource()` in the controller, not the FormRequest.

**Impact**:
- Authorization is not visible alongside validation rules in the FormRequest
- New endpoint developers may forget authorization entirely
- Testing authorization requires HTTP integration tests instead of unit-testing the FormRequest
- Authorization logic cannot be reused across different controller methods
- The FormRequest's four-pillar contract (rules, authorize, messages, attributes) is incomplete

**Detection**:
- Code review: `$this->authorize()` or `Gate::allows()` in controller methods
- Code review: `authorizeResource()` calls in controller constructors
- Code review: FormRequests without `authorize()` method

**Solution**:
- Move all authorization logic into FormRequest's `authorize()` method
- Delegate Policy calls via `$this->user()->can()`
- Keep controllers focused on orchestration, not authorization

**Example**:
```php
// BEFORE: Authorization in controller
class PostController
{
    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $this->authorize('update', $post); // ❌ in controller
        // ...
    }
}

// AFTER: Authorization in FormRequest
class UpdatePostRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post')); // ✅ in FormRequest
    }

    public function rules(): array { /* ... */ }
}
```

---

### AP-AFR-02: Manual Ownership Checks Without Policy

**Description**: Authorization checks are performed inline with raw comparisons — `$post->user_id === auth()->id()` — rather than through Policy classes. This scattered approach duplicates ownership logic across FormRequests, controllers, and blades, making it impossible to change authorization rules in one place. Inline checks also bypass Policy auto-discovery and cannot be tested independently.

**Root Cause**: Convenience. Inline checks are faster to write than creating a Policy class and registering it.

**Impact**:
- Ownership logic duplicated across multiple classes
- Changing ownership rules (e.g., from user_id to team_id) requires hunting every inline check
- Policies cannot be tested independently of their calling context
- Policy auto-discovery and Gate registration are bypassed
- New developers cannot discover authorization rules by looking at Policy classes

**Detection**:
- Code review: direct property comparisons like `$this->user()->id === $post->user_id`
- Code review: `$post->user_id !== auth()->id()` patterns without Policy delegation
- Test review: no Policy unit tests exist for the resource

**Solution**:
- Create a Policy class for each resource
- Delegate all ownership checks to Policy methods
- Keep inline checks as a last resort for trivial, non-reusable cases

**Example**:
```php
// BEFORE: Manual ownership check
public function authorize(): bool
{
    $post = $this->route('post');
    return $post && $this->user()->id === $post->user_id; // ❌ inline, not reusable
}

// AFTER: Policy delegation
// PostPolicy.php
public function update(User $user, Post $post): bool
{
    return $user->id === $post->user_id;
}

// FormRequest
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post')); // ✅ reusable, testable
}
```

---

### AP-AFR-03: authorize With Business Logic Side Effects

**Description**: The `authorize()` method performs business logic operations — rate limit checks, database writes, external API calls, or logging actions — instead of simply returning a boolean access decision. Authorization should be a pure function: given a user and a resource, return true or false. Side effects in authorization invalidate audit trails (authorization logged before the action completes), create data inconsistencies (write on deny), and introduce latency.

**Root Cause**: Misunderstanding the authorization layer's responsibility. The developer treats `authorize()` as a convenient place for any check that happens before validation.

**Impact**:
- Log entries for authorization failures that were denied for business reasons, not security reasons
- Database writes in authorization that create records for denied requests
- External API calls blocking validation on every request
- Authorization cannot be tested as a pure boolean decision

**Detection**:
- Code review: `Log::info()`, `DB::insert()`, `dispatch()`, or `Http::post()` inside `authorize()`
- Code review: `authorize()` returns a value computed from external state that changes on each call
- Audit log review: authorization entries without corresponding action entries

**Solution**:
- Keep `authorize()` as a pure access decision — return `true` or `false` only
- Move business logic checks to the controller or service layer
- Use `after()` hooks for validation that needs side-effect checks

**Example**:
```php
// BEFORE: Side effects in authorization
public function authorize(): bool
{
    Log::info('User attempting to create post', ['user' => $this->user()->id]); // ❌ side effect
    if ($this->user()->hasReachedPostLimit()) {
        return false;
    }
    return $this->user()->can('create', Post::class);
}

// AFTER: Pure authorization
public function authorize(): bool
{
    return $this->user()->can('create', Post::class); // ✅ pure boolean, no side effects
}

// Business logic check moved to service layer:
public function store(StorePostRequest $request, PostService $posts): JsonResponse
{
    if ($request->user()->hasReachedPostLimit()) {
        return response()->json(['error' => 'Post limit reached'], 429);
    }
    return PostResource::make($posts->create($request->payload()));
}
```

---

### AP-AFR-04: Single authorize for All Actions

**Description**: The same `authorize()` method — often calling a single Policy method — is used for store, update, destroy, and other actions. Each action has different authorization requirements: creating a post differs from deleting one. Using a single check means either being too permissive (allowing delete when only create should be allowed) or too restrictive (requiring admin for everything).

**Root Cause**: Copy-paste endpoint scaffolding. The developer creates one FormRequest and reuses it for multiple actions with minor changes, not realizing that authorization differs.

**Impact**:
- Security: users may delete resources they shouldn't have access to
- Usability: users may be blocked from legitimate actions
- Policy methods become unused or incorrectly registered
- Cannot implement granular audit trails per action type

**Detection**:
- Code review: same `authorize()` method body in `Store*Request` and `Destroy*Request`
- Code review: `authorize()` calls `can('create', ...)` on an update endpoint
- Test review: authorization tests only cover one action type

**Solution**:
- Create separate FormRequests per action with distinct `authorize()` methods
- Match the Policy method to the action: `create`, `update`, `delete`, `view`
- Test each action's authorization independently

**Example**:
```php
// BEFORE: Same authorization for all actions
// Both StorePostRequest and DestroyPostRequest use:
public function authorize(): bool
{
    return $this->user()->can('create', Post::class); // ❌ wrong for destroy
}

// AFTER: Per-action authorization
// StorePostRequest
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}

// DestroyPostRequest
public function authorize(): bool
{
    return $this->user()->can('delete', $this->route('post'));
}
```

---

### AP-AFR-05: authorize With DB Queries That Could Fail

**Description**: The `authorize()` method executes database queries that may throw exceptions — `findOrFail()`, complex joins, or unvalidated relationships. If the database connection fails or a record is missing, the exception propagates as a 500 error instead of a 403 Forbidden. Authorization should be simple and reliable; database failures during authorization mask security decisions as infrastructure errors.

**Root Cause**: Complex authorization logic. The developer needs data from the database to make an access decision but uses fragile query patterns.

**Impact**:
- Database outages manifest as 500 errors on authorization, not as degraded access control
- Missing related records (deleted since the query was written) cause 500 instead of 403
- Slow authorization queries add latency to every guarded request
- Cannot distinguish "authorization failed" from "database unavailable"

**Detection**:
- Code review: `findOrFail()`, `firstOrFail()`, or eager loading without null checks in `authorize()`
- Code review: authorization logic that queries three or more tables
- Error monitoring: authorization-related 500 errors that correlate with database issues

**Solution**:
- Use simple existence checks (nullable returns) instead of `findOrFail()` in authorization
- Eager-load authorization data in route model binding, not in `authorize()`
- Keep authorization queries simple and bounded

**Example**:
```php
// BEFORE: Fragile DB query in authorization
public function authorize(): bool
{
    $team = Team::findOrFail($this->route('team')); // ❌ 500 on missing team
    return $this->user()->teams()->where('team_id', $team->id)->exists();
}

// AFTER: Safe null-checked query
public function authorize(): bool
{
    $team = $this->route('team');
    if (!$team) { // ✅ route model binding already loaded — null-safe
        return false;
    }
    return $this->user()->teams()->where('team_id', $team->id)->exists();
}
```
