# ECC Standardized Knowledge — Layer Isolation Rules

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Layer Isolation Rules |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Layer isolation rules define which application layers can communicate with which other layers. The fundamental rule is that each layer may only communicate with the layer directly below it — controllers talk to services/actions, services talk to repositories (or Eloquent directly), repositories talk to the database. A layer must never skip an intermediate layer. These rules prevent fragile coupling between HTTP and persistence, ensuring that business rules, scoping, and caching are always applied.

## Core Concepts

- **The Dependency Direction Rule**: Layers may only depend on layers below them. Dependencies flow downward: Controller → Service/Action → Repository → Database. A repository must NOT depend on a service.
- **The Skip Rule**: A layer must not skip the adjacent layer. Controller → Repository directly is a violation. The correct path is Controller → Service → Repository.
- **Enforcement Mechanisms**: The framework does not enforce layer isolation — it is purely a convention. Enforcement operates at three levels: convention (documented rules), static analysis (PHPStan/Larastan custom rules), and code review.
- **Strict vs Pragmatic Isolation**: Strict isolation requires services to always use repositories. Pragmatic isolation allows services to use Eloquent directly for simple queries. Choose based on application complexity and team size.

## When To Use

- Enterprise applications where auditability requires clear layer boundaries
- Multi-tenant applications where query scoping must always be applied
- Applications with large teams where different developers own different layers
- Any codebase where layer skipping has caused production bugs in the past

## When NOT To Use

- MVPs and prototypes where iteration speed is the priority (introduce rules as the app matures)
- Simple applications where layer skipping would never cause issues
- When the team is too small to justify the enforcement overhead

## Best Practices

- Document layer rules explicitly in the project's architecture guide
- Add code review checklist items for layer violation detection
- Use PHPStan or Larastan custom rules for automated violation detection
- Add architectural tests (Pest/PHPUnit) that assert layer boundaries
- Document exceptions when a layer must be skipped for pragmatic reasons

## Architecture Guidelines

- Controllers must only call services or actions — never `Model::query()`, `Model::find()`, `DB::table()`, or repositories directly
- Services may call repositories or use Eloquent directly — never call raw SQL or external APIs without an abstraction
- Repositories must only use Eloquent or the DB facade — never call services, dispatch events, or apply business logic
- Service A may call Service B, but Service B may NOT call Service A — extract shared logic to a lower layer
- A service method should call the repository once per logical operation — multiple calls suggest the repository API is not expressive enough

## Performance Considerations

- Layer isolation adds ~0.001ms per method call layer — Controller → Service → Repository → DB is 3 calls vs Controller → DB = 1 call
- The ~0.003ms overhead is negligible compared to database query time (1-50ms)
- No measurable performance impact from enforced layer boundaries

## Security Considerations

- Layer isolation prevents controllers from bypassing authorization logic in the service layer
- Repository-level query scoping for multi-tenancy is only effective if all data access goes through repositories
- Bypassing layers can lead to inconsistent security policy enforcement (e.g., soft-delete filtering, tenant scoping)
- Architecture collapse (no layer isolation) means any security change requires auditing every call site

## Common Mistakes

- **Controllers Using Eloquent Directly**: Faster to write `User::find($id)` than to create an action. Solution: Always delegate to an action or service.
- **Services Calling Each Other in Circular Chain**: Service A needs Service B, Service B needs Service A. Solution: Extract shared logic to a repository or third service.
- **Repository Calling Another Repository**: OrderRepository needs User data to filter orders. Solution: Inject UserRepository into the service layer and coordinate there.
- **Inconsistent Enforcement**: Some controllers follow rules, others don't. New team members can't tell what the real architecture is.

## Anti-Patterns

- **Architecture Collapse**: No layer isolation — controllers call models, services call controllers, repositories dispatch events. The architecture is flat; changes to any layer break all others.
- **The "Just This Once" Exception**: Repeated layer-skipping exceptions that become the norm. Each exception should be documented and justified.
- **Repository as Bypass**: Creating a repository but still allowing services to call Eloquent directly — the repository exists but provides no value.

## Examples

### Layer Violation vs Correct Delegation
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

### Layer Enforcement with PHPStan
```neon
parameters:
    layerViolations:
        - from: App\Http\Controllers\*
          to: App\Models\*
        - from: App\Http\Controllers\*
          to: App\Repositories\*
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Thin Controller Principle | Why controllers must not access models | Prerequisite |
| Controller-DTO-Action Flow | The correct delegation path | Prerequisite |
| When to Skip Layers | Pragmatic exceptions to isolation rules | Related |
| Layer Isolation Enforcement | Automated detection with PHPStan/Larastan | Related |
| Hexagonal Architecture | Port/adapter layer isolation | Follow-up |
| Clean Architecture | Framework-agnostic layer rules | Follow-up |

## AI Agent Notes

- Layer isolation rules are the structural backbone of a maintainable CRUD architecture — without them, architecture degenerates into a flat structure
- The Laravel framework does NOT enforce layer isolation — it must be maintained through convention, static analysis, and code review
- Default to pragmatic isolation for smaller teams; adopt strict isolation for enterprise apps with large teams
- New team members should be taught layer isolation rules during onboarding — controllers calling models is the most common first mistake
- When generating code, always ensure the generated class only imports types from the layer directly below

## Verification

- [ ] Controllers never call Eloquent models directly
- [ ] Controllers never call repositories directly (if services exist)
- [ ] Services never call raw SQL or DB::raw()
- [ ] Services never dispatch events (that belongs in the service layer)
- [ ] No circular dependencies exist between services
- [ ] Repository methods do not call other repositories
- [ ] Layer violations are detected by static analysis or architectural tests
- [ ] Layer exception documentation exists for any deliberate bypass
