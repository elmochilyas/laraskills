# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Transaction Script (Fowler) in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Transaction Script vs Domain Model selection
* Decision 2: Transaction Script organization — action classes vs fat controllers
* Decision 3: Duplication management in Transaction Scripts

---

# Architecture-Level Decision Trees

---

## Decision: Transaction Script vs Domain Model Selection

---

## Decision Context

Choose whether to organize business logic as Transaction Scripts (procedural, per use case) or Domain Model (object-oriented, rich domain objects).

---

## Decision Criteria

* performance considerations: Transaction Script is faster (no object graph overhead); Domain Model adds object hydration cost
* architectural considerations: Transaction Script is simpler; Domain Model handles complexity better
* security considerations: Domain Model centralizes security rules in domain objects; Transaction Script spread across scripts
* maintainability considerations: Transaction Script has duplication as rules grow; Domain Model is more maintainable at scale

---

## Decision Tree

How complex are the business rules?
↓
SIMPLE (CRUD, basic validation, single entity operations) → Transaction Script (simplest, sufficient)
MODERATE (cross-entity logic, conditional rules, 3-5 rule sets) → Evaluate: is duplication already emerging?
    YES → Refactor to Domain Model for shared rules (Transaction Script duplication threshold reached)
    NO → Transaction Script still appropriate (monitor for duplication)
COMPLEX (interconnected rules, state machines, workflow, 6+ rule sets) → Domain Model (Transaction Script doesn't scale)
    ↓
    Does the team have experience with Domain Model / DDD?
    YES → Domain Model with rich domain objects
    NO → Transaction Script with Service Layer pattern as intermediate step

How stable are the business rules?
STABLE → Transaction Script is sufficient (rules rarely change)
CHANGING → Domain Model (encapsulates rule changes in single place)
    ↓
    Do new rules often affect existing Transaction Scripts?
    YES → Duplication is already happening — refactor to Domain Model
    NO → Transaction Scripts may still work

---

## Rationale

Transaction Script is the simplest domain logic pattern — one script per use case, all logic in one place. It's ideal for CRUD and simple business rules. As rules grow and intersect, duplication emerges (same rule repeated across scripts). The tipping point is when duplication makes change costly. Domain Model eliminates duplication through shared domain objects but requires more upfront investment.

---

## Recommended Default

**Default:** Start with Transaction Script. Refactor to Domain Model when duplication across scripts makes changes costly or when rules exceed 3-5 intersecting rule sets.

**Reason:** Transaction Script is simpler, faster to develop, and YAGNI-compliant. Domain Model provides better change containment at scale but is over-engineering for simple CRUD.

---

## Risks Of Wrong Choice

Domain Model for simple CRUD: over-engineering, unnecessary complexity, team cognitive load. Transaction Script for complex domain: duplication explosion, inconsistent rule application, high change cost.

---

## Related Rules

- Rule 3: Transaction Script is sufficient for CRUD and simple business rules
- Rule 1: Transaction Script organizes business logic as procedural scripts, one per use case

---

## Related Skills

- Implement Transaction Script
- Refactor to Domain Model

---

## Decision: Transaction Script Organization — Action Classes vs Fat Controllers

---

## Decision Context

Choose where to place Transaction Script code — in dedicated action classes or directly in controllers.

---

## Decision Criteria

* performance considerations: both have negligible difference
* architectural considerations: action classes are reusable across transports; controllers are HTTP-coupled
* security considerations: action classes can be authorized independently; controller scripts need method-level auth
* maintainability considerations: action classes are testable without HTTP; controller scripts need framework bootstrapping

---

## Decision Tree

Does this Transaction Script need to be callable from multiple entry points (HTTP, CLI, queue)?
↓
YES → Action class (dedicated class per script, reusable across transports)
    ↓
    Create a single-action invokable class (e.g., `RegisterUserAction`)
    Controller calls the action class, not the logic directly
    NO → Is the script simple enough (<30 lines) and has no reuse potential?
        YES → Keep in controller (simple CRUD, no abstraction needed)
        ↓
        Monitor: if the script grows beyond 50 lines, extract to action class
        NO → Extract to action class regardless (future reuse or testability benefit)

---

## Rationale

Transaction Scripts can live in controllers (for trivial cases) or in dedicated action classes (for reusable or testable cases). Action classes (single-action invokable classes) are the recommended Laravel pattern for Transaction Scripts — they are testable without HTTP, reusable across transports, and maintain SRP.

---

## Recommended Default

**Default:** Single-action invokable classes for all but the simplest Transaction Scripts (<30 lines, no reuse potential).

**Reason:** Action classes are testable, reusable, and maintain SRP. Controllers are fine for trivial scripts but should not accumulate logic.

---

## Risks Of Wrong Choice

Fat controller: untestable without HTTP, unreusable across transports, SRP violation. Action class for every trivial operation: file proliferation, unnecessary abstraction for CRUD.

---

## Related Rules

- Rule 2: In Laravel, single-action controllers or invokable classes are natural Transaction Script hosts
- Rule 4: Keep Transaction Scripts focused: one script = one use case

---

## Related Skills

- Design Action Classes
- Refactor Controller to Action Class

---

## Decision: Duplication Management in Transaction Scripts

---

## Decision Context

Choose how to handle duplicate logic that emerges across Transaction Scripts.

---

## Decision Criteria

* performance considerations: extracting shared logic adds method call overhead (negligible)
* architectural considerations: shared logic should be extracted to appropriate layer (domain service, helper)
* security considerations: centralized validation/authorization prevents inconsistent enforcement
* maintainability considerations: duplicated logic is inconsistent logic — fixes must be applied in every script

---

## Decision Tree

Is the same logic found in 2+ Transaction Scripts?
↓
YES → Is this logic a domain rule (calculation, validation, state change)?
    YES → Extract to a domain service or value object (not a helper or trait)
    ↓
    Does the extracted logic belong in an existing domain concept?
    YES → Make it a method on the relevant domain object or value object
    NO → Create a domain service class for the extracted logic
    NO → Is this logic infrastructure-related (logging, caching, formatting)?
        YES → Extract to a shared utility or infrastructure service
        NO → Is this logic orchestration (coordinating multiple domain objects)?
            YES → Extract to a use-case service (keeps orchestration out of controllers)
NO → Monitor: if duplication emerges in the future, extract at the 3rd occurrence

---

## Rationale

Duplication across Transaction Scripts is the primary signal that the pattern is reaching complexity limits. When the same rule appears in multiple scripts, extract it before adding a fourth occurrence. The extracted logic belongs in the appropriate architectural layer — domain rules in domain services, orchestration in application services, infrastructure in infrastructure services.

---

## Recommended Default

**Default:** Extract on the 3rd occurrence. Domain rules go to domain services; orchestration to application services; infrastructure to infrastructure services.

**Reason:** Two occurrences is coincidence; three is a pattern. Early extraction at 3 occurrences prevents the duplication from becoming costly while avoiding premature abstraction.

---

## Risks Of Wrong Choice

Never extract: inconsistent rule application, bug fixes require touching every script. Extracting too early: premature abstraction for logic that only appeared twice. Extracting to wrong layer: domain rules in helpers, infrastructure concerns in domain services.

---

## Related Rules

- Rule 5: Extract duplicated logic across Transaction Scripts to shared services at the 3rd occurrence

---

## Related Skills

- Extract Domain Service from Transaction Script
- Identify Duplication Threshold
