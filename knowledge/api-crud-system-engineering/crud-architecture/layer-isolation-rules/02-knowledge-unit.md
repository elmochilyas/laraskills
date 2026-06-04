# Layer Isolation Rules

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Layer Isolation Rules
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Layer isolation rules define which application layers can communicate with which other layers. The fundamental rule is that each layer may only communicate with the layer directly below it — controllers talk to services/actions, services talk to repositories (or Eloquent directly), repositories talk to the database. A layer must never skip an intermediate layer.

The engineering significance is that layer isolation prevents fragile coupling between HTTP and persistence. If a controller calls `User::where('email', $email)->first()` directly, it bypasses the service layer that might apply tenancy scoping, caching, or business rules. When the business rule changes (e.g., "only active users can be fetched"), the controller query is not updated — it silently returns incorrect results. Layer isolation makes these changes safe by ensuring all data access goes through the proper channels.

---

## Core Concepts

### The Dependency Direction Rule

Layers may only depend on layers below them:

```
Controller → Service/Action → Repository → Database
```

Dependencies flow downward. A service may depend on a repository, but a repository must NOT depend on a service.

### The Skip Rule

A layer must not skip the adjacent layer:

```
Controller → Repository     ❌ SKIP
Controller → Service → Repository  ✅
```

### The Framework-Layer Boundary

Layers are defined by namespace and convention:

| Layer | Namespace | May Call |
|-------|-----------|----------|
| Controller | `App\Http\Controllers` | Services, Actions, FormRequests |
| Service | `App\Services` | Repositories, other Services, Actions |
| Action | `App\Actions` | Repositories, Eloquent models |
| Repository | `App\Repositories` | Eloquent models, DB facade |
| Eloquent | `App\Models` | DB facade, relationships |

---

## Mental Models

### The Waterfall

Each layer is a level in a waterfall. Data flows from top to bottom, one level at a time. Jumping from the top to the bottom (controller to database) skips the intermediate layers that purify and transform the data.

### The Checkpoint System

Each layer is a checkpoint. Bypassing a checkpoint means missing the validation, transformation, and business rules applied there.

---

## Internal Mechanics

### Laravel Container and Layer Resolution

The service container resolves classes by their namespace. When a controller type-hints `App\Services\UserService`, the container autoloads the file from `app/Services/UserService.php` and resolves its constructor dependencies recursively. This autoloading chain is what enables layer skipping — nothing in the framework prevents a controller from type-hinting `App\Models\User` and calling `User::find()` directly. The enforcement of layer isolation must come from team discipline, static analysis, and code review.

### Autoloading and Layer Boundaries

PSR-4 autoloading maps namespace prefixes to directories. The namespace `App\Http\Controllers\*` maps to `app/Http/Controllers/`, `App\Models\*` maps to `app/Models/`. There is no technical barrier preventing a class in the Controllers namespace from importing and using a class in the Models namespace — the autoloading system treats all classes as equally accessible. Layer isolation is purely a convention enforced by human review or external tooling.

### Enforcement Mechanisms

Enforcement operates at three levels: convention (documented rules and team agreement), static analysis (PHPStan/Larastan custom rules that detect prohibited cross-namespace imports), and code review (manual inspection of layer boundaries). The most effective enforcement combines all three — convention defines the rules, static analysis catches violations automatically, and code review catches what static analysis misses.

---

## Ruleset

### Rule 1: Controller → Service/Action Only

Controllers must call services or actions. They must NOT call:
- `Model::query()` or `Model::find()` or any Eloquent static method
- `DB::table()` or `DB::select()` directly
- Repositories directly (if services exist)

### Rule 2: Service → Repository or Eloquent Only

Services must delegate data access to repositories or use Eloquent directly. They must NOT call:
- `DB::raw()` or raw SQL
- External API gateways without an abstraction layer

### Rule 3: Repository → Eloquent or DB Only

Repositories must only use Eloquent or the DB facade. They must NOT:
- Call services or actions
- Dispatch events (that belongs in the service layer)
- Perform business logic validation

### Rule 4: No Circular Dependencies

Service A may call Service B. Service B may NOT call Service A. Extract shared logic to a lower layer (repository, action, or third service).

### Rule 5: One Repository Call Per Method

A service method should call the repository once per logical operation. Calling the repository, checking the result, then calling it again with slightly different parameters suggests the repository API is not expressive enough.

---

## Enforcement

### Code Review Checklist

```php
// VIOLATION: Controller queries Eloquent directly
class UserController
{
    public function show(int $id)
    {
        $user = User::with('posts')->find($id); // ❌ SKIP: service layer bypassed
        return response()->json($user);
    }
}

// CORRECT: Controller delegates to action
class UserController
{
    public function show(int $id)
    {
        $user = $this->findUser->execute($id);
        return response()->json($user);
    }
}
```

### Automated Detection

Use static analysis (PHPStan, Larastan) to detect layer violations:

```neon
// phpstan.neon
parameters:
    layerViolations:
        - from: App\Http\Controllers\*
          to: App\Models\*  # Controllers should not use models directly
```

---

## Patterns

### Layer Enforcement with PHPStan

```neon
parameters:
    layerViolations:
        - from: App\Http\Controllers\*
          to: App\Models\*
        - from: App\Http\Controllers\*
          to: App\Repositories\*
```

Custom PHPStan rules detect namespace-level layer violations. Rules are defined in `phpstan.neon` and enforced in CI.

### Architectural Testing with Pest/PHPUnit

```php
test('controllers do not use models directly')
    ->assertNotUses(Controller::class, Model::class);
```

Architectural tests assert layer boundaries at the class level. Run as part of the test suite to catch regression violations.

### Deptrac for Dependency Graphs

Deptrac analyzes namespace-level dependencies and enforces layer rules as a static analysis layer. Layers are defined as namespace groups in a configuration file, and Deptrac rejects any dependency that violates the defined layer graph.

---

## Architectural Decisions

### Strict vs Pragmatic Isolation

Strict isolation: Services always use repositories, even for simple queries. Controllers never touch models. This is the pure layered architecture.

Pragmatic isolation: Services use Eloquent directly for simple queries. Controllers call actions/services. Repositories are used only when query complexity warrants them.

Choose strict isolation for enterprise apps with large teams. Choose pragmatic isolation for smaller teams where speed matters more than architectural purity.

### The Repository Bypass Exception

If a service uses Eloquent directly (no repository), that's acceptable — the service IS the data access layer for that entity. The rule violation would be a controller bypassing BOTH the service AND the repository to call Eloquent directly.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Safe refactoring — change a layer without affecting others | Strict enforcement requires discipline | Code review must check layer boundaries |
| Clear dependency direction — no circular confusion | More files and indirection | Predictable navigation |
| Business rules always applied | Exceptions for simple operations | Document exceptions clearly |

---

## Performance Considerations

Layer isolation adds one method call per layer. Controller → Service → Repository → DB is 3 method calls vs Controller → DB = 1 call. The ~0.003ms overhead is negligible.

---

## Production Considerations

### Documenting Exceptions

When a layer must be skipped for pragmatic reasons, document it explicitly:

```php
/**
 * Layer Exception: This action calls Eloquent directly
 * because the operation is a simple toggle with no business rules.
 * If business rules are added, extract to a service or repository.
 */
class ToggleUserStatusAction
{
    public function execute(int $userId): void
    {
        User::where('id', $userId)->update(['active' => DB::raw('NOT active')]);
    }
}
```

### Onboarding Enforcement

New team members should be taught the layer isolation rules as part of onboarding. The most common first mistake is a controller calling a model directly.

---

## Common Mistakes

### Controllers Using Eloquent Directly
Why it happens: It's faster to write `User::find($id)` than to create an action, inject it, and call `execute()`. Why it's harmful: Bypasses all business logic in the service/action layer. Changes to business rules don't take effect for this path. Better approach: Always delegate to an action or service.

### Services Calling Each Other in a Circular Chain
Why it happens: Service A needs data from Service B, and Service B needs data from Service A. Why it's harmful: Impossible to resolve — the container detects a circular dependency. Better approach: Extract shared logic to a repository or third service.

### Repository Calling Another Repository
Why it happens: An OrderRepository needs User data to filter orders. Why it's harmful: Creates hidden cross-entity coupling. Better approach: Inject UserRepository into the service layer and coordinate there.

---

## Failure Modes

### Architecture Collapse
A codebase where layer isolation is not enforced. Controllers call models, services call controllers, repositories dispatch events. The architecture is flat — no layer provides any isolation. Changes to any layer break all other layers.

### Inconsistent Enforcement
Some controllers follow layer rules, others don't. New team members can't tell what the real architecture is. The documented architecture differs from the actual code.

---

## Ecosystem Usage

### Layered Enterprise Applications
Strict layer isolation is standard in enterprise Laravel applications, especially in regulated industries where auditability requires clear layer boundaries.

### Rapid-Prototype Applications
Layer isolation is relaxed in MVPs and prototypes. The rules are introduced as the application matures.

---

## Related Knowledge Units

### Prerequisites
- Thin Controller Principle — Why controllers must not access models
- Controller-DTO-Action Flow — The correct delegation path

### Related Topics
- When to Skip Layers — Pragmatic exceptions to isolation rules
- Layer Isolation Enforcement (PHPStan/Larastan) — Automated detection

### Advanced Follow-up Topics
- Hexagonal Architecture — Port/adapter layer isolation
- Clean Architecture — Framework-agnostic layer rules

---

## Research Notes

### Source Analysis
- Domain-Driven Design: Layered architecture principles
- Laravel community: Layer isolation is a convention, not framework-enforced
- PHPStan/Larastan: Available for automated layer violation detection

### Key Insight
Layer isolation rules are the structural backbone of a maintainable CRUD architecture. Without them, the architecture degenerates into a flat structure where any class calls any other class. The rules must be enforced through code review and (optionally) static analysis — the framework does not enforce them.

### Version-Specific Notes
- Laravel 11+: Service provider auto-discovery does not affect layer isolation
- No framework version-specific layer enforcement
