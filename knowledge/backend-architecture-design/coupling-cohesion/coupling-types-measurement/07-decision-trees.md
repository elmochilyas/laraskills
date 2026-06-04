# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Coupling types and measurement
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Acceptable coupling level per coupling type taxonomy
* Decision 2: Interface abstraction vs event-driven decoupling strategy
* Decision 3: When high efferent coupling (Ce) warrants refactoring

---

# Architecture-Level Decision Trees

---

## Decision: Acceptable Coupling Level Per Coupling Type Taxonomy

---

## Decision Context

Determine whether a given coupling relationship between modules is acceptable based on Fowler's coupling taxonomy (content → common → external → control → stamp → data).

---

## Decision Criteria

* performance considerations: data coupling is cheapest; content coupling is most expensive to maintain
* architectural considerations: data and stamp coupling are acceptable; content and common must be eliminated
* security considerations: content coupling can bypass security checkpoints
* maintainability considerations: weaker coupling levels enable independent module evolution

---

## Decision Tree

What type of coupling exists between the two modules?
↓
DATA (passing only primitives/values) → Acceptable (best type — low impact)
STAMP (passing a data structure) → Acceptable with caution (module receives more data than needed)
    ↓
    Does the data structure expose internal representation?
    YES → Reduce to data coupling (pass only what's needed)
    NO → Acceptable
CONTROL (passing a flag to control behavior) → Warn: consider Strategy pattern instead
EXTERNAL (shared external contract like file format) → Monitor: accept if external standard
COMMON (shared global state) → Eliminate: inject state explicitly instead
CONTENT (directly modifying another module's internals) → Eliminate immediately (highest coupling risk)

---

## Rationale

Data coupling is ideal — modules exchange only necessary primitive values. Content coupling (modifying another module's internal state) is the worst and must be eliminated. Common coupling (shared global state) causes unpredictable side effects. Control coupling should be replaced with polymorphism.

---

## Recommended Default

**Default:** Target data and stamp coupling across modules; eliminate content, common, and control coupling.

**Reason:** Data and stamp coupling enable independent module evolution with minimal coordination overhead. Stronger coupling types create brittle, hard-to-change systems.

---

## Risks Of Wrong Choice

Accepting content/common coupling: modules cannot be changed independently, testing is difficult, side effects unpredictable. Insisting on data coupling everywhere: excessive parameter lists, unnatural interfaces that obscure intent.

---

## Related Rules

- Rule 1: Prefer content coupling → stamp coupling → data coupling (lowest to highest coupling)
- Rule 5: Use the Law of Demeter to reduce coupling depth

---

## Related Skills

- Measure and Reduce Coupling
- Perform Dependency Analysis

---

## Decision: Interface Abstraction vs Event-Driven Decoupling Strategy

---

## Decision Context

Choose between interface abstraction (DIP) and event-driven messaging to decouple modules.

---

## Decision Criteria

* performance considerations: interface abstraction has negligible overhead; events add latency
* architectural considerations: interfaces suit sync, in-process decoupling; events suit async, cross-process
* security considerations: events may expose internal state to unauthorized consumers
* maintainability considerations: interfaces are simpler; events add infrastructure complexity

---

## Decision Tree

Are the modules deployed together (same process/monolith)?
↓
YES → Interface abstraction (simpler, sync, type-safe)
NO → Are the modules deployed independently (microservices/separate processes)?
    YES → Event-driven decoupling (async, network-tolerant)
    NO → Is eventual consistency acceptable for this interaction?
        YES → Event-driven decoupling (preferred for cross-boundary communication)
        NO → Interface abstraction (sync needed; accept coupling)
            ↓
            Can the sync dependency be accepted?
            YES → Interface abstraction
            NO → Reconsider whether eventual consistency can be tolerated

---

## Rationale

Interface abstraction is the simplest, most performant decoupling mechanism for modules in the same process. Event-driven decoupling is necessary for independently deployed services or when eventual consistency is acceptable. Don't introduce event infrastructure for in-process decoupling unless there's a clear reason.

---

## Recommended Default

**Default:** Interface abstraction for in-process module decoupling; events only for cross-process communication or when eventual consistency is explicitly desired.

**Reason:** Interface abstraction provides decoupling without the complexity of event infrastructure, serialization, and eventual consistency handling.

---

## Risks Of Wrong Choice

Events for everything: unnecessary infrastructure complexity, eventual consistency where not needed, debugging difficulty. Interfaces for cross-process: tight deployment coupling, network unreliability causes failures.

---

## Related Rules

- Rule 1: Prefer content coupling → stamp coupling → data coupling

---

## Related Skills

- Measure and Reduce Coupling
- Perform Dependency Analysis
- Implement Outbox Pattern for Event Delivery

---

## Decision: When High Efferent Coupling (Ce) Warrants Refactoring

---

## Decision Context

Determine whether a class with high efferent coupling (many outgoing dependencies) needs refactoring.

---

## Decision Criteria

* performance considerations: high Ce doesn't affect runtime performance; affects compilation
* architectural considerations: high Ce indicates fragility — class breaks when any dependency changes
* security considerations: high Ce widens attack surface
* maintainability considerations: high Ce classes are hard to test, understand, and maintain

---

## Decision Tree

What is the class's Ce (efferent coupling) value?
↓
Ce ≤ 10 → Healthy (normal coupling for cohesive classes)
Ce 10-15 → Warning: Investigate further
    Is this a deliberately orchestration class (service provider, controller, facade)?
    YES → Accept (orchestration naturally has more dependencies)
    NO → Can dependencies be consolidated behind facades?
        YES → Extract facades to reduce Ce
        NO → Accept with monitoring
Ce > 15 → Action required
    Can the class be split into multiple classes with lower per-class Ce?
    YES → Split
    NO → Can dependencies be consolidated by extracting shared interfaces?
        YES → Extract interfaces, inject facades
        NO → Can some dependencies be injected as grouped parameter objects?
            YES → Use parameter objects to reduce method-level Ce
            NO → Investigate deeper restructuring

---

## Rationale

High Ce makes a class fragile because changes in any of its many dependencies can force changes in it. The threshold varies by class type: infrastructure classes naturally have higher Ce. Domain and application classes should maintain Ce ≤ 10.

---

## Recommended Default

**Default:** Flag Ce > 10 for review; require refactoring for Ce > 15 unless the class is intentionally a facade/orchestrator.

**Reason:** Ce > 10 indicates a class that's too coupled to its environment. Ce > 15 is almost always a problem except for deliberately orchestration-focused classes.

---

## Risks Of Wrong Choice

Ignoring high Ce: fragile classes, frequent breakage when dependencies change. Refactoring high-Ce orchestration classes: unnecessary overhead for classes that naturally coordinate many dependencies.

---

## Related Rules

- Rule 2: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- Rule 3: Measure fan-out (Ce) and fan-in (Ca) per module

---

## Related Skills

- Measure and Reduce Coupling
- Perform Dependency Analysis
- Detect Distributed Monolith
