# Controller Inheritance — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Controller inheritance structures API controllers in a versioned hierarchy: a base controller defines shared logic, and version-specific subclasses override only what changed. Phase 2 covers class hierarchy design, trait reuse, and method override patterns.

## Core Concepts
- **Base Controller:** `Api\BaseController` holds shared authentication, pagination, error handling.
- **Version Controllers:** `Api\V1\UsersController` extends `Api\BaseController`.
- **Override Points:** Only methods that change between versions are overridden.
- **Trait Composition:** Shared cross-version logic via traits rather than deep inheritance.

## Mental Models
- **Car Platform:** Base controller is the car chassis. V1 is the base model, V2 is the upgraded model with different seats (serialization) and engine (business logic). Same chassis, different features.
- **Template Method:** The base controller defines the "skeleton" of the response — status code, structure, headers. Version subclasses fill in the "variable parts" — data, transformers.

## Internal Mechanics
- Laravel's `Route::group(['namespace' => 'Api\V1'])` resolves to the correct controller.
- PHP method resolution follows the LSP (Liskov Substitution Principle).
- Base controller methods marked `protected` are available for override.
- `final` methods in base prevent override for security-critical logic (auth, throttle).

## Patterns
- Abstract base controller with `protected` helper methods and abstract version-specific methods.
- Controller traits for cross-cutting concerns (audit logging, cache headers).
- Version-specific request classes injected via `__construct` or method injection.
- Factory method in base controller for version-specific form requests.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Inheritance depth | Max 2 levels (Base → Version) | Prevents deep inheritance complexity |
| Override granularity | Method-level | Fine-grained, clear intent |
| Base controller location | `App\Http\Controllers\Api\BaseController` | Standard PSR-4 convention |
| Shared logic | Traits vs abstract methods | Traits for helpers, abstract for required overrides |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Code reuse | High — shared logic in base | Tight coupling between versions |
| Override clarity | Obvious which methods changed | Extra boilerplate for unchanged endpoints |
| Testing | Test base once, test overrides only | Mocking complexity for subclass tests |
| New version speed | Fast — copy and override | Risk of unintentional shared state |

## Performance Considerations
- PHP inheritance adds zero runtime overhead (method resolution is compile-time).
- Base controller constructor can be heavy if it resolves many dependencies — use lazy resolution.
- Trait composition is equivalent to copy-paste at compile time — no performance impact.

## Production Considerations
- Keep base controllers lean; move infrastructure concerns to middleware.
- Document which methods are safe to override and which are internal.
- Use `@override` annotations (PHP 8.3) to catch accidental signature changes.
- Test version controllers against base controller tests to ensure contract compliance.

## Common Mistakes
- Deep inheritance chains (Base → V1 → V1_1 → V2) — confusion and accidental regressions.
- Overriding a method and forgetting to call `parent::method()`.
- Shared mutable state in base controller properties.
- Base controller growing too large (God Controller anti-pattern).

## Failure Modes
- **Silent contract violation:** V2 overrides a method but changes the return type, breaking consumers.
- **Base controller regression:** Changing base controller behavior unintentionally affects all versions.
- **Override blindness:** Developer adds feature to V2 without realizing V1 also needs it, but V1 doesn't inherit.
- **Constructor coupling:** Version controller constructor diverges from parent, causing DI container conflicts.

## Ecosystem Usage
- **Laravel Spark:** Uses inheritance for billing plan controllers across versions.
- **October CMS:** Plugin controllers extend base controller with version-specific overrides.
- **Laravel Nova:** Tools extend base controller for CRUD operations with version-specific customizations.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Resource class organization
- Form request organization

### Advanced Follow-up Topics
- Strategy pattern vs inheritance for versioning
- Decorator pattern for version overrides

## Research Notes
### Source Analysis
Fowler's "Refactoring" (2019) discusses the Template Method pattern which underlies controller inheritance. Laravel's own Spark source code demonstrates versioned controller inheritance in production.

### Key Insight
Controller inheritance works well when most endpoints don't change between versions. When >50% of methods are overridden, composition (strategy pattern) is cleaner.

### Version-Specific Notes
Laravel 11's `__invoke` single-action controllers work well with inheritance: override the `__invoke` method in version subclasses.
