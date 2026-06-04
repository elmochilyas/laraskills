# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Factory Method Alternatives
**Generated:** 2026-06-03

---

# Decision Inventory

* Static factory method vs constructor
* Model factory method vs dedicated factory class
* Create vs create-and-persist

---

# Architecture-Level Decision Trees

---

## Static Factory Method vs Constructor

---

## Decision Context

Choosing between a static factory method and direct `new Model()` construction.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does creating a new instance require setup beyond simple property assignment?
↓
YES → Use a named static factory method — expresses intent and encapsulates setup
NO → Is there only one creation path?
    YES → `new Model()` is sufficient — factory method adds unnecessary indirection
    NO → Multiple creation paths? Use named factory methods for each (`draftForCustomer()`, `expressFromCart()`)

---

## Rationale

Factory methods name the creation intent and encapsulate setup logic. They replace `new Order()` followed by 5+ lines of property assignments with a single intention-revealing call.

---

## Recommended Default

**Default:** `new Model()` for simple instantiation
**Reason:** Don't add factory methods until creation complexity or multiple paths justify them.

---

## Risks Of Wrong Choice

Adding factory methods for trivial creation creates unnecessary method surface area. Using inline construction for complex creation duplicates setup logic across callers.

---

## Related Rules

* Use named static factory methods for complex creation
* Name factory methods to express intent

---

## Related Skills

* Create a Domain Factory Method on a Model

---

## Model Factory Method vs Dedicated Factory Class

---

## Decision Context

Choosing between placing factory logic on the model vs in a separate factory class.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the factory logic span multiple models?
↓
YES → Use a dedicated factory class — cross-model orchestration
NO → Is the factory logic complex or dependency-heavy?
    YES → Dedicated factory class — keeps model focused
    NO → Model static method — simpler, keeps creation with the type

---

## Rationale

Model factory methods keep creation logic with the type it creates. When creation involves multiple models or complex dependencies, a dedicated factory class provides better separation.

---

## Recommended Default

**Default:** Model static factory method
**Reason:** Simpler, colocated with the type, sufficient for most creation scenarios.

---

## Risks Of Wrong Choice

Putting cross-model factory logic on a single model creates inappropriate dependencies. Using dedicated factory classes for simple single-model creation adds unnecessary abstraction.

---

## Related Rules

* Factory methods create but don't persist
* Keep factory methods free of external I/O

---

## Related Skills

* Create a Domain Factory Method on a Model

---

## Create vs Create-and-Persist

---

## Decision Context

Deciding whether a factory method should persist the model or just create an in-memory instance.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the caller need to modify the instance before saving?
↓
YES → Factory creates without persisting — caller decides when to save
NO → Is the creation always followed by immediate persistence?
    YES → Factory can create-and-save — convenience method (e.g., `Order::placeNew()`)
    NO → Return unsaved instance — let caller control persistence

---

## Rationale

Creating without persisting gives the caller flexibility to inspect, compute derived fields, or abort without rolling back. Create-and-save is a convenience for operations where creation always equals persistence.

---

## Recommended Default

**Default:** Create without persisting
**Reason:** Maximum flexibility; caller decides when/if to save.

---

## Risks Of Wrong Choice

Factory methods that always persist prevent callers from inspecting or modifying the instance before saving. Create-only approaches for operations that are always persisted require an extra `->save()` call at every call site.

---

## Related Rules

* Factory methods create but don't persist

---

## Related Skills

* Create a Domain Factory Method on a Model
