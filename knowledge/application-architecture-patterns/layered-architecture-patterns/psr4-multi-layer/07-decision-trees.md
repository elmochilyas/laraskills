# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** PSR-4 Autoloading for Multi-Layer Projects
**Generated:** 2026-06-04

---

# Decision Inventory

* Separate PSR-4 roots per layer vs single root with subdirectories
* Custom namespace prefix vs default App namespace
* Optimized autoloader (-o) vs standard autoloader

---

# Architecture-Level Decision Trees

---

## Separate PSR-4 Roots vs Single Root with Subdirectories

---

## Decision Context

Multi-layer projects need namespace organization that supports architecture enforcement. The choice is between giving each layer its own PSR-4 root (enforcement-friendly) versus keeping everything under one root with subdirectories (simpler but opaque).

---

## Decision Criteria

* performance considerations — both options have identical performance with optimized autoloader
* architectural considerations — separate roots enable namespace-level architecture testing
* security considerations — no difference
* maintainability considerations — separate roots make dependencies visible; single root is simpler

---

## Decision Tree

Project uses Clean Architecture, Hexagonal, or strict layered design?
↓
YES → Does the team commit to enforcing layer boundaries?
    YES → Use separate PSR-4 roots per layer
        Layer dependencies become visible in use statements
        Architecture tests can verify no cross-layer violations
    NO → Single root with subdirectories
        Team will not enforce boundaries anyway
NO → Project is standard MVC with layers as directories?
    YES → Single root (App\\) is sufficient
    NO → Single root (App\\) is sufficient

---

## Rationale

Separate PSR-4 roots are an architectural enforcement tool, not a performance feature. If the team enforces layer boundaries, separate roots provide a namespace-level audit trail. If the team does not enforce boundaries, separate roots add ceremony without benefit.

---

## Recommended Default

**Default:** Separate PSR-4 roots per layer for any project with distinct architecture layers.
**Reason:** The audit trail in `use` statements is valuable for architecture enforcement, code review, and onboarding.

---

## Risks Of Wrong Choice

Separate roots without enforcement discipline adds complexity without value. Single root with layered architecture makes dependency violations invisible.

---

## Related Rules

- Rule: Define PSR-4 Namespace Per Layer (LAP-05/05-rules.md)
- Rule: Distinct Namespace Roots Avoid Overlap (LAP-05/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Multi-Layer Projects (LAP-05/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

---

## Custom Namespace Prefix vs Default App Namespace

---

## Decision Context

When using separate PSR-4 roots, the namespace prefix can be a sub-namespace of `App` (e.g., `App\Domain\`) or a custom prefix (e.g., `Domain\`). The choice affects import readability and project conventions.

---

## Decision Criteria

* performance considerations — no difference
* architectural considerations — custom prefixes make layer imports immediately visible in use statements
* security considerations — no impact
* maintainability considerations — custom prefixes are more explicit; App sub-namespaces follow convention

---

## Decision Tree

Does the project use a framework-independent Domain layer?
↓
YES → Custom prefix without `App\` root
    `Domain\Entities\Invoice` not `App\Domain\Entities\Invoice`
    Domain layer has zero framework coupling
NO → Convention matters more than framework independence?
    YES → `App\` sub-namespace (`App\Domain\`, `App\Application\`)
    NO → Custom prefix for explicit layer visibility

---

## Rationale

`App\` sub-namespaces follow Laravel conventions and are familiar to developers. Custom prefixes make framework independence explicit but may confuse developers expecting standard `App\` namespace.

---

## Recommended Default

**Default:** `App\` sub-namespaces (`App\Domain\`, `App\Application\`)
**Reason:** Follows Laravel conventions, familiar to all Laravel developers, enables future extraction without namespace changes.

---

## Risks Of Wrong Choice

Custom prefixes may confuse new Laravel developers. `App\` sub-namespaces make extraction to separate packages slightly harder.

---

## Related Rules

- Rule: Define PSR-4 Namespace Per Layer (LAP-05/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Multi-Layer Projects (LAP-05/06-skills.md)

---

## Optimized Autoloader (-o) vs Standard Autoloader

---

## Decision Context

Composer's optimized autoloader generates a classmap for faster class resolution. The standard autoloader resolves PSR-4 mappings on every request.

---

## Decision Criteria

* performance considerations — optimized autoloader is faster in production; standard is fine in development
* architectural considerations — no difference
* security considerations — no impact
* maintainability considerations — optimized autoloader requires regeneration after every class addition

---

## Decision Tree

Is this a production environment or Octane deployment?
↓
YES → Use `composer dump-autoload -o`
    Faster class resolution; required for Octane worker performance
NO → Development environment with frequent class additions?
    YES → Use standard `composer dump-autoload` (no -o)
        Faster iteration without regenerating classmap
    NO → Use standard autoloader

---

## Rationale

The optimized autoloader improves production performance by generating a classmap that eliminates PSR-4 resolution. In development, the standard autoloader is sufficient and avoids regeneration delays when adding classes.

---

## Recommended Default

**Default:** `composer dump-autoload -o` in production; `composer dump-autoload` (without -o) in development.
**Reason:** Optimized autoloader is a production concern. Development iteration speed matters more.

---

## Risks Of Wrong Choice

Standard autoloader in production adds unnecessary class resolution overhead. Optimized autoloader in development requires frequent regeneration.

---

## Related Rules

- Rule: Run composer dump-autoload After Changes (LAP-05/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Multi-Layer Projects (LAP-05/06-skills.md)
