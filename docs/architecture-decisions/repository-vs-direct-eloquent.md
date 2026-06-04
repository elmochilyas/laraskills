# Repository vs Direct Eloquent

- **Status:** Accepted
- **Date:** 2026-06-04
- **Applies to:** All Laravel modules within the ECC ecosystem

---

## Context

The ECC knowledge base contains guidance from multiple architectural paradigms (Clean Architecture, Onion Architecture, Layered Architecture, Vertical Slices, Use Case patterns). Some of these mandate repository interfaces as a strict architectural requirement, while the ECC rule files advocate direct Eloquent access. This creates conflicting guidance for developers.

The core tension:
- Clean Architecture / Onion Architecture prescribe repository interfaces in the domain layer as a hard rule (Dependency Inversion Principle).
- ECC's `rules/laravel/eloquent.md` states: "Avoid generic `UserRepository` that wraps Eloquent — use Query Objects, Actions, or Custom Builders instead."
- `rules/laravel/architecture.md` previously listed a "Contract (interface)" as a mandatory architectural layer.

## Decision

Adopt the **ECC Default**: Use direct Eloquent access inside Actions or application services by default. Do NOT require a Repository for every model. Use a Repository only when it creates a meaningful abstraction boundary.

### Repository Justification Criteria

A Repository is justified when **one or more** of the following criteria are met:

1. **Multiple persistence implementations exist** — e.g., primary database + read replica + cache-as-store require a common interface.
2. **External APIs, search engines, or remote services act as data sources** — e.g., Algolia search, Stripe API, a third-party CRM wrapped behind a repository interface.
3. **The domain must remain persistence-agnostic** — e.g., a DDD aggregate that must not reference Eloquent to enforce domain invariants purely.
4. **Complex reusable query behavior requires a dedicated abstraction** — e.g., a report query with 15 joins, aggregations, and filtering that would bloat an Action or Builder.
5. **Module boundaries require stable interfaces** — e.g., a package, plugin, or microservice boundary that must define a contract between teams.
6. **Swappable implementations are genuinely required** — e.g., switching from MySQL to PostgreSQL mid-project, or supporting on-premise vs cloud storage backends.

### Anti-Pattern

Avoid repositories that merely proxy simple Eloquent calls:

```php
// ANTI-PATTERN — no abstraction value
final class UserRepository
{
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}
```

**Preferred:** Use `User::query()->findOrFail($id)` directly inside an appropriate Action or application service:

```php
final readonly class GetUserProfileAction
{
    public function handle(int $userId): UserResource
    {
        $user = User::query()->findOrFail($userId);
        $this->authorize('view', $user);

        return new UserResource($user);
    }
}
```

### Application to Architecture Flow

The ECC-required flow is:

```
Controller (thin)
    ↓
Action (orchestration)
    ↓
Domain Service (business logic) — or direct Eloquent
    ↓
Database
```

The Contract (interface) layer is **optional** and introduced only when one of the Repository Justification Criteria above is satisfied.

## Consequences

**Positive:**
- Eliminates boilerplate proxy repositories for simple CRUD.
- Keeps application code easier to navigate (fewer indirections).
- Reduces architectural overhead for standard Laravel applications.
- Clarifies when to invest in a repository abstraction.
- Knowledge base rules now carry explicit context notes rather than contradictory mandates.

**Negative:**
- Teams accustomed to strict Clean Architecture must consciously evaluate whether a repository is justified.
- Direct Eloquent in Actions creates a weaker boundary for persistence-agnostic domain models.
- Existing knowledge unit rules that mandate repos may still be followed by teams that have explicitly adopted Clean Architecture for specific modules.

**Neutral:**
- This decision does not forbid repositories — it changes the default from "always require interface" to "justify before introducing interface."

## Related Files

- `rules/common/patterns.md` — Repository Pattern section with ECC Default note.
- `rules/laravel/eloquent.md` — Rule against generic UserRepository, with clarification for meaningful domain repositories.
- `rules/laravel/architecture.md` — Architecture flow updated to make Contract layer optional.
- `knowledge/backend-architecture-design/clean-onion-architecture/**/05-rules.md` — Added ECC Context Notes.
- `knowledge/application-architecture-patterns/service-layer-patterns/use-case-classes/05-rules.md` — Added ECC Context Note.
