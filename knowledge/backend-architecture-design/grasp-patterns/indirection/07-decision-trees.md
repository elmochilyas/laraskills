# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Indirection
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Direct coupling vs indirection via interface
* Decision 2: Indirection mechanism (interface, facade, adapter, mediator)
* Decision 3: Pre-emptive indirection vs refactor-to-indirection

---

# Architecture-Level Decision Trees

---

## Decision: Direct Coupling vs Indirection via Interface

---

## Decision Context

Choose whether to couple two classes directly or introduce an interface as an intermediary.

---

## Decision Criteria

* performance considerations: indirection adds a virtual method call; direct coupling is faster
* architectural considerations: indirection allows swapping implementations; direct coupling is simpler
* security considerations: indirection can add a security boundary; direct coupling inherits the target's security context
* maintainability considerations: indirection adds a file and indirection but enables independent evolution

---

## Decision Tree

Will the depended-on class ever have more than one implementation (swap, test mock)?
↓
YES → Do you need to swap implementations without changing clients?
    YES → Interface-based indirection (stable contract, multiple implementations)
    NO → Is the second implementation for testing only?
        YES → Interface-based indirection (mock the interface in tests)
NO → Is the depended-on class volatile (frequent API changes, different vendor)?
    YES → Interface indirection (shield clients from volatility)
    NO → Are the two classes in the same cohesion group (always change together)?
        YES → Direct coupling acceptable (no benefit from indirection)
        NO → Would direct coupling violate the Dependency Rule (domain knowing about infrastructure)?
            YES → Interface indirection (domain depends on interface; infra implements it)
            NO → Are the classes separated by an architectural boundary?
                YES → Interface indirection (boundaries are natural indirection points)
                NO → Direct coupling (no architectural reason for indirection)

---

## Rationale

Indirection via interfaces decouples clients from implementations, enabling swapping, testing, and independent evolution. However, it adds complexity. Use indirection at architectural boundaries (domain/infrastructure) and for volatile dependencies. Use direct coupling within cohesive groups that change together.

---

## Recommended Default

**Default:** Interface indirection at architectural boundaries (domain/infrastructure). Direct coupling within the same module or cohesion group.

**Reason:** Architectural boundaries exist precisely to allow independent change — indirection is how you enable that. Within a module, direct coupling is simpler and the change risk is lower.

---

## Risks Of Wrong Choice

No indirection at boundaries: changes ripple across the architecture, hard to swap implementations. Indirection everywhere: unnecessary complexity, YAGNI violation, navigation overhead.

---

## Related Rules

- Rule 1: Introduce an intermediary when direct coupling between components is undesirable
- Rule 4: Don't over-indirect—add intermediaries only when there's a proven need

---

## Related Skills

- Apply the Indirection GRASP Pattern
- Apply Low Coupling GRASP Pattern

---

## Decision: Indirection Mechanism (Interface, Facade, Adapter, Mediator)

---

## Decision Context

Choose the appropriate indirection pattern based on the coupling problem.

---

## Decision Criteria

* performance considerations: all add minimal overhead; mediator adds the most if it dispatches to many services
* architectural considerations: each pattern solves a different coupling problem
* security considerations: adapter can sanitize data from external systems; facade can centralize auth
* maintainability considerations: choosing the wrong pattern adds confusion about intent

---

## Decision Tree

Is the goal to swap implementations of a dependency?
↓
YES → Interface (the simplest indirection: contract + implementations)
NO → Is the goal to simplify a complex subsystem or hide multiple dependencies?
    YES → Facade (single simplified interface over a complex subsystem)
NO → Is the goal to make an incompatible interface compatible with what the client expects?
    YES → Adapter (translates one interface to another)
NO → Is the goal to decouple multiple components that need to communicate indirectly?
    YES → Is the communication one-to-many (event-style)?
        YES → Mediator or Event Bus (central coordination, one-to-many dispatch)
        NO → Is the communication many-to-many?
            YES → Mediator (colleagues communicate through mediator, not directly)
            NO → Is there a complex protocol or state machine between components?
                YES → Mediator (encapsulates interaction protocol)
    ↓
    Is the indirection to add behavior transparently (logging, caching, timing)?
    YES → Decorator (wraps the interface with additional behavior)
    NO → Is the indirection to provide a simplified interface to a set of interfaces?
        YES → Facade
    ↓
    Document why this indirection mechanism was chosen

---

## Rationale

Each indirection mechanism solves a specific problem. Interface is for implementation swapping. Adapter is for interface incompatibility. Facade is for simplifying complex subsystems. Mediator is for decoupling multiple components. Using the wrong pattern adds confusion and maintenance overhead.

---

## Recommended Default

**Default:** Interface for most indirection needs. Adapter for external/vendor integration. Facade for simplifying complex subsystems.

**Reason:** Interfaces are the simplest and most common indirection. Adapter and Facade solve specific problems that interfaces alone don't address.

---

## Risks Of Wrong Choice

Adapter when interface would suffice: unnecessary translation overhead, violates YAGNI. Mediator for simple two-class coupling: over-engineering, ceremony for simple communication. Facade that becomes a God object: all logic flows through one class.

---

## Related Rules

- Rule 2: Use indirection where direct access would violate encapsulation or increase complexity
- Rule 3: Prefer interface-based indirection over class inheritance

---

## Related Skills

- Apply the Indirection GRASP Pattern
- Implement Adapter Pattern
- Implement Facade Pattern

---

## Decision: Pre-emptive Indirection vs Refactor-to-Indirection

---

## Decision Context

Choose whether to introduce indirection pre-emptively (anticipating future needs) or only when the need is proven.

---

## Decision Criteria

* performance considerations: pre-emptive indirection has no performance benefit; refactoring costs time when change occurs
* architectural considerations: pre-emptive indirection may guess wrong variation points
* security considerations: delays indirection until needed means security boundaries may be missing initially
* maintainability considerations: pre-emptive indirection adds complexity; refactoring requires discipline

---

## Decision Tree

Is this a published library or API consumed externally?
↓
YES → Pre-emptive indirection (changing published contracts is expensive; get the boundary right)
NO → Is this a well-known variation point (payment gateways, email providers, storage backends)?
    YES → Does the team have experience with at least 2 different implementations?
        YES → Pre-emptive indirection acceptable (known variation pattern)
        NO → Refactor-to-indirection when second implementation is added
NO → Is there a regulatory or compliance reason for the indirection?
    YES → Pre-emptive indirection (may be required for audit separation)
NO → Would adding indirection later be expensive (many clients to update)?
    YES → Pre-emptive indirection (migration cost justifies early abstraction)
    ↓
    Is the team disciplined about refactoring (will they actually add it when needed)?
    YES → Refactor-to-indirection (wait for proven need)
    NO → Pre-emptive indirection (pragmatic: team won't refactor later)

---

## Rationale

Pre-emptive indirection is justified at published boundaries (libraries, APIs), known variation points (payment, storage), and regulatory boundaries. For internal, speculative variation, refactor-to-indirection is better — most anticipated variation never materializes, and pre-emptive abstraction becomes dead complexity.

---

## Recommended Default

**Default:** Refactor-to-indirection. Add interfaces only when a proven need exists (second implementation, external API change).

**Reason:** YAGNI applies strongly to indirection. Most anticipated variation never happens. Adding indirection is cheap with modern IDEs (extract interface).

---

## Risks Of Wrong Choice

Pre-emptive indirection: dead interfaces that never have a second implementation, navigation overhead, speculative complexity. Never adding indirection: tight coupling, hard to evolve, resistance to change.

---

## Related Rules

- Rule 4: Don't over-indirect—add intermediaries only when there's a proven need
- Rule 1: Introduce an intermediary when direct coupling between components is undesirable

---

## Related Skills

- Apply the Indirection GRASP Pattern
- Apply Pure Fabrication GRASP Pattern
