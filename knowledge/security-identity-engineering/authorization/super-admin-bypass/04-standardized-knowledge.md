# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Super-Admin Bypass (Gate::before) |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The super-admin bypass pattern uses `Gate::before()` to allow certain users (super-admins) to bypass all authorization checks. When `Gate::before()` returns `true`, the gate check succeeds immediately without executing the specific Gate or Policy method. This is the standard Pattern for super-admins who should have unrestricted access to all features. The implementation: `Gate::before(fn ($user) => $user->isSuperAdmin())`. Returns `true` to allow, `null` to delegate to the normal gate check.

---

## Core Concepts

- **`Gate::before()`**: A callback registered in `AppServiceProvider::boot()` that runs before any Gate or Policy check.
- **Return `true` = Allow All**: If `before()` returns `true`, the check is immediately authorized.
- **Return `null` = Delegate**: If `before()` returns `null` or no value, the normal gate/policy check runs.
- **Never Return `false`**: Returning `false` denies the action even if the gate would allow it.
- **Spatie Integration**: `$user->hasRole('super-admin')` in `before()` works with Spatie laravel-permission.

---

## When To Use

- Super-admin users who need unrestricted access to all features
- Development environments where authorization is temporarily bypassed
- Support/admin tools where staff need access across all user contexts
- System accounts (CLI commands, queue workers) that run with full privileges

## When NOT To Use

- Normal authorization flow — super-admin bypass is specifically for elevated accounts
- Feature flags or permission checks in business logic — use explicit permissions
- Guest/unauthenticated routes — unauthenticated users should not bypass authorization

---

## Best Practices

- **Return `true|null`, Never `false`**: `true` = allow; `null` = delegate to gate. `false` = deny everything.
- **Authenticated User Check**: `Gate::before(fn (User $user) => $user->isSuperAdmin())` — unauthenticated users are not passed (the gate system handles them separately).
- **Keep It Simple**: The `before()` closure should be a single boolean check. Complex logic belongs in the User model method.
- **Document Super-Admin Criteria**: Which users qualify as super-admin? Document the criteria and how they are assigned.

---

## Architecture Guidelines

- Register in `AppServiceProvider::boot()` or `AuthServiceProvider::boot()`
- Check against a user model method: `$user->isSuperAdmin()`
- The `isSuperAdmin()` method should be simple: role check, column check, or permission check
- For Spatie: `$user->hasRole('super-admin')`
- For simple setups: `$user->is_super_admin` column

---

## Performance Considerations

- `before()` runs on every authorization check — keep the closure lightweight
- A database query in `before()` would execute on every authorization check — avoid
- Cache the super-admin status: use eager loading, cached roles, or a column

---

## Security Considerations

- **Single Point of Escalation**: `Gate::before()` grants all permissions. Carefully control which users get super-admin status.
- **Audit Logging**: Log when a super-admin acts on resources they would not normally access.
- **Scoped Super-Admin**: For multi-tenant apps, consider tenant-scoped super-admin that bypasses checks only within their tenant.
- **No Guest Bypass**: Unauthenticated users never trigger `Gate::before()` — guests cannot bypass authorization.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Returning `false` from `before()` | Misunderstanding return semantics | Denies all actions even if normal gates would allow | Never return `false` — return `true` or `null` |
| Complex logic in `before()` | Putting authorization rules in the bypass | Hard to test; slow | Keep it simple — delegate to model method |
| No super-admin audit trail | Assuming super-admins shouldn't be audited | Unauthorized super-admin actions go undetected | Log super-admin access to restricted resources |
| Using `before()` for non-super-admin logic | Convenience for shared checks | Bypasses individual gate logic unexpectedly | Use `Gate::after()` or explicit gate checks |

---

## Anti-Patterns

- **Multiple `Gate::before()` registrations**: Only the last registered `before()` takes effect. Register once.
- **Returning `true` for all authenticated users**: Defeats the entire authorization system
- **Checking permissions in `before()` and returning boolean**: Should return `true` (allow all) or `null` (delegate)

---

## Examples

**Basic super-admin bypass:**
```php
// AppServiceProvider::boot()
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user) {
    return $user->isSuperAdmin() ? true : null;
});
```

**User model method:**
```php
// app/Models/User.php
public function isSuperAdmin(): bool
{
    return $this->hasRole('super-admin');
    // or: return $this->is_super_admin;
    // or: return $this->email === config('app.super_admin_email');
}
```

**With Spatie permission wildcard:**
```php
// Combined approach: super-admin role with wildcard permission
Gate::before(function (User $user) {
    if ($user->hasRole('super-admin')) {
        return true;
    }
});
```

---

## Related Topics

- Gates (closure-based authorization)
- Policies (model-centric authorization)
- RBAC design (role-based access control)
- Spatie laravel-permission
- Authorization testing

---

## AI Agent Notes

- `Gate::before()` is the standard super-admin pattern. Check if it's implemented in all Laravel projects needing admin bypass.
- Verify the return value is `true|null`, not `false` — this is the most common bug.
- Super-admin assignment must be tightly controlled — check how users become super-admins.

---

## Verification

- [ ] `Gate::before()` registered in `AppServiceProvider` or `AuthServiceProvider`
- [ ] Return value is `true|null` (not `false`)
- [ ] Super-admin check is a simple boolean method on User model
- [ ] No database queries in the `before()` closure
- [ ] Super-admin assignment process documented and controlled
- [ ] Super-admin actions logged for auditing
- [ ] Guest/unauthenticated users cannot bypass authorization
- [ ] Only one `Gate::before()` registered
