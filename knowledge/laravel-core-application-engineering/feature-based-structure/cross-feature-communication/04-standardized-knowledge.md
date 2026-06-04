# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Inter-Module Communication |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Cross-feature communication defines how features interact without creating tight coupling. Features should not directly access each other's models. Instead, they communicate through well-defined interfaces: service classes, events, or a shared kernel/bus layer. The engineering value is maintaining the independence of each feature. When feature A depends on feature B through a stable interface, feature B can be refactored internally without breaking feature A.

---

## Core Concepts

### Communication Patterns

| Pattern | Coupling | When to Use |
|---------|----------|-------------|
| Shared model (`app/Models/`) | Highest | Model is truly shared (User) |
| Service interface | Medium | One feature needs data from another |
| Event dispatching | Low | Fire-and-forget side effects |
| Job dispatching | Low | Async cross-feature work |
| Shared kernel/bus | Lowest | Complex domain orchestrations |
| Direct model access | Never | Always an anti-pattern |

---

## When To Use

- Feature-based applications where features need to exchange data
- Fire-and-forget side effects across feature boundaries (notifications, analytics)
- Data retrieval where one feature needs information owned by another
- Complex workflows spanning multiple bounded contexts

## When NOT To Use

- Within a single feature (use internal service calls)
- For simple CRUD that doesn't cross feature boundaries
- When direct method calls on shared services suffice (don't abstract prematurely)

---

## Best Practices

- **Establish a shared kernel directory** (`app/Kernel/Contracts/`) for interfaces that features implement
- **Use events for cross-cutting concerns** — audit logging, notifications, analytics
- **Use service interfaces for data retrieval** — one feature fetches data from another via a contract
- **Enforce dependency direction** — "upper" features depend on "lower" features, never the reverse
- **Never allow direct model access across feature boundaries** — enforce with PHPStan/Psalm rules
- **Start simple, extract interfaces when needed** — don't create abstractions before there's evidence of need
- **Document the dependency graph** between features for the team

---

## Architecture Guidelines

- Service interfaces in `app/Kernel/Contracts/` with no implementation
- DTOs in `app/Kernel/DTOs/` for safe cross-boundary data passing
- Events in feature-specific `Events/` directories, listeners in consuming features
- Event subscribers in a shared location or `AppServiceProvider` bridge features
- Container binding wires interfaces to implementations across feature boundaries
- CI step detects cross-feature model imports as a build failure

---

## Performance

Cross-feature communication via service interfaces is zero-cost — PHP resolves the concrete class at container resolution. Event-based communication adds ~0.1ms for dispatching. Queued events move the cost to a worker process. No measurable performance impact for typical applications.

---

## Security

Cross-feature communication does not bypass authentication or authorization. Each feature's service layer should still check permissions. Events carry data that has already been authorized by the dispatching context.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Direct model access across features | Convenience, speed | Tight coupling, cannot refactor independently | Go through service interface |
| Over-engineering | Interfaces for every interaction | Abstractions without benefit, harder navigation | Start simple, extract when needed |
| Circular feature dependencies | A depends on B, B depends on A | Cannot test independently | Move contract to shared kernel, invert dependency |
| Event overload | 15 listeners on one event | Debugging difficulty, any listener can fail independently | Split into specific events, use async jobs |
| Silent interface drift | Implementation changes, interface unchanged | Runtime errors from contract violations | Write contract tests |

---

## Anti-Patterns

- **Direct model import across features**: `use App\Features\Users\Models\Profile` in Billing code
- **Event with 15+ listeners**: Debugging becomes impossible; split into domain-specific events
- **Interface for everything**: Creating `UserServiceInterface` when there's only one implementation
- **Shared kernel bloat**: 200+ interfaces in `Kernel/Contracts/` because every feature adds contracts "just in case"

---

## Examples

**Interface-based communication:**
```php
// Billing defines what it needs
interface UserProfileProvider
{
    public function getContactEmail(int $userId): string;
}

// Users feature provides implementation
class UserProfileService implements UserProfileProvider
{
    public function getContactEmail(int $userId): string
    {
        return User::findOrFail($userId)->email;
    }
}
```

**Event-based communication:**
```php
// Billing dispatches event
class InvoicePaid
{
    public function __construct(public readonly Invoice $invoice) {}
}

// Bridge in AppServiceProvider
class BillingEventSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(InvoicePaid::class, [Analytics\RecordRevenue::class, 'handle']);
        $events->listen(InvoicePaid::class, [Notifications\SendReceipt::class, 'handle']);
    }
}
```

---

## Related Topics

- modular-monolith-basics — Understanding feature boundaries
- bounded-contexts — Where shared contracts live
- service-layer-pattern — Service classes as the feature's public API
- action-pattern — Action classes for single cross-feature operations
- dtos — Data transfer objects for safe cross-boundary data passing
- module-dependencies — Managing inter-feature dependencies

---

## AI Agent Notes

- Feature independence is the primary benefit of feature-based structure
- The `app/Kernel/` pattern is adapted from Symfony's kernel concept
- Events are the preferred communication mechanism in modular Laravel applications
- PHPStan/Psalm can enforce "no direct import from Features/*/Models/" rules
- Service providers should wire cross-feature dependencies (binding interfaces to implementations)
- Consider extracting features into separate packages if cross-feature communication becomes too complex

---

## Verification

- [ ] No direct model imports across feature boundaries
- [ ] All cross-feature data access goes through service interfaces
- [ ] Events used for fire-and-forget side effects
- [ ] Shared kernel directory exists (`app/Kernel/Contracts/`)
- [ ] Dependency direction is documented and enforced
- [ ] CI step detects cross-feature model imports
- [ ] No circular dependencies between features
- [ ] Contract tests verify interfaces match implementations
