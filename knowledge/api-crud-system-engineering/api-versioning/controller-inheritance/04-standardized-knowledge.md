# ECC Standardized Knowledge — Controller Inheritance

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Controller Inheritance |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Controller inheritance structures API controllers in a versioned hierarchy: a base controller defines shared logic, and version-specific subclasses override only what changed. This KU covers class hierarchy design, trait reuse, and method override patterns. A base controller holds shared authentication, pagination, and error handling. Version controllers extend the base and override only the methods that change between versions. Controller inheritance works well when most endpoints don't change between versions — when >50% of methods are overridden, composition (strategy pattern) is cleaner.

## Core Concepts

- **Base Controller**: `App\Http\Controllers\Api\BaseController` — shared auth, pagination, error handling
- **Version Controllers**: `App\Http\Controllers\Api\V1\UsersController extends Api\BaseController`
- **Override Points**: Only methods that change between versions are overridden
- **Trait Composition**: Shared cross-version logic via traits rather than deep inheritance
- **Template Method Pattern**: Base defines skeleton, subclasses fill variable parts
- **`#[Override]` Attribute** (PHP 8.3+): Catches accidental signature drift in inherited methods

## When To Use

- APIs where most endpoints remain similar across versions
- Teams practicing DRY with versioned controller logic
- When the base controller is stable and well-tested
- As starting architecture for new API versioning

## When NOT To Use

- When >50% of methods are overridden (inheritance becomes burden)
- When versions diverge significantly in behavior
- When the base controller grows into a "god" object
- When deep inheritance chains develop (Base → V1 → V1_1 → V2)

## Best Practices

- **Limit inheritance depth to 2 levels** (Base → Version) — prevents deep inheritance complexity.
- **Mark security-critical methods as `final`** in the base controller (auth, throttle).
- **Use traits for cross-cutting concerns** (audit logging, cache headers).
- **Use `#[Override]` attribute** (PHP 8.3+) to catch accidental signature changes.
- **Keep base controllers lean** — move infrastructure concerns to middleware.
- **Test the base controller once** and override tests for version-specific methods only.
- **Document which methods are safe to override** and which are internal.

## Architecture Guidelines

- PHP inheritance adds zero runtime overhead (method resolution is compile-time).
- Base controller constructor can be heavy if it resolves many dependencies — use lazy resolution.
- Trait composition is equivalent to copy-paste at compile time — no performance impact.
- Controller inheritance is a "young API" pattern — as the API matures and versions diverge, evolve to composition.
- A `ControllerInheritanceAnalyzer` can calculate override percentage to detect when refactoring is needed.

## Performance Considerations

- PHP inheritance adds zero runtime overhead (compile-time method resolution).
- Base controller constructor with many dependencies can add startup overhead — use lazy resolution.
- Trait composition has no performance impact.
- Test suite execution time may increase with deep hierarchy complexity.

## Security Considerations

- `final` methods in base controller prevent override for security-critical logic (auth, throttle).
- Security audits should check that version controllers don't accidentally bypass base authorization.
- When adding new version controllers, ensure security tests are duplicated or inherited.

## Common Mistakes

- Deep inheritance chains (Base → V1 → V1_1 → V2) — confusion and accidental regressions.
- Overriding a method and forgetting to call `parent::method()`.
- Shared mutable state in base controller properties.
- Base controller growing too large (God Controller anti-pattern).

## Anti-Patterns

- **God base controller**: Base controller with methods used by only one version.
- **Abandoned base**: All methods overridden in every version — base becomes an empty shell with dead code.
- **Version bleed**: Base controller accidentally references V2-specific logic, causing V1 runtime errors.

## Examples

```php
// Base controller — shared logic
abstract class BaseController extends Controller
{
    final public function authorizeResource(): void
    {
        // Security-critical — cannot be overridden
    }

    protected function paginate($query): array
    {
        return $query->paginate(config('api.pagination.per_page'))->toArray();
    }
}

// V1 controller — minimal overrides
class V1\PostController extends BaseController
{
    public function index(): JsonResponse
    {
        return response()->json($this->paginate(Post::query()));
    }
}

// V2 controller — overrides pagination behavior
class V2\PostController extends BaseController
{
    public function index(): JsonResponse
    {
        return response()->json(
            Post::query()->cursorPaginate(config('api.v2.pagination.per_page'))
        );
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: resource-class-organization, form-request-organization
- **Advanced**: Strategy pattern vs inheritance for versioning, Decorator pattern for version overrides

## AI Agent Notes

- Controller inheritance works well when most endpoints don't change between versions. When >50% of methods are overridden, composition is cleaner.
- PHP 8.3+ `#[Override]` attribute helps catch accidental signature drift in inherited controllers.
- Laravel 11's `__invoke` single-action controllers work well with inheritance — override `__invoke` in version subclasses.

## Verification

- [ ] Base controller defined with shared logic (auth, pagination, error handling)
- [ ] Version controllers extend base with minimal overrides
- [ ] Inheritance depth limited to 2 levels (Base → Version)
- [ ] Override ratio monitored — alert when >60%
- [ ] Security-critical methods marked `final` in base
- [ ] Base controller is lean — no god objects
- [ ] `#[Override]` attribute used for method overrides (PHP 8.3+)
