# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Creator
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Creator vs Factory for object creation
* Decision 2: Aggregate root vs external service for child entity creation
* Decision 3: Static factory method vs constructor for domain object construction

---

# Architecture-Level Decision Trees

---

## Decision: Creator vs Factory for Object Creation

---

## Decision Context

Choose whether to assign creation responsibility to a natural creator (has data/context) or to a dedicated factory class.

---

## Decision Criteria

* performance considerations: factory adds one extra class; creator is more direct
* architectural considerations: creator keeps data and behavior together; factory centralizes complex creation
* security considerations: factory can enforce creation policies; creator may bypass validation
* maintainability considerations: factory isolates creation complexity; creator is simpler for straightforward cases

---

## Decision Tree

Is the creation logic complex (conditional branching, assembling from multiple sources)?
↓
YES → Is the creation logic expected to change independently from the created class?
    YES → Factory (separate creation from domain class; SRP for both)
    NO → Creator with helper methods (if complexity is moderate and stable)
NO → Does the creator class have all the data needed to initialize the new object?
    YES → Does the creator already contain or closely use objects of the created type?
        YES → Creator pattern (natural assignment — container creates children)
        NO → Would assigning creation to the creator violate SRP?
            YES → Factory (creation is an additional responsibility)
            NO → Creator pattern (acceptable; the class already works with these objects)
    NO → Factory (creator doesn't have the data; factory collects what's needed)
    ↓
    How often does creation logic change?
    RARELY → Creator pattern (simple, direct)
    FREQUENTLY → Factory (isolates change from domain classes)
    ↓
    Is the creation part of the domain language (domain experts talk about "creating orders")?
    YES → Creator on aggregate root (natural domain concept)
    NO → Factory (technical creation; no domain meaning)

---

## Rationale

The Creator pattern assigns creation to the class that naturally has the context and data. Use it when creation is straightforward and the creator is a logical container. Use a Factory when creation logic is complex, requires assembly from multiple sources, or would burden the creator with an additional responsibility.

---

## Recommended Default

**Default:** Creator on the aggregate root for child entities. Factory for complex creation or when the creator doesn't have all the data.

**Reason:** Aggregate roots are the natural creators of their children. Factories should be reserved for genuinely complex creation scenarios, not as a default pattern.

---

## Risks Of Wrong Choice

Creator for complex creation: SRP violation, domain class grows with assembly logic. Factory for trivial creation: unnecessary indirection, YAGNI violation, navigation overhead.

---

## Related Rules

- Rule 1: Assign creation responsibility to the class that has the data needed to create
- Rule 2: Use Factory (not Creator) when creation logic is complex or requires configuration

---

## Related Skills

- Apply the Creator GRASP Pattern
- Apply Pure Fabrication GRASP Pattern

---

## Decision: Aggregate Root vs External Service for Child Entity Creation

---

## Decision Context

Choose whether the aggregate root or an external service should create child entities.

---

## Decision Criteria

* performance considerations: aggregate root creation preserves invariants in one step; external creation may cause extra validation
* architectural considerations: aggregate root creation enforces domain invariants; external creation risks bypassing rules
* security considerations: aggregate root controls what children can be created; external service may lack context
* maintainability considerations: aggregate root creation centralizes rules; external creation scatters them

---

## Decision Tree

Does the child entity have invariants that depend on the aggregate root's state?
↓
YES → Is the child creation part of a larger operation (e.g., addItem as part of placeOrder)?
    YES → Aggregate root creates child (invariant enforcement guaranteed)
    NO → Is the child created independently (e.g., adding an item to an existing order)?
        YES → Aggregate root method (addItem) validates and creates child
NO → Can the child exist independently of the aggregate?
    YES → External service or factory (child is not owned by aggregate)
    NO → Aggregate root creates child (part of the aggregate)
    ↓
    Would allowing external creation bypass necessary validation?
    YES → Aggregate root must create child (enforce invariants)
    ↓
    Performance consideration: bulk operations
    SINGLE CREATE → Aggregate root method (preserves invariants)
    BULK CREATE → Aggregate root batch method (e.g., addItems) with bulk validation, then internal creation

---

## Rationale

The aggregate root is the invariant enforcer for its children. Allowing external code to create children directly bypasses these invariants. The aggregate root should expose methods that accept creation data and internally create the child entities, validating all rules in the process.

---

## Recommended Default

**Default:** Aggregate root creates its own children. External code calls `$order->addItem($data)`, never `new OrderItem(...)`.

**Reason:** The aggregate root owns the invariants for its children. External creation always risks bypassing rules.

---

## Risks Of Wrong Choice

External creation: bypassed invariants, inconsistent aggregate state, business rules enforced in multiple places. Aggregate root for everything: large aggregate methods that handle too many creation paths.

---

## Related Rules

- Rule 3: Aggregate roots create their own child entities

---

## Related Skills

- Apply the Creator GRASP Pattern
- Design a Rich Domain Model

---

## Decision: Static Factory Method vs Constructor for Domain Object Construction

---

## Decision Context

Choose between named static factory methods and public constructors for creating domain objects.

---

## Decision Criteria

* performance considerations: both have identical performance; static factory is slightly more verbose
* architectural considerations: static factory communicates intent via naming; constructor is limited to one name
* security considerations: static factory can validate invariants before construction; constructor may need separate validation
* maintainability considerations: static factories are self-documenting; constructors require documentation comments

---

## Decision Tree

Does the domain object have multiple construction paths (different sources, different intents)?
↓
YES → Do the construction paths have meaningful names in the domain language?
    YES → Static factory methods (Order::fromCart, Order::fromSubscription, Order::restore)
    NO → Multiple constructors with different signatures (use if parameter types differ)
NO → Is the construction simple (just assign parameters)?
    YES → Constructor (new Money(100, 'USD') — clear enough)
    NO → Is the construction for reconstitution (rebuilding from persistence)?
        YES → Separate static factory (Order::reconstructFromEvents) or private constructor + named method
        ↓
        Does the domain object enforce invariants during construction?
        YES → Static factory method validates before calling private constructor
        NO → Constructor is fine
    ↓
    Is there only one way to construct this object?
    YES → Constructor (new Order(...) — single, clear path)
    ↓
    Future consideration: will more construction paths be added?
    YES → Start with private constructor + static factory methods (easier to add later)
    NO → Public constructor is sufficient

---

## Rationale

Named static factory methods communicate intent better than constructors, especially when the same object can be created from different sources. Use them when the domain language provides meaningful names for creation paths. Use constructors for simple value objects where `new` is clear enough.

---

## Recommended Default

**Default:** Private constructor with named static factory methods for domain objects. Public constructor for value objects and DTOs.

**Reason:** Static factory methods communicate intent and allow multiple creation paths. Value objects and DTOs are simple enough that `new` with named parameters is clear.

---

## Risks Of Wrong Choice

Constructor for multiple intents: `new Order($a, $b, $c)` — unclear which parameters correspond to which creation path. Static factory for everything: unnecessary ceremony for simple objects.

---

## Related Rules

- Rule 4: Prefer static factory methods over `new` for domain object construction

---

## Related Skills

- Apply the Creator GRASP Pattern
- Implement Factory Pattern
