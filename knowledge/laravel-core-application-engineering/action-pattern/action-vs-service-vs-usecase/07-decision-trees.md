# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action vs Service vs Use Case
**Generated:** 2026-06-03

---

# Decision Inventory

* Three-Tier Pattern Selection (Service vs Action vs Use Case)
* Evolution Path — When to Extract/Upgrade
* DTO Boundary — Signal of Pattern Choice

---

# Architecture-Level Decision Trees

---

## Decision 1: Three-Tier Pattern Selection (Service vs Action vs Use Case)

---

## Decision Context

Which architectural pattern to use for organizing a business operation — Service (multi-method, entity-oriented), Action (single-method, operation-oriented), or Use Case (framework-agnostic, DTO-contracted).

---

## Decision Criteria

* Whether the operation belongs to a group of related operations on the same entity
* Whether the operation is a single distinct unit that may be reused
* Whether the operation needs to run identically across entry points with framework-agnostic contracts

---

## Decision Tree

Question 1 — Cohesion: Does this operation belong to a group of related operations on the same entity?
↓
YES → Does the entity group have shared constructor dependencies AND does it remain under 10 methods?
    YES → Service — group related operations, share DI
    NO → Proceed to Question 2
NO → Proceed to Question 2

Question 2 — Granularity: Is this a single, distinct operation that may be reused or composed?
↓
YES → Is the operation trivially simple (1-2 method calls, no dependencies)?
    YES → Keep as service method — action extraction adds ceremony without benefit
    NO → Proceed to Question 3 (or choose Action)
NO → Keep as service method

Question 3 — Portability: Does this operation need to run identically across 2+ entry points?
↓
YES → Is the operation called from 2+ entry points NOW (not someday)?
    YES → Use Case — DTO contracts ensure consistent input across entry points
    NO → Action — extract to Action now, upgrade to Use Case when second entry point emerges
NO → Action

---

## Rationale

The three-tier decision framework provides objective criteria. Each question filters out patterns that would be over- or under-engineered for the operation's characteristics. The Service-Action complement is the default production pattern.

---

## Recommended Default

**Default:** Service-Action complement — Services for entity grouping and orchestration; Actions for individual operation execution. Use Cases only for multi-entry-point portability.
**Reason:** This balances file economy (services group related actions) with isolation (each action is independently testable).

---

## Risks Of Wrong Choice

* Service for everything: God service with 30 methods, impossible to test
* Action for everything: File proliferation for simple CRUD
* Use Case for single entry point: DTO overhead paid without benefit

---

## Related Rules

* Apply the Three-Tier Decision Framework to Each Operation Individually (05-rules.md)
* Do Not Enforce a Single Pattern Across the Entire Codebase (05-rules.md)

---

## Related Skills

* Skill: Choose the Right Pattern for a Business Operation

---

## Decision 2: Evolution Path — When to Extract/Upgrade

---

## Decision Context

When to evolve from a simpler pattern to a more specialized one — Service method → Action → Use Case.

---

## Decision Criteria

* Whether a service method has grown beyond 5 unique dependencies
* Whether a service method is called from multiple entry points
* Whether merge conflicts on the service file are frequent
* Whether the action needs multi-entry-point portability

---

## Decision Tree

Current state: Service method
↓
Has the service method grown to 5+ unique dependencies not shared with other methods?
    YES → Extract to Action — isolate dependencies, improve testability
NO → Is the method called from 2+ entry points (HTTP + CLI + queue)?
    YES → Extract to Action — enable reuse without coupling to service
NO → Are merge conflicts on the service file frequent?
    YES → Extract to Action — reduce surface area for conflicts
NO → Keep in Service — extraction not yet justified

Current state: Action
↓
Is the action called from 2+ entry points with framework-agnostic contract requirements?
    YES → Upgrade to Use Case — add DTO input, interface dependencies
NO → Is the action's array input causing production errors (wrong keys from different callers)?
    YES → Upgrade to Use Case — DTO provides compile-time safety
NO → Is the action part of a Hexagonal Architecture project with strict boundaries?
    YES → Upgrade to Use Case
NO → Keep as Action — Use Case overhead not yet justified

---

## Rationale

All migrations are additive — Service → Action (service delegates to action, callers unchanged), Action → Use Case (Use Case wraps action with DTO). Forward-only evolution means no callers break during migration.

---

## Recommended Default

**Default:** Start with Service methods; extract to Action when isolation/reuse is needed; upgrade to Use Case only when multi-entry-point portability is required
**Reason:** Starting simple defers costs until value is proven. Each evolution is additive and forward-only.

---

## Risks Of Wrong Choice

* Use Case from day one: Overhead for unproven multi-entry-point need
* Never extracting: God services, untestable, merge conflict magnet

---

## Related Rules

* Start with Services, Evolve to Actions, Introduce Use Cases as Needed (05-rules.md)
* Use Service-Action Complement as the Default Production Pattern (05-rules.md)

---

## Related Skills

* Skill: Evolve a Service Method to an Action
* Skill: Upgrade an Action to a Use Case

---

## Decision 3: DTO Boundary — Signal of Pattern Choice

---

## Decision Context

Using the presence/absence of a typed DTO input boundary as the distinguishing signal between Action and Use Case.

---

## Decision Criteria

* Whether the method accepts a typed DTO or a loose array
* Whether the dependencies are concrete classes or interfaces
* Whether the return type is a framework class (Model) or a typed DTO

---

## Decision Tree

Does the method accept a typed DTO (not `array`, not `Request`, not `Model`)?
↓
NO → Not a Use Case. It is either a Service method or an Action.
    - Loose `array $data` → Action or Service
    - Eloquent `Model $model` → Action or Service
    - Individual params → Action or Service
YES → Are the constructor dependencies interfaces (not concrete classes)?
    NO → Pragmatic Use Case (DTO input, concrete deps, model output)
    YES → Full Hexagonal Use Case (DTO input + output, interface deps, zero framework imports)
NO → Is the return type a typed DTO (not an Eloquent model)?
    YES → Full Hexagonal Use Case
    NO → Pragmatic Use Case or Action

---

## Rationale

The DTO boundary is the most objective differentiator between patterns. No DTO = Service or Action. Optional DTO = Action. Required typed DTO = Use Case. Interface dependencies and result DTOs distinguish Pragmatic from Full Hexagonal.

---

## Recommended Default

**Default:** No DTO = Service/Action; Typed DTO = Use Case. Start with Pragmatic (DTO input, model output), evolve to Full Hexagonal only when needed.
**Reason:** The DTO is what makes a Use Case. Pragmatic captures 80% of the benefit with 30% of the cost.

---

## Risks Of Wrong Choice

* Named "UseCase" but accepts array: Misleading — actually an Action
* Full Hexagonal for single-entry-point: All boilerplate, no portability benefit realized

---

## Related Rules

* Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case (05-rules.md)
* Use Typed DTOs for All Use Case Input, Never Raw Arrays (05-rules.md)
* Depend on Interfaces, Not Concrete Classes, in Use Case Constructors (05-rules.md)

---

## Related Skills

* Skill: Choose the Right Pattern for a Business Operation
