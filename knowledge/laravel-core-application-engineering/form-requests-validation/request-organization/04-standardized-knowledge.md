# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Request Organization |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Request organization determines how validation classes are named, structured, and located within the codebase. The two dominant patterns are flat organization (all requests in `app/Http/Requests/`) and domain-based organization (requests co-located with their domain module). Naming conventions, inheritance strategies, and versioning approaches all affect long-term maintainability as the number of request classes grows.

---

## Core Concepts

- **Flat organization**: All FormRequests in `app/Http/Requests/` — simple, follows Laravel defaults
- **Domain-based organization**: `app/Http/Requests/User/`, `app/Http/Requests/Post/` — groups by entity
- **Naming convention**: `{Action}{Entity}Request` — `StoreUserRequest`, `UpdateUserRequest`
- **Inheritance**: Base request classes for shared validation rules across similar actions
- **Autoloading**: PSR-4 autoloading discovers FormRequests automatically — no registration needed

---

## When To Use

- **Flat**: Small projects with <15 FormRequests, single developer, following Laravel defaults
- **Domain-based**: Projects with 15+ FormRequests across multiple entities, multi-developer teams
- **Inheritance**: When multiple requests share significant common validation logic

## When NOT To Use

- Domain-based for projects with 3-5 FormRequests (unnecessary directory overhead)
- Deep inheritance hierarchies (2 levels max — base → specific request)
- Inheritance when requests only share 1-2 rules (use a trait or helper instead)

---

## Best Practices

- **Name requests by action first**: `StoreUserRequest` reads as "store a user" — more natural than `UserStoreRequest`
- **One request per action**: Separate requests for create and update, even if they share many rules
- **Keep inheritance shallow** — one level of base class is enough; deep hierarchies are hard to follow
- **Use domain-based directories at 15+ requests** — flat becomes hard to navigate
- **Co-locate with feature modules** in feature-based structure: `Features/Billing/Requests/`
- **Use traits for shared rules** instead of deep inheritance when rules are reused across unrelated entities

---

## Architecture Guidelines

- Default location: `app/Http/Requests/` with optional domain subdirectories
- Naming: `{Verb}{Entity}Request` where Verb = Store/Update/Show/Delete/Index
- Inheritance: Abstract base class extends `FormRequest`, specific requests extend base
- Base class pattern: `abstract class UserRequest extends FormRequest` with `commonRules()` method
- Container resolution: Controller type-hint triggers auto-resolution and validation
- No registration step needed — PSR-4 autoloading handles discovery

---

## Performance

Organizational strategy has zero performance impact. Request resolution time is identical regardless of directory structure. Inheritance adds no measurable overhead. Autoloading classmaps eliminate filesystem differences.

---

## Security

Request organization has no security implications. Authorization and validation behavior is identical regardless of directory or naming convention. Inheritance does not bypass authorization — each request's `authorize()` method runs independently.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| One request for create and update | DRY over-optimization | Conditional rules everywhere | Separate requests with shared base class |
| Deep inheritance hierarchy | Over-abstracting shared rules | Hard to trace which rule applies | Maximum 2 levels: base → specific |
| Inconsistent naming | No convention enforced | Hard to find the right request | Use `{Action}{Entity}Request` consistently |
| Requests scattered without pattern | No organizational strategy | New requests placed randomly | Establish and document a convention |
| Base class with too many rules | All entity requests share everything | Base class grows unmanageable | Split into multiple base classes per concern |

---

## Anti-Patterns

- **One request for all CRUD actions**: A single `UserRequest` with conditional rules for every action
- **Five-level inheritance**: `FormRequest → AdminRequest → UserRequest → UpdateUserRequest → AdminUpdateUserRequest`
- **Giant base class**: `BaseRequest` with 50 rules that 20 diverse request classes extend
- **Flat directory with 50 files**: No organization, requests for different entities mixed together

---

## Examples

**Flat organization:**
```
app/Http/Requests/
  StoreUserRequest.php
  UpdateUserRequest.php
  StorePostRequest.php
  UpdatePostRequest.php
  LoginRequest.php
```

**Domain-based organization:**
```
app/Http/Requests/User/
  StoreUserRequest.php
  UpdateUserRequest.php
  IndexUserRequest.php

app/Http/Requests/Post/
  StorePostRequest.php
  UpdatePostRequest.php
```

**Inheritance pattern:**
```php
abstract class UserRequest extends FormRequest
{
    public function commonRules(): array
    {
        return [
            'email' => ['required', 'email', Rule::unique('users')->ignore($this->route('user'))],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}

class UpdateUserRequest extends UserRequest
{
    public function rules(): array
    {
        return $this->commonRules();
    }
}

class StoreUserRequest extends UserRequest
{
    public function rules(): array
    {
        return array_merge($this->commonRules(), [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
    }
}
```

**Co-location in feature-based structure:**
```
Features/Billing/Requests/
  StoreInvoiceRequest.php
  UpdateInvoiceRequest.php
```

---

## Related Topics

- form-request-fundamentals — Core FormRequest architecture
- form-request-dto-integration — Converting requests to DTOs
- form-request-testing — Testing organized requests
- authorization-in-requests — Authorization per request
- modular-monolith-basics — Feature-based structure for request co-location

---

## AI Agent Notes

- FormRequests are discovered through PSR-4 autoloading — no registration needed
- The Router checks for `ValidatesWhenResolved` interface during parameter resolution
- Namespace must match autoloading configuration: `App\Http\Requests` → `app/Http/Requests/`
- The container resolves the request using reflection, injecting current request data
- Route model binding results are available via `$this->route('param')`

---

## Verification

- [ ] Naming convention documented and consistent (`{Action}{Entity}Request`)
- [ ] Separate requests for different actions (Store vs Update)
- [ ] Domain-based directories used at 15+ requests
- [ ] Inheritance hierarchy is max 2 levels deep
- [ ] No conditional rules for action detection (if create vs if update)
- [ ] Request namespace matches autoloading configuration
- [ ] All requests extend `FormRequest` or a project-specific base
- [ ] Consistent location strategy across the project
