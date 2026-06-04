# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Cohesion types and measurement
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: When to split a class based on cohesion measurement
* Decision 2: Appropriate cohesion level per class type
* Decision 3: Balancing cohesion vs coupling when splitting classes

---

# Architecture-Level Decision Trees

---

## Decision: When to Split a Class Based on Cohesion Measurement

---

## Decision Context

Determine whether a class should be split based on LCOM4 (Lack of Cohesion of Methods) values and responsibility analysis.

---

## Decision Criteria

* performance considerations: splitting adds indirection but improves maintainability
* architectural considerations: low-cohesion classes violate SRP
* security considerations: cohesive classes are easier to audit for security properties
* maintainability considerations: splitting reduces complexity per class but increases total class count

---

## Decision Tree

What is the class's LCOM4 value?
↓
LCOM4 = 1 → No action needed (class is cohesive)
LCOM4 = 2 → Investigate: Do the two method groups use different field subsets?
    YES → Consider splitting (different responsibilities using different data)
    NO → Check if the methods are closely related despite different field usage
        YES → Keep as-is (cohesion may be acceptable despite metric)
        NO → Split
LCOM4 > 2 → Can you describe the class in one sentence without "and"?
    YES → Investigate further (the metric may be misleading)
    NO → Split (class clearly has multiple responsibilities)

---

## Rationale

LCOM4 > 2 is a strong indicator that a class has multiple unrelated responsibilities. However, the metric should be combined with the "Single Responsibility Prompt" test: if you cannot describe the class in one sentence without using "and," it needs splitting. Infrastructure/facade classes are exceptions.

---

## Recommended Default

**Default:** Flag LCOM4 > 2 for review; split if the class fails the one-sentence responsibility test.

**Reason:** The metric identifies potential issues; human judgment confirms whether the low cohesion is a real problem or a deliberate design choice (facades, controllers).

---

## Risks Of Wrong Choice

Splitting based on metric alone: over-splitting, unnecessary classes, increased coupling. Ignoring LCOM4 > 2: god classes, SRP violations, maintainability decline.

---

## Related Rules

- Rule 1: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- Rule 3: Use the "Single Responsibility Prompt" test to evaluate class cohesion

---

## Related Skills

- Measure and Improve Cohesion
- Detect and Refactor God Classes

---

## Decision: Appropriate Cohesion Level per Class Type

---

## Decision Context

Choose the appropriate level of cohesion (from coincidental to functional) based on the type of class being designed.

---

## Decision Criteria

* performance considerations: functional cohesion may create many small classes
* architectural considerations: different class types need different cohesion levels
* security considerations: security classes need functional cohesion (no unrelated methods)
* maintainability considerations: higher cohesion generally improves maintainability

---

## Decision Tree

What type of class is being designed?
↓
DOMAIN ENTITY → Target functional cohesion (all methods contribute to entity behavior)
DOMAIN SERVICE → Target functional or sequential cohesion (methods serve related domain operations)
APPLICATION SERVICE → Target functional cohesion per use case (one use case per service)
CONTROLLER → Temporal cohesion acceptable (HTTP request handling grouped by resource)
REPOSITORY → Communicational cohesion (methods work with same data source)
UTILITY/HELPER → Neither; avoid if possible. If necessary, use logical cohesion (similar operations)
FACADE → Deliberately low cohesion (orchestrates multiple subsystems; that's its purpose)
INFRASTRUCTURE → Sequential or communicational cohesion (methods around same infrastructure concern)

---

## Rationale

Different class types have different appropriate cohesion levels. Domain entities should be functionally cohesive. Controllers can have temporal cohesion (grouped by resource). Facades are intentionally broad. The key is matching cohesion level to class purpose.

---

## Recommended Default

**Default:** Functional cohesion for domain and application classes; communicational cohesion for infrastructure; temporal for controllers.

**Reason:** Aligns cohesion level with class responsibility. Domain logic benefits most from tight cohesion; infrastructure and controllers have natural reasons for broader scope.

---

## Risks Of Wrong Choice

Functional cohesion for controllers: too many tiny controller classes. Temporal cohesion for domain entities: scattered logic, missed invariants. Logical cohesion for utilities: the "Utils" dumping ground.

---

## Related Rules

- Rule 2: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- Rule 5: Do not sacrifice coupling quality to improve cohesion artificially

---

## Related Skills

- Measure and Improve Cohesion
- Apply Single Responsibility Principle

---

## Decision: Balancing Cohesion vs Coupling When Splitting Classes

---

## Decision Context

When splitting a low-cohesion class, decide how to balance improved cohesion against potentially increased coupling between the new classes.

---

## Decision Criteria

* performance considerations: splitting may create cross-class communication overhead
* architectural considerations: perfect cohesion with excessive coupling is worse than moderate cohesion with low coupling
* security considerations: split security classes carefully to avoid gaps
* maintainability considerations: the goal is net improvement, not perfect cohesion

---

## Decision Tree

Will splitting the class require the new classes to communicate extensively?
↓
YES → Will the communication increase coupling more than the cohesion improvement?
    YES → Keep as a single class (net negative to split)
    NO → Would the new classes need to share significant internal state?
        YES → Extract shared state to a separate class; then split
        NO → Split (cohesion improvement outweighs coupling increase)
NO → Consider splitting (no coupling concern)
    ↓
    Would the new classes be natural collaborators (loose coupling, high cohesion)?
    YES → Split and design clear interfaces between them
    NO → Can the cohesion be improved by extracting private methods instead of new classes?
        YES → Refactor internally (extract methods, don't split classes)
        NO → Split with caution

---

## Rationale

Cohesion and coupling are related but separate concerns. Splitting a class to improve cohesion should not come at the cost of dramatically increased coupling. If the new classes would be tightly coupled, the split may make things worse overall.

---

## Recommended Default

**Default:** Split only if the cohesion improvement clearly outweighs any coupling increase; prefer internal refactoring (method extraction) when in doubt.

**Reason:** Internal refactoring improves cohesion without increasing coupling. Class splitting should be reserved for cases where methods genuinely serve different concerns.

---

## Risks Of Wrong Choice

Splitting with high resulting coupling: distributed logic, more complex testing, harder to understand overall flow. Not splitting despite low cohesion: god classes, SRP violations, complex testing.

---

## Related Rules

- Rule 5: Do not sacrifice coupling quality to improve cohesion artificially
- Rule 4: Extract methods or classes when they use different subsets of fields

---

## Related Skills

- Measure and Improve Cohesion
- Measure and Reduce Coupling
- Detect and Refactor God Classes
