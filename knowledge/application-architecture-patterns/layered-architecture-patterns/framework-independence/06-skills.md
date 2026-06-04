# Skill: Decide and Implement Framework Independence Level for Domain Layer
## Purpose
Explicitly choose and enforce the appropriate framework independence level for the Domain layer — full independence (pure PHP, zero Laravel imports), partial independence (Eloquent accepted, no HTTP coupling), or pragmatic default — based on application complexity, team maturity, and long-term maintainability requirements.
## When To Use
- Complex business logic that is the primary long-term application asset
- Application expected to outlive its current framework version
- Multiple delivery mechanisms (HTTP + CLI + Queue) sharing a core
- Team maturity to maintain architectural discipline with enforcement
## When NOT To Use
- Simple CRUD with straightforward business rules (full independence overhead not justified)
- Short-lived project (<3 years) with no framework migration path
- Team cannot commit to maintaining indepedence discipline
- No realistic scenario where framework migration would occur
## Prerequisites
- Understanding of Clean/Hexagonal Architecture dependency rule
- LAP-05 Domain layer knowledge (entities, value objects, domain services)
- Architecture testing infrastructure (Laravel Pest/PHPUnit arch tests)
- Architecture Decision Record (ADR) documentation established
## Inputs
- Business logic complexity assessment (invariant count, rule complexity)
- Application lifespan and expected delivery mechanism evolution
- Team size and architectural experience level
- Framework migration probability assessment
## Workflow
1. Document independence decision in ADR: state chosen level (full/partial/none), rationale, and criteria for revisiting
2. If full independence: create `app/Domain/` with pure PHP entities/value objects/services — zero `use Illuminate\*`, zero `extends Model`, zero Facades
3. If full independence: create explicit mapper layer in Infrastructure (`InvoiceMapper::toDomain()`, `InvoiceMapper::toEloquent()`) — bidirectional, tested roundtrip
4. If full independence: define port interfaces in Domain (Repository, EventBus, Mailer interfaces) — implement in Infrastructure
5. If full independence: architecture tests enforce no Laravel imports in Domain (`arch('domain')->expect('App\Domain')->toOnlyUse(['App\Domain'])`)
6. If partial independence: keep value objects framework-agnostic (Money, Email, DateRange as plain PHP)
7. If partial independence: write unit tests for value objects without Laravel bootstrap — place business logic on Eloquent models
8. For any level: never use Facades, Helpers, or `Carbon` in Domain classes — even partial independence rejects HTTP coupling
9. For any level: write Domain unit tests separately from integration tests — Domain tests should be fast (<50ms each)
10. Review independence level quarterly: has complexity justified the current level? Should it be increased or decreased?
## Validation Checklist
- [ ] Independence level documented in ADR (full/partial/none)
- [ ] Architecture tests enforce the chosen level
- [ ] If full: no `Illuminate\*` imports in Domain (arch test passes)
- [ ] If full: mapper layer exists with roundtrip tests for each aggregate
- [ ] If full: Domain tests run without Laravel bootstrap (pure PHPUnit)
- [ ] If partial: value objects are framework-agnostic (no Carbon, no Facades)
- [ ] If partial: business logic on Eloquent models but no HTTP coupling
- [ ] No Facade calls or helper functions in any Domain class
- [ ] No `extends Model` in Domain namespace
- [ ] Independence level reviewed within last 3 months
## Common Failures
- **Accidental coupling:** Using `Carbon::now()`, `Str::slug()`, or Facades in Domain because they're convenient. Fix: use `\DateTimeImmutable`, plain PHP functions; inject dependencies via interfaces.
- **Not deciding:** No documented decision, so some classes are pure, others use Facades. Fix: document and enforce the chosen level.
- **Purity at all costs:** Full independence for simple CRUD app. Fix: downgrade to partial independence (documented).
- **Tests not matching architecture:** Full independence but Domain tests still bootstrap Laravel. Fix: make Domain tests use pure PHPUnit.
- **Abandoned mapper:** Mapping layer created but not maintained — grows outdated. Fix: recognize this means partial independence and document it.
## Decision Points
- **Full vs partial vs none:** Full = port/adapter + mapper + arch tests (high cost). Partial = Eloquent in Domain, no HTTP (moderate cost). None = Laravel MVC (no cost).
- **When to upgrade complexity:** New delivery mechanism emerges, business logic complexity justifies framework-independent testing, team grows beyond 10 engineers.
- **When to downgrade complexity:** Architecture overhead consistently exceeds benefit, team cannot maintain discipline, no realistic migration path materializes.
## Performance Considerations
- Full independence tests: milliseconds (pure PHPUnit) vs seconds (Laravel bootstrap) — significant at 1000+ tests
- Mapping layer adds small conversion overhead per operation — profile if performance-critical
- No runtime performance difference between independent and coupled Domain code in production
- Partial independence saves mapping overhead while keeping most test-speed benefits
## Security Considerations
- Framework independence does not directly affect security posture
- Independence forces explicit handling of security boundaries (no reliance on framework magic)
- Repository abstraction enables auditable data access patterns
- Independent Domain makes it easier to verify security invariants in pure unit tests
## Related Rules (from 05-rules.md)
- Be Intentional About Independence Level
- Keep Value Objects Framework-Agnostic
- Use Interfaces for Infrastructure Concerns
- Write Domain Tests Without Laravel Bootstrap
- Map Domain Entities to Eloquent Explicitly for Full Independence
- Prefer Partial Independence for Most Laravel Apps
## Related Skills
- Domain Layer Modeling (LAP-05)
- Domain-Entity Mapping (LAP-10)
- Real-World Architecture Tradeoffs (LAP-14)
- Architecture Tests (LAP-13)
## Success Criteria
- Independence level documented in ADR with rationale and review triggers
- Architecture tests enforce the chosen level (CI fails on violations)
- Domain tests run in <50ms without Laravel bootstrap (full independence) or value object tests run independently (partial)
- Zero accidental coupling — no Facades, Helpers, or Carbon in any Domain class
- Independence level reviewed quarterly and adjusted as justified
