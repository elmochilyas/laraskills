# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** The Dependency Rule: inward-pointing dependencies
**Generated:** 2026-06-03

---

# Decision Inventory

* Strict Dependency Rule vs pragmatic relaxation for utilities
* Architecture tests vs code review for dependency enforcement
* Tiered enforcement (strict Domain, relaxed Application) vs uniform enforcement

---

# Architecture-Level Decision Trees

---

## Strict Dependency Rule vs Pragmatic Relaxation for Utilities

---

## Decision Context

The Dependency Rule states inner layers must never depend on outer layers. In practice, some teams relax this for Laravel utility helpers (Str, Arr, Collection, Carbon) in the Application layer, considering them acceptable tools rather than framework coupling.

---

## Decision Criteria

* performance considerations — no performance impact from relaxation
* architectural considerations — strict rule provides cleaner boundaries; relaxation is pragmatic
* security considerations — no security impact
* maintainability considerations — strict enforcement is easier to automate; relaxation requires documented exceptions

---

## Decision Tree

Utility dependency in inner layer?
↓
Is the utility a Laravel helper (Str, Arr, Collection, Carbon)?
YES → Application layer: acceptable (pragmatic relaxation)
    Domain layer: NOT acceptable (strict — pure PHP only)
NO → Is the utility framework infrastructure (DB, Cache, Queue)?
    YES → NOT acceptable in any inner layer — inject via port interface
    NO → Acceptable if it doesn't create framework coupling

---

## Rationale

The community consensus is that Laravel utilities (Str, Arr, Collection, Carbon) are acceptable in the Application layer because they are stable helpers, not infrastructure concerns. However, the Domain layer must remain pure PHP — no exceptions. Framework infrastructure (DB, Cache, Queue) must always be injected via port interfaces.

---

## Recommended Default

**Default:** Allow Laravel utilities in Application layer; forbid everything in Domain layer
**Reason:** Laravel utilities are stable helpers that don't create infrastructure coupling. The Domain layer must remain pure PHP to deliver the value of Clean Architecture. Document this relaxation explicitly.

---

## Risks Of Wrong Choice

Allowing all Laravel imports in Application leads to gradual infrastructure coupling. Forbidding all utilities (including Collection) creates unnecessary mapping overhead for simple operations.

---

## Related Rules

- Rule: Domain Layer Must Be Pure PHP (LAP-02/05-rules.md)
- Rule: No Framework Helpers in Application (LAP-02/05-rules.md)

---

## Related Skills

- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

---

## Architecture Tests vs Code Review for Dependency Enforcement

---

## Decision Context

The Dependency Rule cannot be enforced by directory structure alone — a class in `app/Domain/` can still import `Facades\DB`. Architecture tests (Pest arch tests, PHPStan) provide automated enforcement. Code review provides human judgment for edge cases.

---

## Decision Criteria

* performance considerations — architecture tests add 1-3s to CI for large codebases
* architectural considerations — automated enforcement is reliable; manual review is fallible
* security considerations — dependency violations can lead to security concerns (leaking infrastructure)
* maintainability considerations — architecture tests run automatically; code review depends on reviewer vigilance

---

## Decision Tree

Enforcement approach?
↓
Team > 5 engineers?
YES → Use architecture tests (Pest arch tests) — automated enforcement
NO → Can a dependency violation cause production issues?
    YES → Use architecture tests regardless of team size
    NO → Use code review — but document rules explicitly

---

## Rationale

Architecture tests are the only reliable enforcement mechanism for the Dependency Rule. They catch violations at CI time before merge and don't depend on reviewer vigilance. Code review alone degrades under time pressure.

---

## Recommended Default

**Default:** Use Pest architecture tests for automated Dependency Rule enforcement
**Reason:** The Dependency Rule cannot be enforced by directory structure. Automated tests catch violations before merge with zero reviewer effort. They are living documentation of the architecture.

---

## Risks Of Wrong Choice

Code review alone misses violations, especially during complex reviews. Architecture tests without maintenance rot — update when the architecture evolves. Both are needed: automated tests for common cases, review for edge cases.

---

## Related Rules

- Rule: Architecture Tests Enforce Dependency Rule (LAP-02/05-rules.md)
- Rule: No Facade or Helper Usage in Inner Layers (LAP-04/05-rules.md)

---

## Related Skills

- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

---

## Tiered Enforcement (Strict Domain, Relaxed Application) vs Uniform Enforcement

---

## Decision Context

Some teams enforce the Dependency Rule strictly only for the Domain layer (zero external dependencies) while allowing some framework usage in the Application layer. Uniform enforcement applies the same strict rules to all inner layers.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — tiered enforcement is pragmatic; uniform is idealistic
* security considerations — tiered can still provide adequate security boundaries
* maintainability considerations — tiered is easier to adopt incrementally; uniform is cleaner

---

## Decision Tree

Enforcement tiering?
↓
Domain layer is pure PHP (zero framework imports)?
YES → Apply strictest rules: no Illuminate imports, no facades, no helpers
NO → Fix Domain layer first — this is non-negotiable
    Application layer?
    YES → Apply relaxed rules: allow Collection, Str, Arr, Carbon; forbid DB, Cache, Queue, Request
    NO → Presentation/Infrastructure: no restrictions (these are outer layers)

---

## Rationale

The Domain layer must be the strictest — zero framework dependencies. The Application layer can accept pragmatic relaxations for Laravel utilities. Infrastructure and Presentation layers are outer layers with no restrictions. This tiered approach balances purity with pragmatism.

---

## Recommended Default

**Default:** Tiered enforcement — strict for Domain, relaxed for Application, unrestricted for outer layers
**Reason:** Domain purity is non-negotiable for Clean Architecture value. Application layer relaxations for utilities reduce ceremony. Outer layers have no restrictions.

---

## Risks Of Wrong Choice

Uniform strict enforcement makes Application development slower with ceremony for trivial operations. Uniform relaxation leads to Domain layer framework coupling.

---

## Related Rules

- Rule: Domain Layer Must Be Pure PHP (LAP-02/05-rules.md)
- Rule: Application Depends Only on Domain (LAP-02/05-rules.md)

---

## Related Skills

- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
