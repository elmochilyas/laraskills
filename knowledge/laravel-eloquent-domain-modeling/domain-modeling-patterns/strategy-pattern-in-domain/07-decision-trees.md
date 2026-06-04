# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Strategy Pattern in Domain
**Generated:** 2026-06-03

---

# Decision Inventory

* Strategy pattern vs if/else switch
* Strategy selection mechanism
* Strategy interface design

---

# Architecture-Level Decision Trees

---

## Strategy Pattern vs If/Else Switch

---

## Decision Context

Choosing between the strategy pattern and a simple conditional (if/else/match) for variant domain algorithms.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the number of variants likely to grow over time?
↓
YES → Strategy pattern — adding a new variant doesn't modify existing code (Open/Closed)
NO → Are there 3+ variants already?
    YES → Strategy pattern — conditional becomes unwieldy at 3+ branches
    NO → Conditional is simpler — strategy pattern would over-engineer it

---

## Rationale

The strategy pattern excels when variants are added frequently (Open/Closed principle). For a fixed set of 2-3 variants that rarely change, a conditional is simpler and more direct.

---

## Recommended Default

**Default:** Conditional (if/else/match) for 2-3 stable variants
**Reason:** Simpler, no interface overhead, directly readable. Escalate to strategy when the variant set grows.

---

## Risks Of Wrong Choice

Using conditionals for frequently growing variant sets violates Open/Closed and requires modifying existing code for each new variant. Using strategy pattern for 2 fixed variants adds unnecessary abstraction.

---

## Related Rules

* Open/closed — add strategies without modification
* Each concrete strategy implements the full algorithm

---

## Related Skills

* Implement a Strategy for Variant Domain Behavior

---

## Strategy Selection Mechanism

---

## Decision Context

Choosing how the correct strategy implementation is selected at runtime.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the selection logic simple (one condition based on a single value)?
↓
YES → Inline conditional in a factory/selector is sufficient
NO → Is the selection logic complex (multiple conditions, external data)?
    YES → Extract selection to a dedicated StrategySelector class
    NO → Keep selection simple with match/if-else

---

## Rationale

The selection mechanism should be as simple as the domain allows. A dedicated selector class helps when selection logic is complex enough to warrant its own tests. Inline selection works for simple cases.

---

## Recommended Default

**Default:** Inline selection with match statement
**Reason:** Direct, readable, and sufficient for most strategy selection scenarios.

---

## Risks Of Wrong Choice

Complex inline selection logic makes tests difficult and violates SRP. Extracting trivial selection to a separate class adds indirection without testability benefit.

---

## Related Rules

* Decouple selection from execution
* Inject strategies via DI container

---

## Related Skills

* Implement a Strategy for Variant Domain Behavior

---

## Strategy Interface Design

---

## Decision Context

Designing the strategy interface contract for clarity and testability.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the interface have a single, clearly defined method?
↓
YES → Does the method have clear parameters and return type?
    YES → Well-designed strategy interface
    NO → Refine signature — parameters and return type must be explicit
NO → Single responsibility violation — split into separate strategy interfaces

---

## Rationale

A strategy interface should define a single contract with clear inputs and outputs. Multiple methods on a strategy interface suggest it has multiple responsibilities.

---

## Recommended Default

**Default:** Single-method interface with typed parameters and return
**Reason:** Clear contract, easy to implement, easy to test.

---

## Risks Of Wrong Choice

Multi-method strategy interfaces create implementation burden (every strategy must implement all methods) and suggest the interface is doing too much.

---

## Related Rules

* Define strategy interface with single method

---

## Related Skills

* Implement a Strategy for Variant Domain Behavior
