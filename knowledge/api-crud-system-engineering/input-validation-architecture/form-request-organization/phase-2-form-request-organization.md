# Form Request Organization

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** form-request, directory-structure, organization, laravel

## Executive Summary
Phase 2 covers directory structure strategies, naming conventions, and namespace organization for Form Requests in API contexts. As endpoint count grows, a flat `App\Http\Requests` directory becomes unmaintainable. This phase prescribes per-resource and per-action organization patterns, inheritance hierarchies, and convention-based autoloading strategies.

## Core Concepts

### Organization as API Surface Mapping
The FormRequest directory structure should mirror the API surface. Each resource gets a dedicated subdirectory, and each action gets a dedicated file. This creates a 1:1 mapping between filesystem and API contract — developers can locate validation logic by knowing the endpoint URL.

### Per-Resource Organization
```
App\Http\Requests\Api\V1\
├── Posts\
│   ├── StorePostRequest.php
│   ├── UpdatePostRequest.php
│   └── BulkStorePostsRequest.php
├── Comments\
│   ├── StoreCommentRequest.php
│   ├── UpdateCommentRequest.php
│   └── IndexCommentsRequest.php
└── Auth\
    ├── LoginRequest.php
    ├── RegisterRequest.php
    └── ResetPasswordRequest.php
```

### Per-Action Suffix Convention
| Suffix | Endpoint | HTTP Method |
|---|---|---|
| `Index*Request` | `GET /resources` | GET |
| `Store*Request` | `POST /resources` | POST |
| `Update*Request` | `PUT\|PATCH /resources/{id}` | PUT/PATCH |
| `Show*Request` | `GET /resources/{id}` | GET |
| `Destroy*Request` | `DELETE /resources/{id}` | DELETE |
| `BulkStore*Request` | `POST /resources/bulk` | POST |

## Internal Mechanics

### Namespace Resolution
Laravel resolves FormRequests via the service container. The namespace must match the autoloader configuration in `composer.json`:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/"
        }
    }
}
```

All FormRequests under `App\Http\Requests\Api\V1\Posts\StorePostRequest.php` resolve automatically without manual registration.

### Inheritance Hierarchies
```
App\Http\Requests\Api\V1\Posts\
├── BasePostRequest.php        (shared rules: title, body max-length)
├── StorePostRequest.php       (extends BasePostRequest: adds required rule)
└── UpdatePostRequest.php      (extends BasePostRequest: makes fields sometimes)
```

Base request classes contain common rules but should be prefixed with `Base` to signal their abstract nature.

## Patterns

### Versioned Namespace
```php
namespace App\Http\Requests\Api\V1\Posts;

class StorePostRequest extends \App\Http\Requests\Api\ApiRequest
{
    // API-wide base request provides shared headers, error handling
}
```

### ApiRequest Base Class
```php
namespace App\Http\Requests\Api;

abstract class ApiRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        // API-wide consistent JSON error response
    }

    protected function failedAuthorization(): void
    {
        // API-wide forbidden response
    }
}
```

### Convention-Based Autoloading Macro
```php
// AppServiceProvider::boot()
Request::macro('fromRequest', function (string $requestClass): static {
    return app($requestClass);
});
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Per-resource subdirectories | Mirrors API surface, easy to navigate | Flat directory — unmanageable at 50+ endpoints |
| Action-suffixed names (`StorePostRequest`) | Explicit, no naming collisions | `PostStoreRequest` — less natural English |
| Versioned namespace `Api\V1\*` | Allows breaking changes across API versions | No versioning — breaks backward compatibility |
| Base request per resource | Reduces rule duplication across Store/Update | Single request with method sniffing — conditional complexity |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Deep directory structure | Clear ownership, easy grep | More imports, deeper namespace paths |
| Abstract base request | Shared error handling, headers | Fragile base class; changes affect all subclasses |
| Per-action files | Single responsibility, simple tests | High file count; requires discipline to maintain |
| Inheritance for rules | DRY, centralized rule definitions | Override complexity in subclasses |

## Performance Considerations
- Deep namespaces have zero runtime cost — autoloader only loads used files.
- Avoid loading all FormRequests in a `ServiceProvider` — register only when needed.
- Base request classes should be `abstract` to prevent direct instantiation.

## Production Considerations
- Enforce directory structure with a custom PHPStan or Larastan rule.
- Use `Ide-helper` to generate IDE autocompletion for FormRequests in deep namespaces.
- Document the naming convention in `CONTRIBUTING.md` to enforce consistency across teams.
- `git mv` when renaming endpoints to keep file history.

## Common Mistakes
- Placing update and store rules in the same file with `isMethod()` sniffing — harder to test.
- Creating a single `Requests` flat directory — collisions and clutter at scale.
- Forgetting to update namespace when moving files — `class not found` error.
- Over-abstracting base requests — three-level deep inheritance is hard to debug.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Class not found after move | Autoloader cannot resolve namespace | Run `composer dump-autoload` |
| Wrong request injected | Store rules applied to update | Type-hint the correct class in controller |
| Base class changes break children | Unexpected validation behavior | Use `final` on base request methods or test all subclasses |
| Directory drift from API spec | Stale validation, missing endpoints | CI check comparing routes vs Request file existence |

## Ecosystem Usage

### Laravel Built-in Generators
```bash
php artisan make:request Api/V1/Posts/StorePostRequest
```
Creates the file and namespace automatically.

### IDE Support
- PHPStorm + Laravel Idea plugin: `Navigate > File by Class` works with deep namespaces.
- VS Code with Laravel Extension Pack: `Ctrl+P` + request name.

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — rules(), authorize(), messages() design basics.

### Related Topics
- **authorization-in-form-requests** — how authorize() fits in organized structure.
- **dto-integration-payload-method** — DTO integration within organized requests.

### Advanced Follow-up Topics
- **validation-rule-array-design** — nested validation within per-action requests.
- **conditional-validation-patterns** — conditional rules across request organization.

## Research Notes

### Source Analysis
Laravel's `make:request` command generates files in `App\Http\Requests`. The namespace is derived from the provided path segments. This convention is extensible — any subdirectory under `Requests` is automatically PSR-4 loadable.

### Key Insight
Organizing FormRequests by resource and action creates a **self-documenting filesystem** that maps directly to the OpenAPI spec. A developer looking at the directory tree can immediately understand the full API shape and its validation constraints.

### Version-Specific Notes
- Laravel 9+: `make:request` supports nested subdirectories natively.
- Laravel 11: No changes to request generation or autoloading.
