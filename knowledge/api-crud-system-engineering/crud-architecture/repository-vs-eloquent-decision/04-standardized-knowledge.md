# ECC Standardized Knowledge — Repository vs Eloquent Decision

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Repository vs Eloquent Decision |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The repository vs direct Eloquent decision is one of the most debated topics in Laravel architecture. Direct Eloquent is the default — models are queried directly in services or actions without a repository abstraction. The repository pattern introduces an interface and implementation class to mediate between business logic and data access. The debate is not about right vs wrong but about ceremony vs centralized query control. The emerging consensus is a hybrid approach: use direct Eloquent for simple entities and repositories for entities where query complexity, caching, or cross-cutting scoping justifies the abstraction.

## Core Concepts

- **Direct Eloquent**: Simple, productive, zero-ceremony. The action/service is directly coupled to Eloquent. Best for simple CRUD with minimal query logic.
- **Repository Pattern**: Abstraction layer between business logic and data access. Interface + implementation + binding add ceremony but provide centralized query control, test seams, and decoration capabilities.
- **Hybrid Approach**: Use direct Eloquent for 90% of entities (simple CRUD) and repositories for 10% (complex queries, multi-tenancy, caching needs). The pragmatic middle.
- **Ceremony Threshold**: Benefit = query complexity × number of call sites × decoration needs. Cost = interface file + implementation file + binding + mocking overhead. Use a repository when benefit > cost.

## When To Use

- Direct Eloquent for simple CRUD with minimal query logic, <50 models, single data source, no multi-tenancy
- Repository for complex query logic that should be centralized, multi-tenancy, caching at data access layer, large teams, >50 models
- Hybrid approach as the production-proven consensus — repositories only where they add value

## When NOT To Use

- Premature repository abstraction for entities that will never need complex queries
- Dogmatic "repositories always" or "repositories never" — either extreme ignores context
- Repositories that mirror Eloquent's API without adding value (no additional query logic, caching, or scoping)

## Best Practices

- Start with direct Eloquent by default — extract repositories only when justified by query complexity or cross-cutting concerns
- Use the hybrid approach: repositories for complex entities, direct Eloquent for simple ones
- A repository should add value (centralized multi-tenancy, caching, complex filtering) — not just mirror Eloquent's API
- Migration from direct Eloquent to repositories is straightforward (~30 minutes per entity): create interface, implementation, binding, replace call sites
- If a repository has the same methods as `Model` with no additional logic, it's a red flag

## Architecture Guidelines

- Direct Eloquent is the default path — ask "do I have a problem that a repository solves?" not "should I use a repository?"
- Small teams (1-5) benefit less from repositories; large teams (10+) benefit more from clear data access contracts
- Eloquent's `scoped()` method (Laravel 8+) reduces some benefits of repository scoping by providing global query macros
- Migration is straightforward: interface → implementation → binding → replace call sites. Start with the most complex entities.

## Performance Considerations

- Direct Eloquent is slightly faster — no interface resolution or method delegation (~0.01ms difference per query — irrelevant)
- Repository-level caching can dramatically outperform direct Eloquent for read-heavy workloads
- Performance should not be the deciding factor — the difference is negligible

## Security Considerations

- Direct Eloquent scattered across call sites makes it harder to ensure consistent multi-tenant scoping
- Repositories centralize query logic, making it easier to audit data access patterns
- Direct Eloquent queries may miss global scopes if developers forget to apply them
- Hybrid approach: critical security scoping (tenancy) should use repositories; non-sensitive entities can use direct Eloquent

## Common Mistakes

- **Premature Repository Abstraction**: Creating repositories for every entity because "the architecture requires it." Solution: Start with direct Eloquent. Extract only when justified.
- **Repository Interface Without Multiple Implementations**: Interface added for a single-implementation repository. Solution: Use concrete classes for single implementations.
- **Never Using Repositories When Needed**: Dogmatic "repositories are bad" stance. Solution: Use repositories pragmatically where they solve real problems.
- **Java-itis**: Every entity has repository interface + implementation but 90% just mirror Eloquent's CRUD API. Solution: Only create repositories that add value.

## Anti-Patterns

- **Java-itis**: Every entity gets interface + repository + binding regardless of need. 3x files with no architectural benefit.
- **Scattered Queries Hell**: No repositories. Complex query logic duplicated across 10+ call sites. A change requires finding every duplication.
- **Repository as Eloquent Mirror**: Repository has the exact same methods as `Model` with no added logic. The interface is pure ceremony.

## Examples

### Extraction When Needed
```php
// Phase 1: Direct Eloquent (default)
class UserService
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}

// Phase 2: Extract to repository when query complexity grows
class UserService
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {}

    public function findByEmail(string $email): ?User
    {
        return $this->users->findByEmail($email);
    }
}
```

### Repository Only for Complex Entities
```php
// Simple entities — direct Eloquent
class TagService
{
    public function create(string $name): Tag
    {
        return Tag::create(['name' => $name]);
    }
}

// Complex entities — repository
class OrderService
{
    public function __construct(
        private OrderRepositoryInterface $orders, // Complex queries, caching, scoping
    ) {}
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Repository Pattern Design | What repositories are | Prerequisite |
| Eloquent Fundamentals | What direct Eloquent provides | Prerequisite |
| Layer Isolation Rules | Rules preventing direct Eloquent bypass | Related |
| When to Skip Layers | Pragmatic exceptions to full abstraction | Related |
| Criteria/Query Object Pattern | Advanced query encapsulation | Follow-up |
| Multi-Tenancy Scoping | Tenant-aware queries in repositories | Follow-up |

## AI Agent Notes

- The debate is over-polarized — the correct answer is "it depends"
- Direct Eloquent is the default for new entities. Do NOT generate repositories unless the entity has clear query complexity
- The hybrid approach is the production-proven consensus across the Laravel community (2024-2026)
- When generating code for a simple entity, use direct Eloquent. When generating for a complex entity with multi-tenancy or caching needs, use a repository
- Migration path always exists — extracting a repository later is straightforward and low-risk

## Verification

- [ ] Simple entities use direct Eloquent (no unnecessary repository abstraction)
- [ ] Complex entities with multi-tenancy, caching, or complex queries use repositories
- [ ] Repository interfaces exist only when there are multiple implementations or decoration needs
- [ ] Repositories add value beyond mirroring Eloquent's API
- [ ] Hybrid approach is applied consistently based on entity complexity
- [ ] Migration path is documented for entities that may need repositories later
