# ECC Standardized Knowledge — Enum Binding

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Enum Binding |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Implicit enum binding (introduced in Laravel 9) automatically resolves backed enums from route parameters. When a route parameter is type-hinted with a PHP backed enum in the controller or closure, Laravel automatically casts the URL segment string to the corresponding enum case. If the value doesn't match any case, a 404 response is returned.

This eliminates manual enum resolution boilerplate (`Enum::tryFrom($value) ?? abort(404)`) and ensures type safety in controller method signatures. Enum binding works with both string and integer backed enums.

---

## Core Concepts

### Backed Enum Binding
```php
enum PostStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}

Route::get('/posts/{status}', function (PostStatus $status) {
    return $status; // Resolved from URL segment
});
```

### 404 on Invalid Values
If the URL segment doesn't match any enum case, Laravel returns 404 automatically — no manual validation needed.

### String and Integer Backed Enums
Both `string` and `int` backed enums are supported. Pure enums (non-backed) are not supported for binding.

---

## When To Use

- Route parameters representing enum values (status, type, category, role)
- API filters where the filter value is an enum
- Workflow states in URL patterns

---

## When NOT To Use

- Non-backed enums (pure enums cannot be bound)
- Enum values that should not be exposed in URLs
- When the enum value needs additional validation beyond case matching

---

## Best Practices

### Use Backed Enums for Route Parameters
Use string-backed enums for route-routable values.

**Why:** String-backed enums provide readable URL segments and automatic binding. Integer-backed enums are less readable in URLs.

### Combine with Route Constraints
Add regex constraints for additional validation.

**Why:** While enum binding handles case matching, regex constraints can provide early rejection and clearer 404 responses for invalid formats.

---

## Architecture Guidelines

### Binding Flow
```
URL: /posts/draft
  → Route parameter {status} → PostStatus $status
  → PostStatus::tryFrom('draft') → PostStatus::Draft
  → If null → 404
```

### Invalid Value Behavior
```
URL: /posts/archived
  → PostStatus::tryFrom('archived') → null
  → 404 response
```

---

## Performance Considerations

Enum binding uses `tryFrom()` which is O(1) for backed enums. Negligible performance cost. No database query involved.

---

## Security Considerations

Enum binding does not replace authorization. An enum value in a URL may be valid but the user may not be authorized to access resources filtered by that value. Always apply authorization checks.

---

## Common Mistakes

### Using Pure Enums
Desc: Type-hinting a pure (non-backed) enum in a route parameter.
Cause: Not knowing that only backed enums are supported.
Consequence: BindingResolutionException — the container cannot resolve the pure enum.
Better: Use backed enums (`: string` or `: int`) for route parameters.

### Assuming Binding for Non-Enum Types
Desc: Expecting enum-like binding for non-enum types (e.g., type-hinting a string).
Cause: Misunderstanding the feature scope.
Consequence: No binding occurs; raw string is injected.
Better: Only use enum binding for backed enum type hints.

---

## Anti-Patterns

### Manual tryFrom() in Controllers
Writing `PostStatus::tryFrom($request->status) ?? abort(404)` when route-level enum binding would handle it automatically.

---

## Examples

### String-Backed Enum Binding
```php
enum PostStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}

Route::get('/posts/{status}', function (PostStatus $status) {
    return $status; // PostStatus::Draft for /posts/draft
});
```

### Integer-Backed Enum Binding
```php
enum UserRole: int
{
    case Admin = 1;
    case Editor = 2;
    case Viewer = 3;
}

Route::get('/users/{role}', function (UserRole $role) {
    return $role; // UserRole::Admin for /users/1
});
```

---

## Related Topics

### Prerequisites
- **Route Model Binding (Implicit)** — Foundation for all binding
- **PHP 8.1 Enums** — Backed enum fundamentals

### Closely Related
- **Route Definition** — Parameter type-hinting in routes
- **Route Constraints** — Regex patterns for route parameters

---

## AI Agent Notes

### Important Decisions
- Enum binding was introduced in Laravel 9
- Only backed enums (string or int) are supported
- Pure enums cannot be bound — use string matching with explicit validation
- Invalid values return 404, not validation errors

### Important Constraints
- The enum must be a backed enum (`: string` or `: int`)
- `tryFrom()` must return null for invalid values
- The route parameter type hint must be the fully qualified enum class

### Rules Generation Hints
- Enforce backed enums over string literals for route-routable values
- Enforce enum type hints in controller parameters instead of manual tryFrom()

---

## Verification

This document has been validated against:
- `Illuminate\Routing\ImplicitRouteBinding::resolveForRoute()` — enum resolution logic
- PHP 8.1 backed enum `tryFrom()` behavior
