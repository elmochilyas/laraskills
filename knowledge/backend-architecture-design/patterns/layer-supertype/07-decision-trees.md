# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Layer Supertype pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Framework supertype vs custom application supertype
* Decision 2: Supertype vs trait for shared behavior
* Decision 3: Inheritance depth — flat hierarchy vs deep hierarchy

---

# Architecture-Level Decision Trees

---

## Decision: Framework Supertype vs Custom Application Supertype

---

## Decision Context

Choose whether to extend framework base classes directly (Eloquent Model, FormRequest) or create custom base classes in-between.

---

## Decision Criteria

* performance considerations: both add negligible overhead
* architectural considerations: a custom supertype decouples application code from framework; direct extends is simpler
* security considerations: custom supertype can enforce security policies across all subtypes
* maintainability considerations: custom supertype is a stable extension point; framework upgrades may break direct subtypes

---

## Decision Tree

Does the application need custom behavior across all models without framework coupling?
↓
YES → Custom application supertype (e.g., `App\Models\BaseModel extends Model`)
    ↓
    Is the custom behavior framework-specific (timestamps, casts, events)?
    YES → Custom supertype works well (inherits framework, adds app-specific behavior)
    ↓
    Can the custom behavior be applied via traits instead?
    YES → Traits may be more flexible (composable rather than inherited)
    ↓
    But a supertype is simpler if ALL models need the same behavior
    NO → Custom supertype is the right choice
NO → Does the team frequently upgrade Laravel (major version changes)?
    YES → Custom supertype insulates from framework changes (one class to update)
    NO → Direct extends is fine (simpler, no intermediate maintenance)
NO → Direct extend of framework classes is sufficient (no custom base needed)

---

## Rationale

Framework supertypes (Eloquent Model, FormRequest) are the foundation. A custom application supertype between your classes and the framework is useful when (1) all models need custom behavior, (2) you want an upgrade insulation layer, or (3) you need to enforce cross-cutting policies. For most apps, direct extension is sufficient — add custom supertype only when shared behavior emerges.

---

## Recommended Default

**Default:** Direct extension of framework classes. Add a custom application supertype only when shared behavior across all subtypes is needed.

**Reason:** Adding an intermediate base class creates maintenance overhead. YAGNI applies — add the supertype when shared behavior actually emerges, not preemptively.

---

## Risks Of Wrong Choice

Custom supertype without need: unnecessary indirection, class must be kept in sync with framework base. Direct extend without shared behavior extraction: duplicated code across subtypes, inconsistent policies.

---

## Related Rules

- Rule 1: Extend framework supertypes directly unless a custom supertype solves a concrete problem

---

## Related Skills

- Design Application Supertype
- Apply Layer Supertype Pattern

---

## Decision: Supertype vs Trait for Shared Behavior

---

## Decision Context

Choose whether to share behavior across classes via inheritance (supertype) or composition (traits).

---

## Decision Criteria

* performance considerations: traits are compiled into classes (same as inheritance); supertype is inherited
* architectural considerations: traits are composable; supertype creates a rigid hierarchy
* security considerations: supertype can enforce security; traits can be selectively applied
* maintainability considerations: traits avoid deep inheritance but may cause name collisions

---

## Decision Tree

Is the behavior applicable to ALL classes in the layer?
↓
YES → Supertype (inheritance is appropriate for always-present behavior)
    ↓
    Example: all models need timestamps, soft deletes, event dispatching
    YES → Supertype (these are cross-cutting features all models share)
    NO → Trait (selective application is better)
NO → Does the behavior need state (properties, constructor logic)?
    YES → Supertype (traits cannot enforce constructor requirements)
    ↓
    Does the trait require properties that conflict with other classes?
    YES → Supertype (avoids trait property conflicts)
    NO → Trait (traits work for stateless behavior or self-contained state)
NO → Trait (composable, selective, avoids inheritance constraints)
    ↓
    Are there 3+ traits being applied to the same class?
    YES → Consider extracting some into a supertype (trait overload is a code smell)
    ↓
    Do the traits interact with each other?
    YES → Extract to supertype (trait interaction is fragile)
    NO → 3+ traits is acceptable if they're independent

---

## Rationale

Supertype inheritance is appropriate for behavior that ALL subtypes share. Traits are better for selective, composable behavior that not all classes need. The rule of thumb: if the behavior is universal to the layer (applies to all subtypes), use a supertype. If it's selective, use a trait.

---

## Recommended Default

**Default:** Supertype for always-present cross-cutting behavior. Traits for selective, composable features.

**Reason:** Supertype inheritance is simpler for universal behavior. Traits provide selective composition without forcing irrelevant behavior into subtypes.

---

## Risks Of Wrong Choice

Trait for universal behavior: applied to every class anyway, may as well be a supertype. Supertype for selective behavior: forces irrelevant methods on subtypes, violates ISP. Deep inheritance chains: fragile base class, hard to navigate.

---

## Related Rules

- Rule 3: Use supertypes for always-present behavior; traits for selective composition
- Rule 2: Keep inheritance flat — 1-2 levels maximum

---

## Related Skills

- Design Traits
- Design Base Classes

---

## Decision: Inheritance Depth — Flat Hierarchy vs Deep Hierarchy

---

## Decision Context

Choose how many levels of inheritance to use in the layer supertype hierarchy.

---

## Decision Criteria

* performance considerations: deep hierarchy adds negligible overhead
* architectural considerations: deep hierarchy creates fragile base class problem
* security considerations: deep hierarchy makes security policies harder to trace
* maintainability considerations: deep hierarchy is hard to navigate and change

---

## Decision Tree

How many levels of inheritance exist?
↓
1 (Framework → Your Class) → Flat hierarchy (ideal — simplest, least fragile)
2 (Framework → Your Base → Your Class) → Acceptable (one intermediate level)
3+ (Framework → Base → Abstract → Your Class) → Deep hierarchy — refactor
    ↓
    Can levels be collapsed?
    YES → Merge intermediate levels
    ↓
    Do intermediate levels add distinct behavior or just pass through?
    PASS-THROUGH → Collapse (no value add)
    DISTINCT → Can the distinct behavior be moved to a trait?
        YES → Move to trait, collapse the class hierarchy
        NO → Consider if the hierarchy is justified by the behavior (rarely)
    NO → Are intermediate levels causing the fragile base class problem?
        YES → Definitively refactor — use traits and composition
        NO → Monitor: deep hierarchies tend to grow and become fragile

---

## Rationale

Flat inheritance (1 level from framework) is ideal. One intermediate level (2 levels total) is acceptable. Three or more levels create a fragile base class — changes at any level can break all subclasses. Prefer composition (traits) over deep inheritance. Each inheritance level multiplies the surface area for LSP violations.

---

## Recommended Default

**Default:** 1 level of inheritance (Framework → Your Class). Maximum 2 levels (Framework → Your Base → Your Class).

**Reason:** Each inheritance level increases fragility and complexity. Composition (traits) provides the same reuse without the coupling of deep inheritance.

---

## Risks Of Wrong Choice

Deep inheritance (3+ levels): fragile base class, hard to navigate, LSP violations likely. No inheritance at all: couldn't use framework supertypes, would lose framework functionality. Single level with traits: trait interactions become complex.

---

## Related Rules

- Rule 4: Keep layer supertype inheritance to 1-2 levels maximum
- Rule 2: Keep inheritance flat — 1-2 levels maximum

---

## Related Skills

- Refactor Deep Inheritance to Composition
- Design Flat Class Hierarchies
