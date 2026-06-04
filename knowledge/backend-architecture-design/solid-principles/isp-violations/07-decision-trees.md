# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** SOLID principles in PHP: ISP violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Interface splitting strategy — role interfaces vs monolithic contracts
* Decision 2: Interface granularity — fine role interfaces vs coarse contracts
* Decision 3: Interface ownership — where to define and place interfaces

---

# Architecture-Level Decision Trees

---

## Decision: Interface Splitting Strategy — Role Interfaces vs Monolithic Contracts

---

## Decision Context

Choose whether to split a large interface into role-specific interfaces or keep it monolithic.

---

## Decision Criteria

* performance considerations: more interfaces add no runtime cost
* architectural considerations: role interfaces align with ISP; monolithic interfaces force implementors to provide unused methods
* security considerations: role interfaces allow per-role access control; monolithic interfaces give broad access
* maintainability considerations: role interfaces are easier to implement; monolithic interfaces change frequently

---

## Decision Tree

Does the interface have 5+ methods?
↓
YES → Potential ISP violation — evaluate splitting
    ↓
    Do different clients use different subsets of methods?
    YES → Split by client role (role interfaces)
    ↓
    Can you name each subset by the client's need (e.g., OrderReadable, OrderWritable)?
    YES → Role interfaces are clearly defined
    ↓
    Do any clients depend on only 1-2 methods from a large interface?
    YES → Definitely split — the fat interface forces these clients to depend on methods they don't use
    NO → Clients use most methods — monolithic interface may be justified
    NO → Name interfaces by role, not by implementation (e.g., Exportable vs CsvExporter interface)
NO → Does the interface have methods from different domains (persistence + export + notification)?
    YES → Split by domain concern (these are different responsibilities)
    NO → Does the interface have methods with different change frequencies?
        YES → Split — methods that change at different rates should be in different interfaces
        NO → Monolithic interface is acceptable (cohesive methods, same change rate)

---

## Rationale

The Interface Segregation Principle is violated when a client depends on methods it does not use. Split large interfaces into role interfaces named by what the client needs (OrderReadable, OrderExportable), not by implementation (OrderRepository). If different clients use different method subsets or methods change at different rates, the interface should be split.

---

## Recommended Default

**Default:** Start with cohesive interfaces (3-5 related methods). Split when a client depends on only a subset or when methods have different change frequencies.

**Reason:** Small, cohesive interfaces are easier to implement, test, and reason about. They prevent the "implement and throw" pattern that fat interfaces encourage.

---

## Risks Of Wrong Choice

Fat interface: implementors must create empty or throwing methods for irrelevant functionality. Interface explosion: one interface per method creates navigation nightmare and constructor pollution. Technology-named interfaces: named after implementation (e.g., OrderRepositoryInterface) instead of role (e.g., OrderReadable).

---

## Related Rules

- Rule 1: Interfaces should be role-specific — named by what the client needs, not by what the class is
- Rule 2: No client should be forced to depend on methods it does not use
- Rule 3: Split interfaces when clients use different method subsets

---

## Related Skills

- Design Role Interfaces
- Identify ISP Violations
- Refactor Fat Interfaces

---

## Decision: Interface Granularity — Fine Role Interfaces vs Coarse Contracts

---

## Decision Context

Choose how fine-grained role interfaces should be — many small interfaces or fewer larger ones.

---

## Decision Criteria

* performance considerations: interface granularity has no performance impact
* architectural considerations: finer granularity provides more precise contracts
* security considerations: finer granularity enables more precise authorization scoping
* maintainability considerations: very fine granularity causes constructor injection pollution (5+ interfaces per class)

---

## Decision Tree

Would splitting this interface make some classes require 5+ constructor-injected interfaces?
↓
YES → Further splitting would cause constructor pollution
    ↓
    Can the role interfaces be grouped into a facade interface?
    YES → Keep role interfaces, add a composite interface that extends them for classes that need all roles
    NO → Consider if the roles are genuinely independent or if some merging is warranted
NO → Is each method in the interface used by a different client?
    YES → Interface per client (role interface — the strictest ISP adherence)
    ↓
    Would this create 2-4 interfaces per typical use case?
    YES → Acceptable granularity (2-4 interfaces per consumer is manageable)
    NO → Consider merging some roles (1-2 interfaces per consumer is ideal)
NO → Do all methods serve the same role (used by the same client)?
    YES → Keep as one interface (cohesive)
    NO → Split by role

---

## Rationale

The right granularity minimizes the number of unused methods a client depends on while avoiding constructor pollution. Aim for 1-2 role interfaces per typical consumer class. If a class needs 5+ injected interfaces, either the class violates SRP or the interfaces are too fine-grained. Use interface inheritance (an interface that extends multiple role interfaces) for consumers that legitimately need all roles.

---

## Recommended Default

**Default:** 2-4 methods per interface. If a client needs 3+ separate interfaces, consider a composite interface or whether the client itself violates SRP.

**Reason:** 2-4 method interfaces are cohesive, easy to implement, and avoid constructor pollution. Composite interfaces provide flexibility for consumers that need multiple roles.

---

## Risks Of Wrong Choice

Too fine: constructor injection overload, excessive interface files, navigation overhead. Too coarse: unused methods in implementors, ISP violation persists. Interface inheritance abuse: deep interface hierarchies that are hard to navigate.

---

## Related Rules

- Rule 5: Prefer multiple, focused interfaces over general-purpose interfaces
- Rule 4: Avoid creating interface hierarchies deeper than 2-3 levels

---

## Related Skills

- Assess Interface Cohesion
- Design Composite Interfaces
- Refactor Interface Hierarchy

---

## Decision: Interface Ownership — Where to Define and Place Interfaces

---

## Decision Context

Choose where interface definitions should live — in the consuming module, the implementing module, or a shared contracts layer.

---

## Decision Criteria

* performance considerations: interface location has no performance impact
* architectural considerations: interfaces owned by consumers follow DIP; interfaces in shared layer may cause coupling
* security considerations: consumer-owned interfaces limit exposure to implementing module's details
* maintainability considerations: consumer-owned interfaces are stable; shared interfaces change frequently

---

## Decision Tree

Who defines what this interface should look like — the consumer or the implementor?
↓
CONSUMER → Interface owned by consumer (follows DIP — high-level defines the contract)
    ↓
    Place the interface in the consumer's module/domain layer
    Implementor depends on the consumer's interface (dependency inversion)
    ↓
    Does this create a circular dependency between modules?
    YES → Extract shared contracts to a neutral module (both depend on shared contract)
    NO → Consumer-owned interface is correct (best practice)
IMPLEMENTOR → Interface owned by implementor (less common, may indicate violation)
    ↓
    Does the consumer import the implementor's interface directly?
    YES → This violates DIP — consumer depends on implementor's abstraction
    ↓
    Move the interface to the consumer or create a shared contracts module
    NO → Implementor-owned interface may be acceptable (e.g., technical abstractions)

---

## Rationale

Following DIP, interfaces should be defined where the consumer needs them — in the consumer's domain layer. The implementor then depends on this interface. In Laravel, this means repository interfaces live in the domain layer (consumer), not in the infrastructure layer (implementor). This prevents the high-level module from depending on a low-level abstraction.

---

## Recommended Default

**Default:** Define interfaces in the consuming module (domain layer). Implementors (infrastructure) depend on and implement these interfaces.

**Reason:** Consumer-owned interfaces follow DIP, are stable (driven by domain needs), and prevent infrastructure coupling in the domain layer. Interface in the domain layer doesn't import infrastructure.

---

## Risks Of Wrong Choice

Implementor-owned interface: consumer depends on a low-level abstraction, DIP violation, interface changes when infrastructure changes. Shared contracts module (when not needed): extra module with thin content, premature abstraction. Interface in wrong layer: domain layer importing infrastructure types.

---

## Related Rules

- Rule 6: Interfaces belong to the client (the code that uses them), not the implementor
- Rule 7: In Laravel, keep interfaces in the domain layer; implementations in the infrastructure layer
- Rule 3: Split interfaces when clients use different method subsets

---

## Related Skills

- Organize Interfaces by Consumer
- Apply DIP to Interface Ownership
- Structure Laravel for DIP Compliance
