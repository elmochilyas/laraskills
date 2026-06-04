# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Framework independence of domain layer in practice
**Generated:** 2026-06-03

---

# Decision Inventory

* Full framework independence vs partial independence (Laravel DDD)
* Value object independence vs full domain independence
* Independent tests (no Laravel bootstrap) vs integration tests

---

# Architecture-Level Decision Trees

---

## Full Framework Independence vs Partial Independence (Laravel DDD)

---

## Decision Context

Full independence means Domain layer imports nothing from Laravel — pure PHP. Partial independence (Laravel DDD) allows Eloquent model usage in Domain with business logic on models. The choice determines the entire architectural approach and cost structure.

---

## Decision Criteria

* performance considerations — full independence enables faster unit tests (ms vs seconds); partial is faster to develop
* architectural considerations — full independence enables framework migration; partial is pragmatic
* security considerations — no direct security impact
* maintainability considerations — full independence requires constant vigilance and mapping layer

---

## Decision Tree

Independence level?
↓
Business logic is the primary application asset (fintech, healthcare, compliance)?
YES → Full independence — framework-outlive-ability
NO → Application expected to outlive current Laravel version?
    YES → Full independence — future migration readiness
    NO → Multiple delivery mechanisms (HTTP + CLI + Queue)?
        YES → Full independence — share domain across mechanisms
        NO → Standard Laravel application?
            YES → Partial independence (Laravel DDD) — pragmatic
            NO → Full independence

---

## Rationale

Full independence provides maximum flexibility but at significant cost — mapping layers, interface ceremony, and constant enforcement. Partial independence (Laravel DDD) accepts Eloquent coupling in the Domain while maintaining separation from HTTP concerns. The community consensus is that partial independence is the pragmatic default.

---

## Recommended Default

**Default:** Partial independence (Laravel DDD) — Eloquent in Domain, no HTTP coupling
**Reason:** Full independence costs outweigh benefits for most Laravel applications. Partial independence provides meaningful separation (business logic in models, not controllers) without the overhead of pure domain entities and mappers.

---

## Risks Of Wrong Choice

Full independence for simple CRUD creates unnecessary complexity. Partial independence without boundaries becomes indistinguishable from default Laravel.

---

## Related Rules

- Rule: Keep Value Objects Framework-Agnostic Regardless of Architecture (LAP-09/05-rules.md)
- Rule: Be Intentional About Independence Level (LAP-09/05-rules.md)

---

## Related Skills

- Apply Framework Independence Pragmatically (LAP-09/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)

---

## Value Object Independence vs Full Domain Independence

---

## Decision Context

Value objects (Money, Email, DateRange) are the easiest domain concepts to keep framework-independent. Even teams that accept Eloquent coupling benefit from keeping value objects as pure PHP.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — value objects are naturally framework-independent
* security considerations — value object validation prevents invalid data
* maintainability considerations — pure PHP value objects are simpler and more portable

---

## Decision Tree

Value object framework independence?
↓
Does the value object have validation or behavior?
YES → Keep as pure PHP — independent of any framework
NO → Is the value object just a type alias (wrapper around string)?
    YES → Pure PHP is simple enough — keep independent
    NO → Does the value object depend on Laravel components?
        YES → Extract to pure PHP — eliminate dependency
        NO → Keep as pure PHP — no reason to couple

---

## Rationale

Value objects are inherently framework-independent — they validate on construction and encapsulate behavior. There is almost no benefit to coupling them to Laravel, and significant cost (reduced portability, testability). Even teams that accept Eloquent coupling benefit from pure PHP value objects.

---

## Recommended Default

**Default:** Keep all value objects as pure PHP, regardless of architectural approach
**Reason:** Value objects are naturally framework-independent. Coupling them to Laravel provides no benefit while reducing portability. Pure PHP value objects are easier to test, reuse, and maintain.

---

## Risks Of Wrong Choice

Coupling value objects to Laravel (using `Carbon`, `Collection` subtypes) reduces portability without providing meaningful benefit.

---

## Related Rules

- Rule: Keep Value Objects Framework-Agnostic Regardless of Architecture (LAP-09/05-rules.md)
- Rule: Value Objects Validate on Construction (LAP-05/05-rules.md)

---

## Related Skills

- Apply Framework Independence Pragmatically (LAP-09/06-skills.md)
- Apply Domain Layer Entities and Value Objects (LAP-05/06-skills.md)

---

## Independent Tests (No Laravel Bootstrap) vs Integration Tests

---

## Decision Context

If the Domain layer is truly framework-independent, unit tests run in milliseconds without Laravel bootstrap. If Domain tests still use `RefreshDatabase` or `CreatesApplication`, the independence benefit is unrealized.

---

## Decision Criteria

* performance considerations — independent tests: ms; Laravel-bootstrapped: hundreds of ms per test
* architectural considerations — independent tests prove real independence
* security considerations — no direct security impact
* maintainability considerations — independent tests are faster and simpler

---

## Decision Tree

Domain testing strategy?
↓
Can Domain tests run without Laravel bootstrap (no `RefreshDatabase`, no `CreatesApplication`)?
YES → Full independence is realized — tests run in milliseconds
NO → Does the test use `DB::` or Eloquent?
    YES → Domain depends on Laravel — this is partial independence
        Consider: is the independence level intentional?
        YES → Accept integration tests — document the decision
        NO → Refactor Domain to remove dependencies — pursue full independence
    NO → Test can run without bootstrap — decouple it

---

## Rationale

Domain tests that require Laravel bootstrap indicate the Domain layer is not truly independent. This is acceptable if partial independence is intentional. If full independence is the goal, tests must run without `CreatesApplication`.

---

## Recommended Default

**Default:** Match testing approach to independence level — independent tests for full independence; integration tests for partial
**Reason:** Testing approach should reflect actual independence, not aspirations. Full independence without independent tests is unreachable. Partial independence with integration tests is honest and pragmatic.

---

## Risks Of Wrong Choice

Independent tests for a domain that uses Facades/DB will fail. Integration tests for a truly independent domain waste bootstrap time.

---

## Related Rules

- Rule: Write Domain Unit Tests Without Laravel Bootstrap (LAP-09/05-rules.md)
- Rule: Architecture Tests Enforce Dependency Rule (LAP-02/05-rules.md)

---

## Related Skills

- Apply Framework Independence Pragmatically (LAP-09/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
