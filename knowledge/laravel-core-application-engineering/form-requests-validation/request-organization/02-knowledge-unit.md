# Request Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Request Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Form Request organization determines how validation classes are named, structured, and located within the codebase. The two dominant patterns are flat organization (all requests in `app/Http/Requests/`) and domain-based organization (requests co-located with their domain module). Naming conventions, inheritance strategies, and versioning approaches all affect long-term maintainability as the number of request classes grows.

---

## Core Concepts

### Flat vs Domain-Based Organization

**Flat organization** places all FormRequests in a single directory:

```
app/Http/Requests/
├── StoreUserRequest.php
├── UpdateUserRequest.php
├── StorePostRequest.php
├── UpdatePostRequest.php
├── StoreCommentRequest.php
├── UpdateCommentRequest.php
└── LoginRequest.php
```

**Domain-based organization** co-locates requests with their domain:

```
app/Http/Requests/User/
├── StoreUserRequest.php
└── UpdateUserRequest.php

app/Http/Requests/Post/
├── StorePostRequest.php
└── UpdatePostRequest.php

app/Http/Requests/Comment/
├── StoreCommentRequest.php
└── UpdateCommentRequest.php
```

### Naming Conventions

The standard naming pattern is `{Action}{Entity}Request`:

- `StoreUserRequest` — POST
- `UpdateUserRequest` — PUT/PATCH
- `ShowUserRequest` — GET
- `DeleteUserRequest` — DELETE
- `IndexUserRequest` — GET (list, for filter/sort validation)

Alternative: `{Entity}{Action}Request` (`UserStoreRequest`). The `{Action}{Entity}` form reads more naturally ("StoreUserRequest" = "store a user").

---

## Mental Models

### The Action Contract

Each FormRequest is a contract for one specific action. The class name answers "what can I do with this?" — not "what resource does this belong to?" A file named `StoreUserRequest` declares an intent that is immediately understood.

### The Belongs-To Relationship

Flat organization makes ownership implicit (naming convention). Domain organization makes ownership explicit (directory structure). The choice reflects the team's familiarity — flatter is simpler for small projects, domain grouping scales better for large ones.

---

## Internal Mechanics

### Autoloading and Discovery

FormRequests are discovered through PSR-4 autoloading. No registration step is needed — the container resolves them when the controller method type-hints the class. The `Router` checks for `ValidatesWhenResolved` interface during parameter resolution, not by scanning directories.

### Namespace Resolution

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    // ...
}
```

The namespace must match the autoloading configuration. Default Laravel conventions: `App\Http\Requests` maps to `app/Http/Requests/`.

### Container Resolution

When a controller method type-hints a FormRequest:

```php
public function store(StoreUserRequest $request)
{
    // $request is resolved from container, validated, then passed
}
```

The container resolves `StoreUserRequest` using reflection, injecting the current request data. The `Router` then calls `validateResolved()` before passing to the controller.

---

## Patterns

### Inheritance for Shared Rules

Base class for common validation:

```php
namespace App\Http\Requests\User;

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

Limit inheritance to one level. Two+ levels create fragility where changes propagate unexpectedly.

### Trait Composition for Cross-Cutting Rules

For rules shared across domain boundaries:

```php
trait HasPublishableFields
{
    protected function publishableRules(): array
    {
        return [
            'published_at' => ['nullable', 'date'],
            'is_draft' => ['boolean'],
        ];
    }
}

class StorePostRequest extends FormRequest
{
    use HasPublishableFields;

    public function rules(): array
    {
        return array_merge($this->publishableRules(), [
            'title' => ['required', 'string'],
            'body' => ['required', 'string'],
        ]);
    }
}
```

### Versioned Request Namespacing

For APIs with breaking validation changes:

```
app/Http/Requests/V1/
├── StoreUserRequest.php

app/Http/Requests/V2/
├── StoreUserRequest.php
```

The controller binds to the version-specific request:

```php
// V1 controller uses App\Http\Requests\V1\StoreUserRequest
// V2 controller uses App\Http\Requests\V2\StoreUserRequest
```

This allows the same endpoint path to have different validation rules per version without conditionals in the request class.

### Module-Based Organization (Modular Monolith)

For modular applications using nwidart/laravel-modules or manual module structure:

```
Modules/User/Http/Requests/
├── StoreUserRequest.php
├── UpdateUserRequest.php
└── LoginRequest.php

Modules/Post/Http/Requests/
├── StorePostRequest.php
└── UpdatePostRequest.php
```

Each module is self-contained — moving a module to a separate package requires no request refactoring.

---

## Architectural Decisions

### Flat vs Domain for Team Size

| Team Size | Recommended | Rationale |
|-----------|------------|-----------|
| 1-2 developers | Flat | Fewer directories, simpler navigation |
| 3-5 developers | Domain | Prevents merge conflicts in single directory |
| 5+ developers | Module | Complete isolation, minimized coordination |

Threshold for domain-based: 20+ FormRequests in the flat directory. Before that, flat is simpler.

### Inheritance vs Composition

Inheritance is simpler for sharing rules within a domain (UserRequest → StoreUserRequest). Composition via traits is better for cross-domain patterns (publishable, soft-deletable, audit fields). Deep inheritance is an anti-pattern — a change to `BaseApiRequest` affects every API action.

---

## Tradeoffs

### Flat vs Domain Organization

Flat organization (`app/Http/Requests/`) has the lowest cognitive overhead — every developer knows where to find FormRequests. The tradeoff emerges at scale: with 50+ files in a single directory, naming collisions require longer prefixes (`AdminStoreUserRequest`, `ApiStoreUserRequest`), and unrelated requests are interleaved. Domain-based organization prevents naming collisions naturally but requires developers to navigate subdirectories, increasing the cost of cross-domain lookups.

### Inheritance vs Trait Composition

Inheritance (`UserRequest → StoreUserRequest`) provides clear parent-child semantics and method override safety. The tradeoff is rigidity — a child class cannot selectively inherit only some rules from the parent; it inherits all public/protected methods. Trait composition (`use HasPublishableFields`) allows selective rule sharing across unrelated request hierarchies. The tradeoff is that traits can introduce naming conflicts and make the rule source harder to trace — a rule in `rules()` may come from the class, a parent class, or one of several traits.

---

## Performance Considerations

### Autoloading Performance

PSR-4 autoloading for FormRequest classes has no measurable performance impact. Only the resolved FormRequest class is loaded — autoloading does not scan the directory for available classes. The performance characteristics of flat vs domain organization are identical from a runtime perspective.

### Inheritance Chain Resolution

Deep inheritance chains (3+ levels) add negligible runtime overhead because PHP's method resolution is cached in the opcode cache. The real performance concern is developer time — tracing which method applies at which level of a deep hierarchy is slower than the runtime cost.

---

## Production Considerations

### Discovery Through Container

FormRequests are discovered through controller type-hints, not directory scanning. Moving a FormRequest to a new directory namespace requires updating the controller's `use` statement. In production deployments, verify that all controller type-hints match the actual FormRequest namespace to prevent runtime resolution errors.

### Merge Conflict Management

In production teams, flat FormRequest directories generate merge conflicts when multiple developers add or modify request classes simultaneously. Domain-based organization reduces conflicts by isolating changes to subdirectories. For teams of 5+ developers, domain-based or module-based organization is a merge-conflict reduction strategy, not just a code organization preference.

---

## Common Mistakes

### Too Many Base Classes

A hierarchy like `AdminRequest → AuthenticatedRequest → ApiRequest → FormRequest` creates:
- Fragile changes (adding to `ApiRequest` affects all API endpoints)
- Hard-to-trace rule sources (which base class added this rule?)
- Testing overhead (mocking the deep hierarchy)

Prefer flat classes with trait composition over deep inheritance.

### Mixed Concerns in One Request

```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => 'required|string',
            'body' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'author_id' => 'required|exists:users,id', // Admin concern
            'publish_at' => 'date|after:now',          // Publisher concern
            'seo_title' => 'string|max:60',            // SEO concern
        ];
    }
}
```

A FormRequest should validate one action's input. When it accumulates concerns from multiple roles (author, publisher, SEO editor), consider splitting into request types or using conditionals with authorization gates.

---

## Failure Modes

### Missing Imports on Inheritance

When using inheritance, ensure the child class properly imports the parent. The container resolves by class name — if the imported base class is wrong (e.g., extends `FormRequest` instead of `UserRequest`), the parent's `commonRules()` method is never called.

### Namespace Collisions in Modules

Two modules with `StoreUserRequest` under different namespaces (`Modules/User/...` and `Modules/Admin/...`) can coexist. The controller's use statement determines which resolves. No collision possible as long as each module uses its own namespace.

---

## Ecosystem Usage

### Laravel Nova

Nova follows a domain-based organization for its internal FormRequests. Each Nova resource tool (e.g., `ResourceCreationRequest`, `ResourceUpdateRequest`) is organized under the `Nova\Http\Requests` namespace with subdirectories per resource type. This domain organization allows Nova to support hundreds of resource types without naming collisions.

### Laravel Jetstream

Jetstream uses a flat organization pattern in `Laravel\Jetstream\Http\Requests` for its authentication, team management, and profile FormRequests. With fewer than 20 total request classes, the flat approach works well. Jetstream's choice demonstrates the threshold guideline — flat organization is sufficient until the request count exceeds 20-30 classes.

### Laravel Spark

Spark uses modular organization with separate namespace trees for its billing, team, and user management features. Each module contains its own `Http/Requests` subdirectory, enabling Spark to be distributed as separate packages while maintaining clean separation between billing and team concerns.

---

## Related Knowledge Units

- **Form Request Fundamentals** (this subdomain) — base class and autoloading
- **Controller Organization** (controllers subdomain) — how controllers consume FormRequests
- **Feature-based Structure** (feature-based-structure subdomain) — module-level request placement

---

## Research Notes

### Autoloading and Directory Independence

FormRequests follow standard PSR-4 autoloading, meaning the directory structure is irrelevant to the framework's ability to locate and resolve the class. A FormRequest in `app/Http/Requests/V2/StoreUserRequest.php` with namespace `App\Http\Requests\V2` resolves identically to one in `app/Modules/User/Http/Requests/StoreUserRequest.php` with namespace `App\Modules\User\Http\Requests`. The framework only cares about the class name and namespace, not the directory structure.

### Future Direction — Convention-Based Discovery

Future Laravel versions could introduce convention-based FormRequest discovery, where the framework automatically maps a controller action `UserController::store()` to `App\Http\Requests\StoreUserRequest` without an explicit type-hint. This would eliminate the controller import statement but make the request-controller mapping implicit, trading explicitness for reduced boilerplate.

### Framework Source Reference
- `Illuminate\Routing\Router::resolveMethodDependencies()` — dependency resolution
- `Illuminate\Contracts\Validation\ValidatesWhenResolved` — autoloading contract
- `Illuminate\Foundation\Http\FormRequest` — base class autoloading
