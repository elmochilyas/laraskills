# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Gates (Closure-Based Authorization) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Gates are Closure-based authorization checks defined in `AppServiceProvider` using the `Gate` facade. They answer "Can the user perform this action?" for actions that are not tied to a specific model or resource. Gates are the simplest form of authorization in Laravel — define a closure, check with `Gate::allows()` or `$user->can()`. Gates are ideal for actions like "view admin dashboard", "export data", or "access reporting".

---

## Core Concepts

- **`Gate::define()`**: Define a gate in `AppServiceProvider::boot()`. Takes a name and a closure receiving the authenticated user and optional arguments.
- **`Gate::allows()` / `Gate::denies()`**: Check if a gate passes. `Gate::allows('view-dashboard')` returns boolean.
- **`$user->can()` / `$user->cannot()`**: Check on the User model. Same as `Gate::allows()`/`Gate::denies()` but called on the user instance.
- **`Gate::before()`**: A callback that runs before all gates. Used for super-admin bypass — if `before()` returns true, the gate check is skipped (allowed).
- **`Gate::after()`**: A callback that runs after all gates. Can override the gate result.
- **`Gate::authorize()`**: Throws `AuthorizationException` if the gate fails — results in 403 response.

---

## When To Use

- Non-model-specific actions (view admin dashboard, export data, access settings)
- Simple boolean checks that do not require a full Policy class
- Admin/super-admin bypass logic via `Gate::before()`
- Prototyping authorization before extracting to Policies

## When NOT To Use

- Model-specific CRUD actions (use Policies)
- Complex authorization logic requiring dependency injection (use Policies)
- When authorization logic needs to be reused across multiple models (use Policies)

---

## Best Practices

- **Use Gate::before() for Super-Admin**: `Gate::before(fn ($user) => $user->isSuperAdmin())`. Returns `true` to allow all actions.
- **Gate Names Should Be Action-Oriented**: `'view-dashboard'`, `'export-reports'`, `'manage-settings'`. Not role names.
- **Check Gates in Controllers, Not Views Only**: Server-side `Gate::authorize()` is mandatory. Blade `@can` is UX-only — bypassable by direct URL access.
- **Keep Gates in AppServiceProvider**: For many gates, extract to a dedicated `AuthServiceProvider` or gate class.

---

## Architecture Guidelines

- Gates defined in `AppServiceProvider::boot()` or dedicated `AuthServiceProvider`
- Gate checks in controllers: `Gate::authorize('view-dashboard')` throws 403 on failure
- Blade usage: `@can('view-dashboard')` for UI conditional rendering
- Gates can receive additional context: `Gate::authorize('update-field', $field)` passes `$field` as second argument

---

## Performance Considerations

- Gate resolution: negligible overhead (~0.01ms per check). Closures are resolved once and cached.
- `Gate::before()` runs on every gate check — keep it lightweight (simple boolean check).
- No database queries unless the gate closure performs one.

---

## Security Considerations

- **Server-Side Enforcement**: Gates must be checked on the server. Blade directives are presentation-only and do not prevent direct URL access.
- **Super-Admin Bypass**: `Gate::before()` must return `true|null` (not `false`). Returning `false` denies the action even if the gate would allow it.
- **Type Safety**: Gate closures receive a nullable user. Unauthenticated users have `$user = null`. Check for null before accessing user properties.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only checking gates in Blade views | Assuming @can is sufficient | Direct URL navigation bypasses authorization | Always check with `Gate::authorize()` in controller |
| Returning `false` from `Gate::before()` | Super-admin bypass anti-pattern | Denies all actions even if gate would allow | Return `true|null` (true = allow; null = delegate to gate) |
| Using role names as gate names | 'editor', 'admin' literals | Check is too coarse-grained | Use action-based names ('view-dashboard', 'export-reports') |
| Forgetting null user check | Assuming user is always authenticated | Error on guest routes | Check `$user !== null` before access |

---

## Anti-Patterns

- **Checking roles instead of abilities**: Gates should check "can the user do X?" not "is the user an admin?"
- **Duplicating Policy logic in Gates**: If the check is model-specific, use a Policy
- **Using `Gate::allows()` without fallback**: Always handle the false case — don't assume authentication

---

## Examples

**Defining gates:**
```php
// AppServiceProvider::boot()
use Illuminate\Support\Facades\Gate;

Gate::define('view-dashboard', function (User $user) {
    return $user->isAdmin() || $user->hasPermission('view-dashboard');
});

Gate::define('export-reports', function (User $user) {
    return $user->hasPermission('export-reports');
});
```

**Super-admin bypass:**
```php
Gate::before(function (User $user, string $ability) {
    if ($user->isSuperAdmin()) {
        return true; // Allow all actions
    }
});
```

**Checking gates:**
```php
// Controller
public function dashboard()
{
    Gate::authorize('view-dashboard');
    return view('dashboard');
}

// Blade
@can('view-dashboard')
    <a href="/dashboard">Dashboard</a>
@endcan
```

---

## Related Topics

- Policies (model-centric authorization)
- Policy auto-discovery
- Super-admin bypass patterns
- Blade authorization directives
- Authorization middleware

---

## AI Agent Notes

- Gates are the entry point for Laravel authorization. Check `AppServiceProvider::boot()` for gate definitions.
- `Gate::before()` is the most common super-admin pattern — verify it returns `true|null`, not `true|false`.
- For model-specific CRUD, recommend extracting gates to Policies.

---

## Verification

- [ ] Gates defined for non-model actions (dashboard, export, settings)
- [ ] `Gate::authorize()` called in controllers for server-side enforcement
- [ ] `@can`/`@cannot` used in Blade for conditional UI rendering
- [ ] `Gate::before()` correctly implemented (returns `true|null`, not `true|false`)
- [ ] Null user check in gate closures
- [ ] Gate names are action-oriented, not role-based
- [ ] Gate logic extracted to `AuthServiceProvider` if many gates exist
