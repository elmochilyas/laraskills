# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Interface explosion vs interface starvation
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Create interface vs use concrete class
* Decision 2: Merge small interfaces vs keep segregated
* Decision 3: Interface vs callable/Closure for single-method contracts

---

# Architecture-Level Decision Trees

---

## Decision: Create Interface vs Use Concrete Class

---

## Decision Context

Determine whether a dependency needs an interface abstraction or can use a concrete class directly.

---

## Decision Criteria

* performance considerations: interface calls add negligible overhead
* architectural considerations: interfaces at boundaries enable DIP; concrete classes inside modules are fine
* security considerations: interfaces at security boundaries are important
* maintainability considerations: single-implementation interfaces add navigation overhead without benefit

---

## Decision Tree

Does the dependency cross an architectural boundary (domain → infrastructure)?
↓
YES → Create interface (hexagonal port; even with one implementation)
NO → Does the dependency have (or will have within one release) at least two implementations?
    YES → Create interface (multiple implementations justify abstraction)
    NO → Can the dependency be tested without mocking the interface?
        YES → Use concrete class (no interface needed)
        NO → Is the difficulty of testing with the real implementation significant?
            YES → Create interface (testability justifies it)
            NO → Use concrete class (no benefit from interface)
            ↓
            Is this a value object or DTO?
            YES → Never create interface (value objects don't need interfaces)
            NO → Use concrete class

---

## Rationale

Interfaces are justified at architectural boundaries (hexagonal ports), at variation points (multiple implementations), and when testability demands it. Within a single module with a single implementation and acceptable testability, concrete classes are simpler and more navigable.

---

## Recommended Default

**Default:** Interface for outbound ports crossing architectural boundaries; concrete class for internal services.

**Reason:** Outbound ports protect the domain from infrastructure changes. Internal services with single implementations don't benefit from interface overhead.

---

## Risks Of Wrong Choice

Interface starvation: no mockable boundaries, tests use real implementations, slow and brittle. Interface explosion: excessive navigation overhead, abstraction without benefit, slower onboarding.

---

## Related Rules

- Rule 1: Create interfaces only when there are or will be at least two implementations
- Rule 5: Don't create interfaces for value objects or DTOs

---

## Related Skills

- Balance Interface Granularity
- Detect Premature Abstraction YAGNI Violations
- Design Hexagonal Architecture Ports and Adapters

---

## Decision: Merge Small Interfaces vs Keep Segregated

---

## Decision Context

Decide whether to merge multiple small interfaces into a role interface or keep them segregated according to ISP.

---

## Decision Criteria

* performance considerations: merged interfaces reduce constructor parameter count
* architectural considerations: ISP says keep interfaces focused; role interfaces say merge by usage context
* security considerations: never merge security interfaces with non-security interfaces
* maintainability considerations: too many small interfaces cause navigation overhead and construction pain

---

## Decision Tree

Do the small interfaces represent genuinely independent roles used by different clients?
↓
YES → Keep segregated (ISP applies — different clients depend on different interfaces)
NO → Are the interfaces from the same context and always used together?
    YES → Are there 4+ small interfaces injected together?
        YES → Merge into a role interface (construction pain indicates over-segregation)
        NO → Keep segregated if they serve different purposes; merge if same role
    NO → Can the interfaces be logically grouped by concern?
        YES → Merge by concern group (e.g., all order-related interfaces)
        NO → Keep segregated

---

## Rationale

Interface Segregation Principle (ISP) says keep interfaces focused, but pragmatism says too many small interfaces create construction pain and navigation overhead. The balance is merging interfaces that are always used together by the same client into role interfaces.

---

## Recommended Default

**Default:** Keep interfaces segregated by role; merge only when 4+ small interfaces are always injected together.

**Reason:** Four+ injected interfaces from the same context indicate over-segregation. Merging them into a role interface reduces construction pain without violating ISP's intent.

---

## Risks Of Wrong Choice

Over-segregation: excessive constructor parameters, navigation overhead, DI container clutter. Over-merging: violating ISP, forcing clients to depend on methods they don't use.

---

## Related Rules

- Rule 2: When you have too many small interfaces, consider merging them

---

## Related Skills

- Balance Interface Granularity
- Apply Interface Segregation Principle

---

## Decision: Interface vs Callable/Closure for Single-Method Contracts

---

## Decision Context

Choose between defining an interface with one method vs using a Closure/callable for a single-method contract.

---

## Decision Criteria

* performance considerations: callable has slightly less overhead than interface dispatch
* architectural considerations: callable is lighter; interface provides named, documented contract
* security considerations: security contracts should always use explicit interfaces
* maintainability considerations: callables reduce file count; interfaces provide discoverability

---

## Decision Tree

Is this a security-related contract (authentication, authorization)?
↓
YES → Use explicit interface (security contracts must be clearly named and documented)
NO → Is the contract part of a public API or library?
    YES → Use explicit interface (stability and documentation for external consumers)
    NO → Will the contract have more than one method within 6 months?
        YES → Use interface (it will grow beyond single method)
        NO → Is the contract used in a hot path where performance matters?
            YES → Consider callable (minor performance benefit)
            NO → Use callable/Closure (simpler, fewer files)

---

## Rationale

Single-method contracts can often be replaced with callables, reducing file count and formality. However, security contracts, public APIs, and contracts expected to grow still benefit from explicit interfaces.

---

## Recommended Default

**Default:** Use callable/Closure for internal single-method contracts; use interface for security, public API, and growing contracts.

**Reason:** Callables reduce ceremony for internal contracts. Interfaces provide essential documentation and stability for contracts that cross team or system boundaries.

---

## Risks Of Wrong Choice

Interface for every single-method contract: interface explosion, unnecessary files, formality without benefit. Callable for security contracts: unclear contract boundaries, difficulty enforcing security constraints.

---

## Related Rules

- Rule 3: Replace interfaces with callables/closures for single-method contracts

---

## Related Skills

- Balance Interface Granularity
- Detect Premature Abstraction YAGNI Violations
