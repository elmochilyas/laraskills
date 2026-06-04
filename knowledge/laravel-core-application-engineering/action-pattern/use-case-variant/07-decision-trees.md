# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Use Case Variant
**Generated:** 2026-06-03

---

# Decision Inventory

* Pragmatic vs Full Hexagonal Use Case
* Use Case vs Action for Multi-Entry-Point Operations
* Framework Agnosticism — Interface Dependencies vs Concrete Classes

---

# Architecture-Level Decision Trees

---

## Decision 1: Pragmatic vs Full Hexagonal Use Case

---

## Decision Context

Whether to use a Pragmatic Use Case (DTO input, Eloquent model output, concrete deps) or Full Hexagonal (DTO input + output, interface deps, zero framework imports).

---

## Decision Criteria

* Whether the operation is called from multiple entry points
* Whether the team needs framework-agnostic business logic
* Whether result DTOs and interface overhead are justified

---

## Decision Tree

Is the operation called from 2+ entry points (HTTP + CLI + queue)?
↓
NO → Use Action, not Use Case — DTO overhead not justified
YES → Does the architectural policy require strict framework-boundary separation (Hexagonal/Clean Architecture)?
    YES → Full Hexagonal Use Case:
        - Typed DTO input
        - Typed DTO output (not Eloquent model)
        - Interface dependencies for everything
        - Zero `Illuminate\*` imports
    NO → Pragmatic Use Case:
        - Typed DTO input (the most valuable part)
        - Eloquent model output (no result DTO overhead)
        - Concrete class dependencies (no interface extraction)
        - Zero `Illuminate\*` imports in execute() method
NO → Does the team need framework-portable business logic?
    YES → Full Hexagonal — portability requires interfaces and DTOs
    NO → Is the operation complex enough to justify DTO overhead?
        YES → Pragmatic Use Case
        NO → Action is sufficient

---

## Rationale

The Pragmatic variant captures the most valuable part (typed input contract) with minimal overhead. Full Hexagonal adds result DTOs and interface dependencies, which provide portability but more boilerplate. Most teams never need Full Hexagonal.

---

## Recommended Default

**Default:** Pragmatic Use Case (DTO input, Eloquent model output, concrete deps). Evolve to Full Hexagonal only when multi-entry-point reuse or framework portability becomes a real requirement.
**Reason:** Pragmatic covers 80% of the benefit with 30% of the cost. Full Hexagonal overhead is justified only when portability is a concrete requirement.

---

## Risks Of Wrong Choice

* Full Hexagonal for single entry point: All boilerplate, no portability benefit realized
* Pragmatic when Hexagonal required: Framework coupling prevents true portability
* Action when Use Case needed: No DTO contract, validation bypassed from non-HTTP entry points

---

## Related Rules

* Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed (05-rules.md)
* Enforce Zero Framework Imports in Use Case Business Logic (05-rules.md)

---

## Related Skills

* Skill: Create a Pragmatic Use Case
* Skill: Create a Full Hexagonal Use Case

---

## Decision 2: Use Case vs Action for Multi-Entry-Point Operations

---

## Decision Context

Whether to use a Use Case (with DTO) or Action (without DTO) for an operation called from multiple entry points.

---

## Decision Criteria

* Whether the input data shape is complex (3+ fields)
* Whether the operation needs validation consistency across entry points
* Whether the team prefers explicit input contracts

---

## Decision Tree

Is the operation called from 2+ entry points (HTTP + CLI + queue)?
↓
NO → Action — DTO overhead is not justified for single-entry-point
YES → Is the input data shape complex (3+ fields)?
    YES → Use Case — DTO provides typed contract across all callers
    NO → Is the input data shape expected to change?
        YES → Use Case — adding DTO field is non-breaking, changing array key is breaking
        NO → Action with individual parameters is sufficient
NO → Does the operation need validation consistency across entry points?
    YES → Use Case — DTO validation runs identically for all callers
    NO → Action — each entry point validates independently
NO → Does the team prefer explicit, discoverable input contracts?
    YES → Use Case — DTO is the contract
    NO → Action — array or individual params

---

## Rationale

The DTO is the key advantage of Use Cases over Actions for multi-entry-point operations. A DTO ensures that all callers (HTTP, CLI, queue) pass the same input shape, validated the same way, with compile-time safety.

---

## Recommended Default

**Default:** Use Case with DTO for multi-entry-point operations with 3+ input fields; Action for 1-2 stable fields or single-entry-point operations
**Reason:** The DTO contract ensures consistency across entry points. For simple inputs, the DTO overhead may not be justified.

---

## Risks Of Wrong Choice

* Action for multi-entry-point complex input: Each caller may pass different array keys, runtime errors
* Use Case for single-entry-point: DTO overhead paid but no multi-caller consistency benefit
* No DTO for changing input: Array key additions silently missed by some callers

---

## Related Rules

* Use Typed DTOs for All Use Case Input, Never Raw Arrays (05-rules.md)
* Do Not Create Use Cases for Single-Entry-Point Operations (05-rules.md)

---

## Related Skills

* Skill: Create a Pragmatic Use Case

---

## Decision 3: Framework Agnosticism — Interface Dependencies vs Concrete Classes

---

## Decision Context

Whether a Use Case should depend on interfaces (framework-agnostic) or concrete classes (pragmatic, Laravel-coupled).

---

## Decision Criteria

* Whether the Use Case needs to be testable without booting Laravel
* Whether the storage layer might change (Eloquent → MongoDB)
* Whether the team enforces strict Hexagonal Architecture

---

## Decision Tree

Does the Use Case need to be testable without booting Laravel (pure PHP unit test)?
↓
YES → Interface dependencies required — mock any implementation without framework
NO → Could the storage layer change in the future (Eloquent → API → MongoDB)?
    YES → Interface dependencies — swap implementation without changing Use Case
    NO → Does the architecture policy require strict Hexagonal boundaries?
        YES → Interface dependencies — non-negotiable for Hexagonal Architecture
        NO → Concrete classes are acceptable (Pragmatic Use Case)
NO → Are the dependencies stable and unlikely to change?
    YES → Concrete classes (simple, no interface overhead)
    NO → Interface dependencies

---

## Rationale

Interface dependencies enable framework-agnostic testing — the Use Case can be instantiated with any implementation without booting Laravel. They also enable storage-layer swaps without changing Use Case code. Concrete classes are simpler but couple the Use Case to the framework.

---

## Recommended Default

**Default:** Concrete dependencies for Pragmatic Use Cases; interface dependencies for Full Hexagonal Use Cases. Evolve from concrete to interfaces when testability or portability requires it.
**Reason:** Interfaces add extraction overhead. Start with concrete deps (pragmatic), extract interfaces when concrete deps cause testability or portability problems.

---

## Risks Of Wrong Choice

* Concrete for always-mock-needed: Cannot unit test without Laravel boot
* Interfaces for stable dependencies: Interface extraction ceremony with no benefit
* Mixed: Some interfaces, some concrete — confusing, partial decoupling

---

## Related Rules

* Depend on Interfaces, Not Concrete Classes, in Use Case Constructors (05-rules.md)
* Bind Every Use Case Interface Dependency in a Service Provider (05-rules.md)

---

## Related Skills

* Skill: Create a Full Hexagonal Use Case
