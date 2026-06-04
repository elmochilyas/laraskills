# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Framework independence of domain layer in practice
Knowledge Unit ID: LAP-09
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Framework independence of the Domain layer is the defining promise of Clean/Hexagonal Architecture. In practice, achieving true independence requires constant vigilance and is often not worth the cost for most Laravel applications. The community's dominant position is that partial independence (no HTTP coupling, but Eloquent coupling is acceptable) is the pragmatic sweet spot.

---

# Core Concepts

- **Full independence**: Domain imports nothing from Laravel. No `Model`, `Facades`, `Helpers`, `Carbon`. All dependencies injected via interfaces defined in Domain.
- **Partial independence (Laravel DDD)**: Domain uses Eloquent but not HTTP concerns. Business logic lives in models. Pragmatic for most teams.
- **No independence**: All code uses Laravel conventions throughout. Default approach.
- **Cost-Benefit Curve**: Independence cost starts high and stays high. Benefits only pay off for complex, long-lived applications.

---

# When To Use

Full independence:
- Complex business logic that is the primary application asset
- Application expected to outlive its framework
- Multiple delivery mechanisms requiring shared core
- Team maturity to maintain architectural discipline

Partial independence:
- Standard Laravel application benefiting from Eloquent structure
- Teams wanting service/action layer without full port-adapter overhead

---

# When NOT To Use

- Simple CRUD with straightforward business rules
- Short-lived project (<3 years)
- No realistic path to framework migration
- Team cannot commit to maintaining independence

---

# Best Practices

- **Be intentional about independence level.** WHY: Accidental coupling (using `Facades` or `Carbon` in Domain because they're convenient) is worse than either committed approach. Decide explicitly and enforce.
- **Keep value objects framework-agnostic.** WHY: `Money`, `Email`, `DateRange` as plain PHP are easy to keep independent and provide clear benefit regardless of architectural approach.
- **Use interfaces for infrastructure concerns.** WHY: Repository interfaces in Domain/Application, Eloquent implementations in Infrastructure. This is the minimum viable abstraction.
- **Write domain unit tests without Laravel bootstrap.** WHY: If Domain is truly independent, tests run in milliseconds. If tests still use `RefreshDatabase`, independence benefit is unrealized.
- **Map domain entities to Eloquent models explicitly** if pursuing full independence. WHY: The mapping layer is where coupling is managed — skipping it under time pressure leads to contaminated Domain.

---

# Architecture Guidelines

- Full independence requires: no `extends Model`, no Facade calls, no Carbon, no helpers, architecture tests, explicit mapping layer.
- Partial independence accepts: Eloquent in Domain (models with business logic), no HTTP coupling.
- Pragmatic stance: Placing business logic in Eloquent models is acceptable Laravel DDD; placing business logic in controllers is not.

---

# Performance Considerations

- Framework-independent domain tests: milliseconds vs. seconds (with Laravel bootstrap). Significant at 1000+ tests.
- Mapping layer adds conversion overhead per operation — profile if performance-critical.
- No runtime performance difference between independent and coupled domain code in production.

---

# Security Considerations

- Framework independence does not directly affect security.
- Independent domain forces explicit handling of security boundaries rather than relying on framework magic.

---

# Common Mistakes

1. **Purity at all costs:** Full independence for an application with no realistic migration path. Cause: architectural idealism. Consequence: cost paid daily for benefit that never materializes. Better: accept partial independence.

2. **Laravel-in-domain by accident:** Using Facades, Helpers, Carbon in Domain because they're convenient. Cause: no intentional decision about coupling. Consequence: worst of both worlds. Better: decide explicitly.

3. **Testing shortcuts:** Unit tests that bootstrap full Laravel because Domain isn't truly independent. Cause: convenience. Consequence: defeats purpose of independence. Better: either make Domain independent or accept integration tests.

4. **Abandoned mapping:** Mapping layer becomes outdated or skipped. Cause: time pressure. Consequence: Eloquent models accumulate business logic. Better: recognize this means the team chose partial independence — document it.

---

# Anti-Patterns

- **Independent domain, coupled tests**: Domain is pure but tests still use Laravel bootstrap.
- **Framework-as-core**: No architectural boundaries — Laravel conventions throughout, making framework migration impossible.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-05 Domain layer | LAP-10 Domain entity mapping | LAP-14 Clean Architecture tradeoffs |
| LAP-04 Dependency Rule | LAP-12 Incremental migration | LAP-15 Octane compatibility |

---

# AI Agent Notes

- Default to partial independence (Laravel DDD) — Eloquent in domain, no HTTP coupling.
- Only suggest full independence when explicitly requested or when project demonstrates need.
- Never generate Facade calls or helper function usage in Domain layer classes.

---

# Verification

- [ ] Independence level (full/partial/none) is explicitly documented in ADR
- [ ] Architecture tests enforce the chosen independence level
- [ ] Domain tests do not require Laravel bootstrap (if full independence)
- [ ] No `Facade` calls or helper functions in Domain classes
- [ ] Mapping layer exists and is maintained if pursuing full independence
