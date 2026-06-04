# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Polymorphism
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Polymorphism vs conditional logic for behavioral variation
* Decision 2: Strategy pattern via interface vs inheritance
* Decision 3: Runtime polymorphism vs compile-time generics

---

# Architecture-Level Decision Trees

---

## Decision: Polymorphism vs Conditional Logic for Behavioral Variation

---

## Decision Context

Choose whether to use polymorphic dispatch (interfaces) or conditional logic (switch/if-else) to handle behavior that varies by type.

---

## Decision Criteria

* performance considerations: polymorphism adds virtual call overhead; conditionals are slightly faster
* architectural considerations: polymorphism follows OCP (open for extension, closed for modification)
* security considerations: polymorphic implementations can have different security contexts
* maintainability considerations: polymorphism adds files but reduces change risk; conditionals scatter logic

---

## Decision Tree

Is the behavioral variation based on the type of an object?
↓
YES → How many variants exist today?
    1 → Conditional is fine (if it's unlikely to grow)
    2-3 → Is the variation stable (new types won't be added)?
        YES → Conditional acceptable (few, stable variants; polymorphism would be over-engineering)
        NO → Polymorphism (new types should not require modifying existing code)
    4+ → Polymorphism (switch/if-else chains beyond 3 branches are maintenance problems)
NO → Is the variation likely to grow in the future?
    ↓
    Is the conditional complexity low (single boolean check)?
    YES → Conditional is appropriate (if ($isAdmin) { ... } — no need for polymorphism)
    NO → Is the same conditional repeated in multiple places?
        YES → Polymorphism (centralize the variation; eliminate repeated checks)
        NO → Conditional is acceptable (isolated, not duplicated)
    ↓
    Would polymorphism make it easier to add new variants?
    YES → Polymorphism (new implementations implement the interface; no existing code changes)
    NO → Is the condition based on data (not type)?
        YES → Data-driven approach (strategy table, configuration) may be better than either
    ↓
    Does the team have good discipline with OCP?
    YES → Polymorphism will be maintained properly
    NO → Conditional may be more practical (team may not create new implementations)

---

## Rationale

Polymorphism replaces type-based conditionals with interface dispatch, following OCP. Use it when:
types vary, new types will be added, or the same conditional appears in multiple places.
Keep conditionals for simple, stable, single-location checks.

---

## Recommended Default

**Default:** Polymorphism when there are 3+ variants or when new variants are expected. Conditionals for 1-2 stable variants.

**Reason:** Polymorphism's main benefit is OCP — adding a new type doesn't change existing code. For few stable variants, the overhead of interfaces and implementations isn't justified.

---

## Risks Of Wrong Choice

Conditional for many variants: OCP violation, scattered switch statements, hard to add new types. Polymorphism for one variant: unnecessary interface and implementation, YAGNI violation.

---

## Related Rules

- Rule 1: Use polymorphism to handle behavioral variations, not conditionals
- Rule 3: Favor Strategy pattern over inheritance for polymorphic behavior

---

## Related Skills

- Apply the Polymorphism GRASP Pattern
- Implement Strategy Pattern

---

## Decision: Strategy Pattern via Interface vs Inheritance

---

## Decision Context

Choose between interface-based composition (Strategy) and inheritance (Template Method) for implementing polymorphic behavior.

---

## Decision Criteria

* performance considerations: composition and inheritance have equivalent performance
* architectural considerations: composition is more flexible; inheritance creates tighter coupling
* security considerations: composition allows runtime strategy injection; inheritance is fixed at compile time
* maintainability considerations: composition is easier to test and swap; inheritance is simpler for shared behavior

---

## Decision Tree

Do the variants share significant common behavior?
↓
YES → Is the shared behavior stable (unlikely to change)?
    YES → Template Method (abstract base class with shared logic in template methods)
    NO → Composition with Strategy (shared behavior extracted into separate classes)
NO → Strategy interface (each implementation is independent; no shared base class)
    ↓
    Do the variants need to be swapped at runtime?
    YES → Composition/Strategy (swap implementations by injecting different strategies)
    NO → Composition still preferred (testing benefits: mock the interface)
    ↓
    Do the variants share state or initialization logic?
    YES → Template Method (shared initialization in base class constructor or setup method)
    NO → Strategy interface (no shared state; simpler, more focused)
    ↓
    Would inheritance create a deep hierarchy (> 2 levels)?
    YES → Composition/Strategy (deep inheritance is fragile and hard to change)
    ↓
    Can the Strategy be tested in isolation?
    YES → Strategy is testable independently of the context class
    NO → Consider if the strategy needs context data passed as parameters

---

## Rationale

Composition (Strategy) is more flexible than inheritance (Template Method) — strategies can be swapped, tested independently, and combined. Use Template Method only when the shared behavior is significant, stable, and genuinely benefits from being in a base class.

---

## Recommended Default

**Default:** Strategy pattern via interface (composition) for polymorphic behavior. Template Method only for significant, stable shared behavior.

**Reason:** Composition is flexible, testable, and follows the "favor composition over inheritance" principle. Template Method creates tighter coupling through the inheritance hierarchy.

---

## Risks Of Wrong Choice

Template Method for new variants: each new variant must extend the base class, coupled to base class changes. Strategy for completely unrelated implementations: the interface may be too broad or too narrow for all variants.

---

## Related Rules

- Rule 3: Favor Strategy pattern over inheritance for polymorphic behavior
- Rule 2: Define interfaces with behavior, not type markers

---

## Related Skills

- Apply the Polymorphism GRASP Pattern
- Implement Strategy Pattern

---

## Decision: Runtime Polymorphism vs Compile-Time Generics

---

## Decision Context

Choose between runtime dispatch (interfaces) and compile-time parameterization (generics/templates) for type-varying behavior.

---

## Decision Criteria

* performance considerations: runtime has virtual call overhead; compile-time has zero overhead
* architectural considerations: runtime is more flexible (can vary at runtime); compile-time is fixed
* security considerations: runtime allows swapping implementations per request context
* maintainability considerations: runtime is more familiar to most PHP devs; generics add type complexity

---

## Decision Tree

Does the type vary at runtime based on input data (user choice, configuration)?
↓
YES → Runtime polymorphism (type is determined at runtime; must dispatch dynamically)
NO → Does the type vary only at compile time (the same type is always used for a given context)?
    YES → Can PHP generics sufficiently express the constraint?
        YES → Could use generics for type safety (e.g., Collection<T>, Result<T, E>)
        NO → Does the behavior differ per type (not just data type)?
            YES → Runtime polymorphism (different behavior needs virtual methods)
            NO → Data type parameterization (store the type as a property)
    NO → Runtime polymorphism (the type variation is fundamentally dynamic)
    ↓
    Is the performance of the virtual call critical (< 1μs budget)?
    YES → Consider compile-time approach if available (rarely the deciding factor in PHP)
    NO → Runtime polymorphism is fine (virtual dispatch cost is negligible)
    ↓
    Does the team have experience with static analysis generics (PHPStan generics)?
    YES → Generics can add type safety without runtime overhead
    NO → Runtime polymorphism is more practical (team familiarity)

---

## Rationale

PHP is a dynamically-typed language — true compile-time generics (like Java or C++) don't exist. PHPStan generics provide static analysis type safety but don't change runtime behavior. Runtime polymorphism via interfaces is the standard and most practical approach in PHP.

---

## Recommended Default

**Default:** Runtime polymorphism via interfaces. Use PHPStan generics for type-safe collections and result types, not for behavioral variation.

**Reason:** Runtime polymorphism is the idiomatic PHP approach. PHPStan generics add static type safety for data containers but don't replace interfaces for behavioral variation.

---

## Risks Of Wrong Choice

Forcing generics into behavioral variation: fighting PHP's dynamic nature, complex static analysis, unclear runtime behavior. Runtime polymorphism for everything: over-engineering for simple type-based data storage.

---

## Related Rules

- Rule 1: Use polymorphism to handle behavioral variations, not conditionals

---

## Related Skills

- Apply the Polymorphism GRASP Pattern
- Implement Strategy Pattern
