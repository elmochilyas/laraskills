# Authorization in Form Requests

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** authorization, form-request, testing, production, security

## Executive Summary
Phase 3 covers testing authorization logic, production observability for auth failures, multi-tenancy authorization patterns, integration with API authentication guard, and defense-in-depth strategies that layer FormRequest authorization with middleware and controller gates.

## Core Concepts

### Defense in Depth
FormRequest `authorize()` is one layer in a multi-layer security model:
1. **Route middleware** — `auth:api`, `can:create,App\Models\Post`
2. **FormRequest authorize()** — context-aware permission check
3. **Controller/Service** — explicit gate checks for complex scenarios
4. **Model events** — last-resort guard via `creating` / `updating` boot methods

No single layer is trusted alone — each reinforces the others.

### authorize() as a Security Contract
`authorize()` is not an optimization — it is a **mandatory gate**. Every FormRequest that mutates state must implement `authorize()`. Read-only requests (Index, Show) may omit it (defaults to `true`) but should still check visibility.

## Internal Mechanics

### Authorization in Multi-Tenant Systems
```php
public function authorize(): bool
{
    $team = $this->route('team');

    // User must belong to the team being acted upon
    if (!$this->user()->teams->contains($team)) {
        return false;
    }

    return $this->user()->can('create', [Post::class, $team]);
}
```

### Exhaustive Pre-Authorization Logging
```php
public function authorize(): bool
{
    $authorized = $this->user()->can('create', Post::class);

    if (!$authorized) {
        Log::warning('Authorization denied', [
            'user_id' => $this->user()->id,
            'ability' => 'create',
            'resource' => Post::class,
            'ip' => $this->ip(),
            'user_agent' => $this->userAgent(),
        ]);
    }

    return $authorized;
}
```

## Patterns

### Testing authorize() in Isolation
```php
public function test_authorize_denies_guest(): void
{
    $request = new StorePostRequest([], [], [], [], [], ['REMOTE_ADDR' => '127.0.0.1']);

    $this->assertFalse($request->authorize());
}

public function test_authorize_allows_owner(): void
{
    $user = User::factory()->create();
    $post = Post::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user);

    $request = new UpdatePostRequest([], [], [], [
        'post' => $post->id,
    ], [], ['REMOTE_ADDR' => '127.0.0.1']);
    $request->setRouteResolver(fn () => Route::get('api/v1/posts/{post}', ...)->bind($request));

    $this->assertTrue($request->authorize());
}
```

### Testing Authorization Failure Response
```php
public function test_store_post_returns_403_when_forbidden(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/posts', [
        'title' => 'Test Post',
        'body' => 'Content',
    ]);

    $response->assertStatus(403);
    $response->assertJsonPath('errors.0.code', 'FORBIDDEN');
}
```

### Rate Limiter + Authorization
```php
public function authorize(): bool
{
    $key = 'auth-check:' . $this->user()->id . ':create-post';

    if (RateLimiter::tooManyAttempts($key, 5)) {
        Log::warning('Rate-limited authorization check', ['user_id' => $this->user()->id]);
        return false;
    }

    $result = $this->user()->can('create', Post::class);

    RateLimiter::hit($key, 60);

    return $result;
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Layered security (middleware + request + service) | Defense-in-depth; single layer can be bypassed by misconfiguration |
| authorize() test via unit test + integration test | Unit tests cover logic; integration tests verify HTTP response |
| Rate-limited authorize() for sensitive actions | Prevents brute-force guessing of authorization rules |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Three-layer authorization | Redundant checks catch configuration errors | Triple query overhead on every request |
| Rate-limited authorize() | Prevents abuse of auth-check endpoint | Adds Redis calls to authorization path |
| Unit testing authorize() | Fast, focused tests | Requires mocking route bindings and authentication |

## Performance Considerations
- Rate limiting `authorize()` adds 2 Redis calls per request — measure impact on high-throughput endpoints.
- Use `User::with('roles.permissions')` in a middleware to preload authorization data before `authorize()` runs.
- Cache policy results with `Gate::after()` if users change roles infrequently.
- Avoid model loading in `authorize()` if middleware already loaded it.

## Production Considerations

### Audit Trail for Authorization Decisions
```php
// App\Listeners\LogAuthorizationDecision
class LogAuthorizationDecision
{
    public function handle(AuthorizationDecision $event): void
    {
        DB::table('authorization_audit_log')->insert([
            'user_id' => $event->user?->id,
            'ability' => $event->ability,
            'resource_type' => get_class($event->resource),
            'resource_id' => $event->resource?->getKey(),
            'result' => $event->result,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
```

### Graceful Degradation
If the authorization service (policy or gate) throws an exception, **deny by default**:
```php
public function authorize(): bool
{
    try {
        return (bool) $this->user()->can('create', Post::class);
    } catch (\Throwable $e) {
        Log::error('Authorization service failure', [
            'exception' => $e->getMessage(),
            'user_id' => $this->user()?->id,
        ]);
        return false;
    }
}
```

### Team-Level Authorization for Multi-Tenant
```php
class UpdateTeamPostRequest extends ApiRequest
{
    public function authorize(): bool
    {
        $team = $this->route('team');
        $post = $this->route('post');

        // Post must belong to the team
        if ($post->team_id !== $team->id) {
            return false;
        }

        return $this->user()->can('update', [$post, $team]);
    }
}
```

## Common Mistakes
- Only testing the happy path (authorized) — 403 paths left untested.
- Using `$this->user()` without ensuring `auth` middleware ran — returns `null`.
- Checking authorization inside rules() via conditional: rules don't run if authorize() fails, but it's confusing.
- Making authorize() depend on request input: raw input is available but should not be trusted for authorization decisions.
- Logging sensitive authorization details (e.g., policy evaluation details) in production logs.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Policy method missing | `403` with no detail | Register policy methods; test all abilities |
| Gate::denies() misuse | Boolean logic inverted | Use `Gate::allows()` or `$user->can()` |
| authorize() returns null | `403` always (null is falsy) | Always return `bool` explicitly |
| Middleware order changed | authorize() sees no auth guard | Document middleware order; test with integration tests |
| Multi-tenant boundary leak | User from Team A can act on Team B resource | Double-check team_id in both route and model |

## Ecosystem Usage

### Laravel Sanctum + FormRequest
```php
// Sanctum token scopes can be checked inside authorize()
public function authorize(): bool
{
    if (!$this->user()->tokenCan('post:create')) {
        return false;
    }

    return $this->user()->can('create', Post::class);
}
```

### Spatie Laravel Permission Integration
```php
public function authorize(): bool
{
    return $this->user()->hasRole('editor') || $this->user()->hasPermissionTo('create posts');
}
```

### Laravel Telescope
- Authorization failures appear in Telescope's "Gates" tab.
- Use `Gate::before()` and `Gate::after()` callbacks to log all authorization checks to Telescope.

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class that hosts authorize().
- **authorization-in-form-requests** — Phase 2 authorize() mechanics.

### Related Topics
- **conditional-validation-patterns** — input-dependent authorization decisions.
- **after-validation-hooks** — authorization-triggered hooks.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — authorized data shaping through DTOs.
- **manual-validator-creation** — authorization in non-FormRequest contexts.

## Research Notes

### Source Analysis
Laravel's `Gate` class resolves policies via `AuthServiceProvider`. The `can()` method on `User` model proxies to `Gate::forUser()`. Policy methods receive the authenticated user as the first parameter and the model instance (or class string) as the second.

### Key Insight
FormRequest authorization creates a **single responsibility boundary**: the request class determines *if* the action is allowed, and the controller/service performs *what* the action does. This separation means authorization logic can be tested in isolation via unit tests, without HTTP routing overhead.

### Version-Specific Notes
- Laravel 10: `Gate::after()` can override policy decisions — use with caution.
- Laravel 11: No breaking changes to authorization in FormRequests.
- PHP 8.3: Intersection types allow `authorize(): bool&gateResult` patterns.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization