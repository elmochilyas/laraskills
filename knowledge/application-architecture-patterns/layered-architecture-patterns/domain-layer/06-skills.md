# Skill: Model Domain Layer with Entities, Value Objects, and Domain Services
## Purpose
Design and implement a framework-independent Domain layer containing pure business logic — Entities with behavior methods enforcing invariants, immutable Value Objects validating on construction, and stateless Domain Services coordinating multi-entity operations — with zero `Illuminate\*` imports.
## When To Use
- Clean Architecture or Hexagonal Architecture implementations
- Complex business domains with non-trivial rules and invariants
- Business logic that must be independently testable without Laravel bootstrap
- Long-lived applications where business rules are the primary asset
## When NOT To Use
- Simple CRUD with no business invariants (three-layer architecture is simpler)
- Service-oriented architecture where business logic lives in service classes
- When maintaining domain purity cost exceeds the benefit (see LAP-14 tradeoffs)
## Prerequisites
- Understanding of DDD tactical patterns (Entity, Value Object, Domain Service)
- LAP-04 Dependency Rule — inner layers must not depend on outer layers
- Architecture tests configured to prevent `Illuminate\*` imports in Domain namespace
- PHP 8.1+ for readonly properties, constructors, and enum support
## Inputs
- Business requirements and invariant rules from domain experts
- Ubiquitous language terms for naming entities, value objects, services
- Existing infrastructure contracts (repository interfaces, event bus interface)
## Workflow
1. Identify Entities: objects with identity that persist across state changes (Invoice, User, Order) — identity field (`InvoiceId`, `UserId`), behavior methods (`markAsPaid()`, `cancel()`)
2. Implement Entity invariants: each state-changing method enforces business rules before mutation — `markAsPaid()` checks `status !== InvoiceStatus::PENDING` and throws `InvoiceNotPendingException` otherwise
3. Identify Value Objects: objects defined by attributes, not identity (Money, Email, DateRange, Address) — immutable, `readonly` properties, validation in constructor, `add()` returns new instance
4. Implement Value Object validation: constructor throws `\InvalidArgumentException` on invalid state — `new Money(-50, 'USD')` throws, `new Email('not-an-email')` throws
5. Identify Domain Services: stateless operations spanning multiple entities/value objects (PricingService, ShippingService, FraudDetectionService) — named after business concept, not technical pattern
6. Define Repository interfaces in Domain: interface declares `save()`, `find()`, `delete()` using Domain types only — no Eloquent, no Laravel collections
7. Define Domain Events as pure PHP objects: classes with constructor, readonly properties, no `Illuminate\Foundation\Events\Dispatchable` trait
8. Write architecture tests: verify Domain namespace has zero `use Illuminate\*` imports, zero `extends Model`, zero Facade calls
9. Write unit tests without Laravel bootstrap: extend `PHPUnit\Framework\TestCase`, test entity behavior, value object validation, domain service logic
## Validation Checklist
- [ ] Zero `use Illuminate\*` imports in any Domain class
- [ ] Entities have behavior methods (not just getters/setters)
- [ ] Entity invariants enforced in behavior methods, not in callers
- [ ] Value objects immutable with `readonly` properties
- [ ] Value objects validate on construction and throw on invalid state
- [ ] Domain services are stateless (no mutable properties)
- [ ] Repository interfaces defined in Domain (implementations in Infrastructure)
- [ ] Domain events are pure PHP objects (no framework traits)
- [ ] Architecture tests enforce Domain layer purity
- [ ] Unit tests run without Laravel bootstrap (pure PHPUnit)
## Common Failures
- **Anemic domain model:** Entities are property bags with getters/setters but no behavior. Business logic leaks to Application/Infrastructure. Fix: add behavior methods that enforce invariants.
- **Framework imports in domain:** Using `Carbon`, `Facades`, `extends Model` in Domain. Fix: use `\DateTimeImmutable`, constructor injection via interfaces.
- **Giant entities:** 50+ methods on a single entity. Fix: extract Domain Services for multi-concern operations.
- **Missing invariants:** Business rules checked only in controllers/use cases. Fix: move invariant enforcement into entity methods so new code paths can't bypass them.
- **Value objects without validation:** Invalid state passes silently. Fix: add constructor validation for all value objects.
## Decision Points
- **Entity vs Value Object:** Same object but different instances are interchangeable? Value Object (Money(100, USD) == Money(100, USD)). Has identity that persists? Entity (Invoice #123 ≠ Invoice #456).
- **Entity method vs Domain Service:** Operation uses only one entity's state? Entity method. Operation spans multiple entities/value objects? Domain Service.
- **Full vs partial framework independence:** Full independence (pure PHP, no Laravel in Domain) vs partial (Eloquent in Domain is accepted). Document in ADR.
## Performance Considerations
- Domain objects are PHP objects in memory — performance is negligible
- Performance cost is in mapping between Domain entities and Eloquent models (Infrastructure), not in Domain itself
- Value object immutability creates new instances on mutation — acceptable for typical business object volumes
## Security Considerations
- Domain layer should not handle authentication or authorization directly
- Security rules that are business invariants (e.g., "only managers can approve invoices above $10K") belong in Domain entities
- Domain events should not contain sensitive data beyond what business logic requires
## Related Rules (from 05-rules.md)
- Entities Enforce Their Own Invariants
- Value Objects Validate on Construction
- Domain Services for Multi-Entity Operations
- Domain Events as Pure PHP Objects
- Repository Interfaces in Domain
- No Framework Imports in Domain
- Business Behavior on Entities
## Related Skills
- Application Layer Orchestration (LAP-06)
- Domain-Entity Mapping to Eloquent (LAP-10)
- Framework Independence Decisions (LAP-09)
- Transaction Boundaries (LAP-11)
## Success Criteria
- Domain classes contain zero framework imports (verified by architecture tests)
- All business invariants enforced by entity behavior methods, not by callers
- Value objects guarantee validity — invalid state cannot be instantiated
- Domain unit tests run in <50ms without Laravel bootstrap
- Architecture tests fail CI on any `Illuminate\*` import in Domain namespace
