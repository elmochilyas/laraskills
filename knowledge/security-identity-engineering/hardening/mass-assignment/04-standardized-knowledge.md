# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Mass Assignment Protection ($fillable/$guarded) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Mass assignment protection prevents users from setting arbitrary model attributes via request input. Eloquent models use `$fillable` (whitelist of assignable attributes) or `$guarded` (blacklist of non-assignable attributes) to control which fields can be set via `create()` or `update()` with an array. The best practice is to use `$request->validated()` from Form Requests — only validated fields are passed, and mass assignment protection is the second line of defense. Never use `$request->all()` with mass assignment, and avoid `Model::unguard()` in production code.

---

## Core Concepts

- **`$fillable`**: Array of attribute names that are mass-assignable. `protected $fillable = ['name', 'email']`.
- **`$guarded`**: Array of attribute names that are NOT mass-assignable. `protected $guarded = ['is_admin']`.
- **`$guarded = ['*']`**: Guard all attributes — nothing is mass-assignable. The safest default.
- **Mass Assignment**: Setting multiple attributes at once via `create()`, `update()`, `fill()`, or `forceCreate()`.
- **`create()` vs `forceCreate()`**: `create()` respects `$fillable`/`$guarded`. `forceCreate()` bypasses mass assignment protection.

---

## When To Use

- Every Eloquent model — mass assignment protection should be configured by default
- User registration, profile updates, and any form that accepts user input
- API endpoints that accept JSON payloads with model attributes

## When NOT To Use

- Internal code paths where all attributes are explicitly set (not from user input)
- Console commands and queue jobs that set attributes individually
- When using `$request->validated()` exclusively (Form Requests validate before assignment)

---

## Best Practices

- **Use `$fillable` Whitelist**: Explicitly list assignable attributes. Safer than `$guarded` blacklist.
- **Always Use `$request->validated()`**: Form Request validation returns only the validated, allowed fields. Mass assignment protection is defense-in-depth.
- **Never Use `$request->all()`**: The entire request payload is passed to mass assignment — bypasses Form Request filtering.
- **Avoid `unguard()`**: `Model::unguard()` disables mass assignment protection globally. Only use in seeders/factory code.

---

## Architecture Guidelines

- Define `$fillable` on every model — empty array or explicit list
- Form Requests return validated data — pass directly to `create()` or `update()`
- For admin-only fields (roles, permissions, is_admin), ensure they are NOT in `$fillable`
- Use `forceCreate()` sparingly and only in internal code paths with explicit attribute setting

---

## Performance Considerations

- Mass assignment protection is a runtime check — negligible overhead (~0.001ms)
- No database impact — purely application-level validation

---

## Security Considerations

- **`$request->all()` is Dangerous**: Includes all request fields, including any the user added maliciously. Always use validated data.
- **is_admin Attack**: If `is_admin` is not in `$fillable` but the request includes it, the field is silently ignored. If using `$request->all()`, the field may be set if `$guarded` doesn't include it.
- **Nested Attributes**: Mass assignment protection works one level deep. Nested relationships may need additional protection.
- **`forceCreate()`**: Completely bypasses protection. Audit all uses.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `$request->all()` | Convenience | Malicious fields can be mass-assigned | Use `$request->validated()` |
| `$guarded = []` (empty) | Leaving default | All attributes are mass-assignable | Use `$fillable` whitelist or `$guarded = ['*']` |
| `Model::unguard()` in production | Allowing tinker convenience | Global mass assignment disabled | Only use in seeders/test factories |
| Assuming validated data is safe | Skipping $fillable | If validation misses a field, it can be set | Validate + fillable protection (defense in depth) |
| `forceCreate()` without review | Silence mass assignment errors | Bypasses protection unexpectedly | Audit every forceCreate() usage |

---

## Anti-Patterns

- **`$guarded = []` (no protection)**: All attributes are assignable — a malicious user could set `is_admin = true`
- **Using `$request->except(['field'])`**: Still passes all other fields — use validated data instead
- **Mass assignment without validation**: Passing raw request data to `create()` bypasses validation entirely

---

## Examples

**Safe pattern:**
```php
// Model
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
}

// Controller (Form Request)
public function store(UserRequest $request)
{
    // $request->validated() returns only validated, allowed fields
    return User::create($request->validated());
}
```

**Unsafe pattern:**
```php
// Model with no fillable/guarded (mass-assignable by default)
class User extends Model
{
    // $guarded = []; // DANGEROUS — all attributes mass-assignable
}

// Controller — $request->all() includes ALL request fields
User::create($request->all());
// User could set: is_admin=1, role=admin, etc.
```

**Safe guarded pattern:**
```php
class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password',
        // is_admin is NOT in fillable — cannot be mass-assigned
    ];
}
```

---

## Related Topics

- Form Request validation
- SQL injection prevention
- Eloquent ORM fundamentals
- Input validation security

---

## AI Agent Notes

- Mass assignment protection is a critical Laravel security feature. Check that every model has `$fillable` defined.
- The combination of `$fillable` + `$request->validated()` provides defense in depth.
- `Model::unguard()` in application code is a red flag — audit immediately.

---

## Verification

- [ ] Every model has `$fillable` (or `$guarded`) defined
- [ ] No `$guarded = []` (empty blacklist) in production models
- [ ] Controllers use `$request->validated()` (not `$request->all()`) for create/update
- [ ] `Model::unguard()` only used in seeders/factories (not application code)
- [ ] `forceCreate()` usage audited and minimal
- [ ] Admin-only fields (is_admin, role) not in any `$fillable` array
- [ ] Form Requests validate all fields that could be mass-assigned
