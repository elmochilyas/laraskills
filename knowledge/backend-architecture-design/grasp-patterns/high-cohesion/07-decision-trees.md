# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: High Cohesion
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Merge vs split classes based on cohesion analysis
* Decision 2: Class size threshold for extraction
* Decision 3: Cohesion vs coupling tradeoff when splitting

---

# Architecture-Level Decision Trees

---

## Decision: Merge vs Split Classes Based on Cohesion Analysis

---

## Decision Context

Determine whether a class with multiple responsibilities should be split or kept together.

---

## Decision Criteria

* performance considerations: splitting adds method call overhead; merging keeps calls local
* architectural considerations: high cohesion means each class has one purpose; splitting improves comprehension
* security considerations: splitting can isolate sensitive operations into their own access-controlled class
* maintainability considerations: splitting makes each class easier to understand but adds navigation files

---

## Decision Tree

Does the class fail the "one-sentence test" (needs "and" or "or" to describe its purpose)?
↓
YES → Split the class (multiple responsibilities)
    ↓
    Do different methods use completely different sets of fields?
    YES → Split along field-access lines (each group of fields + associated methods → separate class)
    NO → Is the class a Facade intentionally orchestrating multiple services?
        YES → Keep as Facade (Facades are intentionally broad; but ensure no domain logic)
        NO → Identify the natural seams and split
NO → Does the class have high LCOM4 (> 1)?
    YES → Split (LCOM4 > 1 means disjoint method groups)
    ↓
    Would splitting create an excessive number of tiny classes?
    YES → Consider if the class is already narrow enough (don't over-split)
    NO → Split into focused classes
    ↓
    Would splitting require passing many parameters between the new classes?
    YES → The split might not be clean; consider a shared context object
    NO → Split cleanly
    ↓
    Does each resulting class have a clear, single responsibility?
    YES → Split successful
    NO → Refine the split boundaries

---

## Rationale

A class with low cohesion has unrelated responsibilities that should be separate. The "one-sentence test" is the quickest diagnostic: if you need "and" to describe what a class does, it does too much. Disjoint field usage across methods is the strongest indicator of where to split.

---

## Recommended Default

**Default:** Split when LCOM4 > 1 or the class fails the one-sentence test. Keep together only when the methods genuinely cooperate toward a single purpose.

**Reason:** Low cohesion is a primary driver of poor maintainability. The cost of an extra class is negligible compared to the cost of understanding and modifying a multi-responsibility class.

---

## Risks Of Wrong Choice

Not splitting: low cohesion, hard to test, SRP violation, hidden dependencies. Over-splitting: excessive classes, navigation overhead, parameter passing between tiny classes.

---

## Related Rules

- Rule 1: Each class must have a single, well-defined responsibility
- Rule 2: Methods within a class should operate on the same set of fields

---

## Related Skills

- Apply the High Cohesion GRASP Pattern
- Measure Cohesion Types
- Detect and Refactor God Classes

---

## Decision: Class Size Threshold for Extraction

---

## Decision Context

Choose when a class has grown large enough to warrant extraction of new classes.

---

## Decision Criteria

* performance considerations: extracted classes add method call overhead; inline is faster
* architectural considerations: smaller classes are easier to understand and test in isolation
* security considerations: extraction can isolate sensitive operations into access-controlled classes
* maintainability considerations: 200-line limit is a heuristic; functional cohesion matters more than line count

---

## Decision Tree

Is the class longer than 200 lines (domain objects) or 100 lines (application services)?
↓
YES → Is the size due to one complex method (algorithmic density, not responsibility sprawl)?
    YES → Keep as-is; extract helper methods within the same class (cohesion is still high)
    NO → Does the size come from multiple unrelated responsibilities?
        YES → Extract new classes (low cohesion confirmed)
        NO → Is the size from boilerplate (getters, setters, serialization)?
            YES → Consider using PHP 8 attributes, value object patterns, or data classes for brevity
            NO → Extract anyway (large classes tend to accumulate responsibilities)
NO → Has the class grown > 50% since its last review?
    YES → Review for emerging low cohesion (preventative extraction before responsibilities tangle)
    NO → Monitor; no extraction needed yet
    ↓
    After extraction, does the original class still have a clear purpose?
    YES → Extraction successful (original class is now focused)
    NO → Extraction may be artificial (consider merging back)
    ↓
    Extract classes must have: a clear name, a single purpose, and be testable in isolation

---

## Rationale

Line count is a heuristic, not a rule. A 200-line class with one cohesive purpose is better than three extracted classes that are tightly coupled. Use size as a trigger to review cohesion, not as an automatic extraction criterion.

---

## Recommended Default

**Default:** 200-line limit for domain objects, 100-line limit for services. Extract when size is due to multiple responsibilities, not algorithmic complexity.

**Reason:** Size limits provide a regular opportunity to review cohesion. The threshold catches classes that have silently accumulated responsibilities over time.

---

## Risks Of Wrong Choice

No size limit: classes silently grow, accumulate responsibilities, become God classes. Strict size limit without cohesion analysis: artificial extraction, increased coupling between helper classes.

---

## Related Rules

- Rule 3: Keep class size manageable—fewer than 200 lines for domain objects
- Rule 4: Extract a class when you notice a group of methods operating on a subset of data

---

## Related Skills

- Apply the High Cohesion GRASP Pattern
- Detect and Refactor God Classes

---

## Decision: Cohesion vs Coupling Tradeoff When Splitting

---

## Decision Context

Choose whether to improve cohesion (by splitting a class) even if it increases coupling between the resulting classes.

---

## Decision Criteria

* performance considerations: increased coupling adds method call overhead between new classes
* architectural considerations: high cohesion with controlled coupling is better than low cohesion with low coupling
* security considerations: splitting can tighten access control per class even if they call each other
* maintainability considerations: coupling to a focused interface is better than low cohesion in one class

---

## Decision Tree

Would splitting the class create a circular dependency between the new classes?
↓
YES → Do not split this way; find a different decomposition (circular coupling defeats the purpose)
NO → Would splitting create high coupling (each new class depends on the other's internals)?
    YES → Consider if the coupling is through stable interfaces or concrete implementations
        INTERFACE → Acceptable coupling (depend on abstractions)
        CONCRETE → Redesign split boundaries (extract interfaces for cross-class dependencies)
    NO → How many new dependencies does each extracted class have?
        1-3 → Acceptable coupling (focused classes with few dependencies)
        4+ → Review if the split was too granular (might need re-merging)
    ↓
    After splitting, does the ORIGINAL class now have fewer responsibilities?
    YES → Cohesion improved (successful split)
    NO → Split was cosmetic; responsibilities just moved
    ↓
    Does each new class have fewer than 5 constructor dependencies?
    YES → Acceptable coupling
    NO → The split exposed too many internal dependencies; consider larger-grained decomposition

---

## Rationale

Improving cohesion often increases coupling because responsibilities that were inside one class now span multiple classes that must communicate. This is acceptable when coupling is through stable interfaces. Prefer high cohesion with interface-based coupling over low cohesion in a monolithic class.

---

## Recommended Default

**Default:** Split to improve cohesion if coupling stays ≤ 3 dependencies and uses stable interfaces. Don't split if it creates circular or concrete-to-concrete coupling.

**Reason:** The maintainability benefit of focused, cohesive classes outweighs the cost of controlled coupling. Interface-based coupling is manageable and testable.

---

## Risks Of Wrong Choice

Not splitting due to coupling fear: low cohesion persists, SRP violations, hard to test. Splitting into highly coupled classes: the new classes can't be tested or changed independently.

---

## Related Rules

- Rule 3 (Low Coupling): Couple to stable, well-tested interfaces—not volatile ones
- Rule 1: Each class must have a single, well-defined responsibility

---

## Related Skills

- Apply the High Cohesion GRASP Pattern
- Apply Low Coupling GRASP Pattern
- Measure and Reduce Coupling
